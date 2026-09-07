# Relatório de Correções do Funil de Conversão

**Data:** 07/09/2026  
**Commit:** `fix(conversion-funnel): corrige 7 bugs criticos do funil de conversao`

## Resumo das 7 correções

1. **P0-1 — Pagamento aprovado não libera o download do PDF:** A causa raiz era `onPaymentSuccess` no array de dependências do `useEffect` de polling, que recriava o intervalo a cada re-render do parent e nunca chegava a verificar o status. Removido das deps, adicionado `onPaymentSuccessRef`, persistência do payment ID no `sessionStorage` para recuperação após reload, e recovery check ao reabrir o `CheckoutModal`. Adicionado contato de suporte na mensagem de timeout.

2. **P0-2 — Nenhum evento de compra é disparado:** Os eventos de tracking (GA4 `purchase`, Meta `Purchase`, Google Ads `conversion`) estavam dentro do bloco de sucesso do delivery — se o delivery falhasse, nenhum evento disparava. Movidos para `firePurchaseEvents()` disparado imediatamente na confirmação de aprovação (3 pontos: polling PIX, verificação manual, cartão aprovado), independente do sucesso do download.

3. **P0-3 — Meta Pixel eventos suprimidos:** O código já usava `event_id` para deduplicação Pixel vs Conversions API. A supressão é configuração no Meta Business Manager (verificação de domínio + categoria especial de emprego). Nenhuma alteração de código necessária — ação pendente para o dono do produto verificar o domínio no Meta Business Manager.

4. **P0-4 — Tag de conversão do Google Ads não verificada:** Adicionado `gtag('config', 'AW-18434491826')` à inicialização do gtag (sem carregar um segundo script). O `send_to` agora inclui o label completo `AW-18434491826/FyTzCPCd-e8cELKLoNZE`. O evento `conversion` dispara junto com GA4 e Meta em `firePurchaseEvents()`.

5. **P1-5 — Exit-intent modal empilha sobre lead capture:** Adicionado prop `isAnyModalOpen` ao `ExitSurvey`; `showOnce()` verifica via ref se outro modal está aberto antes de disparar. `page.tsx` passa `showLeadCapture || showCheckout`.

6. **P1-6 — Perda silenciosa ao salvar o lead:** Removido `onComplete()` do bloco `catch` — o usuário não avança sem salvar com sucesso. Erro específico é mostrado (timeout vs erro genérico) com mensagem para tentar novamente. `backgroundSave` continua tentando em segundo plano.

7. **P2-7 — Chaves de tradução cruas na interface:** Adicionadas `steps.languages`, `common.saved` e `common.error` nos 3 idiomas (PT/EN/ES). Removidos fallbacks inline em `page.tsx`.

## Arquivos modificados

| Arquivo | Correção |
|---------|----------|
| `src/components/CheckoutModal.tsx` | P0-1, P0-2 |
| `src/app/page.tsx` | P0-1 (useCallback), P1-5, P2-7 |
| `src/lib/gtag.ts` | P0-4 (Google Ads ID + label) |
| `src/components/GoogleAnalytics.tsx` | P0-4 (gtag config) |
| `src/components/ExitSurvey.tsx` | P1-5 (isAnyModalOpen) |
| `src/components/LeadCaptureModal.tsx` | P1-6 (don't advance on failure) |
| `src/lib/i18n.ts` | P2-7 (missing translations) |
| `e2e/conversion-funnel.spec.ts` | E2E test (new file) |

## Testes

- **Build:** `npm run build` — OK
- **E2E (Playwright):** `e2e/conversion-funnel.spec.ts` cobre:
  - Fluxo completo: lead → checkout → PIX mock → download + tracking events
  - Recuperação após reload (payment ID persistido no sessionStorage)
  - Exit survey não empilha sobre lead capture
  - Lead save failure mostra erro e não avança

## Teste manual pendente (dono do produto)

1. Fazer pagamento PIX real de R$ 7,90 ponta a ponta
2. Confirmar que o botão de download aparece automaticamente
3. Confirmar PDF final sem marca d'água
4. Recarregar a página após pagar — confirmar recuperação do download
5. Verificar evento `purchase` no GA4 em tempo real
6. Verificar evento `Purchase` no Meta Events Manager
7. Verificar conversão no Google Ads (Metas → Conversões → Compra)
8. Verificar que avisos de "suppressed" do Meta Pixel somem do console

## Ações pendentes para o dono do produto

- **Meta Business Manager:** Verificar domínio `curriculorapidocomia.com.br` em Configurações da Empresa → Domínios
- **Meta Business Manager:** Confirmar se a conta de anúncios está marcada como categoria especial de emprego
- **Google Ads:** Não configurar importação de conversão via GA4 para a mesma ação "Compra" (usar apenas a tag direta `AW-18434491826/FyTzCPCd-e8cELKLoNZE`)
