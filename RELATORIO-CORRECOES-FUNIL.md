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
