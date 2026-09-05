# Continuação — verificação do progresso e desbloqueio das Tarefas 1 e 4

## Verificação independente do que foi reportado

Conferi diretamente no repositório (não apenas pelas mensagens de commit) e confirmo que T0, T2, T3,
T5 e T6 estão de fato implementadas como reportado:

- `9e82be8`, `5fce9ac`, `9b4b872`, `63772d7` existem em `main`; `git status` está limpo.
- `.gitattributes` presente e correto.
- O `gclid` **não fica só no `sessionStorage`** — está de fato sendo enviado no payload de
  `/api/leads` e persistido na coluna `gclid` da tabela `leads` (`ALTER TABLE leads ADD COLUMN IF
  NOT EXISTS gclid`). Isso é melhor do que eu esperava — bom trabalho.
- O guard de dedup do CAPI Purchase está corretamente implementado em `paymentComplete.ts` com o
  padrão checar (`isCapiPurchaseSent`) → enviar → marcar (`markCapiPurchaseSent`), dentro do bloco
  fire-and-forget.
- `Footer.tsx`, `/termos-uso` e `/politica-reembolso` existem e estão linkados.

Duas pendências antes de considerar o lote atual 100% fechado:

1. **Não encontrei nenhum log novo da rodada de e2e "15/15 passing"** — os únicos `.log` de e2e no
   repositório são de rodadas anteriores (fim de julho). Salve o log completo desta execução (ex.:
   `e2e-round3.log`) como evidência, no mesmo padrão já usado no projeto — sem isso, "15/15
   passing" é uma afirmação, não uma evidência.
2. **A Tarefa 0 pedia confirmar, via API/CLI da Vercel, que o deploy de produção corresponde ao
   commit atual de `main`** — isso não apareceu no relatório. Confirme isso agora, já incluindo os
   commits novos (T2/T3/T5/T6), e dispare um novo deploy de produção se houver defasagem.

## T4 — você não precisa de "acesso externo novo"

O projeto já tem `VERCEL_TOKEN` configurado em `.env.local`, e a pasta já está linkada a um projeto
Vercel (existe `.vercel/`). Use esse token para autenticar a CLI/API da Vercel **de forma
não-interativa** (passe o token explicitamente, ex. `vercel env pull --token=$VERCEL_TOKEN` ou
equivalente via API — uma chamada anterior sem o token explícito travou esperando login no
navegador) e obtenha o `POSTGRES_URL` real de produção. A partir daí, rode as queries de funil
propostas na Tarefa 4 (leads capturados, `checkout_started`, pedidos criados por status,
`payment_delivered`) para o período 06/08–04/09/2026 e produza o relatório numérico pedido.

## T1 — duas ressalvas importantes antes de continuar

1. **O `MERCADO_PAGO_ACCESS_TOKEN` atual é uma credencial de produção real (`APP_USR-...`), não de
   sandbox.** Não rode uma bateria grande de recusas forçadas contra essa credencial — isso pode
   afetar o histórico antifraude da conta real do usuário e poluir métricas reais (GA4/Meta) mesmo
   com a proteção de dedup já implementada. Peça ao usuário para gerar, no painel de
   desenvolvedores do Mercado Pago, um usuário de teste + Access Token de teste (`TEST-...`), e
   rode a bateria completa de cenários (aprovado / recusado por diferentes motivos / em análise,
   PIX e cartão) contra um **ambiente de preview da Vercel** configurado com essas credenciais de
   teste — sem tocar a produção real.
2. **Para desktop e mobile "normal" (fora de navegador in-app), você não precisa de dispositivo
   físico** — use emulação de dispositivo do Playwright (viewport mobile + user agent de
   Chrome Android / Safari iOS) contra o ambiente de preview acima. Isso pode e deve ser feito
   agora, sem esperar por nada externo.
3. **Para o navegador in-app real do Facebook/Instagram**, a fidelidade de um WebView real é
   difícil de replicar 100% em automação — aqui sim faz sentido um teste manual humano. Roteiro de
   ~15 minutos para o usuário (ou alguém do time) rodar num celular real, assim que as credenciais
   de teste estiverem disponíveis num link de preview:
   1. Abrir o link a partir de uma postagem/DM real dentro do app do Instagram (não colar o link
      no Safari/Chrome diretamente).
   2. Preencher o formulário até a tela de checkout.
   3. Pagar via PIX: gerar o QR code, copiar o código e confirmar que o feedback "Copiado!"
      aparece.
   4. Pagar via cartão de teste: confirmar que o Brick carrega e aceita o cartão sem o erro "Dado
      obrigatório".
   5. Confirmar que o PDF abre/baixa corretamente dentro do WebView, ou que o aviso para abrir no
      navegador padrão aparece de forma clara.
   6. Repetir o mesmo roteiro a partir de uma postagem/DM no Facebook.
   7. Reportar com prints de cada etapa.

## Diretrizes

Mesmo rigor de sempre: nenhuma tarefa é considerada concluída sem evidência real anexada. Ao
finalizar T1 e T4, produza o relatório final único já pedido no prompt original (causa raiz,
correção, evidência, tabela antes/depois, checklist de prontidão para o Google Ads).
