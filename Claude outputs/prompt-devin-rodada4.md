# Prompt para o Devin — Rodada 4 (fechamento: teste real de pagamento + limpeza)

Ótimo trabalho na Rodada 3 (commit `d7d3e7a`) — testei ao vivo em produção e confirmei tudo:
- Recuperação de PIX após reload agora mostra o valor certo, o QR Code visível e o código PIX pagável (testei com um PIX novo e também com um PIX antigo de mais de um dia). `/api/payment/status/:id` já devolve `amount`, `qr_code` e `qr_code_base64` corretamente.
- Aba "Cartão"/"Card"/"Tarjeta", textos da seção PIX e rodapé traduzidos corretamente em EN e ES.
- "1 downloads" corrigido para "1 download" (singular) em PT e ES.
- Nenhum erro novo no console.

Não sobrou nenhum bloqueador novo. Só falta uma coisa importante para eu poder certificar o funil como 100% pronto, mais duas tarefas pequenas de limpeza/ajuste.

## Prioridade real: teste de ponta a ponta com pagamento aprovado → download do PDF

Esse é o bug ORIGINAL que motivou todo este trabalho (pagamento aprovado sem acesso ao download) e, apesar de várias correções em outras partes do funil, **nunca foi reconfirmado numa rodada recente com um pagamento de fato aprovado**. Preciso que você:
1. Gere um PIX de valor baixo (o mínimo possível, ex: plano Básico R$ 7,90) e pague de verdade (ou, se tiver acesso a credenciais de teste do Mercado Pago que gerem um `approved: true` real sem cobrança real, use esse caminho — mas deixe claro no relatório qual dos dois você usou).
2. Confirme que, após a aprovação, a tela avança automaticamente (sem precisar de F5) para a tela de download.
3. Confirme que o botão de download aparece e que o PDF baixado é o arquivo final, sem marca d'água.
4. Confirme que o evento de compra (GA4, Google Ads, Meta Pixel/CAPI) dispara nesse fluxo real, não só em teste isolado.
5. Registre prints/vídeo de cada etapa — não é aceitável reportar isso como "deveria funcionar" sem ter visto acontecer.

## Baixo (opcional, resolver se for rápido)

Ao recarregar a página com um PIX pendente e clicar na aba "Cartão", o modal muda para "Total: R$ 0,00" e "Select a plan to enable card payment" em vez de manter o contexto do pagamento recuperado. Não é um risco (evita cobrar valor errado), mas pode confundir quem quiser trocar de método após um reload. Se for simples, ajuste para reaproveitar o plano/valor já conhecido; se não for trivial, pode ficar para depois.

## Limpeza de dados de teste

Apague os registros de teste acumulados nas rodadas de verificação (Rodada 1, 2 e 3):
- Leads com "QA"/"Verificacao"/"Round2"/"Round3 Card Test" no nome e e-mails `@example.com`.
- PIX pendentes de teste, incluindo o mais recente (R$ 7,90, id `176880360255`) e o da Rodada 2 (id `177824245422`).

## Ao terminar

Atualize `RELATORIO-CORRECOES-FUNIL.md` com esta rodada, incluindo a evidência do teste de pagamento real (item mais importante). Confirme explicitamente "testei X ao vivo e funcionou" para cada item, com prints/vídeo — não "deveria estar funcionando".
