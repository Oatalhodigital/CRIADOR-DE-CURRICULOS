# Prompt para o Devin — Correção completa do funil de conversão (Criador de Currículos)

## Contexto

O site **Criador de Currículos** (Next.js, hospedado na Vercel, domínio `curriculorapidocomia.com.br`) está recebendo tráfego pago real (Google Ads + Meta/Facebook Ads) mas fechou os últimos 28 dias com **R$ 0,00 de receita e zero vendas registradas em qualquer painel** (GA4, Google Ads). Uma auditoria ao vivo (navegação real no site + leitura do console do navegador + rede + GA4 + Google Ads + logs da Vercel) encontrou vários bugs concretos, listados abaixo em ordem de prioridade. Depois da auditoria, o dono do produto fez um teste de pagamento real: **o pagamento foi aprovado, mas nenhum botão de download do PDF apareceu e o download automático não aconteceu** — este é o bug mais grave e devia ser o ponto de partida.

Corrija tudo abaixo, na ordem de prioridade indicada. Para cada item: reproduza o bug, corrija a causa raiz (não só o sintoma), e descreva o que foi mudado e como foi testado.

---

## P0 — Bloqueadores (impedem a entrega do produto que já foi pago)

### 1. Pagamento aprovado não libera o download do PDF
**Sintoma:** usuário completa o pagamento via PIX, o pagamento é aprovado pelo gateway, mas a tela não muda para liberar o download — nenhum botão de download aparece e nenhum PDF é entregue automaticamente.

**O que investigar:**
- O fluxo hoje é: `POST /api/payment/create` (gera o PIX) → `GET /api/payment/status/:id` em polling (retorna `{id, status, approved}`). Confirme o que o frontend faz exatamente quando esse polling retorna `approved: true` — parece que a transição de estado da UI (fechar o modal de pagamento → mostrar o botão/tela de download) está quebrada ou nunca é acionada.
- Verifique se existe uma race condition: o polling pode parar de rodar (componente desmontado, timeout do `setInterval`/`setTimeout`, ou o usuário navega/a aba perde foco) antes de capturar o momento exato em que `approved` vira `true`.
- Verifique se existe um endpoint de geração do PDF final (sem marca d'água) e se ele depende de algum estado (ex: pedido marcado como "pago" no banco) que não está sendo atualizado corretamente quando o pagamento é confirmado.
- Verifique se há um webhook do gateway de pagamento (server-to-server) que deveria confirmar o pagamento no backend — se o webhook não está configurado/está falhando, o pedido pode nunca ser marcado como pago no banco mesmo que o `status` pareça `approved` no polling do frontend.
- Teste especificamente o caso "usuário fecha o navegador ou atualiza a página depois de pagar, antes do polling capturar o `approved`" — hoje, isso provavelmente perde o acesso ao download para sempre.

**Corrija para garantir:**
- Assim que o pagamento for aprovado (idealmente confirmado por webhook do gateway, não só pelo polling do cliente), o pedido é marcado como pago no banco e o botão de download aparece de forma confiável.
- Um usuário que pagou consegue acessar o download **mesmo se recarregar a página, fechar a aba e voltar depois, ou trocar de dispositivo** — por exemplo, permitindo buscar o status do pedido por e-mail/ID do pedido, e/ou enviando o link de download por e-mail automaticamente após a confirmação do pagamento.
- Adicione um estado de erro visível na tela de pagamento caso o polling falhe ou demore demais, com uma opção de "já paguei, verificar novamente" e um canal de suporte visível (o rodapé já tem `suporte@curriculorapidocomia.com.br` — use-o aqui).

**Critério de aceite:** fazer um pagamento PIX real de R$ 7,90 de ponta a ponta e confirmar que o botão de download aparece automaticamente e entrega o PDF final sem marca d'água. Repetir o teste recarregando a página logo depois de pagar, para garantir que o acesso ao download não se perde.

---

## P0 — Rastreamento de conversão (sem isso, a operação continua "cega")

### 2. Nenhum evento de compra é disparado em lugar nenhum
**Sintoma:** nos últimos 28 dias, o GA4 registrou 8 tipos de evento (`page_view`, `session_start`, `first_visit`, `user_engagement`, `lead_captured`, `checkout_started`, `step_completed`, `exit_feedback`) — **nenhum evento de `purchase`, nem qualquer evento padrão de e-commerce** (`view_item`, `add_to_cart` etc). Zero vendas aparecem em qualquer painel mesmo que pagamentos reais tenham sido aprovados.

**Corrija:**
- No exato momento em que o pagamento é confirmado como aprovado (idealmente no mesmo lugar do webhook mencionado no item 1, não só no cliente), disparar:
  - Evento `purchase` do GA4 (gtag ou GTM), com `transaction_id`, `value` (7.90 / 12.49 / 17.90 conforme o plano), `currency: "BRL"` e os itens.
  - Evento `Purchase` do Meta Pixel/Conversions API, com o mesmo valor e moeda.
- Prefira disparar esses eventos a partir do servidor (Measurement Protocol do GA4 e Conversions API do Meta), não só client-side — isso evita perda de eventos por ad-blocker, fechamento de aba antes do disparo, ou pelo problema descrito no item 3 abaixo.

**Critério de aceite:** depois de uma compra de teste aprovada, o evento aparece no relatório de eventos do GA4 em tempo real como `purchase`, e no Meta Events Manager como `Purchase`, com o valor correto.

### 3. Meta Pixel está com eventos suprimidos
**Sintoma:** o console do navegador mostra, durante a navegação normal no site, os avisos:
```
[Meta Pixel] - You are attempting to send a restricted event. The event was suppressed.
[Meta Pixel] - You are attempting to send an unverified event. The event was suppressed.
```
Ou seja, o próprio Meta está descartando eventos do Pixel — o algoritmo de anúncios do Meta está sem sinal de conversão, o que provavelmente explica por que a campanha traz tráfego de países fora do público-alvo (EUA, Armênia, Canadá, Irlanda, Suécia) e idiomas de navegador estranhos (inglês, russo, vietnamita) misturados ao tráfego brasileiro esperado.

**O que investigar:**
- Verificação de domínio do site no Meta Business Manager (Configurações da Empresa → Domínios) — domínios não verificados costumam gerar exatamente esse tipo de supressão.
- Eventos "restritos" geralmente estão ligados a categorias sensíveis (ex: eventos de "emprego", que é literalmente o nicho deste produto) sob as políticas de Special Ad Category do Meta — confirme se a conta de anúncios está (ou deveria estar) marcada como categoria especial de emprego, o que muda como e quais eventos/segmentações são permitidos.
- Duplicidade entre Pixel (client-side) e Conversions API (server-side) sem `event_id` de deduplicação — configure a deduplicação corretamente se os dois forem usados.
- Use a ferramenta "Test Events" do Meta Events Manager para validar cada evento (`PageView`, `Lead`, `InitiateCheckout`, `Purchase`) um por um depois da correção.

**Critério de aceite:** os avisos de "suppressed" somem do console, e os eventos aparecem como recebidos com sucesso no Meta Events Manager (aba "Test Events" e depois no histórico real).

### 4. Tag de conversão do Google Ads nunca foi verificada
**Sintoma:** a ação de conversão "Compra" existe no Google Ads mas a tag nunca verificou nenhum disparo real, deixando a campanha com status "Qualificada (limitada)".

**Já decidido — use o caminho direto (não importar do GA4 também, para não contar a mesma venda duas vezes):** o Google Ads enviou o snippet oficial para esta conta, com o ID de conversão real. Hoje o site só carrega `gtag/js?id=G-FQCJ664XNB` (o tag do GA4) — confirmei isso ao vivo no console, não existe nenhuma referência a `AW-18434491826` no HTML nem em nenhum script carregado. Implemente:

1. Adicionar em todas as páginas, dentro de `<head>`, o comando de config do Google Ads **usando a mesma tag `gtag.js` que já existe** (não carregue um segundo `<script src="googletagmanager.com/gtag/js?id=...">`, só adicione mais um `gtag('config', ...)` na tag que já está lá):
   ```html
   gtag('config', 'AW-18434491826');
   ```
2. No exato momento em que o pagamento é confirmado como aprovado (o mesmo lugar do item 1 e do item 2 — idealmente resolvido nesse único ponto do código), disparar:
   ```js
   gtag('event', 'conversion', {
     'send_to': 'AW-18434491826/FyTzCPCd-e8cELKLoNZE',
     'value': /* valor real do plano pago: 7.90, 12.49 ou 17.90 */,
     'currency': 'BRL',
     'transaction_id': /* ID único do pedido/pagamento, nunca vazio */,
   });
   ```
   O `transaction_id` é obrigatório e precisa ser único por pedido (ex: o mesmo `id` que já volta de `/api/payment/create`) — sem isso, o Google Ads pode contar a mesma venda mais de uma vez ou não contar nenhuma.
3. **Não** configure também a importação da conversão via GA4 → Google Ads para esta mesma ação de "Compra". Se isso já tiver sido feito em algum momento, desative-a ou marque como secundária, para essa tag direta ficar como a única fonte primária de conversão de compra no Google Ads.

**Critério de aceite:** depois de uma compra de teste aprovada, o evento de conversão aparece no Google Ads (Metas → Conversões → Compra) como recebido, com o valor certo, e a campanha deixa de mostrar "Qualificada (limitada)" por falta de verificação da tag.

---

## P1 — Bugs de UX que derrubam a conversão antes mesmo do checkout

### 5. Pesquisa de saída ("exit intent") aparece por cima do formulário de início
**Sintoma reproduzido ao vivo:** ao clicar no botão principal da home ("Criar Meu Currículo Agora"), abre corretamente o modal "Vamos Começar!" (captura de lead) — mas, em alguns casos, um segundo modal de pesquisa ("Ajude-nos a melhorar — Antes de você ir, o que fez você não continuar?") abre **empilhado por cima**, escondendo o formulário real. No GA4, o evento `exit_feedback` dispara em média 3,5 vezes por usuário (7 eventos para apenas 2 usuários) nos últimos 28 dias — isso não é normal para uma pesquisa que deveria aparecer só uma vez, quando a pessoa realmente demonstra intenção de sair.

**Corrija:**
- Revise a condição de disparo do exit-intent (provavelmente baseada em `mouseleave` perto do topo da viewport, ou um timer). Ela está disparando em cenários que não são de saída real — inclusive por cima de outro modal já aberto.
- Garanta que o exit-intent nunca abra enquanto outro modal (como o de captura de lead) já estiver aberto.
- Garanta que ele dispare no máximo uma vez por sessão.

**Critério de aceite:** clicar no CTA principal repetidamente, em diferentes momentos e velocidades de mouse, nunca deve abrir o modal de pesquisa por cima do modal de início.

### 6. Perda silenciosa ao salvar o lead
**Sintoma reproduzido ao vivo (console):**
```
LeadCaptureModal: synchronous save failed, advancing user
AbortError: signal is aborted without reason
```
A primeira chamada a `POST /api/leads` é abortada, e o código automaticamente tenta de novo (a segunda tentativa retornou 200 no teste) — funciona por sorte de tempo, não por garantia. Em conexões lentas (comum em mobile/3G), o lead pode se perder de verdade sem o usuário notar, já que a UI avança normalmente mesmo quando o save falha.

**Corrija:** elimine a race condition (provavelmente um `AbortController` sendo cancelado por um re-render, unmount do componente, ou navegação disparada antes da promise resolver). O usuário só deve avançar para a próxima etapa depois que o lead for salvo com sucesso — e, se salvar falhar de verdade (todas as tentativas), mostre um erro em vez de avançar silenciosamente.

**Critério de aceite:** simular uma rede lenta (throttling no DevTools) e confirmar que o lead é salvo de forma confiável antes de avançar, sem depender de uma segunda tentativa "por acaso".

---

## P2 — Polimento

### 7. Chaves de tradução aparecendo cruas na interface
**Sintoma:** os textos `steps.languages` e `common.saved` aparecem literalmente na tela (barra de progresso do formulário e indicador de "salvo"), em vez do texto traduzido.

**Corrija:** adicione as traduções faltantes nos três idiomas do site (PT/EN/ES) para essas chaves, e faça uma varredura completa no projeto de i18n procurando por outras chaves sem tradução em qualquer um dos três idiomas (não só as duas encontradas nesta auditoria pontual).

**Critério de aceite:** nenhuma chave i18n aparece crua na tela em nenhum dos 3 idiomas, em nenhum passo do formulário.

---

## Depois de corrigir tudo

1. Rode um teste de ponta a ponta real: visitar o site → preencher o formulário → chegar ao checkout → pagar via PIX (valor mínimo, R$ 7,90) → confirmar que o download do PDF final aparece automaticamente → confirmar que o evento `purchase`/`Purchase` aparece no GA4 e no Meta Events Manager com o valor correto.
2. Se possível, adicione um teste automatizado (E2E, ex: Playwright) que cubra esse fluxo completo (lead → checkout → pagamento simulado/mock → liberação do download → disparo dos eventos de conversão), para que uma regressão como essa não fique invisível de novo por semanas.
3. Documente, em uma frase por item, o que foi corrigido em cada um dos 7 pontos acima, para o dono do produto conferir.
