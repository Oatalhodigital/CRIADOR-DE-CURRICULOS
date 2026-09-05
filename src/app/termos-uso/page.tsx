import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso | Criador de Currículos',
  description: 'Termos de uso do serviço Criador de Currículos.',
}

export default function TermsPage() {
  return (
    <main className="min-h-[100dvh] bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Termos de Uso</h1>
        <p className="text-sm text-gray-500 mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <section className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Aceitação dos termos</h2>
            <p>
              Ao acessar e utilizar o Criador de Currículos, você concorda com estes Termos de Uso.
              Se não concordar com qualquer parte destes termos, não utilize o serviço.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Descrição do serviço</h2>
            <p>
              O Criador de Currículos é uma ferramenta online que permite ao usuário criar, editar e
              baixar currículos profissionais em formato PDF, otimizados para sistemas de rastreamento
              de candidatos (ATS). O serviço inclui geração de texto assistida por inteligência artificial.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Planos e pagamento</h2>
            <p>
              O serviço oferece planos de pagamento único (sem assinatura). O pagamento é processado
              pelo Mercado Pago. Após a confirmação do pagamento, o usuário recebe o download do PDF
              e um e-mail de confirmação com cópia anexada.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Responsabilidade do usuário</h2>
            <p>
              Você é responsável pela veracidade e precisão das informações inseridas no currículo.
              O Criador de Currículos não se responsabiliza por decisões de contratação baseadas em
              currículos gerados pela plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Propriedade intelectual</h2>
            <p>
              O currículo gerado a partir das suas informações é de sua propriedade. O código, design
              e marca do Criador de Currículos são propriedade da LS Soluções Digitais.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Limitação de responsabilidade</h2>
            <p>
              O serviço é fornecido "como está". Não garantimos que o currículo resultará em
              contratação. Eventuais falhas técnicas serão corrigidas no menor prazo possível.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Alterações</h2>
            <p>
              Estes termos podem ser atualizados periodicamente. Recomendamos revisá-los
              ocasionalmente.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Contato</h2>
            <p>
              Em caso de dúvidas, entre em contato pelo e-mail:{' '}
              <a href="mailto:suporte@curriculorapidocomia.com.br" className="text-emerald-600 hover:underline">
                suporte@curriculorapidocomia.com.br
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Responsável legal</h2>
            <p>
              Este serviço é operado por LS Soluções Digitais. Para questões legais ou de
              consumidor, utilize o canal de contato acima.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
