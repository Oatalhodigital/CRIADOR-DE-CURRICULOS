# Prompt para Devin — Corrigir falha de download pós-pagamento, pesquisa de saída interrompendo o formulário e cota da IA

## Contexto

Foi feita uma auditoria completa do site em produção (`xn--currculorapidocomia-o1b.com.br`, servido
com `www.`), incluindo um teste real de ponta a ponta do checkout (lead → formulário → seleção de
plano → geração de Pix), que **funcionou corretamente**. Três problemas técnicos reais foram
identificados e confirmados durante essa auditoria e precisam ser corrigidos. A Tarefa 1 é a mais
grave: pode fazer um cliente pagar e não receber o produto.

Investigue a causa raiz antes de corrigir (não aplique um patch superficial escondendo o sintoma
sem entender por que ele acontece). Rode `npm run build` após cada mudança. Faça um commit
separado por tarefa, com mensagem clara. Ao final de tudo, push para `main`, deploy de produção via
API da Vercel (`VERCEL_TOKEN` já disponível no `.env.local`), e validação real no domínio
customizado com `www.` (não apenas em preview).

---

## Tarefa 1 — CRÍTICO: corrigir falha de CORS/domínio no download do PDF pós-pagamento

**Erro reproduzido no console do navegador, em produção:**
```
Access to fetch at 'https://xn--currculorapidocomia-o1b.com.br/api/download/{id}' from origin
'https://www.xn--currculorapidocomia-o1b.com.br' has been blocked by CORS policy: Response to
preflight request doesn't pass access control check: Redirect is not allowed for a preflight
request.
```

**Causa provável:** o site em produção é servido a partir do domínio com `www.`, mas alguma parte
do código está montando a URL de download (ou a URL usada para chamadas de API relacionadas ao
download) usando a variante **sem** `www.`. Como o navegador trata `www.dominio` e `dominio` como
origens diferentes, o `fetch()` do download dispara uma requisição cross-origin; o servidor
provavelmente responde com um redirect (sem `www.` → com `www.`, via configuração de domínio da
Vercel), e navegadores bloqueiam qualquer redirect durante uma requisição de preflight CORS — daí o
erro. O ponto mais provável de origem é a função `getAppUrl()` em `src/lib/email.ts`, cujo valor de
fallback hoje é `https://xn--currculorapidocomia-o1b.com.br` (sem `www.`). Essa mesma URL base
parece ser reaproveitada para montar o link de download usado no fluxo pós-pagamento (e possivelmente
no e-mail transacional).

**O que fazer:**
1. Mapear **todos** os lugares do código que constroem uma URL absoluta para
   `/api/download/[id]` ou que dependem de `getAppUrl()` / `NEXT_PUBLIC_APP_URL` — incluindo o
   fluxo de download automático dentro do `CheckoutModal` após o pagamento aprovado, o link enviado
   por e-mail (Resend), e qualquer chamado feito pelos crons (`pix-reminder`, `reengagement`).
2. Confirmar o valor real de `NEXT_PUBLIC_APP_URL` configurado hoje na Vercel (ambiente de
   produção). Se estiver ausente, incorreto, ou sem `www.`, corrigir para
   `https://www.xn--currculorapidocomia-o1b.com.br` (com `www.`, que é o domínio efetivamente
   servido em produção).
3. Corrigir o fallback hardcoded em `getAppUrl()` (`src/lib/email.ts`) para usar a variante com
   `www.`, e revisar o aviso que já existe ali sobre a variante sem acento — garantir que a lógica
   não reintroduza acidentalmente uma URL sem `www.` em nenhum cenário (produção, preview, local).
4. Preferir usar sempre **URLs relativas** (`/api/download/{id}`) nas chamadas feitas a partir do
   próprio navegador (dentro do `CheckoutModal`, por exemplo), em vez de montar uma URL absoluta —
   isso elimina de raiz qualquer risco de mismatch de origem para chamadas client-side. Reserve
   URLs absolutas (via `getAppUrl()`) apenas para contextos que realmente precisam delas, como
   links dentro de e-mails ou chamadas feitas pelo backend/servidor (webhook, crons).
5. Verificar também se existe uma regra de redirect (`vercel.json`, middleware do Next.js, ou
   configuração de domínio na Vercel) que redirecione a variante sem `www.` para a variante com
   `www.` — se sim, confirmar que nenhuma chamada `fetch()` do frontend depende de bater nesse
   redirect (preflight nunca deve passar por um redirect).
6. **Reproduzir o cenário exato antes e depois da correção**: completar um pagamento real (Pix, com
   um valor de teste) em produção, no domínio `www.`, e confirmar que o download do PDF acontece
   sem nenhum erro de CORS no console, tanto no download automático quanto em uma tentativa manual
   de re-download (reload da página com o pedido já pago). Testar também a partir de um pedido
   antigo já existente no banco de dados, se possível, para garantir que pedidos passados também
   voltam a funcionar.

**Critério de aceite:** o download do PDF (automático e manual) funciona de forma consistente, em
produção, no domínio `www.`, sem nenhum erro de CORS no console — inclusive ao recarregar a página
com um pagamento já aprovado anteriormente.

---

## Tarefa 2 — Pesquisa de saída ("Ajude-nos a melhorar") não deve interromper o preenchimento ativo do formulário

**Sintoma reproduzido:** durante um teste real de preenchimento do currículo (etapa "Informações
Pessoais"), a janela de pesquisa de saída (`ExitSurvey.tsx`) apareceu automaticamente por cima do
formulário, mesmo com o usuário ativamente preenchendo os dados minutos antes. O componente dispara
`showOnce()` após `INACTIVITY_MS` (45s) sem nenhum dos eventos `click`, `touchstart`, `input`,
`scroll` ou `keydown` — o que pode acontecer normalmente enquanto a pessoa está pensando no que
digitar, olhando um documento em outra janela, etc., sem necessariamente estar prestes a abandonar
o site. A checagem `isAnyModalOpenRef` hoje só evita a exibição quando um modal explícito (ex.:
`CheckoutModal`) está aberto — as etapas do formulário principal de currículo não são tratadas como
"modal", então a pesquisa pode aparecer por cima delas.

**O que fazer:**
1. Revisar `ExitSurvey.tsx` e o componente pai que controla o `isAnyModalOpen`/equivalente, para
   identificar exatamente onde a flag é (ou não é) atualizada durante as etapas do formulário de
   criação do currículo.
2. Ajustar a lógica para que a pesquisa **não** apareça enquanto o usuário estiver dentro do fluxo
   ativo de criação do currículo (qualquer uma das etapas: informações pessoais, experiência,
   formação, habilidades, idiomas, objetivo, seleção de plano) — tratando esse fluxo como
   equivalente a "modal aberto" para efeito dessa checagem, ou introduzindo uma flag dedicada (ex.:
   `isBuilderActive`) passada para o `ExitSurvey`.
3. Manter (ou reforçar) os gatilhos de intenção real de saída: `mouseleave` para a barra do
   navegador (desktop) e `visibilitychange`/aba oculta (mobile) continuam sendo bons sinais de saída
   e podem continuar disparando a pesquisa mesmo dentro do fluxo do formulário, já que indicam que a
   pessoa está de fato saindo da página — o problema é apenas o gatilho por inatividade genérica
   (45s sem interação) enquanto a pessoa ainda está na aba, ativa no site.
4. Testar o cenário reproduzido: abrir o formulário, ficar mais de 45 segundos sem interagir (sem
   trocar de aba, sem mover o mouse para fora da janela) e confirmar que a pesquisa não aparece;
   depois, trocar de aba ou mover o mouse para a barra do navegador e confirmar que ela aparece
   normalmente.

**Critério de aceite:** a pesquisa de saída não aparece por inatividade simples enquanto o usuário
está ativamente dentro do fluxo de criação do currículo, mas continua funcionando normalmente para
sinais reais de intenção de saída (troca de aba, mouse saindo pela barra do navegador) em qualquer
outro momento do site.

---

## Tarefa 3 — Tratamento da falha de cota da OpenAI ("Melhorar com IA")

**Sintoma reproduzido:** a chamada a `/api/ai/enhance` está retornando HTTP 429 com a mensagem
"Limite de requisições da OpenAI atingido", indicando que a cota/limite de gastos da conta OpenAI
está esgotado. **Aumentar o crédito ou o limite de gastos na conta da OpenAI é uma ação manual de
billing, fora do escopo de código, e deve ser feita separadamente pelo dono do produto** — não é
algo que se resolve por código. O que cabe nesta tarefa é melhorar o comportamento do produto
quando isso acontece (e ajudar a detectar recorrências mais cedo no futuro).

**O que fazer:**
1. Confirmar que a mensagem de erro exibida ao usuário no frontend, quando `/api/ai/enhance` falha
   com 429 (ou qualquer erro), é clara e não trava o restante do fluxo — o usuário deve conseguir
   continuar preenchendo e finalizando a compra do currículo normalmente mesmo sem conseguir usar o
   "Melhorar com IA" (esse recurso é um adicional, não deve ser bloqueante).
2. Adicionar (se ainda não existir) um log de servidor claramente identificável quando esse erro
   específico (429 / cota da OpenAI) ocorrer, para que fique fácil localizar nos logs da Vercel
   quando isso voltar a acontecer.
3. Opcional, se for rápido de implementar com segurança: um retry simples com backoff curto (ex.:
   1 nova tentativa após alguns segundos) apenas para erros transitórios de rate limit (não para
   cota esgotada, que não se resolve por retry).

**Critério de aceite:** quando a IA falhar (por qualquer motivo, incluindo cota esgotada), o usuário
recebe uma mensagem clara, consegue continuar o fluxo normalmente até o pagamento, e o erro fica
visível nos logs do servidor para diagnóstico futuro. (A resolução definitiva da cota em si —
adicionar crédito na OpenAI — é uma ação separada, fora deste prompt.)

---

## Tarefa 4 — Marcar variáveis sensíveis como "Secreto" na Vercel

A Vercel está sinalizando `MERCADO_PAGO_ACCESS_TOKEN`, `OPENAI_API_KEY` e
`FIREBASE_SERVICE_ACCOUNT_KEY` como variáveis que "parecem um segredo, mas têm valor visível para
qualquer pessoa com acesso ao projeto". Isso **não indica que as chaves estão inválidas ou
vazadas** (isso já foi confirmado em teste real — o token do Mercado Pago segue funcional hoje) —
é uma recomendação de boas práticas de armazenamento.

**O que fazer:**
1. Usando o `VERCEL_TOKEN` já disponível, recriar essas três variáveis de ambiente no projeto como
   tipo "Sensitive"/"Secreto" (via API da Vercel ou `vercel env add` com a flag apropriada),
   preservando exatamente o mesmo valor atual — **não gerar nem rotacionar novas chaves**, apenas
   mudar a forma de armazenamento.
2. Confirmar, após a mudança, que o próximo deploy de produção continua funcionando normalmente com
   essas variáveis (testar login/pagamento/IA como sanity check rápido, sem precisar repetir todo o
   teste de ponta a ponta).

**Critério de aceite:** as três variáveis aparecem como "Secreto" no painel da Vercel, sem o aviso
"Precisa de Atenção", e o site continua funcionando normalmente em produção.

---

## Diretrizes gerais

- **Prioridade:** Tarefa 1 (download) é a mais crítica e deve ser resolvida e validada primeiro,
  pois pode estar afetando clientes que já pagaram. Em seguida, Tarefa 2 (pesquisa de saída).
  Tarefas 3 e 4 podem ser feitas depois, com prioridade mais baixa.
- Testar cada tarefa isoladamente antes de passar para a próxima, com evidência real (não apenas
  leitura de código) — para a Tarefa 1 em especial, um teste de pagamento real de ponta a ponta é
  obrigatório, incluindo mobile.
- Nunca imprimir segredos completos em logs/terminal, mesmo ao lidar com a Tarefa 4.
- Ao final de cada tarefa, resumir a causa raiz encontrada e a solução aplicada.
- Ao final de todas as tarefas: `npm run build`, commits separados por tarefa, push para `main`,
  deploy de produção via Vercel, e validação final no domínio customizado com `www.`
  (`https://www.xn--currculorapidocomia-o1b.com.br`).
