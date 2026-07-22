import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import { ResumeProvider } from '@/context/ResumeContext'
import { LanguageProvider } from '@/context/LanguageContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Criador de Currículos | LS Soluções Digitais',
  description: 'Crie currículos profissionais otimizados para ATS em minutos com inteligência artificial.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <LanguageProvider>
          <ResumeProvider>
            {children}
          </ResumeProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
