import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../src/contexts/AuthContext'
import { NotificationProvider } from '../src/contexts/NotificationContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Plataforma Teste',
    template: '%s | Plataforma Teste'
  },
  description: 'Sistema de gerenciamento da plataforma',
  keywords: ['plataforma', 'gerenciamento', 'sistema'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <NotificationProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  )
}
