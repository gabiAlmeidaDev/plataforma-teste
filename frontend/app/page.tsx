import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '../src/components/ui'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Página inicial da Plataforma Teste',
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Plataforma Teste
          </h1>
          <p className="text-gray-600 mb-8">
            Sistema de gerenciamento moderno e eficiente
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/auth/login" className="w-full block">
            <Button variant="primary" size="lg" className="w-full">
              Fazer Login
            </Button>
          </Link>
          
          <Link href="/auth/register" className="w-full block">
            <Button variant="secondary" size="lg" className="w-full">
              Criar Conta
            </Button>
          </Link>
          
          <Link href="/dashboard" className="w-full block">
            <Button variant="success" size="lg" className="w-full">
              Dashboard (Demo)
            </Button>
          </Link>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Versão {process.env.NEXT_PUBLIC_APP_VERSION}</p>
        </div>
      </div>
    </div>
  )
}
