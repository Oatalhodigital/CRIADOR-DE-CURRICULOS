import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 px-6 mt-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <p className="font-semibold text-white mb-1">Criador de Currículos</p>
            <p className="text-sm text-gray-400">LS Soluções Digitais</p>
            <p className="text-sm text-gray-400 mt-2">
              Suporte:{' '}
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
              Termos de Uso
            </Link>
            <Link href="/politica-privacidade" className="hover:text-white transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/politica-reembolso" className="hover:text-white transition-colors">
              Política de Reembolso
            </Link>
          </nav>
        </div>

        <div className="border-t border-gray-700 mt-6 pt-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} LS Soluções Digitais. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
