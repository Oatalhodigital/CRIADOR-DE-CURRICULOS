import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ResumeProvider } from '@/context/ResumeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Criador de Currículos | LS Soluções Digitais',
  description: 'Crie currículos profissionais otimizados para ATS em minutos com inteligência artificial.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ResumeProvider>
          {children}
        </ResumeProvider>
      </body>
    </html>
  )
}
