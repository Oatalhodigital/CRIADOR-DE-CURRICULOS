# Prompt para Devin — Correções críticas: login, IA, preços e automação pós-pagamento

## Contexto

Este lote de correções tem uma tarefa marcada como **crítica e inegociável** (Tarefa 6 — download
automático do PDF após pagamento). Todas as tarefas devem ser tratadas com o mesmo rigor de teste:
nada pode ir para produção sem ser validado de ponta a ponta, porque qualquer falha aqui afeta
diretamente a venda e a experiência do cliente pagante.

Investigue a causa raiz antes de corrigir. Rode `npm run build` após cada mudança relevante.
Ao final, commit + push para `main` e confirme o deploy na Vercel usando o `VERCEL_TOKEN` já
disponível no `.env.local`.

---

## Tarefa 1 — Corrigir login com Google (timeout + Cross-Origin-Opener-Policy)

**Erro reproduzido no console:**
```
Cross-Origin-Opener-Policy policy would block the window.closed call.
LeadCaptureModal: Google login timeout after 10s
LeadCaptureModal: Google login error
```

**Causa provável:** o header `Cross-Origin-Opener-Policy` (COOP) que o Next.js/Vercel está
aplicando por padrão (geralmente `same-origin`) está impedindo o `signInWithPopup` do Firebase de
verificar se o popup de login do Google foi fechado, fazendo a chamada travar até o timeout de 10s.

**O que fazer:**
1. Verificar em `next.config.js` (ou em headers customizados definidos no projeto) se existe uma
   configuração explícita de `Cross-Origin-Opener-Policy`. Se existir como `same-origin`, ajustar
   para `same-origin-allow-popups` nas rotas relevantes (a página onde o login acontece), que é o
   valor recomendado pelo próprio Firebase para permitir `signInWithPopup` funcionar corretamente
   sem abrir brecha de segurança desnecessária.
2. Se não houver configuração explícita no projeto e o header estiver vindo por padrão da
   plataforma (Vercel/Next.js 15), adicionar explicitamente esse header via `next.config.js`
   (`headers()` function) para as rotas necessárias.
3. Como alternativa mais robusta (evita depender de headers de terceiros/navegador), avaliar migrar
   de `signInWithPopup` para `signInWithRedirect` para o login com Google — o fluxo de redirect não
   sofre desse problema de COOP, ainda que exija tratar o retorno via `getRedirectResult()` após o
   redirecionamento. Se optar por essa migração, garantir que o estado do formulário/lead não se
   perca durante o redirect (salvar o necessário antes de redirecionar, restaurar ao voltar).
4. Testar o fluxo completo de login em produção (domínio customizado) depois da correção, várias
   vezes seguidas, para confirmar que não é intermitente.

**Critério de aceite:** login com Google completa com sucesso, sem timeout, sem erro de COOP no
console, de forma consistente (não apenas às vezes).

---

## Tarefa 2 — IA com limite de cota (429) nas Etapas 2 e 3: fallback com templates

**Contexto:** os endpoints `/api/ai/enhance` e `/api/ai/summary` estão retornando 429
("Limite de requisições da OpenAI atingido") de forma recorrente, bloqueando as Etapas 2
(experiência profissional) e 3 (educação).

**Duas frentes de correção, ambas necessárias:**

### 2.1 — Aumentar a capacidade real da conta OpenAI (ação do usuário, não do código)
Reportar claramente ao usuário, no resumo final, que **isso não se resolve só no código**: é
necessário acessar o painel de billing da OpenAI (platform.openai.com/settings/organization/billing)
e aumentar o limite de gasto/tier da conta, já que o 429 reflete uma cota real da conta, não um bug.
Sem esse aumento, mesmo com o código perfeito, o volume de tráfego pago vai esgotar a cota de novo.

### 2.2 — Implementar fallback de templates prontos para quando a IA falhar (Etapas 2 e 3)
1. Criar um conjunto de **templates de texto pré-escritos**, organizados por combinação de
   cargo/profissão (Etapa 2) e por tipo de curso/formação (Etapa 3), usando as mesmas listas de
   profissões e cursos já criadas na Tarefa 1 do lote anterior (`src/data/professions.ts`,
   dado equivalente para cursos).
2. Cada template deve gerar uma descrição coerente combinando os dados que o usuário já informou
   (cargo, tempo de serviço/período, empresa, curso, instituição) com frases prontas adequadas
   àquela profissão/curso — não precisa ser tão personalizado quanto a IA, mas deve soar natural e
   específico o suficiente para não parecer genérico demais.
3. No fluxo das Etapas 2 e 3: ao chamar `/api/ai/enhance` (ou `/api/ai/summary`), se a resposta for
   429 (ou qualquer erro que indique indisponibilidade da IA), **automaticamente** cair no fallback
   de template em vez de simplesmente mostrar erro ao usuário — o usuário não deve perceber uma
   "falha", e sim receber um texto pronto e editável.
4. Deixar claro visualmente (texto pequeno, não alarmante) que aquele texto foi "sugerido
   automaticamente" e pode ser editado livremente pelo usuário — em ambos os casos (IA ou
   template), o campo deve continuar editável.
5. Aplicar a mesma lógica de fallback em qualquer outro ponto do fluxo (ex.: Etapa 5, se usar IA)
   que dependa desses mesmos endpoints.

**Critério de aceite:** mesmo com a OpenAI retornando 429, o usuário consegue avançar pelas Etapas
2, 3 e 5 recebendo um texto pronto (via template), sem nunca ficar travado ou ver uma tela de erro
sem saída.

---

## Tarefa 3 — Etapa 4 (Habilidades): caixa de descrição sincronizada por habilidade

**Pedido:** ao inserir uma habilidade (usando o componente `SearchableSelect` já implementado),
deve aparecer uma caixa de descrição sugerida, específica para aquela habilidade, também via menu
suspenso (ou seja, múltiplas opções de descrição possíveis para a mesma habilidade, que o usuário
escolhe ou edita).

**Exemplo dado pelo usuário:**
```
Habilidade: Liderança
Descrição: Trabalho em equipe
```
(nota: usar esse exemplo apenas como referência de formato — a descrição de "Liderança" na prática
deveria remeter a liderar pessoas/projetos, não a "trabalho em equipe", que é outra habilidade. Ao
montar o dataset, revisar semanticamente para que cada descrição realmente corresponda à
habilidade, evitando incoerências.)

**O que fazer:**
1. Criar um dataset (`src/data/skillDescriptions.ts` ou similar) mapeando cada habilidade da lista
   já existente (`skills.ts`/equivalente) a 2-4 opções de frases de descrição curtas e coerentes
   com aquela habilidade especificamente.
2. Ao selecionar uma habilidade no `SearchableSelect` da Etapa 4, exibir automaticamente um segundo
   campo (dropdown/`SearchableSelect` com `allowFreeText` habilitado) já populado com as opções de
   descrição correspondentes àquela habilidade, permitindo ao usuário escolher uma ou escrever a
   própria.
3. Repetir esse comportamento para cada habilidade adicionada, caso o formulário suporte múltiplas
   habilidades com descrição individual.
4. Garantir que trocar a habilidade selecionada atualize as opções de descrição sugeridas
   (não deixar a descrição "grudada" de uma habilidade anterior).

**Critério de aceite:** ao escolher uma habilidade, aparecem sugestões de descrição relevantes e
coerentes com aquela habilidade específica, editáveis pelo usuário.

---

## Tarefa 4 — Reforçar rate limiting de IA para distribuir cota entre todos os clientes

Complementar à Tarefa 2.1 (aumento de billing, que é ação do usuário): no código, implementar (ou
reforçar, se já existir parcialmente) um limite de uso de IA por usuário/sessão nas rotas
`/api/ai/enhance` e `/api/ai/summary`, para que nenhum usuário sozinho consuma uma fração
desproporcional da cota total, distribuindo melhor a disponibilidade entre "todos os clientes"
(conforme pedido do usuário) mesmo com uma cota finita.

---

## Tarefa 5 — Ajustar preços/downloads e pular direto para seleção de plano no preview

**Novos valores e descrições dos 3 planos:**
- **R$ 7,90** — 1 download do currículo
- **R$ 12,49** — 2 downloads do currículo
- **R$ 17,90** — 3 downloads do currículo

**O que fazer:**
1. Atualizar os 3 planos implementados anteriormente (Tarefa 1 do lote de correções de checkout)
   com esses valores exatos e a descrição de quantidade de downloads incluída em cada um.
2. Implementar a lógica de **limite de downloads por compra**: o backend deve registrar quantos
   downloads já foram realizados para aquele pedido/pagamento aprovado (usar a tabela `orders` no
   Postgres já criada, adicionando uma coluna `downloads_allowed` e `downloads_used`, ou
   equivalente) e bloquear/avisar quando o limite for atingido.
3. **Ao clicar em "Preview"**, pular direto para a tela de seleção dos 3 planos (não exigir um
   clique adicional para "ver os planos" depois do preview) — ou seja, preview e seleção de plano
   devem aparecer juntos/em sequência imediata na mesma interação.
4. Atualizar os valores enviados ao Mercado Pago (`transaction_amount`/`unit_price`) para bater
   exatamente com esses 3 valores, incluindo os centavos corretos (ex.: `7.90`, `12.49`, `17.90`).

**Critério de aceite:** os 3 planos aparecem com os valores e descrições corretos assim que o
usuário chega no preview, sem etapa extra; o número de downloads permitidos é controlado
corretamente pelo backend.

---

## Tarefa 6 — CRÍTICO: download automático do PDF + e-mail de confirmação após pagamento aprovado

**Esta é a tarefa mais importante do lote. Não pode haver falha aqui — trate com o nível de rigor
de um sistema de pagamento em produção, com testes exaustivos antes de considerar concluída.**

### 6.1 — Download automático imediato após aprovação
1. No fluxo atual, o `CheckoutModal` já faz polling do status do pagamento (mencionado em sessões
   anteriores, até 60 tentativas). No momento exato em que o status muda para `approved` (seja via
   esse polling, seja via confirmação recebida do webhook refletida no estado do frontend), disparar
   **automaticamente e sem exigir nenhum clique do usuário** a geração e o download do PDF do
   currículo.
2. Isso deve funcionar tanto para pagamento via **PIX** (aprovação assíncrona, detectada via
   polling/webhook) quanto via **cartão** (que pode aprovar de forma quase imediata, síncrona ou
   quase-síncrona).
3. Implementar com **retry automático**: se a geração do PDF falhar por qualquer motivo transitório
   (erro de rede, timeout), tentar novamente automaticamente (ex.: até 3 tentativas com backoff)
   antes de mostrar qualquer mensagem de erro ao usuário.
4. Se, mesmo após os retries, o download automático falhar, o usuário **nunca pode ficar sem
   acesso ao currículo que pagou** — implementar como rede de segurança um botão de "Baixar
   currículo" sempre visível na tela pós-pagamento (mesmo que o download automático já tenha
   disparado), e garantir que esse botão funcione de forma independente/idempotente (pode ser
   clicado múltiplas vezes sem duplicar cobrança nem gerar erro).
5. Persistir a associação entre o pedido aprovado (`orders.id` / `mp_payment_id`) e o PDF gerado
   (ex.: salvar o PDF gerado, ou os dados necessários para regerá-lo, de forma que o usuário possa
   voltar depois — ex.: acessando um link/e-mail — e baixar de novo, dentro do limite de downloads
   contratado).
6. Testar exaustivamente antes de dar por concluído: simular aprovação de PIX via webhook de teste,
   simular aprovação de cartão, simular falha transitória na geração do PDF (para validar o retry),
   e confirmar em todos os cenários que o cliente termina com o PDF em mãos.

### 6.2 — E-mail de confirmação automático
1. Implementar envio de e-mail transacional usando **Resend** (`resend.com`) — biblioteca simples
   de integrar com Next.js/rotas de API, com free tier generoso o suficiente para o volume inicial
   do projeto. Adicionar a dependência (`npm install resend`) e criar o cliente de envio em
   `src/lib/email.ts` (ou padrão equivalente ao projeto).
2. Disparar o e-mail automaticamente no mesmo momento em que o pagamento é confirmado como
   aprovado (mesmo gatilho da Tarefa 6.1), para o e-mail informado pelo lead/comprador.
3. Conteúdo do e-mail:
   - Agradecimento pela compra e pela confiança no serviço.
   - Confirmação de que o currículo está pronto (anexar o PDF gerado ao e-mail, ou incluir um link
     seguro de download, dado que anexar PDFs pode ter limite de tamanho dependendo do provedor —
     escolher a abordagem mais confiável tecnicamente).
   - Pedido gentil de avaliação/feedback e incentivo a compartilhar o serviço (ex.: link para
     deixar uma avaliação, ou call-to-action de compartilhamento em redes sociais/WhatsApp).
4. Tratar falha de envio de e-mail como **não-bloqueante** para o download do PDF — se o e-mail
   falhar, o cliente já tem o PDF baixado (Tarefa 6.1 é a prioridade máxima); o envio de e-mail
   pode ter sua própria lógica de retry separada, sem travar a experiência principal.
5. Registrar em log (e, se fizer sentido, na tabela `orders` do Postgres, um campo
   `confirmation_email_sent_at`) se o e-mail foi enviado com sucesso, para permitir reenvio manual
   futuro caso necessário.

**Critério de aceite da Tarefa 6 (não negociável):** em 100% dos testes realizados (múltiplas
repetições, incluindo cenários de falha simulada), o cliente que pagou recebe o PDF do currículo
automaticamente, sem precisar clicar em nada além de concluir o pagamento, e recebe um e-mail de
confirmação e agradecimento. Nenhum cenário pode terminar com o cliente pagante sem o produto.

---

## Diretrizes gerais

- Ordem de prioridade: **Tarefa 6 é a mais crítica de todas** — não é opcional, é o núcleo da
  entrega do produto para quem paga. Testar essa tarefa com o maior rigor possível antes de
  considerar o lote concluído. Em seguida, Tarefa 1 (login, bloqueia entrada de usuários) e
  Tarefa 2 (IA travando etapas). Depois Tarefa 5 (preços), Tarefa 3 (habilidades) e Tarefa 4
  (rate limiting, é reforço complementar).
- Para a Tarefa 6, documentar no relatório final exatamente quais cenários de teste foram
  executados e o resultado de cada um — não basta dizer "implementado", é preciso evidenciar que
  foi testado de verdade.
- Ações que dependem do usuário (fora do escopo do código) devem ser listadas claramente ao final:
  aumentar limite de billing da OpenAI, criar conta no Resend e configurar `RESEND_API_KEY` como
  variável de ambiente na Vercel.
- Nunca imprimir segredos completos (chaves de API, tokens) no terminal/log.
- Ao final: `git add`, commit descritivo, `git push origin main`, confirmar deploy de produção via
  API da Vercel com o `VERCEL_TOKEN` disponível, e validar no domínio customizado.
