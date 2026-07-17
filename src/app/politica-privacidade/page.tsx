import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Criador de Currículos',
  description: 'Política de privacidade e tratamento de dados do Criador de Currículos.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidade</h1>
        <p className="text-sm text-gray-500 mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <section className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Dados que coletamos</h2>
            <p>
              Coletamos os dados que você informa voluntariamente ao usar o Criador de Currículos,
              como nome, e-mail, telefone/WhatsApp e as informações preenchidas no currículo.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Como usamos seus dados</h2>
            <p>
              Utilizamos seus dados para gerar e disponibilizar o currículo, processar pagamentos,
              enviar comunicações sobre o serviço (quando autorizado) e melhorar a experiência do usuário.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Compartilhamento</h2>
            <p>
              Não vendemos seus dados. Compartilhamos informações apenas com provedores de pagamento
              (Mercado Pago) e serviços de infraestrutura (Firebase/Vercel), quando necessário para
              a operação do serviço.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Armazenamento e segurança</h2>
            <p>
              Seus dados são armazenados em serviços seguros (Firebase/Firestore) e ambientes
              protegidos. Adotamos práticas de segurança para evitar acessos não autorizados.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Seus direitos</h2>
            <p>
              Você pode solicitar a exclusão, correção ou acesso aos seus dados a qualquer momento
              entrando em contato pelo e-mail de suporte.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Alterações</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Recomendamos revisá-la ocasionalmente
              para se manter informado sobre como protegemos suas informações.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
