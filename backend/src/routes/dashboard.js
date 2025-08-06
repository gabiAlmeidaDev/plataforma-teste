const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Dashboard do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Estatísticas básicas
    const [totalTests, completedTests, avgResult] = await Promise.all([
      prisma.test.count({ where: { isActive: true } }),
      prisma.testResult.count({ where: { userId } }),
      prisma.testResult.aggregate({
        where: { userId },
        _avg: { score: true, totalPoints: true }
      })
    ]);

    // Últimos resultados
    const recentResults = await prisma.testResult.findMany({
      where: { userId },
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
      orderBy: { completedAt: 'desc' },
      take: 5
    });

    const averagePercentage = avgResult._avg.score && avgResult._avg.totalPoints 
      ? Math.round((avgResult._avg.score / avgResult._avg.totalPoints) * 100)
      : 0;

    res.json({
      stats: {
        totalTests,
        completedTests,
        averageScore: averagePercentage,
        completionRate: totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0
      },
      recentResults
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

module.exports = router;
