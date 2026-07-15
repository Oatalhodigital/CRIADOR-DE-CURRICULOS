# Prompt para Windsurf — Diagnóstico e correção completa de erros (Criador de Currículos)

Atue como engenheiro de software sênior especialista em Next.js (App Router), Firebase
Authentication/Firestore e depuração de erros em produção na Vercel. Preciso de uma auditoria
completa do projeto "Criador de Currículos" (criador-de-curriculos.vercel.app) para eliminar
todos os erros ativos e prevenir novos.

## CONTEXTO — Erro reproduzido agora em produção

Ao preencher o formulário inicial (Nome, E-mail, WhatsApp) e clicar no botão de submit, o botão
fica travado em "Processando..." indefinidamente. O console do navegador mostra:

```
identitytoolkit.googleapis.com/v1/accounts:signUp?key=... : 400
Firebase auth failed: FirebaseError: Firebase: Error (auth/configuration-not-found).
```

Também aparecem no console (ruído, não relacionado ao nosso código — pode ignorar na análise,
mas não remover nada relacionado por engano):
- Erros de CORS vindos de `useblackbox.io/tlm` — são de uma extensão do navegador do usuário, 
  não do nosso app.
- `favicon.ico` retornando 404 — corrigir apenas se for rápido (ver Fase 4).

## FASE 1 — Corrigir o erro `auth/configuration-not-found`

1. Verifique no código (`src/lib/firebase.ts` ou equivalente) qual `projectId` e `apiKey` estão
   sendo usados, e confirme que batem exatamente com o projeto Firebase configurado no console
   (`criador-de-curriculos-78079`).
2. Verifique no fluxo de cadastro (componente que chama `createUserWithEmailAndPassword` ou
   similar) exatamente qual método de autenticação está sendo chamado.
3. Documente e me informe, no seu relatório final, qual(is) provedor(es) de login o código
   utiliza (Email/Senha, Google, Telefone, Anônimo, etc.) — preciso habilitar exatamente esses
   provedores no console do Firebase (Authentication > Sign-in method). Não tenho certeza se
   isso já está habilitado, então trate como possível causa raiz mesmo que o código esteja
   correto.
4. Adicione tratamento de erro robusto nesse fluxo: se `error.code === 'auth/configuration-not-found'`
   (ou qualquer erro do Firebase Auth), o botão NUNCA deve travar em "Processando..." para
   sempre. Implemente:
   - Timeout de segurança (ex: 10s) que reseta o estado de loading se a Promise não resolver.
   - Mensagem de erro amigável ao usuário (ex: "Não foi possível criar sua conta agora, tente
     novamente em instantes ou entre com Google.").
   - Log estruturado do erro (ex: `console.error` com contexto) para facilitar debug futuro,
     sem expor detalhes técnicos ao usuário final.

## FASE 2 — Auditoria geral de todas as chamadas assíncronas do app

Faça uma varredura completa no código por TODOS os pontos que podem falhar silenciosamente ou
travar a UI:

1. Liste todas as chamadas a:
   - Firebase Auth (login, cadastro, logout, Google Sign-In)
   - Firestore (leitura/escrita de dados do currículo)
   - Route Handlers próprios (`/api/**`) — IA (OpenAI), pagamento (Mercado Pago), envio de e-mail
   - Fetches externos (ex: ViaCEP, se já implementado)
2. Para cada uma, confirme que existe:
   - `try/catch` (ou `.catch()`) tratando falhas.
   - Estado de loading que É finalizado em caso de erro (não só em caso de sucesso) —
     use `finally` sempre que possível.
   - Feedback visual ao usuário em caso de erro (toast, mensagem inline, etc.), nunca uma
     tela travada ou silenciosa.
3. Verifique especificamente os Route Handlers de IA e pagamento (das fases anteriores já
   implementadas) quanto a:
   - Timeout adequado nas chamadas à API da OpenAI e do Mercado Pago.
   - Tratamento de erro 401/403 (chave inválida/expirada), 429 (rate limit) e 500 (erro do
     provedor), retornando mensagens claras para o frontend.

## FASE 3 — Variáveis de ambiente e configuração

1. Confirme que todas as env vars necessárias (Firebase, OpenAI, Mercado Pago, Admin Email)
   estão configuradas tanto em `.env.local` (dev) quanto no painel da Vercel (Production e
   Preview) — sinalize se encontrar alguma usada no código mas ausente em algum dos dois
   lugares.
2. Confirme novamente que segredos (OPENAI_API_KEY, MERCADO_PAGO_ACCESS_TOKEN) NÃO têm o
   prefixo `NEXT_PUBLIC_` e não são acessados de nenhum componente client.
3. Rode `npm run build` e resolva TODOS os warnings, não apenas erros — inclusive warnings de
   TypeScript, ESLint e de hooks do React (ex: dependências de `useEffect`).

## FASE 4 — Itens menores de qualidade

1. Adicione um `favicon.ico` (ou `icon.png`/`app/icon.png` no padrão do App Router) para
   eliminar o 404 no console.
2. Verifique se há outros assets referenciados no código que não existem no projeto
   (imagens, fontes, ícones) causando 404s silenciosos.
3. Rode uma checagem de acessibilidade básica (labels em inputs, contraste, foco de teclado)
   já que estamos mexendo nos formulários.

## FASE 5 — Teste ponta a ponta de todos os fluxos

Antes de considerar concluído, teste manualmente (ou com script) e reporte o resultado de cada
um:
- [ ] Cadastro com Nome/E-mail/WhatsApp → conta criada com sucesso no Firebase Auth.
- [ ] Login com Google → funciona sem erro.
- [ ] Preenchimento completo do currículo → preview atualiza em tempo real.
- [ ] Botão "Melhorar com IA" → resposta correta, sem expor chave da API no Network tab do
      navegador.
- [ ] Sugestões de habilidades e de objetivo profissional aparecendo.
- [ ] Conclusão do currículo → parabenização → redirecionamento para planos.
- [ ] Seleção de plano → geração de cobrança PIX → confirmação de pagamento → liberação do PDF.
- [ ] Download do PDF com texto selecionável.
- [ ] Console do navegador limpo de erros próprios do app (ignorar ruído de extensões do
      usuário, mas confirmar que não é o nosso app gerando o erro).

## FASE 6 — Build, commit e deploy

```
npm install
npm run build
git add .
git commit -m "fix: corrige auth/configuration-not-found, trata erros assíncronos e elimina 404s"
git push origin main
vercel --prod
```

## FASE 7 — Relatório final

Ao terminar, me entregue um resumo objetivo contendo:
1. Causa raiz confirmada do erro `auth/configuration-not-found` (código, configuração do
   Firebase, ou ambos).
2. Lista de todos os pontos de falha silenciosa que você encontrou e corrigiu na Fase 2.
3. Qualquer ação que EU preciso fazer manualmente no console do Firebase, painel da Vercel ou
   painel do Mercado Pago (você não tem acesso a esses paineis, apenas ao código).
4. Confirmação de que o console do navegador está limpo em produção, com print ou log da
   verificação.

Não presuma nada sobre configurações externas (Firebase console, Vercel dashboard, Mercado
Pago) sem antes me perguntar — apenas aponte o que precisa ser verificado ou ajustado por lá.
