# URGENTE — CRÍTICO: cliente pagou e o download do PDF falha com "signal is aborted without reason"

## Contexto

Isso acabou de acontecer com um cliente real (prints anexados): pagamento aprovado ("Pagamento Aprovado! Seu currículo está pronto para download"), mas na hora de baixar aparece o erro técnico bruto **"signal is aborted without reason"**, com um botão "Tentar preparar download novamente" que não resolve. Este é exatamente o bug ORIGINAL que motivou toda a auditoria deste site (tráfego alto, vendas zero) — a pessoa pagou e não recebeu o produto.

**Já investiguei a causa raiz lendo o código. Não é preciso redescobrir — é preciso corrigir.**

## Causa raiz (confirmada por leitura de código, não é suposição)

O fluxo atual, depois que o pagamento é aprovado, é:

1. `CheckoutModal.tsx` → `completePaymentAndDownload(paymentId)` chama `POST /api/payment/complete` com `fetchWithTimeout(..., 15000)` — **timeout de 15 segundos no cliente**.
2. `/api/payment/complete` chama `finalizePaymentDelivery()` (`src/lib/paymentComplete.ts`), que faz **tudo isso de forma síncrona, em sequência, antes de responder ao navegador**:
   - Gera o PDF do currículo com `generateResumePdfBuffer()` (`@react-pdf/renderer`), com timeout interno de 15s (`withTimeout(..., 15000, 'pdf-generation')`) — sozinho já pode consumir quase todo o orçamento de tempo do cliente.
   - Envia o e-mail de confirmação via Resend (`sendPaymentConfirmationEmail`), que tem **retry com backoff exponencial** (`INITIAL_RETRY_DELAY_MS * 2^(attempt-1)`) — se o Resend demorar ou falhar uma vez, isso soma vários segundos extras.
   - **Só depois de tudo isso** a resposta com `downloadUrl` é enviada de volta ao navegador.
3. Se essa soma (geração de PDF + envio de e-mail com possíveis retries) ultrapassar os 15 segundos do timeout do cliente, o `AbortController.abort()` dispara **sem argumento de motivo** (`controller.abort()`, sem `reason`) — e é exatamente isso que produz a mensagem crua "signal is aborted without reason" que o cliente viu na tela, porque o `catch` em `CheckoutModal.tsx` mostra `err.message` diretamente ao usuário.
4. Como o timeout estourou **antes** de `downloadUrl` ser definido, o botão "Tentar preparar download novamente" aparece — mas ele só re-chama a mesma cadeia lenta do zero (`completePaymentAndDownload`), então se a lentidão for sistêmica (não um caso isolado), a nova tentativa tende a falhar do mesmo jeito.
5. Agravante: o endpoint `/api/download/[id]/route.ts`, usado tanto pelo link de e-mail quanto pelo download automático via `downloadPdf()`, **gera o PDF de novo, do zero** — ou seja, o PDF é renderizado duas vezes por compra (uma para o anexo do e-mail, outra para o download), dobrando à toa o tempo/custo dessa etapa mais lenta do fluxo.
6. Note também que `ResumePDF.tsx` registra fontes via `Font.register({ fonts: [{ src: 'https://cdn.jsdelivr.net/...' }] })` — isto é, a biblioteca de PDF pode precisar buscar arquivos de fonte por HTTP a cada geração; em cold start de função serverless, isso é uma fonte plausível de lentidão adicional.

**Ou seja: o download não depende de nada que precise ser síncrono.** `downloadUrl` é só `${getAppUrl()}/api/download/${mpPaymentId}` — uma string previsível, que não depende da geração do PDF nem do envio do e-mail ter terminado. Hoje o código trata isso como se dependesse, e é aí que mora o bug.

## O que corrigir (nesta ordem)

### 1. Desacoplar a resposta de `/api/payment/complete` da geração de PDF e do envio de e-mail

Assim que o pagamento for confirmado como `approved` (checagem que já existe e deve continuar), responda **imediatamente** com `{ success: true, downloadUrl }` — sem esperar `generateResumePdfBuffer()` nem `sendPaymentConfirmationEmail()` terminarem. Dispare a geração do PDF para o e-mail e o envio do e-mail como fire-and-forget no servidor (`void finalizePaymentDelivery(...)`, no mesmo padrão já usado no código para `trackMetaPurchaseServerSide`), sem bloquear a resposta ao navegador. Isso, sozinho, resolve o bloqueador: o cliente passa a receber o link de download em menos de 1 segundo, e o e-mail continua sendo enviado em paralelo, sem risco de travar a experiência principal.

### 2. Não gerar o PDF duas vezes

Reaproveite o mesmo buffer do PDF entre o anexo do e-mail e o endpoint de download (ex.: gerar uma vez em `finalizePaymentDelivery`, guardar em cache/Storage/Postgres associado ao `mpPaymentId`, e servir esse mesmo arquivo em `/api/download/[id]` em vez de rerenderizar do zero) — ou, no mínimo, garanta que a geração para o e-mail (fire-and-forget) nunca compita por tempo/recursos com a geração usada no download em si.

### 3. Nunca mostrar mensagem técnica crua ao usuário

Em todo `fetchWithTimeout`/`AbortController` do projeto (`src/lib/downloadPdf.ts` e o helper inline em `CheckoutModal.tsx`), passe um motivo legível para `controller.abort(new Error('Tempo limite excedido ao preparar o download.'))` (ou equivalente) em vez de `controller.abort()` sem argumento — e trate `AbortError` explicitamente nas mensagens de erro exibidas, nunca repassando `err.message` bruto de uma exceção técnica para a tela do cliente. "signal is aborted without reason" não pode aparecer para ninguém de novo, nem para esse nem para qualquer outro timeout do site.

### 4. Rede de segurança: garantir que o botão "Baixar Currículo"/link do e-mail sempre funcione, mesmo se o passo 1 falhar

Mesmo depois do fix do item 1, garanta que `/api/download/[id]` sozinho seja resiliente (timeout generoso, sem depender de nenhum outro passo do fluxo de pagamento) — é a units de última instância que o cliente tem para pegar o currículo que pagou, então não pode ter o mesmo tipo de acoplamento.

### 5. Verificar limite de duração da função serverless

Confirme o `maxDuration` (App Router, `export const maxDuration = ...`) configurado em `/api/payment/complete` e `/api/download/[id]`, e se está de acordo com o plano da Vercel em uso — se estiver no default (geralmente 10s), pode estar cortando a função no meio da geração do PDF antes mesmo do timeout do cliente.

## Teste obrigatório antes de considerar concluído

1. Pagamento real aprovado (PIX baixo valor) → confirme que a tela avança para "pronto para download" em menos de 2 segundos após a aprovação, **sem esperar** e-mail ou geração de PDF terminarem.
2. Confirme que o botão de download funciona e o PDF final (sem marca d'água) é baixado com sucesso.
3. Confirme, separadamente, que o e-mail de confirmação com o PDF em anexo chega (pode levar mais alguns segundos, isso é aceitável agora que não bloqueia mais o download).
4. Simule uma falha/lentidão proposital no envio de e-mail (ex.: mock do Resend) e confirme que o download **não é afetado** — a resposta de `/api/payment/complete` continua rápida.
5. Repita o teste pelo menos 5 vezes seguidas, incluindo em mobile, para garantir que não é um caso isolado de cold start.
6. Só relate como concluído com evidência real (print/vídeo do fluxo completo, do pagamento ao PDF baixado) — não "deveria funcionar agora".

## Ao final

Atualize `RELATORIO-CORRECOES-FUNIL.md` com este item, deixando claro que este era o bug de maior impacto possível (cliente pagante sem produto) e como foi corrigido.
