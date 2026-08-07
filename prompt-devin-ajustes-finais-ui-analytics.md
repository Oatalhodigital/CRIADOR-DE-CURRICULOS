# Prompt para Devin — Ajustes finais de UI mobile, preview com marca d'água, logo, correção residual de IA e Google Analytics

## Contexto

Revisão final feita pelo sócio junto com o usuário, com prints reais do site em smartphone. Seis
itens específicos a corrigir/implementar. Investigue a causa raiz de cada um antes de corrigir.
Rode `npm run build` após as mudanças. Ao final, commit + push para `main` e confirme o deploy de
produção, validando no domínio customizado.

---

## Tarefa 1 — Corrigir sobreposição dos campos "Data Início" / "Data Fim" no mobile

**Problema:** nos campos de data das etapas de Experiência e Educação, em telas de smartphone os
campos "Data Início" e "Data Fim" ficam sobrepostos/encavalados (no desktop está normal — é
especificamente um problema de breakpoint mobile).

**O que fazer:**
1. Localizar o componente de campo de data usado em `ExperienceForm` e `EducationForm` (ou
   componente compartilhado de seleção de mês/ano).
2. Testar especificamente em viewports estreitos (375px, 390px — mesmos usados na auditoria mobile
   anterior) e identificar por que os dois campos, lado a lado, não têm espaço suficiente ou não
   estão quebrando para empilhar verticalmente quando necessário.
3. Corrigir o layout responsivo desses dois campos: em telas estreitas, empilhar "Data Início"
   acima de "Data Fim" (um embaixo do outro, ocupando a largura total) em vez de tentar manter os
   dois lado a lado sem espaço suficiente; em telas maiores, manter lado a lado como já está.
4. Confirmar que o seletor de mês/ano (dropdown de data) não é cortado nem sobreposto por outros
   elementos ao abrir, nesses mesmos viewports estreitos.
5. Testar novamente com Playwright/screenshots (mesma abordagem da auditoria mobile anterior) nos
   4 viewports já usados, confirmando visualmente que não há mais sobreposição.

**Critério de aceite:** em telas de smartphone, os campos de data não se sobrepõem, empilhando
verticalmente quando necessário; em desktop, o layout permanece como está (lado a lado).

---

## Tarefa 2 — Scroll independente na barra de etapas (steps)

**Problema:** a barra horizontal de etapas no topo (Pessoal, Experiência, Educação, Habilidades...)
não tem rolagem própria — ao tentar navegar pelas etapas em mobile, a página inteira rola junto,
em vez de apenas a barra de steps se mover horizontalmente de forma isolada.

**O que fazer:**
1. Localizar o componente da barra de navegação de etapas (indicador de progresso/steps no topo do
   formulário).
2. Implementar rolagem horizontal isolada nesse contêiner especificamente (`overflow-x: auto` ou
   equivalente Tailwind `overflow-x-scroll`/`overflow-x-auto`, com `overscroll-behavior: contain`
   para impedir que o gesto de rolagem "vaze" para o scroll vertical da página quando o usuário
   está arrastando a barra de steps).
3. Garantir que a etapa ativa/atual fique visível dentro dessa área de scroll ao navegar entre
   etapas (auto-scroll para a etapa ativa quando o usuário avança/volta), sem depender de rolagem
   manual do usuário toda vez.
4. Adicionar indicação visual sutil de que a barra é rolável (ex.: leve gradiente/sombra nas
   bordas, ou espaçamento que sugira mais conteúdo fora da tela), especialmente em mobile onde
   nem sempre fica óbvio que dá para arrastar.
5. Testar em mobile que rolar a barra de steps não move mais a página inteira junto.

**Critério de aceite:** em mobile, a barra de steps rola horizontalmente de forma independente,
sem mover o restante da página junto.

---

## Tarefa 3 — Preview completo do currículo com marca d'água (em vez de blur parcial)

**Mudança de estratégia:** em vez do preview parcial com blur progressivo (implementado
anteriormente), agora o pedido é **liberar a visualização completa** do currículo no preview, mas
aplicando uma **marca d'água** (watermark) visível sobre o conteúdo, identificando que é uma
prévia do "Criador de Currículo" — de forma que a pessoa veja tudo, mas não consiga usar/imprimir
aquele preview como o documento final sem pagar (pela presença da marca d'água).

**O que fazer:**
1. Remover a lógica de blur progressivo/preview parcial implementada anteriormente em
   `ResumePreview.tsx`.
2. Implementar uma marca d'água (ex.: texto repetido na diagonal, semi-transparente, tipo
   "PREVIEW — currículorapidocomia.com.br" ou o nome/domínio do produto) sobreposta a todo o
   conteúdo do preview, de forma legível mas não excessivamente invasiva — a pessoa deve conseguir
   ler o conteúdo do currículo para se convencer da qualidade, mas a marca d'água deve deixar claro
   que aquilo não é a versão final para uso.
3. Manter as proteções anti-cópia/anti-print já implementadas anteriormente (bloqueio de
   clique-direito, `Ctrl+P`, seleção de texto) na área de preview, já que mesmo com o conteúdo
   visível, ainda não deve ser trivial capturar/usar aquele preview como documento final.
4. Confirmar que a versão final gerada **após o pagamento** (o PDF de verdade) não contém a marca
   d'água — ela deve existir apenas na tela de preview antes da compra.
5. Manter o CTA de "Escolha seu plano"/pagamento visível junto ao preview completo, como já está.

**Critério de aceite:** o preview mostra o currículo completo (não mais parcialmente borrado), com
uma marca d'água clara identificando que é uma prévia; o PDF final pago não tem marca d'água.

---

## Tarefa 4 — Substituir o texto "LS - Soluções Digitais" pela logo do site

**O que fazer:**
1. Localizar onde o texto "LS - Soluções Digitais" aparece no cabeçalho (`Header`/`Navbar` do
   projeto).
2. Substituir esse texto por uma imagem de logo. Como ainda não há um arquivo de logo em alta
   resolução disponível, usar o ícone/raio (⚡) já utilizado como favicon/identidade visual do site
   (mencionado pelo usuário como "o raio que se encontra no link da Vercel") como logo temporária,
   mesmo sabendo que a resolução atual não é ideal — não travar essa tarefa esperando um arquivo
   melhor, que pode ser trocado depois facilmente já que o componente vai referenciar um arquivo de
   imagem, não texto hardcoded.
3. Estruturar o componente de logo de forma que seja fácil substituir o arquivo de imagem no
   futuro (ex.: componente `Logo.tsx` que apenas renderiza uma imagem de um caminho único em
   `public/`), para quando o usuário tiver uma versão em melhor resolução.
4. Garantir que a logo mantenha proporção e tamanho adequados em todos os breakpoints (desktop e
   mobile), sem distorcer.

**Critério de aceite:** o cabeçalho exibe a logo (ícone do raio) no lugar do texto "LS - Soluções
Digitais", de forma responsiva, com o componente pronto para receber um arquivo de logo melhor no
futuro sem precisar reescrever a estrutura.

---

## Tarefa 5 — Corrigir mensagem de erro residual da IA no step "Objetivo Profissional"

**Problema reproduzido (print anexo):** no step de "Objetivo Profissional", ao gerar com IA e
receber 429, a mensagem vermelha **"Limite de requisições da OpenAI atingido. Tente novamente mais
tarde."** ainda aparece, mesmo com os "Templates Rápidos" sendo exibidos corretamente logo abaixo
como alternativa funcional. Esse é o mesmo bug corrigido anteriormente (Tarefa 2 de um prompt
anterior) em outros campos (experiência, educação) — mas o componente usado especificamente no
step de Objetivo Profissional (aparenta ser um componente diferente, com botão "Gerar com IA" em
vez do botão de IA usado nos outros campos) não recebeu a mesma correção.

**O que fazer:**
1. Localizar o componente específico do step "Objetivo Profissional" (provavelmente
   `SummaryForm.tsx` ou um componente irmão dedicado a esse campo, dado que o botão/layout parece
   diferente do padrão usado em Experiência/Educação — com "Gerar com IA" como botão de destaque e
   "Templates Rápidos" como lista de sugestões abaixo, em vez do ícone de IA inline).
2. Aplicar a mesma correção da Tarefa 2 do prompt anterior: quando os templates/sugestões forem
   exibidos com sucesso como alternativa, limpar o estado de mensagem de erro em vermelho — o
   usuário não deve ver a mensagem de "limite atingido" ao mesmo tempo que recebe alternativas
   funcionais.
3. Auditar mais uma vez **todos** os pontos do site que usam geração por IA (para não deixar esse
   mesmo bug se repetir em mais um lugar não coberto): busca no código por todos os componentes que
   chamam `/api/ai/enhance` ou `/api/ai/summary`, e confirmar que cada um deles limpa o estado de
   erro corretamente quando um fallback é aplicado com sucesso.

**Critério de aceite:** em nenhum ponto do site (incluindo especificamente o step "Objetivo
Profissional") a mensagem de erro em vermelho aparece quando o usuário recebe uma alternativa
funcional (template ou texto de IA real).

---

## Tarefa 6 — Implementar Google Analytics (GA4)

**O que fazer:**
1. Adicionar a tag do Google Analytics 4 ao projeto usando o componente `next/script` (abordagem
   recomendada para Next.js, evita bloquear a renderização da página), carregado em
   `src/app/layout.tsx` (aplicado a todas as páginas).
2. Ler o ID de medição do GA4 (formato `G-XXXXXXXXXX`) a partir de uma variável de ambiente
   `NEXT_PUBLIC_GA_MEASUREMENT_ID` — **não hardcodar o ID no código**, já que o usuário ainda vai
   fornecer esse valor (ver seção de ações manuais abaixo).
3. Se essa variável de ambiente não estiver definida (ex.: em ambiente de desenvolvimento local),
   o script do GA não deve ser carregado, evitando poluir dados de analytics com testes locais.
4. Implementar rastreamento de eventos-chave do funil, além do pageview automático padrão do GA4,
   usando `gtag('event', ...)`:
   - `lead_captured` (quando um lead é salvo)
   - `step_completed` (com parâmetro do número/nome da etapa, a cada etapa concluída)
   - `checkout_started` (ao abrir o modal de pagamento)
   - `purchase` (evento padrão de e-commerce do GA4, disparado na aprovação do pagamento, incluindo
     valor e método de pagamento como parâmetros — isso permite futuramente medir ROI de campanhas
     de tráfego pago diretamente no Google Analytics/Google Ads).
5. Adicionar a variável `NEXT_PUBLIC_GA_MEASUREMENT_ID` ao `.env.example` com um comentário
   explicando onde obtê-la.

**Critério de aceite:** o Google Analytics carrega em produção (quando a variável de ambiente
estiver configurada), rastreia pageviews automaticamente, e dispara os eventos de funil listados
acima nos momentos corretos.

---

## Diretrizes gerais

- Testar cada tarefa isoladamente, com foco especial em mobile para as Tarefas 1, 2, 3 e 4 (usar os
  mesmos 4 viewports da auditoria mobile anterior).
- Para a Tarefa 5, não considerar concluído sem revisar todos os pontos de uso de IA no projeto,
  não apenas o do print.
- Reportar no resumo final, para a Tarefa 6, que o rastreamento não vai gerar dados reais até o
  usuário configurar o ID de medição (ação manual dele, descrita fora deste prompt).
- Nunca imprimir segredos completos no terminal/log.
- Ao final: `npm run build`, commit, push para `main`, deploy de produção via Vercel, validação no
  domínio customizado, incluindo novo teste rápido de CLS/responsividade mobile para confirmar que
  as mudanças desta rodada não pioraram os números já validados (CLS abaixo de 0.1).
