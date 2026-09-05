# PDCA — Por que o tráfego pago no Meta não converteu vendas

**Projeto:** Currículo Rápido com IA (currículorapidocomia.com.br)
**Período analisado:** 06/08/2026 a 04/09/2026 (janela do relatório de anúncios exportado)
**Autor da análise:** Claude, a pedido de Leandro Sena
**Base usada:** histórico de código-fonte (GitHub, branch `main`), ~50 commits de correção acumulados, 9 prompts de engenharia já enviados ao Devin/Windsurf/Cursor ao longo do projeto, logs de teste automatizado (Playwright/e2e), e o relatório de anúncios exportado do Gerenciador de Anúncios do Meta.

---

## Resumo executivo

O site está tecnicamente maduro (Next.js 15, Mercado Pago, Firebase, Postgres, Resend, GA4, Meta Pixel + Conversions API) e já passou por **nove rodadas** de correções cirúrgicas via Devin, cobrindo praticamente todos os pontos de fricção clássicos de um checkout: integridade do status de pagamento, falha de download de PDF, e-mail de backup, eventos de analytics duplicados/falsos, login recorrente quebrado, e compatibilidade com navegadores in-app (Instagram/Facebook). Isso não é pouco — é sinal de um processo de melhoria contínua real, não de negligência.

Mesmo assim, a campanha no Meta gastou R$ 219,05, gerou 5.170 impressões e 3.211 de alcance **sem nenhum resultado registrado** ("Resultados" em branco no relatório), com classificação de qualidade do anúncio "abaixo da média — 35% mais baixa" e status final `not_delivering`. Ou seja: o problema não foi só o site — foi uma combinação de três fatores que se reforçam:

1. **O anúncio em si teve baixa qualidade/relevância** (segundo o próprio Meta) e escala pequena — R$ 219 em um mês não é volume suficiente para tirar conclusões estatísticas sobre conversão, e ainda por cima o anúncio parou de entregar.
2. **A imensa maioria dos cliques de um anúncio do Meta abre dentro do navegador in-app (WebView) do Facebook/Instagram**, um ambiente historicamente hostil a login OAuth, iframes de pagamento e downloads — e o histórico de commits mostra que isso *de fato* quebrou o funil várias vezes neste projeto.
3. **Bugs reais de integridade de pagamento e entrega existiram e foram documentados com evidência (prints + e-mails do Mercado Pago)** — a tela chegou a mostrar "Pagamento Aprovado" sem aprovação real, e clientes pagantes chegaram a não receber o PDF. Isso é o pior cenário possível para conversão: mesmo quando alguém tentava comprar, a experiência podia falhar de forma invisível para o time.

A boa notícia: a decisão de migrar para Google Ads ataca diretamente o fator 2 (tráfego de busca abre no navegador padrão do celular, não em WebView) e parte do fator 1 (intenção de compra explícita de quem busca "criar currículo online" é muito maior que a de quem rolou o feed e clicou num anúncio). Mas ela não resolve sozinha o fator 3, nem garante que os fatores 1 e 3 estão de fato equacionados — por isso esta auditoria termina em um prompt de engenharia para o Devin **confirmar com evidência real**, e não apenas "achar que está certo", antes de investir em uma nova campanha.

---

## P — PLAN (o que foi planejado)

- Um gerador de currículos com IA (OpenAI GPT-4o-mini) e monetização via pagamento único (~R$ 7,90–10,00) por PIX ou cartão via Mercado Pago.
- Funil: landing page → captura de lead (login Google ou manual) → formulário em etapas → preview do currículo com marca d'água → tela de planos → checkout (PIX ou cartão) → download do PDF final + e-mail de confirmação.
- Canal de aquisição inicial: Meta Ads (Facebook/Instagram), campanha de vendas.
- Instrumentação planejada: GA4 (evento `purchase`) e Meta Pixel + Conversions API server-side (evento `Purchase`), com deduplicação por `event_id`/`paymentId`.

## D — DO (o que foi de fato executado)

- O site foi construído e está no ar no domínio customizado, com toda a stack acima implementada.
- Ao longo do desenvolvimento, **9 prompts de engenharia distintos** foram enviados ao Devin (e alguns ao Windsurf/Cursor antes dele), evoluindo do básico (montagem do site, domínio/Vercel) para correções cada vez mais críticas de produção:
  1. `prompt-windsurf-melhorias.md` / `prompt-windsurf-correcao-erros.md` — fase inicial de construção.
  2. `prompt-devin-criador-curriculos.md` / `prompt-devin-dominio-vercel.md` — montagem e domínio.
  3. `prompt-devin-criticas-login-ia-pagamento.md` — primeiras críticas de login, IA e pagamento.
  4. `prompt-devin-erros-falsos-e-cliques.md` — falsos positivos de erro.
  5. `prompt-devin-ajustes-finais-ui-analytics.md` — UI e analytics.
  6. `prompt-devin-critico-download-email-ga4-login.md` — **crítico**: falha de download pós-pagamento real, e-mail como plano B, GA4 `purchase` disparando sem confirmação, login recorrente quebrado.
  7. `prompt-devin-integridade-pagamento-critico.md` — **crítico**: tela mostrando "Pagamento Aprovado" enquanto o Mercado Pago recusava o cartão (evidenciado por e-mails reais do MP), mensagem de "em análise" aparecendo antes do cliente terminar de digitar o cartão, taxa de recusa por antifraude.
- O histórico do Git (`git log`) confirma que essas tarefas foram, de fato, endereçadas em commits subsequentes — por exemplo `47437c6 fix(checkout): integridade do status de pagamento`, `e10f3f7 fix(email): envia PDF anexado`, `4753337 fix(analytics): dispara purchase apenas após confirmação real e deduplica`, `97ff1c5 fix(auth): reconhece usuário já autenticado`, além de uma série de commits específicos para navegador in-app (`fix(in-app): ...`) e para o Brick de cartão (`c486236 fix(payment): corrige bug critico 'Dado obrigatorio'`).

## C — CHECK (o que os dados e o código mostram, de fato)

### C.1 — Os números da campanha (CSV exportado do Gerenciador de Anúncios)

| Métrica | Valor |
|---|---|
| Período | 06/08/2026 – 04/09/2026 |
| Nome do anúncio | "Novo anúncio de Vendas" |
| Veiculação | **not_delivering** (parado) |
| Valor gasto | R$ 219,05 |
| Impressões | 5.170 |
| Alcance | 3.211 |
| Resultados | **(em branco)** |
| Indicador de resultados | (em branco) |
| Custo por resultado | (em branco) |
| Classificação de qualidade | **Abaixo da média — 35% mais baixa** que anúncios concorrendo pelo mesmo público |
| Classificação de engajamento | Acima da média |
| Classificação de conversão | Na média |

Leitura: orçamento e alcance modestos (não dá para tirar conclusão estatística forte sobre "o produto não vende" com uma amostra dessa escala), qualidade do anúncio abaixo da média (o próprio Meta penalizou a entrega — coerente com o `not_delivering`), e a coluna "Resultados" vazia é um sinal de alerta à parte: ou nenhum evento de otimização escolhido ocorreu, ou o evento de otimização da campanha não está alinhado ao que o pixel/CAPI do site realmente dispara. Isso precisa ser confirmado dentro do próprio Gerenciador de Anúncios (qual evento foi escolhido como meta da campanha) — está fora do que o código-fonte consegue responder sozinho.

### C.2 — Bugs reais documentados com evidência (prints + e-mails do Mercado Pago)

Achados já registrados pelo usuário e endereçados nos prompts 6 e 7 acima, citados aqui porque são a evidência mais direta de "por que quem tentou comprar não conseguiu":

- Tela do site exibiu **"Pagamento Aprovado! E-mail de confirmação enviado"** na mesma janela de poucos minutos em que 3 e-mails automáticos do Mercado Pago confirmavam **recusa** do cartão usado.
- Mensagem de **"pagamento em análise"** apareceu antes mesmo do campo de número do cartão ser preenchido.
- Cliente que pagou de fato (cartão, mobile) recebeu **"Não foi possível baixar o arquivo"** sem alternativa — ou seja, pagou e não recebeu o produto.
- Suspeita (não confirmada até então) de que o evento `purchase` do GA4 disparava sem confirmação real de pagamento aprovado, inflando artificialmente a métrica de conversão sem venda real por trás.
- Login com Google funcionando na primeira vez, mas exigindo login de novo — ou apresentando erro — em visitas seguintes.

### C.3 — Estado atual do código (o que esta auditoria confirmou por leitura direta do repositório)

Boas notícias, confirmadas por leitura de código (não apenas pelas mensagens de commit):

- `finalizePaymentDelivery` (usado tanto pelo webhook quanto pela rota `/api/payment/complete`) **reconsulta o status real do pagamento na API do Mercado Pago** antes de liberar download, e-mail ou disparo de `Purchase` — não confia apenas na resposta HTTP 200 nem em estado otimista do frontend. Isso é exatamente o padrão exigido no prompt de integridade de pagamento.
- O front-end (`CheckoutModal.tsx`) só marca `paymentStatus = 'approved'` quando `result.status === 'approved'` (cartão) ou quando o polling em `/api/payment/status/[id]` retorna `approved: true` (PIX) — ambos vindos do backend, nunca de forma otimista.
- O e-mail de confirmação já é enviado no servidor (`finalizePaymentDelivery`), com o PDF gerado no servidor e anexado, independente do sucesso do download no navegador — a "segunda via" pedida no prompt 6 existe no código atual.
- Login (`authRedirect.ts`) já verifica `auth.currentUser` antes de tratar a ausência de resultado de redirect como erro — o bug de "login recorrente quebrado" parece corrigido na lógica atual.
- O evento `purchase`/`Purchase` só é disparado depois que `/api/payment/complete` retorna sucesso (que por sua vez já validou o status real), e há deduplicação por `paymentId` via `sessionStorage` no cliente e por `event_id` no CAPI.

Pontos que **esta auditoria não conseguiu confirmar como realmente corrigidos em produção**, e que precisam de verificação com evidência real (não leitura de código) antes de qualquer novo investimento em tráfego:

1. **Se o deploy de produção realmente reflete o commit mais recente da `main`.** O log local de deploy manual da Vercel (`vercel-deploy-prod.log`) é mais antigo que os últimos commits — o que pode ser normal (deploy automático via integração GitHub↔Vercel não gera esse log local), mas precisa ser confirmado olhando o painel/API da Vercel, não presumido.
2. **Se o funil funciona de ponta a ponta dentro do navegador in-app do Facebook/Instagram** — que foi o ambiente real de quem clicou no anúncio testado. Os commits mostram várias correções específicas para esse ambiente, mas não há evidência de teste adversarial recente comprovando que login, Brick de cartão, cópia de PIX e download funcionam hoje dentro do WebView.
3. **A suíte de testes automatizados (`e2e`) está com resultados mistos nos logs mais recentes**: uma rodada mostra falhas (`test-run-checkout.log`) — embora duas delas sejam ambientais (erro `EPERM` do Playwright no Windows, não do app) e uma real (mensagem "Limite de downloads atingido" aparecendo quando não deveria); uma rodada posterior (`e2e-round2.log`) mostra os 14 testes passando, mas com o aviso `firebase-admin: conta de serviço não configurada` durante a execução — o que significa que parte da lógica que depende do Firebase Admin (leitura/gravação de `leads`) pode não ter sido exercitada de verdade nesse teste.
4. **18 arquivos com mudanças não commitadas** no ambiente local (`git status`), incluindo arquivos sensíveis como `api/payment/create/route.ts` e `CheckoutModal.tsx`. A amostra verificada mostra que a diferença é só normalização de fim de linha (CRLF/LF, sem mudança de conteúdo), mas isso precisa ser confirmado para *todos* os 18 arquivos — em especial `package.json`/`package-lock.json`, que têm uma diferença grande demais para ser só isso sem checagem manual — antes de assumir que não há nada "solto" e não versionado.

### C.4 — Achados novos desta auditoria (não cobertos pelos prompts anteriores)

- **Busy-wait síncrono no clique de pagamento com cartão.** A função `getMercadoPagoDeviceId` (`CardPaymentBrick.tsx`) tenta esperar o Device ID do Mercado Pago com um laço `while` síncrono de até 2 segundos, travando a thread principal do navegador nesse intervalo. Isso significa que, no momento exato em que o cliente clica para pagar com cartão, a página pode congelar por até 2s — pior ainda em celulares mais fracos e dentro de navegadores in-app, que já são mais lentos. É o tipo de fricção que faz gente desistir sem nem ver mensagem de erro.
- **Possível duplicidade do evento `Purchase` no Meta Conversions API.** Tanto o webhook do Mercado Pago quanto a rota `/api/payment/complete` (chamada pelo próprio frontend) acionam `finalizePaymentDelivery`, que dispara `trackMetaPurchaseServerSide` — ou seja, para uma única compra aprovada, o evento `Purchase` pode ser enviado ao Meta **duas vezes** (mesmo `event_id`, então o Meta deve deduplicar, mas isso não está confirmado, e não custa nada blindar).
- **Nenhuma tag de conversão do Google Ads existe hoje no código** — só GA4 e Meta Pixel/CAPI. Para rodar Google Ads com qualquer chance de otimizar por conversão de compra, isso precisa existir antes do lançamento, não depois.
- **Não foi encontrada nenhuma página de Termos de Uso ou Política de Reembolso** — só uma Política de Privacidade. Para um produto pago cobrado com cartão de crédito, isso é relevante tanto para a política de anúncios do Google (Google Ads costuma exigir transparência de preço, identificação do vendedor e política de reembolso visíveis para contas que vendem produtos/serviços pagos) quanto para o Código de Defesa do Consumidor brasileiro (direito de arrependimento de 7 dias em compras online).

## A — ACT (causas raízes e plano de ação)

**Causas raízes prováveis da conversão zero no Meta, em ordem de peso:**

1. Fricção e falhas reais no funil de pagamento em mobile e, especialmente, dentro do navegador in-app do Facebook/Instagram — ambiente de praticamente 100% do tráfego pago testado.
2. Bugs de integridade que geraram desconfiança e perda de vendas invisíveis (aprovação falsa, download falho) durante parte do período da campanha — parecem corrigidos no código atual, mas sem confirmação por teste real recente.
3. Escala e qualidade do anúncio insuficientes para qualquer conclusão estatística — R$ 219 em um anúncio classificado como abaixo da média não é uma prova de que "o site não converte", é uma amostra pequena demais rodando com um anúncio que o próprio Meta já sinalizava como fraco.
4. Descompasso entre o evento de otimização escolhido na campanha do Meta e o que o site realmente reporta (a confirmar dentro do Gerenciador de Anúncios).

**Decisão adotada:** migrar a próxima rodada de tráfego pago para o Google Ads (rede de busca), buscando público com intenção de compra explícita ("fazer currículo online", "criar currículo profissional grátis/pago", "modelo de currículo ATS" etc.). Isso ataca diretamente a causa raiz nº 1 (tráfego de busca no Google abre no navegador padrão do celular — Chrome/Safari — não em WebView) e parcialmente a nº 3 (intenção de compra mais qualificada).

**O que precisa acontecer antes de gastar orçamento em Google Ads** (resumo — detalhado no prompt de engenharia entregue ao Devin):

1. Confirmar com evidência real (não suposição) que o deploy em produção está atualizado e que todo o funil de pagamento funciona hoje, incluindo dentro de navegadores in-app (por segurança, mesmo o Google Ads eventualmente gerando cliques via apps).
2. Corrigir o busy-wait do Device ID e blindar a duplicidade de `Purchase` no CAPI.
3. Resolver a higiene do Git (18 arquivos soltos) antes de qualquer nova rodada de mudanças, para não perder rastreabilidade.
4. Implementar a tag de conversão do Google Ads reaproveitando o mesmo ponto (já validado) onde o `Purchase` do Meta e o `purchase` do GA4 disparam — nunca de forma otimista.
5. Fechar as lacunas de conformidade (Termos de Uso, Política de Reembolso, identificação do vendedor) antes de submeter os anúncios ao Google Ads, para evitar reprovação/suspensão da conta de anúncios.
6. Rodar a auditoria de funil real (leads → checkouts iniciados → pagamentos criados → pagamentos aprovados) cruzando Postgres/Firestore com o período da campanha do Meta, para ter um "Check" quantitativo definitivo em vez de depender só de relatos.

O prompt de engenharia abaixo (arquivo separado, no mesmo padrão dos prompts anteriores enviados ao Devin) formaliza essas tarefas.
