# Prompt CIRÚRGICO para Devin — Falha crítica de entrega (download), plano B por e-mail, GA4 purchase incorreto, e login recorrente quebrado

## Contexto e nível de exigência

O site está com **tráfego pago real e clientes reais pagando**. Isso não é mais uma correção
normal — é uma correção de **integridade de entrega**: um cliente que paga e não recebe o produto
é o pior cenário possível para a confiança e para o negócio. Trate cada tarefa abaixo com rigor de
engenharia crítica: **nenhuma tarefa é considerada concluída sem evidência de teste real, repetido,
em condições próximas às de produção** (incluindo mobile). "Parece corrigido" não é aceitável — é
preciso provar.

Investigue a causa raiz antes de corrigir. Rode `npm run build` após cada mudança. Ao final de
cada tarefa, commit separado com mensagem clara. Ao final de tudo, push para `main`, deploy de
produção, e validação completa no domínio customizado.

---

## Tarefa 1 — CRÍTICO: corrigir a falha de download do PDF (automático E manual)

**Evidência anexada:** screenshot mostrando, após "Pagamento Aprovado!" em uma compra real com
cartão via mobile, a mensagem **"Não foi possível baixar o arquivo. Tente novamente mais tarde."**
— ou seja, tanto o download automático quanto (aparentemente) uma tentativa manual falharam. O
cliente pagou e não recebeu o currículo.

1. Reproduzir esse cenário exato: pagamento aprovado via cartão, em viewport mobile, e capturar o
   erro real por trás da mensagem genérica exibida ao usuário (adicionar/revisar logging que
   capture o erro técnico completo — status HTTP, mensagem de erro do servidor, timeout, erro de
   geração do PDF no backend, etc. — não deixar a causa real escondida atrás de uma mensagem
   genérica).
2. Investigar hipóteses concretas, na ordem mais provável primeiro:
   - O endpoint de geração/download do PDF (`/api/download/[id]`) está falhando para pedidos pagos
     via cartão especificamente (diferente de PIX)? Testar os dois métodos separadamente.
   - Há algum problema de geração do PDF em si (biblioteca de PDF travando com determinados
     caracteres/dados do currículo, timeout de função serverless da Vercel sendo excedido durante
     a geração)?
   - O ID do pedido/pagamento usado para buscar os dados do currículo está correto e disponível no
     momento em que o download é tentado (possível condição de corrida: tentar baixar antes dos
     dados estarem totalmente persistidos)?
   - Existe diferença de comportamento entre desktop e mobile especificamente (ex.: técnica de
     download via `<a download>` com blob, mencionada em correção anterior, tem suporte
     inconsistente em navegadores mobile — Safari iOS em particular tem restrições conhecidas com
     downloads de blob que podem exigir abordagem alternativa, como abrir o PDF em nova aba com
     `Content-Disposition: inline` como fallback, ou usar a Web Share API).
3. Corrigir a causa raiz identificada. Implementar tratamento de erro que **nunca** deixe o cliente
   apenas com uma mensagem genérica sem alternativa — se o download falhar, oferecer
   imediatamente e de forma clara uma alternativa (ex.: "Enviamos também por e-mail" — ver Tarefa
   2 abaixo, que deve ser a rede de segurança real para este cenário).
4. Testar exaustivamente: no mínimo 10 tentativas de download pós-pagamento, alternando entre
   desktop e pelo menos 2 navegadores mobile (Chrome Android e Safari iOS, ou o mais próximo
   disso disponível via Playwright/emulação), com PIX e cartão, confirmando sucesso consistente.

**Critério de aceite:** download do PDF funciona de forma consistente e confiável em desktop e
mobile, em ambos os métodos de pagamento, com causa raiz do bug documentada e evidência de teste
repetido em múltiplos ambientes.

---

## Tarefa 2 — CRÍTICO: implementar envio do PDF por e-mail como camada de segurança real (plano B)

**Objetivo:** mesmo que a Tarefa 1 seja corrigida, o download no navegador sempre terá alguma
chance de falhar por motivos fora do controle do site (conexão instável do cliente, navegador
com bloqueios, etc.). Por isso, o e-mail com o PDF não deve ser tratado como "bônus", mas como uma
**segunda via garantida de entrega**, disparada de forma independente do sucesso do download no
navegador.

1. Usando o `RESEND_API_KEY` (o usuário está configurando na Vercel nesta mesma janela de tempo —
   confirmar que a variável está presente antes de testar o envio real; se ainda não estiver,
   implementar o código de qualquer forma, de modo defensivo, reportando a ausência da variável
   como pendência).
2. Implementar o disparo do e-mail **no servidor, no momento da confirmação de aprovação do
   pagamento** (webhook do Mercado Pago / `paymentComplete.ts`) — **não** apenas no momento em que
   o cliente vê a tela de sucesso no navegador. Isso garante que o e-mail seja enviado mesmo que o
   cliente feche a aba imediatamente após o pagamento, antes de qualquer tentativa de download.
3. O e-mail deve conter o **PDF do currículo anexado diretamente** (não apenas um link) sempre que
   o tamanho do arquivo permitir dentro dos limites do Resend (verificar limite de anexo da API do
   Resend, geralmente na casa de alguns MB) — anexar é mais robusto que link, pois não depende do
   site continuar no ar/link não expirar. Se o PDF exceder o limite de anexo, usar um link de
   download seguro como alternativa, com validade generosa (ex.: 30 dias).
4. Conteúdo do e-mail: confirmação de pagamento aprovado, PDF anexado (ou link), agradecimento, e
   pedido de avaliação/compartilhamento (retomando o padrão já especificado em correção anterior).
5. Tratar falha de envio do e-mail com log claro e, se possível, retry automático (2-3 tentativas
   com backoff) — mas sem bloquear o restante do fluxo de aprovação do pagamento.
6. Testar de ponta a ponta: fazer um pagamento de teste real (ou o mais próximo disso permitido
   pelo ambiente), confirmar que o e-mail chega com o PDF anexado corretamente, com o conteúdo do
   currículo correspondente ao pedido certo.

**Critério de aceite:** todo pagamento aprovado dispara um e-mail com o PDF anexado (ou link
seguro), de forma independente do sucesso do download no navegador — confirmado com teste real de
entrega, não apenas "requisição à API do Resend retornou 200".

---

## Tarefa 3 — Corrigir o evento `purchase` do GA4 disparando sem confirmação real de pagamento

**Suspeita a investigar:** o GA4 mostrou 7 compradores/conversões num período em que pode não haver
7 pagamentos realmente aprovados no Mercado Pago no mesmo período — isso sugeriria que o evento
`purchase` está sendo disparado precocemente (ex.: ao chegar na tela de "sucesso" antes da
confirmação real, ou disparando de novo a cada recarregamento de página, sem deduplicação).

1. Localizar exatamente onde no código o evento `purchase` (GA4) e o evento `Purchase` (Meta Pixel)
   são disparados. Confirmar se o disparo depende de uma confirmação real de status `approved`
   vindo do backend/webhook, ou se depende apenas de o usuário ter chegado numa determinada tela do
   frontend (o que pode disparar mesmo com PIX não pago, cartão recusado, ou apenas um
   recarregamento de página).
2. Se o disparo não estiver condicionado a uma confirmação real de aprovação: corrigir para que o
   evento `purchase`/`Purchase` só dispare quando o status do pagamento, verificado no backend
   (não apenas assumido pelo frontend), for de fato `approved`.
3. Implementar deduplicação usando o `transaction_id`/ID do pedido — garantir que recarregar a
   página de sucesso, ou o usuário voltar a essa tela depois, não dispare o evento novamente para
   o mesmo pedido (usar `sessionStorage` ou uma verificação no backend para marcar que aquele
   evento já foi reportado).
4. Auditar os 7 eventos de `purchase` já registrados no período mencionado pelo usuário: cruzar os
   `transaction_id`/IDs de pedido desses eventos com os pagamentos realmente aprovados no Mercado
   Pago (via API, `GET /v1/payments/search` filtrando pelo período e status) — reportar quantos
   desses 7 eventos correspondem a pagamentos genuinamente aprovados, e quantos não.
5. Confirmar (mudança já aplicada em correção anterior, mas reverificar dado o contexto) que a
   moeda enviada no parâmetro `currency` dos eventos é `BRL` de forma consistente — e informar o
   usuário que, além disso, ele mesmo precisa ajustar manualmente a "Moeda de geração de
   relatórios" da propriedade GA4 para BRL no painel do Google Analytics (ação de configuração de
   conta, não de código).

**Critério de aceite:** o evento `purchase`/`Purchase` só dispara mediante confirmação real de
pagamento aprovado, nunca duplica por recarregamento de página, e a auditoria dos 7 eventos
anteriores está documentada (quantos eram reais, quantos não).

---

## Tarefa 4 — Corrigir login recorrente: reconhecer usuário já autenticado, sem exigir login de novo

**Problema relatado:** login com Google funciona no primeiro acesso, mas na segunda tentativa (ex.:
usuário voltando ao site) dá erro, em vez de simplesmente reconhecer que a pessoa já está
autenticada e deixá-la seguir direto para as etapas do formulário.

**Comportamento esperado, para deixar claro:**
- Se o usuário **já esteve logado antes e a sessão do Firebase ainda é válida** (não expirou, não
  saiu manualmente): ao voltar no site, deve ser reconhecido automaticamente via
  `onAuthStateChanged` e seguir direto para as etapas, **sem precisar clicar em login de novo**.
- Se o usuário **fechou o site/sessão expirou/nunca logou nesse dispositivo**: deve ver a tela de
  login normalmente, e o fluxo de `signInWithRedirect` deve funcionar sem erro, como já foi
  corrigido antes.
- O erro visto no log (`[auth redirect] returned without credential (likely cancelled)`) sugere que
  o código está tratando uma situação de **carregamento normal de página (sem retorno de
  redirect)** como se fosse um retorno de redirect sem credencial — ou seja, a lógica de
  `getRedirectResult()` pode estar sendo executada/interpretada incorretamente em todo carregamento
  de página, não apenas quando o usuário genuinamente voltou de um fluxo de login do Google.

1. Revisar a lógica implementada em `src/lib/authRedirect.ts` (ou onde estiver) e o fluxo de
   inicialização de autenticação no Context/componente relevante.
2. Garantir uma ordem clara e correta de verificação:
   a. Primeiro, checar `onAuthStateChanged` — se já existe uma sessão válida do Firebase, usar essa
      informação imediatamente e **não** tratar isso como erro nem exigir novo login.
   b. Só então, separadamente, checar `getRedirectResult()` para tratar o caso específico de o
      usuário estar voltando de um redirect de login do Google — e apenas nesse caso, interpretar
      "sem credencial" como possível cancelamento pelo usuário.
   c. Um carregamento de página normal, sem essas duas condições especiais, não deve gerar nenhum
      log de erro nem mensagem ao usuário — é simplesmente "usuário não autenticado ainda", estado
      neutro, não um erro.
3. Corrigir a lógica para essa distinção ficar clara no código (a mistura das duas checagens é a
   provável causa raiz do bug relatado).
4. Testar exaustivamente o ciclo completo: login pela primeira vez → fechar aba → abrir de novo →
   confirmar reconhecimento automático sem exigir login → deslogar explicitamente (se essa opção
   existir) → confirmar que exige login de novo corretamente. Repetir esse ciclo no mínimo 10 vezes
   para confirmar que não é intermitente.

**Critério de aceite:** um usuário já autenticado anteriormente é reconhecido automaticamente ao
voltar ao site, sem erro e sem precisar logar de novo; um usuário sem sessão válida vê o fluxo de
login funcionando normalmente, sem os logs de erro relatados aparecendo em carregamentos normais de
página.

---

## Diretrizes gerais (não negociáveis dado o contexto de produção ativa)

- Ordem de execução: **Tarefa 1 e 2 são a prioridade absoluta** (entrega do produto pago) — nada
  mais importa mais do que isso agora. Depois Tarefa 4 (bloqueia entrada de usuários recorrentes).
  Depois Tarefa 3 (integridade dos dados de análise, importante mas não bloqueia venda/entrega).
- Para cada tarefa, o relatório final deve conter: causa raiz identificada, correção aplicada, e
  evidência concreta de teste (não apenas "deveria funcionar agora").
- Nunca imprimir segredos completos (incluindo `RESEND_API_KEY`) no terminal/log.
- Ao final: `npm run build`, commits organizados por tarefa, push para `main`, deploy de produção
  via Vercel, e validação final no domínio customizado cobrindo os 4 cenários corrigidos.
