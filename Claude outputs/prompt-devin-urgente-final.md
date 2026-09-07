# URGENTE — corrigir 100% dos erros do site (site está recebendo visitantes reais agora)

O dono do produto está recebendo pessoas no site neste exato momento e alguns desses erros estão impedindo vendas. Trate isto como prioridade máxima. Para cada item abaixo: reproduza o erro primeiro, corrija a causa raiz (não só o sintoma), teste ao vivo depois de corrigir, e só marque como concluído com evidência real (print/vídeo/log), não por suposição.

Screenshots reais anexados a este pedido (tiradas agora mesmo, em produção, por um usuário real e por uma verificação técnica):
- **print-lead-erro-mobile.png** — celular real, tela "Vamos Começar!", erro "O salvamento demorou muito. Verifique sua conexão e tente novamente." aparecendo com dados reais preenchidos.
- **print-dropdown-solto-1.png** e **print-dropdown-solto-2.png** — desktop, etapa "Experiência", campo "Cargo": a lista de sugestões (Administrador, Advogado, Analista de Dados...) aparece **flutuando solta, longe do campo de texto**, quase colada no rodapé/botões "Voltar/Próximo", em vez de aparecer logo abaixo do input "Seu cargo na empresa".

---

## P0-1 (BLOQUEADOR — confirmado por usuário real): captura de lead trava com "O salvamento demorou muito"

Isso já tinha sido sinalizado numa verificação técnica anterior e agora foi reproduzido por um usuário real, com dados reais, no celular, agora mesmo (ver `print-lead-erro-mobile.png`).

**Diagnóstico já confirmado (não precisa redescobrir, só corrigir):**
- `/api/leads` está respondendo em 7 a 9 segundos consistentemente (medido isoladamente com fetch puro, fora da UI, 8676ms e 8663ms em duas chamadas seguidas).
- O `LeadCaptureModal` tem um timeout no cliente menor que isso. Toda vez que o timeout do cliente estoura antes da resposta do servidor, o console registra `LeadCaptureModal: save timed out` e a tela trava mostrando o erro acima — **mesmo quando a chamada termina com sucesso (200) alguns segundos depois**.
- O modal nunca avança sozinho quando isso acontece. `sessionStorage.funnelState.showLeadCapture` continua `true`. Cada novo clique em "Continuar" dispara uma **nova** chamada a `/api/leads`, criando leads duplicados.

**Corrigir:**
1. Descubra por que `/api/leads` leva 7-9 segundos (suspeita forte: alguma integração síncrona lenta dentro do handler antes de responder — envio de e-mail, webhook para CRM, chamada ao Meta Conversions API, cold start, query sem índice). Adicione logs de tempo internos ao endpoint para isolar a etapa lenta.
2. Torne qualquer integração de terceiros assíncrona (fire-and-forget) **depois** de já ter salvo o lead e respondido ao navegador, para que `/api/leads` responda em menos de 1-2 segundos.
3. Como rede de segurança adicional no front-end: se mesmo assim uma chamada demorar, garanta que ao receber sucesso (ainda que tardio) a tela avance automaticamente e não fique presa no estado de erro.
4. Impeça duplo-envio: desabilite o botão "Continuar" enquanto uma chamada está em andamento; não dispare nova chamada se já existe uma em voo ou já concluída com sucesso na sessão atual.

---

## P0-2 (BLOQUEADOR — visual, novo): listas de sugestão/autocomplete aparecem soltas, fora da posição do campo

Reproduzido ao vivo no campo "Cargo" da etapa "Experiência" (ver `print-dropdown-solto-1.png` e `print-dropdown-solto-2.png`): a lista de opções (Administrador, Advogado, Analista de Dados, Analista de Marketing, Analista de RH, Arquiteto...) some do lugar certo — deveria aparecer colada logo abaixo do input "Seu cargo na empresa", mas aparece flutuando bem mais abaixo na tela, quase em cima dos botões "Voltar"/"Próximo", às vezes cortada na borda esquerda da tela.

**Isso é sintoma clássico de um componente de dropdown/combobox posicionado incorretamente** — provavelmente usando `position: fixed`/`absolute` com coordenadas calculadas uma única vez (ou em relação ao body/viewport) em vez de recalcular a posição em relação ao próprio input (bounding rect), e/ou um portal renderizado no lugar errado do DOM sem atualizar em scroll/resize.

**Corrigir:**
1. Localize o componente de autocomplete/combobox reutilizável usado no campo "Cargo" (é bem provável que o mesmo componente seja reaproveitado em outros campos com sugestão, como "Instituição", "Área de Estudo", "Nome da Habilidade", "Nome do Idioma" — verifique e corrija em **todos** os usos, não só em "Cargo").
2. Corrija o posicionamento para que a lista de opções sempre apareça ancorada exatamente abaixo (ou acima, se não houver espaço) do campo de input correspondente, acompanhando scroll e resize da página (ex: recalcular com `getBoundingClientRect()` do input a cada abertura/scroll, ou usar uma lib de positioning como Popper/Floating UI se ainda não usar uma).
3. Garanta que a lista nunca fique cortada nas bordas da tela nem sobreponha os botões de navegação "Voltar/Próximo".
4. Teste em desktop (larguras variadas) e mobile, com a página rolada em diferentes posições.

---

## P0-3 (BLOQUEADOR — risco de pagamento): PIX pendente é perdido se a página recarregar

- Um PIX real gerado (R$ 7,90) salva `checkout_payment_id` e `checkout_payment_method` em `sessionStorage`.
- Ao recarregar a página logo depois (queda de conexão, troca de aba para o app do banco, F5 acidental), essas chaves desaparecem e a tela volta para "Escolha seu Plano" como se nada tivesse acontecido — sem checar o status do PIX que já existe.
- O PIX continua válido nos bastidores, mas o usuário não consegue mais vê-lo nem confirmar o pagamento pela interface.

**Corrigir:**
1. Migre `checkout_payment_id`/`checkout_payment_method` para `localStorage` (sobrevive a fechar/reabrir aba, não só F5).
2. Ao carregar a página, se existir um `checkout_payment_id` salvo, chame `/api/payment/status/:id` **antes** de decidir qual tela mostrar:
   - `approved: true` → seguir fluxo pós-pagamento normalmente.
   - Ainda pendente → reexibir a tela do QR Code/código PIX (idealmente o mesmo código já gerado) e retomar o polling.
   - Expirado/cancelado → aí sim voltar para "Escolha seu Plano", com uma mensagem explícita ("seu PIX anterior expirou, gere um novo").
3. Cubra com teste E2E: gerar PIX → recarregar → confirmar que a tela de QR Code é restaurada, não a de seleção de plano.

---

## P1 — reconfirmar o download do PDF pós-pagamento (o bug que começou tudo isso)

O problema original relatado pelo dono do produto foi: pagamento aprovado, mas sem acesso ao download do PDF nem botão visível para baixar. Isso já foi reportado como corrigido em commits anteriores, mas dado o volume de tráfego real agora, **refaça esse teste de ponta a ponta do zero** (pagamento real ou simulação de `approved: true`) e grave evidência (print/vídeo) de que o botão de download aparece e o PDF final (sem marca d'água) é baixado corretamente. Não presuma que continua funcionando só porque funcionou antes — as duas coisas encontradas agora (P0-1 e P0-3) mostram que há mais bugs de estado/timing na aplicação do que o esperado.

---

## P2 — tela de Pagamento não traduzida em EN/ES

Com o idioma em EN, a barra de etapas troca corretamente, mas o conteúdo da etapa de Pagamento (nomes dos planos, preços, benefícios, aviso de segurança, rodapé) continua 100% em português. Adicione as chaves de tradução faltantes em EN e ES para todo esse conteúdo.

---

## Depois de corrigir tudo:

1. Faça uma varredura geral de console (todas as etapas do formulário, os 3 idiomas) procurando por qualquer erro novo, não só os listados aqui.
2. Adicione/atualize testes E2E do Playwright cobrindo especificamente: (a) `/api/leads` respondendo rápido e o modal avançando sem erro; (b) o dropdown de sugestões permanecendo ancorado ao campo em diferentes posições de scroll; (c) reload durante PIX pendente restaurando a tela de pagamento; (d) download do PDF após pagamento aprovado.
3. Atualize o `RELATORIO-CORRECOES-FUNIL.md` com todos os itens desta rodada (P0-1, P0-2, P0-3, P1, P2), incluindo prints/evidência de cada correção.
4. Ao final, confirme explicitamente: "testei X, Y, Z ao vivo e funcionou" — não "deveria estar corrigido agora".

**Nota:** durante verificações anteriores foram criados registros de teste no banco de produção (leads com nomes "QA"/"Verificacao"/"teste", e-mails `@example.com`, e um PIX de R$ 7,90 pendente/não pago). Pode limpar esses registros ao terminar.
