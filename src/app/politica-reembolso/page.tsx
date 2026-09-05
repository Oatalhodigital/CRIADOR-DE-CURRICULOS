import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Reembolso e Cancelamento | Criador de Currículos',
  description: 'Política de reembolso, cancelamento e direito de arrependimento de 7 dias.',
}

export default function RefundPolicyPage() {
  return (
    <main className="min-h-[100dvh] bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Reembolso e Cancelamento</h1>
        <p className="text-sm text-gray-500 mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <section className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Direito de arrependimento (7 dias)</h2>
            <p>
              Conforme o Art. 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990), você tem o
              direito de se arrepender da compra realizada fora do estabelecimento comercial (online)
              em até <strong>7 (sete) dias</strong> contados da data do pagamento.
            </p>
            <p className="mt-2">
              Para exercer este direito, envie um e-mail para{' '}
              <a href="mailto:suporte@curriculorapidocomia.com.br" className="text-emerald-600 hover:underline">
                suporte@curriculorapidocomia.com.br
              </a>{' '}
              com o assunto "Solicitação de reembolso" e informe o ID do pagamento (presente no
              e-mail de confirmação) ou o e-mail usado na compra.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Reembolso antes do download</h2>
            <p>
              Se você solicitou o reembolso antes de baixar o currículo, o valor será estornado
              integralmente pelo mesmo método de pagamento utilizado (cartão ou PIX), em até
              2 dias úteis após a confirmação da solicitação.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Reembolso após o download</h2>
            <p>
              Após o download do PDF, o serviço foi considerado prestado e entregue. No entanto,
              dentro do prazo de arrependimento de 7 dias, o reembolso ainda pode ser solicitado.
              Após esse prazo, reembolsos por desistência não são garantidos, mas cada caso será
              avaliado individualmente.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Falha técnica</h2>
            <p>
              Se o download do currículo falhar por problema técnico do nosso lado e não for possível
              entregar o PDF por nenhum canal (download direto ou e-mail), o reembolso integral será
              processado independentemente do prazo de 7 dias.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Cancelamento</h2>
            <p>
              Como nosso modelo é pagamento único (sem assinatura), não há cobranças recorrentes
              para cancelar. Uma vez pago, o acesso ao download permanece disponível conforme o
              plano contratado.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Prazo de processamento</h2>
            <p>
              Reembolsos em cartão de crédito podem levar até 2 faturas para aparecer na fatura,
              dependendo da operadora. Reembolsos via PIX são processados em até 1 dia útil.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Contato</h2>
            <p>
              Para qualquer solicitação de reembolso ou dúvida sobre cobrança, entre em contato pelo
              e-mail{' '}
              <a href="mailto:suporte@curriculorapidocomia.com.br" className="text-emerald-600 hover:underline">
                suporte@curriculorapidocomia.com.br
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
