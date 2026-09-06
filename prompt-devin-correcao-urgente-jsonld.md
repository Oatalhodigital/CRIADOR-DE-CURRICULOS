# Correção URGENTE — remover avaliação fabricada do JSON-LD da home

## Achado desta auditoria

Em `src/components/HomeJsonLd.tsx`, o bloco `aggregateRating` do schema `SoftwareApplication`
contém dados **inventados**: `ratingValue: "4.8"`, `ratingCount: "83"`. Não existe, em nenhum
lugar do projeto, qualquer sistema de coleta de avaliação/nota de cliente (não há campo de review
em Firestore, Postgres, nem formulário de feedback com nota) — o número 83 parece ter sido copiado
da contagem de leads da auditoria de funil (T4), não de avaliações reais.

Isso é dado estruturado falso e viola diretamente a política do Google sobre marcação de
review/rating (`aggregateRating`/`review`) — Google exige que esses dados venham de avaliações
reais e coletadas de forma verificável, e aplica penalização manual a sites com marcação
fabricada. É o oposto do que estamos tentando conquistar com o investimento em SEO orgânico.

## Correção obrigatória

1. **Remover completamente o campo `aggregateRating`** de `HomeJsonLd.tsx` agora — não substituir
   por outro número estimado ou "aproximado", remover mesmo. O schema `SoftwareApplication` é
   válido e útil sem esse campo; `offers` sozinho já é suficiente.
2. Verificar se esse mesmo padrão (`aggregateRating` ou qualquer outro dado de avaliação sem fonte
   real) foi replicado em algum outro lugar — nas páginas de profissão (`ProfessionJsonLd` em
   `src/app/curriculo-para/[slug]/page.tsx`) ou em qualquer outro componente de JSON-LD do projeto.
   Se encontrar, remover também.
3. Ajustar o campo `offers` para refletir os 3 planos reais (R$ 7,90 / R$ 12,49 / R$ 17,90 —
   `src/app/page.tsx` linha ~143) em vez de expor só o valor de R$ 7,90 como se fosse o único
   preço. Usar `AggregateOffer` com `lowPrice`/`highPrice`/`offerCount: 3`, ou um array de `Offer`
   com os três planos — o que for mais simples de manter corrigido conforme os planos mudarem.
4. Rodar `npm run build`, commit dedicado (ex.: `fix(seo): remove aggregateRating fabricado do
   JSON-LD e corrige offers para refletir os 3 planos reais`), push, deploy de produção.
5. Confirmar em produção (visualizando o HTML renderizado da home) que o `aggregateRating` não
   aparece mais, e que o Rich Results Test do Google não acusa mais nenhum erro/aviso relacionado
   a review.

## Nota para o futuro (não fazer agora)

Se algum dia quiserem legitimamente esse campo, a forma correta é implementar um mecanismo real de
coleta de avaliação (ex.: pedir uma nota de 1-5 depois do download do PDF, salvar isso no Postgres,
e só então alimentar o `aggregateRating` com o valor agregado real, atualizado dinamicamente — nunca
um número fixo digitado à mão). Isso é um projeto à parte, não uma correção deste lote.

## Item de higiene (baixa prioridade, pode ir no mesmo commit ou separado)

`RELATORIO-SEO-PROGRAMATICO.md` está no working tree como arquivo não rastreado (`git status`
mostra `??`). Adicionar ao commit para manter o histórico de relatórios consistente com os lotes
anteriores.
