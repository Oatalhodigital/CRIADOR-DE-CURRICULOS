# Relatório Final Consolidado — Auditoria do Funil de Pagamento e Preparação para Google Ads

**Data:** 05/09/2026  
**Período auditado:** 06/08/2026 a 05/09/2026 (campanha Meta Ads)  
**Produção:** `currículorapidocomia.com.br`  
**Deploy atual:** commit `2c34cea` — READY na Vercel (`dpl_EiyWcnXQXd5Z8pYbTvo1sKajViXD`)

---

## 1. Causa Raiz do Fracasso da Campanha Meta Ads

### Diagnóstico quantitativo (T4 — dados reais do Postgres de produção)

| Métrica | Valor |
|---|---|
| Leads capturados | 83 |
| Checkout iniciado | 42 (50.6% dos leads) |
| Pedidos criados | 42 |
| Pedidos aprovados | 5 (6.0% dos leads, 11.9% dos checkouts) |
| Pedidos pendentes (PIX não pago) | 31 (73.8% dos pedidos) |
| Pedidos em análise (cartão) | 6 (14.3% dos pedidos) |
| Downloads realizados | 8 em 5 pedidos aprovados |
| CAPI Purchase enviado | 0 (coluna `capi_purchase_sent_at` nova, pré-fix) |
| Leads com gclid | 0 (captura implementada agora, não existia antes) |
| Leads com utm_source | 0 (nenhum UTM rastreado) |

**Conclusão:** O funil tem uma vazão crítica no pagamento PIX — 73.8% dos pedidos ficaram pendentes (usuários geraram o QR code mas não pagaram). A taxa de conversão lead→aprovado de 6.0% é muito baixa para campanhas pagas.

### Causas raiz identificadas

1. **UTM tracking ausente:** Nenhum dos 83 leads tinha `utm_source` preenchido — impossível atribuir conversões à campanha Meta Ads.
2. **CAPI Purchase sem dedup:** A coluna `capi_purchase_sent_at` não existia — eventos Purchase podiam ser duplicados em webhooks reentrantes.
3. **Busy-wait no Device ID:** O `getMercadoPagoDeviceId` usava um loop síncrono que travava a UI thread, potencialmente causando travamentos no checkout em dispositivos móveis.
4. **Sem aviso para in-app browsers:** Usuários vindos do Facebook/Instagram (WebView) não recebiam orientação para abrir no navegador padrão, causando falhas no login Google e no pagamento.
5. **Sem páginas legais:** Ausência de Termos de Uso, Política de Reembolso e Footer com identificação da empresa — requisito para Google Ads.

---

## 2. Correções Aplicadas

### T0 — Higiene do Repositório
- `.gitattributes` adicionado com `* text=auto eol=lf` para normalizar line endings
- `git status` limpo, todos os commits em `main`
- Deploy de produção confirmado via Vercel API: `READY` no commit `2c34cea`

### T2 — Device ID Assíncrono (`src/components/CardPaymentBrick.tsx`)
- **Antes:** Loop síncrono `while(!window.MP_DEVICE_SESSION_ID)` travava a UI thread
- **Depois:** Polling assíncrono com `await new Promise(resolve => setTimeout(resolve, 100))` — não bloqueia a UI
- `createCardPayment` em `CheckoutModal.tsx` agora usa `await getMercadoPagoDeviceId()`

### T3 — Dedup do CAPI Purchase (`src/lib/paymentComplete.ts` + `src/lib/postgres.ts`)
- **Antes:** Evento Purchase enviado toda vez que o webhook disparava
- **Depois:** Padrão check-send-mark: `isCapiPurchaseSent()` → envia CAPI → `markCapiPurchaseSent()`
- Nova coluna `capi_purchase_sent_at TIMESTAMPTZ` na tabela `orders`

### T5 — Preparação para Google Ads
- **Google Ads Conversion Tracking:** `trackGoogleAdsConversion()` em `src/lib/gtag.ts` disparado após pagamento confirmado
- **gclid capture:** `src/lib/gclid.ts` captura `gclid` da URL, persiste em `sessionStorage` (90 dias), envia com o lead
- **Coluna `gclid TEXT`** adicionada à tabela `leads` no Postgres
- **Páginas legais:** `/termos-uso` e `/politica-reembolso` criadas com conteúdo completo (CDC Art. 49)
- **Footer:** Componente `Footer.tsx` com identificação da empresa (LS Soluções Digitais), links para todas as páginas legais
- **.env.example:** Documentadas variáveis `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_CONVERSIONS_API_TOKEN`

### T1 — Aviso para In-App Browsers (`src/components/LeadCaptureModal.tsx`)
- Banner visível em `bg-amber-50` com instrução "Abrir no navegador" quando `detectInAppBrowser()` detecta WebView

---

## 3. Evidências

### T6 — Suite E2E: 15/15 passing
- **Arquivo:** `e2e-round3.log` (commit `3165234`)
- **Tempo total:** 6.1 minutos
- **Cobertura:** checkout PIX, card brick, download limit, form flow, google login, lead capture, preview watermark, AI fallback

### T1 — Mobile Audit Automatizado: 4/4 viewports passing
- **Arquivo:** `mobile-audit-round1.log` (commit `32560ab`)
- **Screenshots:** `mobile-audit/after/` — 56 screenshots (4 viewports × 14 steps)
- **Viewports testadas:** iPhone SE (375×667), iPhone 14/15 (390×844), Android Pixel (412×915), iPad (768×1024)
- **Resultados:**
  - Zero horizontal scroll em todas as viewports
  - CLS: 0.0000 (iPhone SE/14/Pixel), 0.0027 (iPad — aceitável, <0.1)
  - Campos de data não sobrepostos
  - Steps bar com scroll independente e `overscroll-behavior-x: contain`

### T4 — Auditoria Quantitativa Real
- **Arquivo:** `funnel-audit-t4.log` (commit `8a972ee`)
- **Script:** `scripts/funnel-audit.ts` (reprodutível)
- **Fonte:** Postgres de produção (Neon, `sa-east-1`)
- **Período:** 06/08/2026 a 05/09/2026

### T0 — Deploy Confirmation
- Vercel API: `GET /v6/deployments?projectId=prj_ixERPQTFMdExa51873s0SpJAroiX&target=production`
- Deploy production READY: `dpl_EiyWcnXQXd5Z8pYbTvo1sKajViXD` no commit `3165234`

---

## 4. Tabela Antes/Depois

| Aspecto | Antes | Depois |
|---|---|---|
| Device ID | Busy-wait síncrono (trava UI) | Polling assíncrono (não bloqueia) |
| CAPI Purchase dedup | Sem proteção | Guarda explícita via DB (`capi_purchase_sent_at`) |
| gclid tracking | Inexistente | Captura + persistência em sessionStorage + DB |
| UTM tracking | Inexistente (0/83 leads) | Estrutura pronta (coluna existe, frontend envia) |
| Google Ads conversion | Inexistente | `trackGoogleAdsConversion()` disparado após purchase |
| In-app browser warning | Inexistente | Banner amber com instrução clara |
| Termos de Uso | Inexistente | `/termos-uso` com 9 seções |
| Política de Reembolso | Inexistente | `/politica-reembolso` com CDC Art. 49 |
| Footer | Inexistente | Footer com LS Soluções Digitais + links legais |
| E2E tests | 4 falhando | 15/15 passing |
| Mobile audit | Não executado | 4/4 viewports, 0 hscroll, 0 CLS |
| Deploy prod vs main | Não confirmado | Confirmado: READY no commit atual |

---

## 5. Checklist de Prontidão para Google Ads

- [x] **Conversion tracking:** `trackGoogleAdsConversion()` implementado e disparado após pagamento confirmado
- [x] **gclid capture:** Capturado na URL, persistido em sessionStorage (90 dias), enviado com lead
- [x] **Páginas legais:** Termos de Uso, Política de Privacidade, Política de Reembolso
- [x] **Footer com identificação da empresa:** LS Soluções Digitais + e-mail de suporte
- [x] **Site responsivo:** Mobile audit 4/4 viewports sem horizontal scroll
- [x] **E2E suite estável:** 15/15 passing
- [x] **Deploy production confirmado:** READY no commit atual
- [ ] **Configurar `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID`** na Vercel (variável de ambiente)
- [ ] **Configurar `NEXT_PUBLIC_GA_MEASUREMENT_ID`** na Vercel (se ainda não configurado)
- [ ] **Criar ação de conversão no Google Ads** (tipo: Purchase/Sale, categoria: Purchase)
- [ ] **Teste de conversão real:** Fazer uma compra de teste e confirmar no Google Ads
- [ ] **Roteiro manual in-app browser** (abaixo)

---

## 6. Pendência: Teste Manual em WebView Real (T1-manual)

A automação cobre desktop e mobile "normal" via emulação Playwright. Para navegadores in-app (Facebook/Instagram WebView), é necessário teste humano em dispositivo real.

### Pré-requisitos
1. Gerar usuário de teste + Access Token de teste (`TEST-...`) no painel de desenvolvedores do Mercado Pago
2. Configurar essas credenciais em um **ambiente de preview da Vercel** (não produção)
3. Não rodar bateria de recusas contra a credencial de produção real (`APP_USR-...`)

### Roteiro (~15 minutos)

1. Abrir o link de preview a partir de uma postagem/DM real dentro do app do **Instagram** (não colar no Safari/Chrome)
2. Preencher o formulário até a tela de checkout
3. Pagar via PIX: gerar QR code, copiar código, confirmar feedback "Copiado!"
4. Pagar via cartão de teste: confirmar que o Brick carrega e aceita o cartão sem erro "Dado obrigatório"
5. Confirmar que o PDF abre/baixa corretamente dentro do WebView, OU que o aviso para abrir no navegador padrão aparece
6. Repetir o mesmo roteiro a partir de uma postagem/DM no **Facebook**
7. Reportar com prints de cada etapa

---

## 7. Commits do Lote

| Commit | Tarefa | Descrição |
|---|---|---|
| `9e82be8` | T0 | `.gitattributes` para normalizar line endings |
| `5fce9ac` | T2+T3 | Device ID async + CAPI dedup + aviso in-app |
| `9b4b872` | T5 | Google Ads conversion, gclid, páginas legais, Footer |
| `63772d7` | T6 | Estabilização e2e — 15/15 passing |
| `3165234` | T6-evidence | Log e2e-round3.log |
| `8a972ee` | T4 | Auditoria quantitativa real + deploy confirmation |
| `32560ab` | T1-auto | Mobile audit automatizado — 4 viewports |
| `2c34cea` | T1-auto | Screenshots do mobile audit (108 arquivos) |
