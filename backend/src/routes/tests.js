const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Listar testes disponíveis
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    
    const where = {
      isActive: true,
      ...(category && { category }),
      ...(difficulty && { difficulty }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } }
        ]
      })
    };

    const tests = await prisma.test.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true }
        },
        _count: {
          select: { questions: true, results: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar testes' });
  }
});

// Buscar teste específico (sem respostas corretas para usuários)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true }
        },
        questions: {
          include: {
            options: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Teste não encontrado' });
    }

    // Remover respostas corretas para usuários normais
    if (req.user.role === 'USER') {
      test.questions = test.questions.map(question => ({
        ...question,
        options: question.options.map(option => ({
          id: option.id,
          content: option.content,
          order: option.order
        }))
      }));
    }

    res.json(test);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar teste' });
  }
});

// Criar teste (apenas ADMIN/TEACHER)
router.post('/', [
  authMiddleware,
  body('title').trim().isLength({ min: 3 }),
  body('description').optional().trim(),
  body('category').trim().isLength({ min: 2 }),
  body('difficulty').isIn(['EASY', 'MEDIUM', 'HARD']),
  body('timeLimit').optional().isInt({ min: 1 }),
  body('questions').isArray({ min: 1 })
], async (req, res) => {
  try {
    // Verificar permissão
    if (!['ADMIN', 'TEACHER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão para criar testes' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, difficulty, timeLimit, questions } = req.body;

    const test = await prisma.test.create({
      data: {
        title,
        description,
        category,
        difficulty,
        timeLimit,
        authorId: req.user.id,
        questions: {
          create: questions.map((q, index) => ({
            title: q.title,
            content: q.content,
            type: q.type || 'MULTIPLE_CHOICE',
            points: q.points || 1,
            order: index + 1,
            options: {
              create: q.options?.map((opt, optIndex) => ({
                content: opt.content,
                isCorrect: opt.isCorrect || false,
                order: optIndex + 1
              })) || []
            }
          }))
        }
      },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    res.status(201).json(test);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar teste' });
  }
});

// Submeter resultado do teste
router.post('/:id/submit', [
  authMiddleware,
  body('answers').isArray({ min: 1 }),
  body('timeSpent').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { answers, timeSpent } = req.body;

    // Verificar se usuário já fez este teste
    const existingResult = await prisma.testResult.findFirst({
      where: {
        userId: req.user.id,
        testId: id
      }
    });

    if (existingResult) {
      return res.status(400).json({ error: 'Você já realizou este teste' });
    }

    // Buscar teste com questões e opções
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Teste não encontrado' });
    }

    // Calcular pontuação
    let totalScore = 0;
    let totalPoints = 0;
    const processedAnswers = [];

    for (const question of test.questions) {
      totalPoints += question.points;
      const userAnswer = answers.find(a => a.questionId === question.id);
      
      if (userAnswer) {
        let isCorrect = false;
        let points = 0;

        if (question.type === 'MULTIPLE_CHOICE' || question.type === 'SINGLE_CHOICE') {
          const correctOptions = question.options.filter(opt => opt.isCorrect);
          const selectedOptions = userAnswer.selectedOptions || [];
          
          const correctIds = correctOptions.map(opt => opt.id);
          isCorrect = correctIds.length === selectedOptions.length && 
                     correctIds.every(id => selectedOptions.includes(id));
          
          if (isCorrect) {
            points = question.points;
            totalScore += points;
          }
        }

        processedAnswers.push({
          questionId: question.id,
          content: userAnswer.content,
          selectedOptions: JSON.stringify(userAnswer.selectedOptions),
          isCorrect,
          points
        });
      } else {
        processedAnswers.push({
          questionId: question.id,
          content: null,
          selectedOptions: null,
          isCorrect: false,
          points: 0
        });
      }
    }

    // Salvar resultado
    const result = await prisma.testResult.create({
      data: {
        userId: req.user.id,
        testId: id,
        score: totalScore,
        totalPoints,
        timeSpent,
        answers: {
          create: processedAnswers
        }
      }
    });

    res.json({
      score: totalScore,
      totalPoints,
      percentage: Math.round((totalScore / totalPoints) * 100),
      message: 'Teste enviado com sucesso!'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao submeter teste' });
  }
});

// Meus resultados
router.get('/results/my', authMiddleware, async (req, res) => {
  try {
    const results = await prisma.testResult.findMany({
      where: { userId: req.user.id },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar resultados' });
  }
});

module.exports = router;
