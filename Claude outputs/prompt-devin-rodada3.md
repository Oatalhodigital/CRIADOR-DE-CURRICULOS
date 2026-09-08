# Prompt para o Devin — Rodada 3 (ajuste fino, sem bloqueadores novos)

Ótimo trabalho na Rodada 2 (commit `5cea9c2`) — testei ao vivo em produção e confirmei:
- `/api/leads` caiu de 7-9s para ~0,4-1s, sem mais travar o formulário de lead, e a proteção contra clique duplicado funciona (testei 3 cliques rápidos, só 1 lead salvo).
- O dropdown de sugestões (campo "Cargo") agora fica perfeitamente ancorado ao input, inclusive depois de rolar a página (testei antes/depois do scroll, 4px de distância nos dois casos).
- Nenhum erro novo apareceu no console durante toda a bateria de testes.

Sobraram dois pontos, nenhum deles um bloqueador novo, mas o primeiro ainda deixa um cenário de pagamento incompleto:

## Alto: recuperação de PIX após reload não mostra o código para pagar

O que já funciona: ao recarregar a página com um PIX pendente, o `checkout_payment_id` (agora em `localStorage`, correto) é lido, o modal de pagamento reabre sozinho e o polling de `/api/payment/status/:id` retoma com o ID certo. Isso já elimina o risco de o usuário ser jogado de volta para "Escolha seu Plano" e gerar uma cobrança duplicada.

O que falta: a tela recuperada mostra "Total: R$ 0,00" e "QR Code indisponível. Use o código PIX abaixo." com o campo do código PIX vazio. Confirmei que `/api/payment/status/:id` devolve só `{id, status, approved}` — sem valor nem código PIX/QR. Não existe hoje nenhuma chamada que recupere esses dados de um pagamento já criado.

**Corrigir:** faça `/api/payment/status/:id` (ou um novo endpoint, ex: `/api/payment/:id`) devolver também `amount` e o código PIX/QR original quando o pagamento ainda estiver pendente, e ajuste o `CheckoutModal` para usar esses dados ao restaurar a tela, para que o usuário consiga concluir o pagamento pela tela recuperada, não só ver que ela existe.

## Baixo (cosmético, resolver junto):
1. Aba "Cartão" não traduz para "Card" em EN (o resto da etapa de pagamento já traduz corretamente).
2. Textos da seção PIX não traduzidos em EN/ES: "QR Code indisponível. Use o código PIX abaixo.", "Código PIX (copie e cole):", "Copiar código PIX".
3. Rodapé (Termos de Uso, Política de Privacidade, Política de Reembolso, Suporte) continua só em português nos 3 idiomas.
4. Erro de pluralização: plano Básico mostra "1 downloads do currículo em PDF" (deveria ser "1 download", singular) — revisar o mesmo padrão em EN/ES.

## Ao terminar:
- Reteste ao vivo o cenário completo: gerar PIX → recarregar a página → confirmar que valor e código aparecem corretos e que dá para pagar por ali.
- Atualize `RELATORIO-CORRECOES-FUNIL.md` com esta rodada.

Sem urgência de bloqueador desta vez — pode seguir o ritmo normal.
