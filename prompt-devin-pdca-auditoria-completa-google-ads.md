# Prompt CIRÚRGICO para Devin — Auditoria completa pós-Meta Ads e preparação para Google Ads

## Contexto e gravidade

Rodamos tráfego pago real no Meta Ads (Facebook/Instagram) por cerca de um mês (06/08 a 04/09),
gastamos R$ 219,05, geramos 5.170 impressões e 3.211 de alcance, e **não convertemos nenhuma
venda** — houve tentativas de compra, mas inconclusivas/falhas. O anúncio terminou com status
`not_delivering` e classificação de qualidade "abaixo da média — 35% mais baixa".

Isso acontece depois de nove rodadas anteriores de correções neste projeto (histórico completo nos
arquivos `prompt-devin-*.md` e `prompt-windsurf-*.md` na raiz do repositório — leia-os antes de
começar, principalmente `prompt-devin-integridade-pagamento-critico.md` e
`prompt-devin-critico-download-email-ga4-login.md`, que documentam bugs graves e com evidência real
de produção: tela mostrando "Pagamento Aprovado" sem aprovação real do Mercado Pago, download de
PDF falhando para clientes que pagaram, e suspeita de eventos de analytics disparando sem
confirmação real de compra).

A leitura do código atual (commit mais recente da `main`) indica que a maior parte dessas correções
**parece** implementada corretamente (gating real do status de pagamento via reconsulta à API do
Mercado Pago em `src/lib/paymentComplete.ts`, e-mail de backup com PDF anexado, deduplicação de
`Purchase`/`purchase` por `paymentId`, correção da ordem de checagem de sessão em
`src/lib/authRedirect.ts`). Mas "parece implementado" não é o mesmo que "está confirmado em
produção com teste real" — e isso é exatamente o padrão de rigor já estabelecido nas correções
anteriores deste projeto: **nenhuma tarefa abaixo está concluída sem evidência de teste real**,
não "deveria funcionar agora".

A decisão de negócio já tomada é: a próxima rodada de tráfego pago será no **Google Ads** (rede de
busca), para atingir um público com intenção de compra explícita, em vez de tráfego de feed. Isso
muda o ambiente predominante de acesso (navegador padrão do celular, não o WebView do
Facebook/Instagram), mas não elimina a necessidade de garantir que o funil de pagamento é
tecnicamente sólido — o Google Ads também gera cliques a partir do app do Google, Gmail, etc., que
também podem abrir em WebView em alguns casos.

Investigue a causa raiz antes de corrigir qualquer coisa. Rode `npm run build` após cada mudança.
Commits separados por tarefa, com mensagens claras. Nunca imprimir segredos completos (tokens,
chaves, service account) no terminal/log. Ao final de tudo: push para `main`, deploy de produção
via Vercel, e validação completa no domínio customizado (`currículorapidocomia.com.br`).

---

## Tarefa 0 — Higiene do repositório e confirmação do que está realmente em produção

Antes de tocar em qualquer lógica, resolva duas questões de base que colocam em dúvida se as
correções anteriores estão realmente no ar:

1. **Confirme, pela API/CLI da Vercel (não por suposição), qual é o commit SHA atualmente servido
   em produção** no domínio customizado, e compare com o HEAD atual de `origin/main`. Se houver
   defasagem, dispare um novo deploy de produção e documente isso claramente no relatório final —
   esse é o achado mais importante possível caso exista, porque invalidaria a análise de qualquer
   outra tarefa abaixo.
2. **Rode `git status` e `git diff --stat`** no working tree. No momento desta auditoria havia 18
   arquivos com mudanças não commitadas (incluindo `src/components/CheckoutModal.tsx`,
   `src/app/api/payment/create/route.ts`, `src/app/api/payment/status/[id]/route.ts`,
   `package.json`, `package-lock.json`, entre outros). Uma amostra indicou que a diferença é apenas
   normalização de fim de linha (CRLF/LF, sem mudança de conteúdo), mas **confirme isso para os 18
   arquivos, um a um**, especialmente `package.json`/`package-lock.json` (a diferença ali é grande
   demais — 90 e ~21.000 linhas — para aceitar "é só line ending" sem checar o conteúdo real com
   `git diff -w` ou equivalente). Se for de fato só normalização, adicione um `.gitattributes` com
   `* text=auto eol=lf`, normalize o repositório uma única vez (`git add --renormalize .`) e faça
   commit dedicado, para que isso não volte a acontecer e não esconda mudanças reais em diffs
   futuros. Se encontrar qualquer mudança funcional real escondida nesses arquivos, trate-a como um
   achado à parte e decida com cuidado se deve ser commitada, revertida ou revisada.

**Critério de aceite:** relatório claro do commit SHA em produção vs. `main`, com deploy corrigido
se necessário; os 18 arquivos com diff resolvidos (commitados ou descartados) com confirmação
explícita, arquivo por arquivo, de que não havia mudança funcional escondida; `.gitattributes`
adicionado.

---

## Tarefa 1 — CRÍTICO: reauditoria adversarial de todo o funil de pagamento, com foco no navegador in-app

Esta é a tarefa mais importante. Não é para revisar o código e concluir "parece certo" — é para
**forçar os mesmos cenários que já causaram falha real em produção** e provar, com evidência
concreta, que não falham mais.

1. Cenários obrigatórios, em desktop E mobile, com PIX e com cartão:
   - Pagamento aprovado (cartão de teste de aprovação do Mercado Pago, ou dado real de baixo
     valor).
   - Pagamento recusado por diversos motivos (`cc_rejected_high_risk`,
     `cc_rejected_insufficient_amount`, cartão inválido, etc. — usar os cartões de teste do
     Mercado Pago para simular cada `status_detail` relevante).
   - Pagamento em análise (`in_process`/`pending`).
   - Em nenhum desses cenários a tela pode exibir "Pagamento Aprovado!" sem uma confirmação real de
     `status: approved` vinda do backend (reconfirme que `finalizePaymentDelivery` /
     `ensureApprovedOrder` continuam sendo o único caminho para liberar download, e-mail e evento
     de `Purchase`/`purchase` — não deve haver nenhum atalho novo introduzido desde a última
     correção).
2. **Repita os cenários acima especificamente dentro do navegador in-app do Facebook e do
   Instagram** (use um celular real abrindo um link a partir do app, ou o emulador/heurística mais
   próxima disponível) — foi o ambiente real de praticamente todo o tráfego pago já rodado. Para
   cada etapa (login/captura de lead, preenchimento do Brick de cartão, geração e cópia do código
   PIX, download do PDF, abertura do e-mail de confirmação), documente explicitamente se funciona
   ou não dentro do WebView. Onde não funcionar e não houver correção viável dentro do WebView em
   si, confirme que o fallback/aviso já implementado (`src/lib/inAppBrowser.ts`,
   `detectInAppBrowser`) está de fato visível e orientando o usuário a abrir no navegador padrão —
   e não apenas logando no console.
3. Repita os mesmos cenários em Chrome Android e Safari iOS "normais" (fora de WebView), já que
   será o ambiente predominante do tráfego do Google Ads.
4. Para cada cenário, anexe evidência real: prints de tela, e o resultado cruzado com
   `GET /v1/payments/search` na API do Mercado Pago para aquele `payment_id`/`external_reference`
   específico (status, `status_detail`, `date_approved`).

**Critério de aceite:** matriz completa (dispositivo × navegador × método de pagamento × cenário)
com evidência de teste real para cada célula relevante, sem nenhuma célula marcada como "assumido
correto" sem teste.

---

## Tarefa 2 — Corrigir o busy-wait síncrono no Device ID do Mercado Pago

**Achado desta auditoria:** `getMercadoPagoDeviceId` em `src/components/CardPaymentBrick.tsx` usa
um laço `while` síncrono (busy-wait) de até 2000ms tentando ler `window.MP_DEVICE_SESSION_ID`. Isso
bloqueia a thread principal do navegador — no exato momento em que o cliente clica para pagar com
cartão, a página pode congelar por até 2 segundos, sem nenhum feedback visual, o que é
particularmente grave em celulares mais fracos e dentro de navegadores in-app (já mais lentos por
natureza).

1. Substitua o busy-wait por uma espera assíncrona real (ex.: `Promise` com `setTimeout`/polling
   não bloqueante, ou observar o carregamento do script de segurança via evento/callback em vez de
   `while`).
2. Garanta que a UI continua responsiva durante essa espera (idealmente com um indicador visual, já
   que o usuário acabou de clicar em "pagar").
3. Confirme que o comportamento de fallback (enviar o pagamento mesmo sem o Device ID, caso o
   Mercado Pago realmente não tenha carregado a tempo) continua funcionando — hoje o código já
   aceita `deviceId` undefined; apenas garanta que a espera não bloqueia a submissão além do
   razoável.
4. Meça o tempo entre o clique em "pagar" e a Brick de fato submeter, antes e depois da correção,
   em um dispositivo mobile de gama média/baixa (throttling de CPU no DevTools serve como proxy).

**Critério de aceite:** nenhum bloqueio perceptível da UI ao clicar em pagar com cartão; tempo de
resposta ao clique documentado antes/depois.

---

## Tarefa 3 — Investigar e blindar possível duplicidade do evento `Purchase` no Meta CAPI

**Achado desta auditoria:** tanto `src/app/api/payment/webhook/route.ts` (quando o Mercado Pago
notifica `status: approved`) quanto `src/app/api/payment/complete/route.ts` (chamado pelo
frontend logo após a aprovação) acionam `finalizePaymentDelivery`, que por sua vez dispara
`trackMetaPurchaseServerSide`. Para uma única compra aprovada, isso pode enviar o evento `Purchase`
ao Meta Conversions API **duas vezes**.

1. Confirme se isso de fato ocorre na prática (logs/timing de uma compra real de teste — qual das
   duas rotas dispara primeiro, se as duas chegam a rodar para o mesmo pagamento).
2. Mesmo sendo o mesmo `event_id` (o Meta deveria deduplicar automaticamente por `event_id` dentro
   de uma janela de tempo), implemente uma blindagem explícita no código: um flag persistido no
   pedido (Postgres), por exemplo `capi_purchase_sent_at`, verificado antes de chamar
   `trackMetaPurchaseServerSide` em `finalizePaymentDelivery`, para nunca depender só da
   deduplicação do lado do Meta.
3. Documente, no relatório final, se essa duplicidade pode ter contribuído para os "7 eventos de
   purchase" mencionados como suspeitos em correção anterior (`prompt-devin-critico-download-email-ga4-login.md`,
   Tarefa 3) — se ainda houver dados históricos acessíveis para cruzar.

**Critério de aceite:** no máximo um evento `Purchase` via CAPI por pagamento aprovado, comprovado
por teste real com logging antes/depois.

---

## Tarefa 4 — Auditoria quantitativa do funil real durante a campanha do Meta

Este é o "Check" definitivo — mais confiável que qualquer suposição sobre o motivo da conversão
zero.

1. Usando o Postgres/Firestore do projeto, monte um relatório do funil real entre 06/08/2026 e
   04/09/2026 (mesma janela do relatório de anúncios): quantos leads foram capturados
   (`leads`/evento `lead_captured`), quantos checkouts foram iniciados (evento `checkout_started`),
   quantos pagamentos foram de fato criados no Mercado Pago (qualquer status, via
   `orders`/`insertOrderPostgres`), quantos chegaram a `approved`, e quantos tiveram
   `payment_delivered` registrado com sucesso.
2. Identifique exatamente em qual etapa a maior queda ocorreu (ex.: muitos leads mas poucos
   checkouts iniciados → problema de oferta/preço/confiança; muitos checkouts iniciados mas poucos
   pagamentos aprovados → problema técnico/antifraude; pagamentos aprovados mas poucas entregas
   confirmadas → problema de entrega, já endereçado nas tarefas anteriores).
3. Cruze esse número com o texto "Resultados" em branco no relatório de anúncios do Meta — confirme
   junto ao usuário (ele tem acesso ao Gerenciador de Anúncios) qual evento foi configurado como
   meta de otimização daquela campanha, e se ele corresponde a algum evento que o site de fato
   dispara (`Lead`, `InitiateCheckout` ou `Purchase`). Um descompasso aqui explicaria uma coluna de
   resultados vazia mesmo que tenha havido atividade real no funil.

**Critério de aceite:** relatório numérico do funil real da campanha, com a etapa de maior perda
identificada e documentada, e confirmação (ou não) do alinhamento entre o evento de otimização da
campanha e os eventos realmente disparados pelo site.

---

## Tarefa 5 — Preparar o site para o Google Ads

1. **Implementar rastreamento de conversão do Google Ads** (Google Tag / evento de conversão do
   Google Ads, com Enhanced Conversions se possível), disparado **no mesmo ponto já validado e
   protegido** onde hoje disparam `trackPurchase` (GA4) e `trackMetaPurchase`/CAPI (Meta) — ou seja,
   somente após confirmação real de `status: approved` pelo backend, nunca de forma otimista, e com
   a mesma deduplicação por `paymentId`. Peça ao usuário o ID de conversão do Google Ads
   (`AW-XXXXXXXXX/XXXXXXXXXXXX`) e trate como variável de ambiente pública
   (`NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` ou equivalente), seguindo o mesmo padrão já usado para
   `NEXT_PUBLIC_META_PIXEL_ID`/`NEXT_PUBLIC_GA_MEASUREMENT_ID`.
2. **Capturar e persistir o `gclid`** (Google Click ID) da URL de chegada junto com o lead/pedido
   (mesmo padrão hoje usado para `fbp`/`fbc` do Meta em `src/lib/metaConversionsApi.ts`), para
   permitir atribuição correta e uma futura importação de conversões offline/Enhanced Conversions
   caso necessário.
3. **Auditoria de Landing Page Experience** (relevante tanto para Quality Score do Google Ads
   quanto para a própria taxa de conversão):
   - Rodar Lighthouse mobile na landing page e nas primeiras etapas do funil; documentar Core Web
     Vitals (LCP, CLS, INP) e corrigir o que estiver claramente ruim.
   - Confirmar que o preço é comunicado de forma clara e visível antes do clique em "criar
     currículo" (sem letras miúdas escondendo o valor real).
   - Confirmar que não há elementos que a política do Google Ads costuma penalizar (pop-ups
     agressivos, redirecionamentos inesperados, anúncios intersticiais).
4. **Conformidade e transparência** — hoje só existe página de Política de Privacidade
   (`src/app/politica-privacidade`). Para um produto pago cobrado com cartão de crédito, e para
   reduzir risco de reprovação/suspensão da conta do Google Ads:
   - Criar uma página de **Termos de Uso**.
   - Criar uma página de **Política de Reembolso/Cancelamento**, deixando claro o direito de
     arrependimento de 7 dias previsto no Código de Defesa do Consumidor para compras online no
     Brasil, e o processo prático para o cliente solicitar.
   - Confirmar que há identificação clara do responsável pelo serviço (nome da empresa/CNPJ se
     houver, e-mail/canal de contato/suporte) visível no rodapé ou nas páginas legais — hoje o
     rodapé/README menciona "LS Soluções Digitais", mas confirme que isso está visível para o
     usuário final no próprio site, não só no código-fonte.
   - Linkar essas páginas no rodapé e, se fizer sentido, próximo ao botão de pagamento.

**Critério de aceite:** conversão do Google Ads disparando corretamente e apenas em compras reais
confirmadas (teste real, mesmo padrão de evidência das tarefas anteriores); `gclid` sendo
persistido; relatório de Lighthouse mobile antes/depois; páginas de Termos de Uso e Política de
Reembolso publicadas e linkadas.

---

## Tarefa 6 — Estabilizar e revalidar a suíte de testes automatizados (e2e)

1. Resolva o erro `browserType.launch: spawn EPERM` visto em uma das rodadas de teste — parece ser
   uma restrição de ambiente/permissão local do Windows para o executável do Chromium do
   Playwright, não um bug do aplicativo, mas confirme e documente a causa e a correção (ex.:
   permissões da pasta do Playwright, antivírus bloqueando, ou variável de ambiente necessária).
2. Elimine o aviso `firebase-admin: conta de serviço não configurada` que aparece durante a
   execução dos testes e2e — isso indica que `FIREBASE_SERVICE_ACCOUNT_KEY` (ou o trio
   `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`) não está disponível no
   ambiente onde os testes rodam localmente, o que significa que qualquer teste que dependa de
   `adminDb` (leitura/escrita real de `leads`/`resumes`) pode estar rodando sem essa peça
   funcionando de verdade. Configure o ambiente de teste com essas credenciais (ou um mock explícito
   e documentado, se for essa a estratégia) para que a suíte exercite o caminho real.
3. Rode `npm run test:e2e` do zero após as correções acima e confirme os 14+ testes passando de
   forma limpa, sem os erros/avisos acima, anexando o log completo como evidência.

**Critério de aceite:** suíte e2e completa passando sem `EPERM` e sem o aviso de conta de serviço
não configurada; log limpo anexado como evidência.

---

## Diretrizes gerais (mesmo rigor das rodadas anteriores)

- **Ordem de execução sugerida:** Tarefa 0 (higiene/deploy) e Tarefa 4 (auditoria quantitativa do
  funil) primeiro — elas dizem a verdade sobre o que realmente aconteceu antes de qualquer correção
  nova. Depois Tarefa 1 (reauditoria do pagamento, prioridade absoluta de qualquer correção).
  Depois Tarefas 2 e 3 (achados técnicos pontuais desta auditoria). Depois Tarefa 6 (estabilizar
  testes). Por fim Tarefa 5 (preparação para Google Ads) — não faz sentido investir nisso antes de
  confirmar que o funil de pagamento é sólido.
- Cada tarefa exige evidência de teste real cruzando o que a tela mostra com o que a API do Mercado
  Pago (ou o Postgres/Firestore) efetivamente registrou — "parece corrigido" não é uma conclusão
  aceitável.
- Nunca imprimir segredos completos (tokens, chaves, service account, `RESEND_API_KEY`, etc.) no
  terminal/log.
- `npm run build` após cada mudança; commits separados por tarefa com mensagens claras.
- Ao final: push para `main`, deploy de produção via Vercel, validação completa no domínio
  customizado, e um **relatório final único** contendo, para cada tarefa: causa raiz identificada
  (ou confirmação de que não havia problema), correção aplicada (se houve), e evidência concreta de
  teste — incluindo uma tabela-resumo antes/depois e um checklist final de prontidão para começar a
  rodar tráfego pago no Google Ads.
