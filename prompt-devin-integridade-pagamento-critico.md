# Prompt CIRÚRGICO para Devin — Integridade do status de pagamento (falso "Aprovado"), antifraude, e UX do checkout

## Contexto e gravidade

Evidências reais coletadas pelo usuário (prints do site + e-mails oficiais do Mercado Pago) revelam
um problema potencialmente muito grave: o site parece estar exibindo **"Pagamento Aprovado!"** e
**"E-mail de confirmação enviado"** em uma tela, enquanto os e-mails automáticos do próprio Mercado
Pago, no mesmo período de poucos minutos, confirmam **recusa** do cartão usado. Isso pode significar
que o frontend está exibindo um estado de sucesso **sem confirmação real do backend** — o que é
inaceitável tanto do ponto de vista de negócio (cliente pensa que comprou e não comprou, ou o
inverso) quanto de segurança/integridade de dados.

Trate esta tarefa com o rigor máximo já estabelecido nas correções anteriores: nenhuma tarefa está
concluída sem evidência real de teste, cruzando o que a tela mostra com o que a API do Mercado Pago
realmente retornou para aquela transação específica.

Investigue a causa raiz antes de corrigir. Rode `npm run build` após cada mudança. Commits
separados por tarefa. Ao final, push para `main`, deploy de produção, validação no domínio
customizado.

---

## Tarefa 1 — CRÍTICO: investigar e eliminar qualquer exibição de "Aprovado" sem confirmação real do backend

**Evidência:** tela do site (screenshot em anexo) mostrando "Pagamento Aprovado! ... E-mail de
confirmação enviado", com timestamp aproximado de 14:07, enquanto 3 e-mails automáticos do Mercado
Pago confirmando **recusa** do mesmo cartão (Elo final 4529, R$7,90) chegaram às 13:58, 14:04 e
14:12 — ou seja, dentro da mesma janela de tempo.

1. **Antes de qualquer correção, reconstituir os fatos:** localizar, na API do Mercado Pago
   (`GET /v1/payments/search`, filtrando pelo e-mail do pagador e período), todas as tentativas de
   pagamento feitas nesse intervalo (13:55–14:15 do dia mencionado), e para cada uma anotar:
   `id`, `status`, `status_detail`, `date_created`, `date_approved` (se houver). Isso vai revelar
   se houve, entre as tentativas recusadas, **uma tentativa genuinamente aprovada** que gerou a
   tela de sucesso (cenário menos grave: usuário testou múltiplos cartões, um foi aprovado de
   verdade), ou se a tela de "Aprovado" apareceu **sem nenhum pagamento aprovado correspondente**
   no período (cenário gravíssimo: bug de estado no frontend mostrando sucesso indevidamente).
2. Revisar minuciosamente todo o caminho de código entre o envio do pagamento e a exibição da tela
   de "Pagamento Aprovado!": o componente só deve transitar para esse estado mediante uma resposta
   do backend que reflita `status: "approved"` **confirmado**, nunca de forma otimista (ex.: nunca
   assumir sucesso só porque a chamada HTTP retornou 200 — uma resposta 200 do Mercado Pago pode
   perfeitamente conter `status: "rejected"` dentro do corpo).
3. Se for encontrado qualquer caminho de código que trate ausência de erro de rede como sinônimo de
   pagamento aprovado (em vez de checar o campo `status` explicitamente), esse é o bug — corrigir
   para checar o status real em todos os pontos (resposta síncrona da criação do pagamento,
   polling, e webhook).
4. Aplicar a mesma rigidez ao disparo do e-mail de confirmação (Tarefa 2 do prompt anterior,
   `paymentComplete.ts`): confirmar que ele só dispara quando o status realmente confirmado é
   `approved`, nunca antes.
5. Testar de forma extensiva e adversarial: forçar cenários de cartão recusado (usar os cartões de
   teste de recusa do próprio Mercado Pago, se disponíveis em sandbox, ou reproduzir com dados que
   historicamente causaram recusa) e confirmar que a tela **nunca** mostra "Aprovado" nesses casos —
   deve mostrar claramente o motivo da recusa (ver Tarefa 3).

**Critério de aceite:** é tecnicamente impossível, dado o código corrigido, para a tela de
"Pagamento Aprovado" aparecer sem uma confirmação real de `status: approved` vinda do backend —
comprovado por teste adversarial repetido, não apenas revisão de código.

---

## Tarefa 2 — Corrigir a mensagem "Seu pagamento está em análise" aparecendo prematuramente

**Evidência:** screenshot mostrando essa mensagem já visível **antes** do cliente sequer terminar
de preencher os dados do cartão (campo "Número do cartão" ainda vazio/placeholder).

1. Localizar de onde vem esse estado/mensagem no `CardPaymentBrick.tsx` ou componente de checkout.
2. Essa mensagem só deveria aparecer **depois** de uma submissão real do formulário de pagamento
   que retorne um status `in_process`/`pending` do Mercado Pago — nunca antes disso.
3. Corrigir a condição que está disparando essa mensagem cedo demais (provavelmente um estado
   inicial mal definido, ou resquício de uma tentativa anterior não limpo corretamente ao abrir o
   formulário de novo).

**Critério de aceite:** a mensagem de "em análise" só aparece após uma submissão real do
pagamento, nunca antes do usuário preencher e enviar os dados do cartão.

---

## Tarefa 3 — Reduzir a taxa de recusa por antifraude e melhorar a comunicação de erro ao cliente

1. Confirmar que a implementação de sinais antifraude feita em correção anterior (Device ID via
   `X-meli-session-id`, dados do pagador completos, etc.) está de fato ativa e funcionando em
   produção — inspecionar uma tentativa real recente e confirmar que esses campos estão presentes
   na requisição enviada ao Mercado Pago.
2. Revisar a documentação oficial mais recente do Mercado Pago sobre "Regras de segurança"/
   "Prevenção a fraudes" para pagamentos com cartão e conferir se há mais algum sinal recomendado
   que ainda não está sendo enviado (ex.: dados completos de endereço de cobrança, se aplicável).
3. Melhorar a mensagem exibida ao cliente quando o cartão é recusado por antifraude — hoje a
   mensagem do Mercado Pago já é relativamente clara ("recusado por não passar nos controles de
   segurança... use outro meio de pagamento"), mas confirmar que o **site** (não só o painel do
   Mercado Pago que só o dono vê) exibe uma orientação equivalente e clara ao cliente na hora,
   sugerindo tentar PIX como alternativa mais confiável.
4. Documentar no relatório final a taxa de aprovação antes/depois desta correção, se houver dados
   suficientes disponíveis para comparação.

**Critério de aceite:** sinais antifraude confirmados ativos em produção; cliente recusado recebe
orientação clara no próprio site, com sugestão de tentar PIX.

---

## Tarefa 4 — Investigar (não assumir) os relatos de erro de CORS e DNS

**Nota:** estes dois itens foram levantados por uma análise externa ao projeto, sem confirmação
direta nos logs mais recentes fornecidos ao Devin. Investigar genuinamente antes de aplicar
qualquer correção — não fazer mudanças especulativas sem confirmar o problema primeiro.

1. **CORS para `signals.birch.click`:** buscar no código-fonte e nos scripts de terceiros
   carregados pelo site (Mercado Pago SDK, Meta Pixel, GA4, Datadog/RUM se houver) por qualquer
   referência a esse domínio. Se encontrado, identificar de qual serviço faz parte (é comum SDKs de
   antifraude/analytics de terceiros usarem subdomínios assim) e determinar se o bloqueio de CORS
   afeta de fato o funcionamento do checkout ou é apenas um script de telemetria não crítico. Se
   não for encontrada nenhuma referência a esse domínio no código do projeto, reportar isso
   claramente (pode ter vindo de uma extensão do navegador do usuário, não do site).
2. **`ERR_NAME_NOT_RESOLVED` em links de download:** auditar todo o código em busca de URLs
   hardcoded ou variáveis de ambiente potencialmente incorretas para o domínio base do site
   (`NEXT_PUBLIC_APP_URL` e equivalentes), especialmente em: geração de links de download,
   `back_urls` do Mercado Pago, e o corpo do e-mail transacional. Confirmar que todas as
   referências usam consistentemente o domínio customizado correto
   (`xn--currculorapidocomia-o1b.com.br`) e não uma variação antiga/incorreta ou o domínio
   `.vercel.app`. Testar especificamente o botão de download em rede móvel real (não apenas
   Wi-Fi/localhost) se possível.

**Critério de aceite:** relatório claro confirmando se cada um desses dois problemas existe de
fato no código do projeto (com localização exata, se sim) ou se não foi encontrada evidência deles
no código (nesse caso, reportar como não confirmado, não como corrigido às cegas).

---

## Tarefa 5 — Melhorias de UX no checkout (PIX em destaque, copiar chave com 1 clique)

1. Confirmar que a aba PIX já é exibida como opção padrão/em destaque no modal de checkout (dado
   que já foi implementada anteriormente) — se cartão estiver aparecendo como aba padrão/selecionada
   primeiro, inverter para PIX ser a opção inicial, já que tende a converter melhor no Brasil para
   compras de baixo valor.
2. Adicionar (se ainda não existir) um botão **"Copiar chave PIX"** logo abaixo do código
   copia-e-cola já exibido, usando `navigator.clipboard.writeText()`, com feedback visual imediato
   (ícone de check + texto "Copiado!" por 2-3 segundos) ao ser clicado.
3. Confirmar que o preview do currículo com marca d'água (implementado anteriormente) está sendo
   exibido de forma proeminente antes/durante a tela de pagamento, para reforçar valor percebido no
   momento da decisão de compra.

**Critério de aceite:** botão de copiar PIX funcional com feedback visual, testado em iOS Safari e
Android Chrome.

---

## Diretrizes gerais

- **Prioridade absoluta: Tarefa 1.** Uma falha de integridade no status de pagamento é o problema
  mais sério possível neste sistema — afeta diretamente a confiança e pode ter implicações
  financeiras/legais dependendo do cenário real descoberto.
- Cada tarefa exige evidência de teste real, cruzando o que a tela mostra com o que a API do
  Mercado Pago efetivamente retornou — não aceitar "parece corrigido" como conclusão.
- Nunca imprimir segredos completos (tokens, chaves) no terminal/log.
- Ao final: `npm run build`, commits organizados, push para `main`, deploy de produção, validação
  completa no domínio customizado, e relatório detalhado especialmente sobre o que foi descoberto
  na Tarefa 1 (o achado mais crítico deste lote).
