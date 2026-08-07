# Prompt para Cursor — Continuidade de projeto (migração de agente de IA)

Atue como engenheiro de software sênior especialista em Next.js (App Router), Firebase,
integração com IA (OpenAI) e pagamentos (Mercado Pago). Este projeto ("Criador de Currículos",
deployado em criador-de-curriculos.vercel.app) já estava sendo desenvolvido por outro agente de
IA (Windsurf) em sessões anteriores, mas o limite diário de uso foi atingido e o desenvolvimento
foi migrado para você, aqui no Cursor. Você NÃO tem o histórico de conversa da sessão anterior —
apenas o estado atual do código no repositório. Por isso, antes de aplicar qualquer mudança nova,
preciso que você faça um levantamento do que já foi (ou não foi) implementado.

## FASE 0 — Levantamento do estado atual (OBRIGATÓRIO antes de qualquer alteração)

1. Faça uma varredura completa do código-fonte atual (`src/app`, `src/components`, `src/lib`,
   `src/hooks`, `middleware.ts`, `next.config.js/ts`, rotas de API em `src/app/api`) e monte um
   checklist do que já existe implementado versus o que ainda falta, com base nestes dois blocos
   de trabalho que estavam em andamento:

   **Bloco A — Melhorias de UX/IA/monetização** (verifique o que já foi feito):
   - Campos de endereço estruturados (endereço, cidade, estado, CEP) com autocomplete/ViaCEP
   - Date picker inteligente substituindo texto livre nas datas
   - Campo Website/Portfólio marcado como opcional
   - Renomeação de "Resumo" para "Objetivo Profissional"
   - Renomeação para "Habilidades e Competências"
   - Seção de Idiomas com nível de proficiência
   - Botão "Melhorar com IA" na descrição de experiência (via Route Handler server-side)
   - Sugestões de habilidades por cargo (modal)
   - Sugestões de IA para Objetivo Profissional
   - Preview atualizando em tempo real a cada mudança (não só ao clicar em "+Adicionar")
   - Tela de parabenização + redirecionamento automático para planos ao concluir
   - 3 planos de preço implementados (Avulso R$7,98 / Semanal R$10,49 até 3 / Mensal R$12,49
     até 5), sem cobrança recorrente oculta
   - Preview borrado/marca d'água "RASCUNHO" antes do pagamento
   - Integração Mercado Pago (PIX) via Route Handler + webhook de confirmação
   - Geração de PDF com `@react-pdf/renderer` (texto selecionável, fontes/cores configuráveis)
   - Captura de e-mail/contato com checkbox de consentimento (LGPD) + link de política de
     privacidade + remarketing por e-mail com opção de descadastro

   **Bloco B — Correção de erros** (verifique o que já foi feito):
   - Diagnóstico do erro `Firebase: Error (auth/configuration-not-found)` no cadastro
   - Tratamento de erro no fluxo de auth (sem travar em "Processando..." para sempre; timeout
     de segurança; mensagem amigável ao usuário)
   - Auditoria de todas as chamadas assíncronas (Auth, Firestore, Route Handlers de IA/pagamento)
     quanto a try/catch, finally, feedback de erro ao usuário
   - Confirmação de variáveis de ambiente presentes tanto em `.env.local` quanto no painel da
     Vercel, sem prefixo `NEXT_PUBLIC_` em segredos (OPENAI_API_KEY, MERCADO_PAGO_ACCESS_TOKEN)
   - `npm run build` limpo, sem warnings de TypeScript/ESLint/React hooks
   - Favicon/ícones ausentes causando 404
   - Testes ponta a ponta de todos os fluxos

2. Me apresente esse checklist ANTES de escrever qualquer código novo, marcando cada item como:
   ✅ Já implementado e funcionando | ⚠️ Implementado parcialmente/com bug | ❌ Não implementado.
   Para itens ⚠️ ou ❌, descreva brevemente o que falta.

3. Verifique também se existe algum código com bugs, duplicações, ou inconsistências deixadas
   pela sessão anterior (ex: dois componentes fazendo a mesma coisa, imports quebrados, TODOs
   ou comentários indicando trabalho incompleto) e liste isso separadamente.

## FASE 1 EM DIANTE — Continuar exatamente de onde parou

Depois de eu confirmar o checklist (ou você pode prosseguir direto se a evidência no código for
clara), continue implementando os itens marcados como ⚠️ ou ❌, seguindo estas prioridades:

1. **Prioridade máxima — corrigir o erro de autenticação** (Bloco B), pois ele bloqueia o fluxo
   inteiro do site (usuário não consegue nem começar a criar o currículo). Aplique o diagnóstico
   e as correções de tratamento de erro descritas no Bloco B acima.
2. Em seguida, auditoria geral de chamadas assíncronas e variáveis de ambiente (resto do Bloco B).
3. Depois, finalizar os itens pendentes do Bloco A (melhorias de UX/IA/monetização) na ordem em
   que aparecem na lista.

Mantenha os mesmos padrões e convenções já usados no restante do código (não reescreva do zero
componentes que já funcionam, apenas complete ou corrija o que estiver faltando/quebrado).

## FASE FINAL — Build, testes e deploy

Ao concluir os itens pendentes:

```
npm install
npm run build
```

Rode o roteiro de teste ponta a ponta (cadastro, login Google, preenchimento com preview ao
vivo, IA, planos, pagamento PIX, download do PDF, console do navegador limpo) e só então:

```
git add .
git commit -m "fix+feat: continuidade do projeto — correção de auth e finalização das melhorias pendentes"
git push origin main
vercel --prod
```

## RELATÓRIO FINAL

Me entregue:
1. O checklist da Fase 0 preenchido (o que já estava pronto vs. o que você implementou agora).
2. Confirmação da causa raiz do erro de autenticação e se foi resolvida via código, ou se ainda
   depende de uma configuração manual minha no console do Firebase.
3. Qualquer ação que eu precise fazer manualmente fora do código (Firebase Console, painel da
   Vercel, painel do Mercado Pago).
4. Confirmação de que o console do navegador está limpo em produção.

Não presuma nada sobre configurações externas sem me perguntar — e não assuma que um item foi
implementado apenas porque existe um arquivo ou nome de função sugestivo; confirme lendo a
lógica real do código.
