# Prompt para Devin — Corrigir erros falso-positivos (login/IA) e reduzir cliques até o pagamento

## Contexto

O login com Google e a geração de texto por IA **estão funcionando de fato** (o usuário confirma
que os dois completam com sucesso), mas uma **mensagem de erro aparece na tela mesmo assim**. Além
disso, depois de concluir as 8 etapas de preenchimento do currículo, existem cliques
desnecessários até a pessoa chegar na tela de seleção de planos — o ideal é que, assim que a
última etapa for concluída, a tela de seleção de planos apareça diretamente, sem passos
intermediários.

Investigue a causa raiz antes de corrigir (não aplique um patch superficial escondendo a mensagem
sem entender por que ela dispara). Rode `npm run build` após as mudanças. Ao final, commit + push
para `main` e confirme o deploy de produção via API da Vercel (`VERCEL_TOKEN` disponível no
`.env.local`), validando no domínio customizado `xn--currculorapidocomia-o1b.com.br`.

---

## Tarefa 1 — Corrigir mensagem de erro falso-positiva no login com Google

**Sintoma:** o login com Google completa com sucesso (o usuário consegue prosseguir normalmente),
mas uma mensagem de erro aparece na tela de qualquer forma.

**Hipótese mais provável (validar antes de corrigir):** na correção anterior deste projeto, foi
implementado um timeout de 10 segundos no `LeadCaptureModal` para o login com Google (usando
`Promise.race` entre a chamada do Firebase e um timer de timeout), para evitar que o botão ficasse
travado indefinidamente. É provável que, em alguns casos, a resposta real do Firebase (sucesso)
chegue **depois** que o timer de 10s já disparou e marcou a operação como erro — só que a resposta
tardia de sucesso também é processada (avançando o usuário), fazendo aparecer os dois resultados
ao mesmo tempo: a mensagem de erro do timeout E o avanço de tela do sucesso.

**O que fazer:**
1. Localizar a lógica de timeout do login com Google em `LeadCaptureModal.tsx` (ou onde estiver
   hoje, dado que a Tarefa 1 do lote anterior pode ter alterado esse fluxo para
   `signInWithRedirect`).
2. Garantir que, se a resposta real do Firebase (sucesso) chegar depois do timeout já ter
   disparado a mensagem de erro, o código **cancele/ignore o estado de erro** e trate como sucesso
   — ou seja, a última resposta que chega (a real) deve prevalecer sobre o timeout artificial, não
   o contrário. Implementar isso com uma flag/ref que marque se a operação já foi resolvida
   (sucesso ou erro real do Firebase), e o callback do timeout só deve disparar a mensagem de erro
   se a operação **ainda não tiver sido resolvida** por nenhum outro caminho até aquele momento.
3. Se a Tarefa 1 do lote anterior já tiver migrado esse fluxo para `signInWithRedirect` (que não
   deveria mais precisar desse timeout artificial da mesma forma, já que não há popup para
   travar), revisar se esse código de timeout antigo ainda está presente sem necessidade e
   removê-lo caso esteja obsoleto, evitando o bug de UI resultante dele.
4. Testar repetidamente o fluxo de login (múltiplas tentativas seguidas) para confirmar que a
   mensagem de erro nunca mais aparece quando o login de fato é concluído com sucesso.

**Critério de aceite:** login com Google bem-sucedido nunca exibe mensagem de erro na tela.

---

## Tarefa 2 — Corrigir mensagem de erro falso-positiva na geração de texto por IA

**Sintoma:** a geração de texto por IA (`/api/ai/enhance`, `/api/ai/summary`) completa com sucesso
e o texto é de fato gerado/inserido no campo, mas uma mensagem de erro aparece mesmo assim.

**O que fazer:**
1. Aplicar o mesmo raciocínio da Tarefa 1: procurar por lógica de timeout/`Promise.race` nos
   componentes que chamam esses endpoints (ex.: `AIEnhanceButton.tsx`, `SummaryForm.tsx`,
   mencionados em correções anteriores) e verificar se existe a mesma condição de corrida —
   resposta de sucesso chegando depois de um timeout já ter marcado erro.
2. Verificar também se o fallback de templates implementado na correção anterior (para quando a
   IA excede cota) pode estar disparando **junto** com uma resposta de sucesso tardia da própria
   IA — ou seja, o sistema pode estar caindo no fallback por timeout, mas a chamada original à
   OpenAI ainda estava em andamento e retorna sucesso logo depois, gerando dois resultados
   conflitantes na tela (o fallback E o texto real da IA, ou o fallback com uma mensagem de erro
   sobre a IA que na verdade funcionou).
3. Corrigir para que, uma vez que uma resposta (seja da IA real, seja do fallback de template)
   já tenha sido aplicada ao campo, qualquer resposta tardia adicional seja ignorada (usar
   `AbortController` para efetivamente cancelar a requisição anterior ao invés de apenas ignorar
   sua resposta, sempre que tecnicamente possível) — evitando tanto a mensagem de erro falsa
   quanto qualquer sobrescrita inesperada do texto já preenchido.
4. Testar repetidamente em diferentes campos (experiência, resumo/objetivo) para confirmar que a
   mensagem de erro não aparece mais quando a geração de fato funciona.

**Critério de aceite:** geração de texto por IA bem-sucedida nunca exibe mensagem de erro na tela,
e não há sobrescrita inesperada de texto por respostas tardias/conflitantes.

---

## Tarefa 3 — Ir direto para seleção de planos ao concluir a última etapa

**Sintoma:** depois de concluir as 8 etapas de preenchimento, o usuário precisa dar cliques
adicionais (ex.: confirmar/avançar telas intermediárias) até chegar na tela de seleção dos 3
planos de preço — isso deve ser reduzido ao mínimo possível.

**O que fazer:**
1. Mapear exatamente o fluxo de telas/cliques que acontece hoje entre o botão de conclusão da
   última etapa (Etapa 8) e a tela de seleção de planos, identificando cada etapa intermediária
   (ex.: uma tela de "revisão final" separada, um botão de "gerar preview" separado do botão de
   "ver planos", etc.).
2. Unificar o fluxo para que, ao clicar no botão de conclusão da última etapa, a pessoa seja
   levada **diretamente** para a tela que já combina o preview parcial do currículo (com o blur
   já implementado) **e** a seleção dos 3 planos, sem telas de transição adicionais que exijam
   clique — isso já é consistente com a Tarefa 5 do lote anterior ("ao clicar em Preview já
   aparecer diretamente onde selecionar os valores"), então confirmar que essa unificação está
   de fato completa e não ficou um clique residual entre uma coisa e outra.
3. Se houver alguma etapa de transição que seja genuinamente necessária (ex.: um loading/spinner
   enquanto o preview é gerado), isso não conta como "clique extra" e pode ser mantido — o foco é
   eliminar cliques manuais desnecessários, não estados de carregamento.
4. Testar o fluxo completo do zero (das 8 etapas até a tela de planos) contando manualmente o
   número de cliques necessários, e confirmar que está no mínimo possível.

**Critério de aceite:** ao concluir a Etapa 8, a pessoa vê a tela de preview + seleção de planos
imediatamente (no máximo com um estado de carregamento breve), sem telas intermediárias que
exijam clique manual.

---

## Diretrizes gerais

- Testar cada tarefa isoladamente, repetindo os testes várias vezes (esses bugs parecem ser
  condições de corrida/timing, então um único teste de sucesso não é suficiente para validar a
  correção — repetir pelo menos 5-10 vezes cada fluxo antes de considerar corrigido).
- Ao final, reportar quantos cliques o fluxo tem agora (Tarefa 3) e confirmar, com evidência de
  testes repetidos, que as mensagens de erro falso-positivas (Tarefas 1 e 2) não aparecem mais.
- Commit, push para `main`, deploy de produção via Vercel, e validação final no domínio
  customizado.
