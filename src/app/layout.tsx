import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import { ResumeProvider } from '@/context/ResumeContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { warnMissingEnvVars } from '@/lib/env-check'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import MetaPixel from '@/components/MetaPixel'
import Footer from '@/components/Footer'
import HomeJsonLd from '@/components/HomeJsonLd'
import { getSiteUrl } from '@/lib/seo'

const inter = Inter({ subsets: ['latin'] })
warnMissingEnvVars()

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Criador de Currículos com IA | LS Soluções Digitais',
    template: '%s | Criador de Currículos',
  },
  description: 'Crie currículos profissionais otimizados para ATS em minutos com inteligência artificial. Modelos prontos, dicas por profissão e download em PDF.',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'Criador de Currículos',
    title: 'Criador de Currículos com IA | LS Soluções Digitais',
    description: 'Crie currículos profissionais otimizados para ATS em minutos com inteligência artificial.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Criador de Currículos com IA | LS Soluções Digitais',
    description: 'Crie currículos profissionais otimizados para ATS em minutos com inteligência artificial.',
  },
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
        <HomeJsonLd />
        <LanguageProvider>
          <ResumeProvider>
            {children}
          </ResumeProvider>
        </LanguageProvider>
        <Footer />
        <Analytics />
        <GoogleAnalytics />
        <MetaPixel />
      </body>
    </html>
  )
}
