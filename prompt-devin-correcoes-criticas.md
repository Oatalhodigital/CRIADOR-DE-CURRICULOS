# Prompt para o Devin — corrigir bugs críticos encontrados na verificação independente pós-deploy

## Contexto

Você já corrigiu os 7 itens do laudo original (commits `50b8ca4` e `f32eb34`): tag do Google Ads, empilhamento do modal de saída, evento de compra, race condition em `/api/leads`, i18n de `steps.languages`/`common.saved`, etc. Todos esses itens foram **confirmados como corrigidos** em um teste ao vivo independente feito hoje em produção.

Só que, testando o site ao vivo de novo (não apenas lendo relatório), encontrei **dois problemas novos, ativos em produção agora**, mais graves para conversão do que a maioria do que já foi corrigido. Corrija-os nesta ordem de prioridade.

---

## P0-A (BLOQUEADOR): `/api/leads` demora 7-9 segundos e trava o formulário de captura de lead

**Evidência coletada ao vivo:**
- Medi `/api/leads` isoladamente com `fetch()` puro (sem passar pelo componente React), 2 vezes seguidas: **8676ms** e **8663ms** de latência, resposta 200 com `{"success":true,"leadId":"..."}`.
- Repeti pela própria interface (`LeadCaptureModal`) 5 vezes seguidas: em **todas as 5**, o console registrou `LeadCaptureModal: save timed out`, e a tela travou mostrando "O salvamento demorou muito. Verifique sua conexão e tente novamente." — mesmo quando a chamada de fato terminava com sucesso alguns segundos depois.
- O modal **nunca avança sozinho** quando isso acontece. `sessionStorage.funnelState.showLeadCapture` continua `true` e o usuário fica preso na tela "Vamos Começar!", vendo uma mensagem de erro, mesmo com o lead já salvo no banco.
- Cada novo clique em "Continuar" depois do erro dispara **uma nova chamada** a `/api/leads` (não reaproveita a que já está em voo nem a que já teve sucesso), criando leads duplicados no banco.

**O que corrigir:**
1. Descobrir por que `/api/leads` está levando 7-9 segundos. Prováveis causas: alguma chamada síncrona lenta dentro do handler antes de responder ao cliente (envio de e-mail via SMTP, webhook para CRM, chamada ao Meta Conversions API, escrita em banco com índice ausente, cold start de função serverless, etc). Meça com logs/timing dentro do próprio endpoint para isolar qual etapa interna é lenta.
2. Resolver a causa raiz para que `/api/leads` responda em menos de 1-2 segundos (ex: tornar qualquer integração de terceiros — e-mail, webhook, CRM, CAPI — assíncrona/fire-and-forget depois de já ter salvo o lead e respondido ao navegador).
3. Como camada extra de segurança no cliente: aumentar o timeout do `LeadCaptureModal` para um valor generoso (ex: 15s) e, mais importante, garantir que se a chamada eventualmente retornar sucesso (mesmo depois do timeout visual ter aparecido), a tela avance automaticamente e não fique presa no estado de erro.
4. Adicionar proteção contra duplo-envio: desabilitar o botão "Continuar" enquanto uma chamada já está em andamento, e não disparar uma nova requisição de `/api/leads` para o mesmo lead se já existe uma em voo ou já concluída com sucesso na sessão.

**Por que isso é prioridade 0:** hoje isso bloqueia a maior parte dos usuários reais na primeira tela paga do funil, antes mesmo de começarem a preencher o currículo. É plausível que seja a causa principal do "tráfego alto, vendas zero".

---

## P0-B (BLOQUEADOR): pagamento PIX pendente é perdido se a página recarregar

**Evidência coletada ao vivo:**
- Gerei um QR Code PIX real (plano Básico, R$ 7,90) e confirmei que `sessionStorage` recebe `checkout_payment_id` e `checkout_payment_method` (ex: `checkout_payment_id = "176844715237"`).
- Ao recarregar a página (F5) logo depois — simulando queda de conexão, troca de aba para abrir o app do banco, ou reload acidental — essas duas chaves de `sessionStorage` **desaparecem**, e a tela volta para "Escolha seu Plano" como se nada tivesse acontecido. Não há nenhuma tentativa de checar `/api/payment/status/:id` usando o `checkout_payment_id` que deveria ter sido recuperado.
- O PIX gerado continua válido nos bastidores (o código copia-e-cola continua pagável), mas o usuário não tem mais como vê-lo, verificar o status, ou saber que ele existe.

**O que corrigir:**
1. Ao inicializar a etapa de pagamento (ou a aplicação como um todo), verificar se existe `checkout_payment_id` salvo (idealmente migrar isso de `sessionStorage` para `localStorage`, para sobreviver também a fechar/reabrir a aba, não só a um F5).
2. Se existir um `checkout_payment_id` salvo, chamar `/api/payment/status/:id` imediatamente ao carregar a página, antes de decidir qual tela mostrar:
   - Se `approved: true` → seguir o fluxo pós-pagamento normalmente (download do PDF).
   - Se ainda pendente → mostrar de novo a tela do QR Code / código PIX (idealmente reexibindo o mesmo código, sem gerar um novo), retomando o polling de status.
   - Se expirado/cancelado → aí sim voltar para "Escolha seu Plano", mas de forma explícita (ex: mostrar uma mensagem "seu PIX anterior expirou, gere um novo").
3. Cobrir esse cenário com um teste E2E: gerar PIX → recarregar a página → confirmar que a tela de QR Code/pendência é restaurada (não a tela de seleção de plano).

**Por que isso é prioridade 0:** é risco real de dinheiro para o cliente final — ele pode acabar pagando duas vezes, ou desistir por achar que perdeu um pagamento já feito.

---

## P1 (Médio): tela de Pagamento não é traduzida em EN/ES

**Evidência coletada ao vivo:**
- Com o idioma da interface em EN, a barra de etapas troca corretamente para inglês (Personal, Experience, Education, Skills, Languages, Objective, Payment), mas o **conteúdo** da etapa de Pagamento continua 100% em português: "Escolha seu Plano", "Desbloqueie seu currículo otimizado por IA", nomes dos planos, "Pagamento seguro via PIX ou Cartão • Sem assinaturas ocultas", rodapé inteiro, etc.

**O que corrigir:**
- Adicionar as chaves de tradução faltantes para todo o conteúdo da etapa de Pagamento/Pricing (planos, preços — ou ao menos os textos ao redor do preço, benefícios de cada plano, aviso de segurança, rodapé) nos arquivos de i18n de EN e ES, e usar essas chaves no componente em vez de texto fixo em português.

---

## Ao final, para cada item:
1. Confirme com evidência ao vivo (não só "deveria funcionar agora") — igual ao padrão que você já vem usando nos relatórios anteriores.
2. Adicione/atualize os testes E2E do Playwright cobrindo especificamente: (a) `/api/leads` respondendo dentro de um tempo aceitável e o modal avançando sem erro; (b) reload durante PIX pendente restaurando a tela de pagamento, não a de seleção de plano.
3. Atualize o `RELATORIO-CORRECOES-FUNIL.md` com os novos itens P0-A, P0-B e P1 desta rodada.

**Nota:** durante a verificação foram criados registros de teste reais no banco de produção (leads com nomes "QA"/"Verificacao"/"teste" e e-mails `@example.com`, e um PIX de R$ 7,90 que ficou pendente/não pago). Vale limpar esses registros de teste depois de aplicar as correções.
