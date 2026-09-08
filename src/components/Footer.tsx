'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 px-6 mt-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <p className="font-semibold text-white mb-1">{t('footer.brand')}</p>
            <p className="text-sm text-gray-400">{t('footer.company')}</p>
            <p className="text-sm text-gray-400 mt-2">
              {t('footer.support')}:{' '}
              <a
                href="mailto:suporte@curriculorapidocomia.com.br"
                className="text-emerald-400 hover:underline"
              >
                suporte@curriculorapidocomia.com.br
              </a>
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/termos-uso" className="hover:text-white transition-colors">
              {t('footer.terms')}
            </Link>
            <Link href="/politica-privacidade" className="hover:text-white transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link href="/politica-reembolso" className="hover:text-white transition-colors">
              {t('footer.refund')}
            </Link>
          </nav>
        </div>

        <div className="border-t border-gray-700 mt-6 pt-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
