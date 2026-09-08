# Relatório de Correções do Funil de Conversão

**Data:** 07/09/2026  
**Commits:** `50b8ca4`, `f32eb34` (rodada 1) + novo commit (rodada 2)

---

## Rodada 1 — 7 correções originais

1. **P0-1 — Pagamento aprovado não libera o download do PDF:** A causa raiz era `onPaymentSuccess` no array de dependências do `useEffect` de polling, que recriava o intervalo a cada re-render do parent e nunca chegava a verificar o status. Removido das deps, adicionado `onPaymentSuccessRef`, persistência do payment ID para recuperação após reload, e recovery check ao reabrir o `CheckoutModal`. Adicionado contato de suporte na mensagem de timeout.

2. **P0-2 — Nenhum evento de compra é disparado:** Os eventos de tracking (GA4 `purchase`, Meta `Purchase`, Google Ads `conversion`) estavam dentro do bloco de sucesso do delivery — se o delivery falhasse, nenhum evento disparava. Movidos para `firePurchaseEvents()` disparado imediatamente na confirmação de aprovação (3 pontos: polling PIX, verificação manual, cartão aprovado), independente do sucesso do download.

3. **P0-3 — Meta Pixel eventos suprimidos:** O código já usava `event_id` para deduplicação Pixel vs Conversions API. A supressão é configuração no Meta Business Manager (verificação de domínio + categoria especial de emprego). Nenhuma alteração de código necessária — ação pendente para o dono do produto verificar o domínio no Meta Business Manager.

4. **P0-4 — Tag de conversão do Google Ads não verificada:** Adicionado `gtag('config', 'AW-18434491826')` à inicialização do gtag (sem carregar um segundo script). O `send_to` agora inclui o label completo `AW-18434491826/FyTzCPCd-e8cELKLoNZE`. O evento `conversion` dispara junto com GA4 e Meta em `firePurchaseEvents()`.

5. **P1-5 — Exit-intent modal empilha sobre lead capture:** Adicionado prop `isAnyModalOpen` ao `ExitSurvey`; `showOnce()` verifica via ref se outro modal está aberto antes de disparar. `page.tsx` passa `showLeadCapture || showCheckout`.

6. **P1-6 — Perda silenciosa ao salvar o lead:** Removido `onComplete()` do bloco `catch` — o usuário não avança sem salvar com sucesso. Erro específico é mostrado (timeout vs erro genérico) com mensagem para tentar novamente. `backgroundSave` continua tentando em segundo plano.

7. **P2-7 — Chaves de tradução cruas na interface:** Adicionadas `steps.languages`, `common.saved` e `common.error` nos 3 idiomas (PT/EN/ES). Removidos fallbacks inline em `page.tsx`.

---

## Rodada 2 — Correções pós-deploy (verificação independente)

### P0-A — `/api/leads` lento (7-9s) trava captura de lead

**Causa raiz:** O endpoint `/api/leads` aguardava sequencialmente a escrita no Postgres (`insertLeadPostgres` + `insertFunnelEventPostgres`) antes de responder ao cliente. Essas escritas são apenas para analytics e não deveriam bloquear a resposta. O cliente tinha timeout de 7s, menor que os 7-9s do servidor.

**Correções:**
- **Servidor (`/api/leads`):** Postgres writes tornados fire-and-forget (void async IIFE) — a resposta ao cliente é enviada imediatamente após salvar no Firestore (primary store).
- **Cliente (`LeadCaptureModal`):** Timeout aumentado de 7s para 15s. Adicionado `submitInFlightRef` para impedir duplo-envio (botão "Continuar" bloqueia durante request em andamento). Adicionado `leadSavedRef` para não reenviar se já salvou com sucesso.

### P0-B — Dropdown/autocomplete solto, fora da posição do campo

**Causa raiz:** O `SearchableSelect` usa `position: fixed` (viewport-relative), mas adicionava `window.scrollY/scrollX` às coordenadas — isso é correto para `position: absolute`, mas empurra o dropdown para longe quando a página está rolada e o positioning é `fixed`.

**Correção:** Removido `window.scrollY/scrollX` das coordenadas. Para abrir acima do input, trocado de `bottom` para `top` calculado (ambos agora viewport-relative puro). Adicionado `search` ao array de dependências do `useLayoutEffect` para recalcular posição quando o conteúdo muda.

### P0-3 — PIX pendente perdido se a página recarregar

**Causa raiz:** O payment ID era salvo em `sessionStorage` (que pode ser limpo em alguns cenários de reload) e o recovery só funcionava se o usuário reabrisse manualmente o modal de checkout — não havia recovery automático na carga da página.

**Correções:**
- **Migrado de `sessionStorage` para `localStorage`** — sobrevive a fechar/reabrir aba, não só F5.
- **Page-level recovery:** `page.tsx` agora verifica `localStorage.getItem('checkout_payment_id')` na carga da página e auto-abre o `CheckoutModal` se encontrar, disparando o recovery check (status → approved: download, pending: reexibir QR, expired: limpar).
- **Não limpa payment ID ao fechar modal** — só limpa explicitamente em caso de erro de recovery ou conclusão.

### P2 — Tela de Pagamento não traduzida em EN/ES

**Correção:** Adicionadas 28 chaves de tradução na seção `pricing` do i18n (PT/EN/ES) cobrindo: título, subtítulo, nomes dos planos, descrições, features, badge, botão selecionar, aviso de segurança, títulos do checkout, textos do PIX, botões de verificar/baixar, mensagens de pendente/erro. `PricingCards` e `CheckoutModal` agora usam `useLanguage()` e `t()` para todos os textos visíveis.

---

## Arquivos modificados (rodada 2)

| Arquivo | Correção |
|---------|----------|
| `src/app/api/leads/route.ts` | P0-A (Postgres fire-and-forget) |
| `src/components/LeadCaptureModal.tsx` | P0-A (timeout 15s, anti-duplo-envio) |
| `src/components/ui/SearchableSelect.tsx` | P0-B (fix dropdown positioning) |
| `src/components/CheckoutModal.tsx` | P0-3 (localStorage), P2 (i18n) |
| `src/app/page.tsx` | P0-3 (page-level recovery) |
| `src/components/PricingCards.tsx` | P2 (i18n) |
| `src/lib/i18n.ts` | P2 (pricing translations PT/EN/ES) |
| `e2e/conversion-funnel.spec.ts` | E2E: slow lead, dropdown anchor, localStorage recovery |

## Testes E2E (Playwright)

`e2e/conversion-funnel.spec.ts` agora cobre:
- Fluxo completo: lead → checkout → PIX mock → download + tracking events
- Recuperação após reload (payment ID em **localStorage**, auto-open checkout)
- Exit survey não empilha sobre lead capture
- Lead save failure mostra erro e não avança
- **NOVO:** Lead save com resposta lenta (8s) ainda avança (timeout 15s)
- **NOVO:** Dropdown ancorado abaixo do input após scroll

## Teste manual pendente (dono do produto)

1. Fazer pagamento PIX real de R$ 7,90 ponta a ponta
2. Confirmar que o botão de download aparece automaticamente
3. Confirmar PDF final sem marca d'água
4. Recarregar a página após pagar — confirmar recuperação do download
5. Verificar evento `purchase` no GA4 em tempo real
6. Verificar evento `Purchase` no Meta Events Manager
7. Verificar conversão no Google Ads (Metas → Conversões → Compra)
8. Verificar que avisos de "suppressed" do Meta Pixel somem do console
9. **NOVO:** Testar captura de lead em rede lenta (throttle 3G no DevTools) — não deve dar timeout
10. **NOVO:** Gerar PIX, recarregar a página (F5) — deve restaurar a tela de pagamento, não a de seleção de plano
11. **NOVO:** Mudar idioma para EN/ES e verificar tela de pagamento traduzida

## Ações pendentes para o dono do produto

- **Meta Business Manager:** Verificar domínio `curriculorapidocomia.com.br` em Configurações da Empresa → Domínios
- **Meta Business Manager:** Confirmar se a conta de anúncios está marcada como categoria especial de emprego
- **Google Ads:** Não configurar importação de conversão via GA4 para a mesma ação "Compra" (usar apenas a tag direta `AW-18434491826/FyTzCPCd-e8cELKLoNZE`)
- **Limpeza:** Remover registros de teste do banco (leads "QA"/"Verificacao"/"teste", e-mails @example.com, PIX pendente)

---

## Rodada 3 — Ajuste fino (pós-teste ao vivo em produção)

### Alto — Recuperação de PIX após reload não mostra código/valor

**Causa raiz:** `/api/payment/status/:id` devolvia apenas `{id, status, approved}` — sem `amount`, `qr_code` ou `qr_code_base64`. O `CheckoutModal` na recuperação setava `paymentData` com strings vazias, resultando em "Total: R$ 0,00" e "QR Code indisponível" com código PIX vazio.

**Correções:**
- **Servidor (`/api/payment/status/:id`):** Quando o pagamento está `pending` ou `in_process`, agora retorna também `amount` (de `transaction_amount`) e `qr_code`/`qr_code_base64` (de `point_of_interaction.transaction_data`).
- **Cliente (`CheckoutModal`):** `checkPaymentStatus` agora retorna `PaymentStatusResponse` com todos os campos. A recovery usa esses dados para restaurar `paymentData` com o QR code e código PIX reais. Adicionado `restoredAmount` para exibir o valor correto quando `amount` prop é 0.
- **Polling e handleCheckStatus** atualizados para usar a nova interface.

### Baixo-1 — Aba "Cartão" não traduz em EN

**Correção:** CheckoutModal agora usa `t('payment.cardTab')` em vez de string fixa "Cartão". As chaves já existiam no i18n (`payment.cardTab` = "Card" em EN, "Tarjeta" em ES).

### Baixo-2 — Textos da seção PIX não traduzidos

**Correção:** Adicionadas 11 chaves de i18n na seção `pricing` (PT/EN/ES): `pixQrUnavailable`, `pixCodeLabel`, `copyPixCode`, `copied`, `generatingQr`, `tryAgain`, `openPdfNewTab`, `emailSent`, `autoDownloadStarted`, `paymentIdNotFound`, `pollTimeout`. CheckoutModal agora usa `t()` para todos esses textos.

### Baixo-3 — Rodapé só em português

**Correção:** Adicionada seção `footer` no i18n (PT/EN/ES) com 7 chaves: `brand`, `company`, `support`, `terms`, `privacy`, `refund`, `copyright`. `Footer.tsx` convertido para client component com `useLanguage()`. Movido para dentro do `LanguageProvider` no layout.

### Baixo-4 — Pluralização "1 downloads"

**Correção:** Adicionada chave `featurePdfSingular` no i18n (PT/EN/ES). `PricingCards` usa `featurePdfSingular` para 1 download, `featurePdf` (plural) para 2+.

### Arquivos modificados (rodada 3)

| Arquivo | Correção |
|---------|----------|
| `src/app/api/payment/status/[id]/route.ts` | Alto: retornar amount + PIX data quando pending |
| `src/components/CheckoutModal.tsx` | Alto: recovery com dados reais; Baixo-1/2: i18n de todos os textos |
| `src/components/PricingCards.tsx` | Baixo-4: singular/plural |
| `src/components/Footer.tsx` | Baixo-3: i18n + client component |
| `src/app/layout.tsx` | Baixo-3: Footer dentro do LanguageProvider |
| `src/lib/i18n.ts` | Todas as novas chaves (pricing + footer, PT/EN/ES) |

### Teste manual pendente (rodada 3)

1. Gerar PIX → recarregar página (F5) → confirmar que valor e código PIX aparecem corretos
2. Confirmar que dá para escanear/pagar pelo QR code recuperado
3. Mudar idioma para EN → verificar: aba "Card", textos do PIX, rodapé
4. Mudar idioma para ES → verificar o mesmo
5. Verificar que plano Básico mostra "1 download" (singular) em PT, "1 resume PDF download" em EN

---

## Rodada 4 — Correção crítica: cliente pagou e download falha com "signal is aborted without reason"

### Impacto: MÁXIMO — cliente pagante sem produto (bug original que motivou toda a auditoria)

### Causa raiz (confirmada por leitura de código)

O fluxo pós-aprovação era síncrono e encadeado:
1. `CheckoutModal` chama `POST /api/payment/complete` com timeout cliente de 15s
2. `/api/payment/complete` → `finalizePaymentDelivery()` fazia **tudo em sequência antes de responder**:
   - Geração de PDF (`generateResumePdfBuffer`, timeout interno 15s)
   - Envio de e-mail via Resend (com retry + backoff exponencial)
   - Só depois retornava `downloadUrl`
3. Se a soma ultrapassava 15s, `AbortController.abort()` (sem motivo) disparava → mensagem crua "signal is aborted without reason" na tela do cliente
4. O PDF também era gerado **duas vezes** (uma para e-mail, outra no endpoint `/api/download/[id]`)

### Correções aplicadas

**1. Desacoplamento da resposta de `/api/payment/complete` (CRÍTICO)**
- `finalizePaymentDelivery()` agora retorna `{ success, downloadUrl }` **imediatamente** após confirmar aprovação e salvar snapshot
- Geração de PDF + envio de e-mail + CAPI + funnel event executam como **fire-and-forget** (`void async IIFE`) — não bloqueiam a resposta
- O cliente recebe o link de download em < 1s após aprovação
- Arquivo: `src/lib/paymentComplete.ts`

**2. Nunca mostrar mensagem técnica crua ao usuário**
- `fetchWithTimeout` em `CheckoutModal.tsx` e `downloadPdf.ts` agora passam motivo legível: `controller.abort(new Error('Tempo limite excedido.'))`
- `catch` blocks tratam `AbortError` explicitamente — "signal is aborted without reason" nunca mais aparece
- Arquivos: `src/components/CheckoutModal.tsx`, `src/lib/downloadPdf.ts`

**3. `maxDuration` configurado nas rotas serverless**
- `/api/payment/complete`: `export const maxDuration = 60`
- `/api/download/[id]`: `export const maxDuration = 60`
- Antes: sem configuração (default Vercel = 10s), função podia ser morta no meio da geração do PDF
- Arquivos: `src/app/api/payment/complete/route.ts`, `src/app/api/download/[id]/route.ts`

**4. Timeout do cliente aumentado para 30s**
- `completePaymentAndDownload` em `CheckoutModal.tsx`: timeout de 15s → 30s (margem de segurança; resposta agora é quase instantânea)

**5. Baixo: Card tab após recuperação de PIX mostrava R$ 0,00**
- Card section e `CardPaymentBrick` agora usam `restoredAmount` quando `amount` prop é 0
- Arquivo: `src/components/CheckoutModal.tsx`

### Arquivos modificados (rodada 4)

| Arquivo | Correção |
|---------|----------|
| `src/lib/paymentComplete.ts` | Crítico: PDF+email+CAPI fire-and-forget, resposta imediata |
| `src/app/api/payment/complete/route.ts` | maxDuration=60 |
| `src/app/api/download/[id]/route.ts` | maxDuration=60 |
| `src/components/CheckoutModal.tsx` | Abort com motivo legível, handle AbortError, timeout 30s, card recovery |
| `src/lib/downloadPdf.ts` | Abort com motivo legível, handle AbortError |

### Teste manual pendente (rodada 4)

1. **CRÍTICO:** Pagamento real aprovado (PIX R$ 7,90) → confirmar que tela avança para download em < 2s
2. Confirmar que PDF baixado é o arquivo final, sem marca d'água
3. Confirmar que e-mail de confirmação chega (pode levar alguns segundos extras, aceitável)
4. Repetir teste 5x seguidas, incluindo mobile
5. Confirmar que "signal is aborted without reason" nunca aparece em nenhum cenário
6. Recarregar com PIX pendente → clicar aba "Cartão" → confirmar que valor aparece corretamente

---

## Rodada 4 (extra) — Vídeo demonstrativo na homepage

### Adição

Inserido vídeo demonstrativo de ~16s na seção hero da landing page, logo abaixo do headline/CTA "Criar Meu Currículo Agora". O vídeo mostra o fluxo real do produto (preenchimento de dados, prévia em tempo real, avanço pelas etapas, tela de "Currículo pronto!").

### Implementação

- **Arquivos:** `public/videos/demo-curriculo.mp4` (H.264, ~600KB, faststart) + `public/videos/demo-poster.jpg`
- **Componente:** `src/components/DemoVideo.tsx` — video element com `autoPlay`, `muted`, `loop`, `playsInline`, `preload="metadata"`, `poster` fallback
- **IntersectionObserver:** vídeo só toca quando visível no viewport, pausa ao sair — economiza CPU/dados em mobile
- **Botão play/pause discreto:** canto inferior direito, para acessibilidade
- **Sem CLS:** container com `aspect-ratio: 16/9` reserva o espaço antes do vídeo carregar
- **Responsivo:** em mobile o vídeo aparece empilhado abaixo do CTA (não ao lado)

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/DemoVideo.tsx` | Novo componente de vídeo com IntersectionObserver |
| `src/components/LandingPage.tsx` | Import e renderização do DemoVideo na hero section |
| `public/videos/demo-curriculo.mp4` | Arquivo de vídeo (novo) |
| `public/videos/demo-poster.jpg` | Imagem de capa/poster (novo) |

### Teste manual pendente

1. Abrir home em iPhone/Safari iOS → confirmar autoplay mudo em loop
2. Abrir em Android/Chrome → confirmar mesmo comportamento
3. Rolar para longe do vídeo → confirmar que pausa (DevTools Performance)
4. Rolar de volta → confirmar que volta a tocar
5. Lighthouse mobile antes/depois → confirmar que Performance não caiu
6. Confirmar que não há layout shift (CLS) quando o vídeo carrega
