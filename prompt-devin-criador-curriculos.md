# Prompt para Devin — Correções e Melhorias: Criador de Currículos

## Contexto do projeto

Você vai trabalhar no projeto **Criador de Currículos**, uma aplicação web (Next.js, hospedada na Vercel) que permite ao usuário montar um currículo passo a passo e finalizar a compra do documento gerado.

- **URL de produção:** https://criador-de-curriculos.vercel.app/
- **Painel Vercel (domínios):** https://vercel.com/oatalhodigitals-projects/criador-de-curriculos/settings/domains
- **Stack observada:** Next.js (App Router, chunks tipo `page-*.js`), Firebase Auth (login com Google), API própria em `/api/ai/enhance` (integração com OpenAI) e `/api/payment/create` (integração com pagamentos, aparentemente Mercado Pago/PIX).

**Objetivo geral:** o projeto está prestes a começar a rodar tráfego pago. Antes disso, é necessário corrigir bugs críticos que impedem conversão (login quebrado, erro ao gerar PIX, erro na IA de melhoria de texto) e ajustar a estratégia de exibição de preço e de preview de conteúdo para maximizar conversão sem permitir "captura de tela e não conclusão de compra".

Faça um levantamento completo do código-fonte antes de alterar qualquer coisa. Não assuma nomes de arquivos — explore a estrutura real do repositório e identifique os componentes/rotas correspondentes a cada item abaixo. Ao final, eu quero um resumo do diagnóstico de causa raiz de cada bug, e não apenas a correção aplicada às cegas.

---

## Tarefa 1 — Remover valores da landing page (manter preço só no fechamento)

**Problema:** a landing page (página inicial) exibe menções ao valor de **R$ 10,00** em vários pontos.

**O que fazer:**
1. Localizar todos os componentes da landing page (hero, seções de features, FAQ, badges, cards, etc.) que mencionem qualquer valor monetário (ex: "R$ 10", "10 reais", "por apenas...", etc.).
2. Remover completamente essas menções de preço da página inicial/landing. Substituir por chamadas de valor genéricas quando fizer sentido (ex.: "Monte seu currículo profissional em minutos"), sem citar número.
3. **Não remover** o preço da etapa final do fluxo (checkout/resumo antes do pagamento) — esse é o único lugar em que o valor deve continuar aparecendo, já fechado, junto ao botão de pagamento.
4. Verificar se existe alguma constante/config central de preço (ex.: `PRICE`, `PRODUCT_PRICE`, arquivo de config ou variável de ambiente) usada em múltiplos lugares — se sim, mapear todos os usos antes de remover, para não quebrar o checkout.
5. Conferir também meta tags, structured data (JSON-LD) e textos de SEO/Open Graph que possam expor o preço nos resultados de busca ou compartilhamento.

**Critério de aceite:** nenhuma tela antes da etapa final de checkout deve exibir valor em reais. A etapa final continua mostrando o preço normalmente.

---

## Tarefa 2 — Corrigir login com Google (Firebase Auth)

**Erro observado no console:**
```
LeadCaptureModal: Google login error
Info: The current domain is not authorized for OAuth operations. This will prevent
signInWithPopup, signInWithRedirect, linkWithPopup and linkWithRedirect from working.
Add your domain (criador-de-curriculos.vercel.app) to the OAuth redirect domains list
in the Firebase console -> Authentication -> Settings -> Authorized domains tab.
```

**O que fazer:**
1. Acessar o **Firebase Console** do projeto → **Authentication** → **Settings** → aba **Authorized domains**.
2. Adicionar o domínio de produção `criador-de-curriculos.vercel.app` à lista de domínios autorizados.
3. Se houver domínio customizado configurado na Vercel (verificar em Vercel → Domains, link fornecido acima), adicionar também esse domínio customizado ao Firebase.
4. Verificar se existem variáveis de ambiente (`NEXT_PUBLIC_FIREBASE_*`, `authDomain`, etc.) configuradas corretamente na Vercel (Production, Preview e Development) e se o `authDomain` usado no SDK do Firebase corresponde ao projeto correto.
5. Testar o fluxo completo de login com Google em produção (popup e, se aplicável, redirect) após a alteração.
6. Revisar o componente `LeadCaptureModal` para garantir tratamento de erro amigável ao usuário caso o login falhe novamente por qualquer motivo (mensagem clara, não apenas um console.error silencioso).

**Critério de aceite:** login com Google funcionando em produção sem erros de domínio não autorizado.

---

## Tarefa 3 — Corrigir falhas de "Auto-save failed"

**Erro observado (repetido constantemente no console):**
```
Auto-save failed: Object
```

**O que fazer:**
1. Localizar a função/hook responsável pelo auto-save (provavelmente salva o progresso do currículo periodicamente ou a cada alteração de campo).
2. Capturar e logar o conteúdo real do objeto de erro (hoje está sendo logado como `Object` genérico, sem detalhe útil) — adicionar log estruturado (`error.message`, `error.code`, `error.stack`) para diagnóstico.
3. Investigar causas prováveis:
   - Falha de autenticação/permissão (regras do Firestore/Realtime Database negando escrita para usuário não autenticado ou anônimo).
   - Payload inválido (dados undefined/null sendo enviados).
   - Rate limiting ou erro de rede intermitente.
   - Conflito de concorrência (múltiplas chamadas de auto-save disparadas em sequência rápida sem debounce).
4. Implementar debounce/throttle no auto-save se ainda não existir, para evitar chamadas excessivas.
5. Implementar retry com backoff exponencial para falhas transitórias de rede.
6. Adicionar feedback visual sutil ao usuário (ex.: ícone "salvando..." / "erro ao salvar, tentando novamente") em vez de falhar silenciosamente.

**Critério de aceite:** auto-save funcionando de forma confiável, com logs úteis em caso de falha real e sem erros repetidos no console durante uso normal.

---

## Tarefa 4 — Corrigir e liberar a funcionalidade de "Melhorar com IA"

**Erro observado:**
```
/api/ai/enhance: Failed to load resource: the server responded with a status of 429
Failed to enhance text: Error: Limite de requisições da OpenAI atingido. Tente novamente mais tarde.
```

**O que fazer:**
1. Verificar a conta/organização da OpenAI vinculada à API key usada em `/api/ai/enhance`: confirmar limite de rate (RPM/TPM) do plano atual e se há saldo/billing configurado corretamente. Um 429 constante geralmente indica ou orçamento esgotado, ou tier de rate limit muito baixo para o volume de uso esperado com tráfego pago.
2. Se o limite atual for insuficiente para produção, recomendar upgrade de tier/billing na OpenAI (isso é uma ação de configuração da conta, não apenas de código).
3. No código do endpoint `/api/ai/enhance`, implementar:
   - Tratamento adequado do erro 429 vindo da OpenAI, com mensagem clara ao usuário final e sugestão de nova tentativa em X segundos.
   - Retry automático com backoff exponencial (respeitando o header `Retry-After` quando presente).
   - Rate limiting próprio no lado do servidor (por usuário/IP) para evitar que poucos usuários esgotem a cota compartilhada.
   - Cache de resultados quando o mesmo texto for enviado novamente (evita chamadas duplicadas desnecessárias).
4. Garantir que uma falha nessa funcionalidade **não trave** o restante do fluxo de criação do currículo — deve ser uma função auxiliar opcional, com degradação graciosa.

**Critério de aceite:** funcionalidade de melhoria de texto por IA operacional em uso normal; em caso de limite atingido, usuário recebe mensagem clara e o restante do fluxo continua funcional.

---

## Tarefa 5 — Corrigir campo de CEP e auto-preenchimento de endereço

**Problema:** a quantidade de dígitos aceita no campo CEP está incorreta, e o sistema não busca o endereço automaticamente a partir do CEP.

**O que fazer:**
1. Corrigir a máscara/validação do campo CEP para o padrão brasileiro: **8 dígitos numéricos**, formatados como `00000-000`.
2. Implementar máscara de digitação (formatação automática ao digitar) e validação client-side antes de disparar a busca.
3. Ao completar os 8 dígitos, disparar automaticamente uma consulta a uma API de CEP (ex.: [ViaCEP](https://viacep.com.br/) — `https://viacep.com.br/ws/{cep}/json/`, gratuita e sem necessidade de chave) para obter: logradouro (rua), bairro, cidade e estado.
4. Preencher automaticamente esses campos no formulário, deixando **editáveis apenas**: número da casa, complemento (e opcionalmente ponto de referência).
5. Tratar CEP inválido ou não encontrado com mensagem clara, permitindo que o usuário preencha o endereço manualmente nesse caso (não travar o fluxo).
6. Adicionar tratamento de erro para falha de rede na consulta do CEP (timeout, API fora do ar), com fallback para preenchimento manual.
7. Adicionar debounce para não disparar a busca a cada tecla, apenas quando o CEP estiver completo.

**Critério de aceite:** campo CEP aceita exatamente 8 dígitos, busca automaticamente o endereço ao completar a digitação, e apenas número/complemento precisam ser preenchidos manualmente.

---

## Tarefa 6 — Estratégia de preview parcial (evitar print sem compra)

**Problema:** é preciso decidir uma estratégia de exibição de preview do currículo pronto que gere interesse e curiosidade suficientes para converter em compra, **sem** liberar a visualização completa (o que permitiria print/captura e abandono sem pagar).

**O que fazer:**
1. Ao final de todas as etapas de preenchimento, exibir uma prévia do currículo finalizado que mostre **parcialmente** o resultado — por exemplo:
   - Mostrar o topo do currículo (cabeçalho, foto, dados pessoais e um resumo/objetivo) nítido e completo.
   - A partir de determinado ponto (ex.: seção de experiências profissionais em diante), aplicar um efeito de **blur progressivo** (gradiente de nitidez para desfoque) ou um **overlay com gradiente + cadeado/CTA** ("Desbloqueie seu currículo completo") sobre o restante do conteúdo.
   - Garantir que o blur não seja facilmente removível via DevTools (evitar que o texto real fique acessível no DOM sem estar de fato oculto — considerar renderizar a versão bloqueada como imagem/canvas ou aplicar o blur de forma que o texto subjacente não seja selecionável/copiável).
2. Adicionar 1 a 2 "ganchos" visuais estratégicos no preview bloqueado (ex.: mostrar o título de uma seção como "Experiência Profissional" nítido, mas o conteúdo abaixo desfocado) para reforçar que o conteúdo já foi gerado e está pronto, aumentando a percepção de valor.
3. Bloquear ações de download, impressão (`Ctrl+P`) e clique-direito/inspeção na área de preview bloqueado (camada de proteção básica — sabendo que proteção 100% client-side nunca é infalível, mas reduz atrito de captura casual).
4. Exibir claramente o CTA de finalizar compra logo abaixo/sobre a área desfocada, com o preço (única página em que o preço deve aparecer, conforme Tarefa 1).
5. Adicionar prova social ou reforço de urgência/benefício próximo ao CTA, se já existir esse tipo de elemento no design (ex.: "Currículo pronto para envio em segundos após a confirmação").

**Critério de aceite:** usuário consegue ver uma amostra convincente do resultado (cabeçalho + início do conteúdo), mas não consegue visualizar nem copiar o currículo completo antes de pagar.

---

## Tarefa 7 — Corrigir erro ao gerar pagamento PIX

**Erro observado:**
```
POST https://criador-de-curriculos.vercel.app/api/payment/create 500 (Internal Server Error)
CheckoutModal: create payment error Error: Falha ao criar pagamento PIX.
```

**O que fazer:**
1. Investigar os logs do servidor (Vercel → projeto → aba **Logs** / **Functions**) no momento das falhas de `/api/payment/create` para obter o stack trace real do erro 500 (o console do navegador só mostra o erro genérico repassado ao cliente).
2. Verificar a integração com o provedor de pagamento (aparentemente Mercado Pago, dado o pedido da Tarefa 8) usada para gerar o PIX:
   - Confirmar se o **Access Token** do Mercado Pago está corretamente configurado nas variáveis de ambiente da Vercel (Production), sem espaços/quebras de linha acidentais, e correspondente à conta/aplicação correta (produção vs. sandbox/teste).
   - Confirmar se o payload enviado à API do Mercado Pago (criação de pagamento PIX via `payment_method_id: "pix"`) está no formato esperado (valor, descrição, `payer.email`, etc. — o Mercado Pago exige e-mail do pagador para PIX).
   - Verificar se há tratamento correto de erros retornados pela API do Mercado Pago (hoje parece estar apenas repassando um erro genérico "Falha ao criar pagamento PIX" sem detalhar a causa).
3. Adicionar logging detalhado no endpoint `/api/payment/create` (sem expor dados sensíveis) para facilitar diagnóstico de futuras falhas.
4. Adicionar tratamento de erro específico para diferentes cenários: token inválido, valor inválido, e-mail do pagador ausente/inválido, indisponibilidade momentânea do Mercado Pago.
5. No frontend (`CheckoutModal`), exibir mensagem de erro mais específica ao usuário quando possível, e permitir nova tentativa sem perder os dados já preenchidos.
6. Testar a geração de PIX de ponta a ponta em ambiente de produção (ou sandbox, se disponível) confirmando que o QR code/código copia-e-cola é gerado corretamente.

**Critério de aceite:** geração de pagamento PIX funcionando de forma consistente em produção, com QR code e código copia-e-cola válidos.

---

## Tarefa 8 — Adicionar pagamento por cartão de crédito via Mercado Pago

**O que fazer:**
1. Confirmar que a integração de pagamento já é feita via **Mercado Pago** (SDK/API) — se for outro provedor, sinalizar isso antes de prosseguir, pois pode mudar a abordagem.
2. Implementar a opção de pagamento com **cartão de crédito** usando o **Checkout Bricks** ou **Checkout Pro** do Mercado Pago (recomenda-se **Checkout Bricks** para manter a experiência dentro do próprio site, coerente com o fluxo atual de PIX embutido no `CheckoutModal`).
3. No `CheckoutModal`, adicionar seleção de forma de pagamento (PIX / Cartão de Crédito) antes ou junto à etapa final.
4. Implementar no backend um endpoint (ou estender `/api/payment/create`) para processar pagamentos com cartão via API do Mercado Pago, incluindo:
   - Tokenização segura do cartão no frontend (via SDK JS do Mercado Pago — nunca trafegar dados de cartão diretamente pelo próprio backend sem tokenização).
   - Suporte a parcelamento (se fizer sentido para o produto/preço).
   - Tratamento de status de pagamento (aprovado, recusado, pendente, em análise) com feedback claro ao usuário em cada caso.
5. Implementar webhook do Mercado Pago (**IPN/Webhooks**) para atualizar o status do pedido de forma assíncrona e confiável (não depender apenas da resposta síncrona do checkout), cobrindo tanto PIX quanto cartão.
6. Garantir consistência: o mesmo pedido/lead não deve ser processado duas vezes, e o status final da compra deve ser persistido corretamente independentemente do método escolhido.
7. Testar o fluxo completo de cartão de crédito em modo sandbox do Mercado Pago com os cartões de teste oficiais antes de liberar em produção.

**Critério de aceite:** usuário consegue escolher entre PIX e cartão de crédito no checkout, e ambos os métodos concluem o pagamento corretamente, com atualização de status via webhook.

---

## Diretrizes gerais para todas as tarefas

- **Não fazer deploy direto em produção sem testes.** Utilize um ambiente de preview da Vercel para validar cada correção antes do merge/deploy final em produção.
- **Variáveis sensíveis** (chaves de API da OpenAI, Firebase, Mercado Pago) devem estar apenas em variáveis de ambiente da Vercel, nunca hardcoded no código ou expostas no bundle client-side além do estritamente necessário (chaves públicas do Mercado Pago/Firebase são ok no client; tokens de acesso/secret NUNCA).
- Ao final de cada tarefa, gerar um resumo do diagnóstico (causa raiz) e da solução aplicada.
- Ao final de todas as tarefas, entregar um checklist de testes manuais realizados em produção/preview antes de considerar o trabalho concluído.
- Priorizar a ordem: **Tarefa 7 (PIX quebrado) e Tarefa 2 (login quebrado) são bloqueadores críticos de receita** e devem ser resolvidas primeiro. Em seguida, Tarefa 4 (IA) e Tarefa 3 (auto-save). Depois Tarefa 5 (CEP), Tarefa 1 (preços) e Tarefa 6 (preview). Tarefa 8 (cartão de crédito) é a última, por ser uma nova funcionalidade e não uma correção de bug.

