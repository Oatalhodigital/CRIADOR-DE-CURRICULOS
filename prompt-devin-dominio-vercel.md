# Prompt para Devin — Atribuir domínio customizado (.com.br com acento) ao projeto na Vercel

## Contexto

O projeto **Criador de Currículos** (Vercel) já está publicado em `criador-de-curriculos.vercel.app` e possui um domínio próprio registrado — algo como `currículorápido.com.ia`/`.com.br` (o nome exato precisa ser confirmado, veja passo 1) — que contém um **caractere acentuado (í)**. Por isso o domínio é um **IDN (Internationalized Domain Name)** e sua forma técnica real (Punycode) é:

```
xn--currculorapidocomia-v4b.com.br
```

Ao tentar conectar esse domínio ao projeto na Vercel, ocorrem os seguintes erros no painel:

```
domains:125 iso_swr: SSR fetch failed for "/api/v9/projects/criador-de-curriculos/domains?limit=91&teamId=oatalhodigitals-projects"
Uncaught Error: Minified React error #418 ...

/api/front-domains/domain-connect/status?domain=xn--currculorapidocomia-v4b.com.br  → 400
/api/front-domains/check-proxy-status?domain=xn--currculorapidocomia-v4b.com.br     → 400
Ignored request error CustomFetchError: Unexpected response: text/plain
"Domain connect record not found"
```

**Link do painel:** https://vercel.com/oatalhodigitals-projects/criador-de-curriculos/settings/domains

O objetivo desta tarefa é diagnosticar e corrigir a atribuição desse domínio ao projeto, garantindo que ele fique **verificado e publicado** corretamente na Vercel.

---

## Diagnóstico esperado (confirmar antes de agir)

Não aplique nenhuma alteração de DNS às cegas. Primeiro confirme:

1. **Qual é o nome exato do domínio pretendido**, com o registro correto de acentuação. O nome que aparece no painel (`CURRÍCULORAPIDOCOMIA.COM.BR`) sugere que o acento pode ter sido inserido/posicionado errado no momento do registro (ex.: o nome desejado provavelmente é algo como `curriculorapido.com.br` **sem** acento, ou `currículo-rápido.com.br` com hífen — o usuário precisa confirmar a grafia pretendida, pois um domínio com acento é raro e pouco recomendado para uso comercial).
2. **Onde o domínio foi registrado.** Domínios `.br` são registrados obrigatoriamente via **Registro.br**. Acesse https://registro.br e localize o domínio na conta do usuário para confirmar: status do registro, servidores DNS (NS) atualmente configurados, e se o registro está realmente ativo (não pendente de pagamento/liberação).
3. Se o domínio no Registro.br está escrito de forma diferente da forma Punycode que a Vercel está tentando validar (`xn--currculorapidocomia-v4b.com.br`), **isso pode ser a causa raiz do erro 400 "Domain connect record not found"** — ou seja, a Vercel está tentando validar um domínio que não corresponde exatamente ao que está registrado/delegado.

Documente esse diagnóstico antes de prosseguir para a correção.

---

## Passo a passo para atribuir o domínio corretamente

### 1. Confirmar/corrigir a grafia do domínio
- Se a grafia pretendida for diferente da atual, corrigir primeiro o registro no Registro.br (ou registrar o domínio correto) antes de tentar conectar na Vercel. Não adianta configurar DNS para um domínio com grafia errada.
- Se a grafia com acento for realmente a pretendida, ter em mente que **todo lugar em que o domínio for usado externamente (ex.: em e-mails, anúncios, redes sociais)** deve usar a forma correta — muitos usuários não conseguem digitar o "í" no navegador, então avaliar com o usuário se não é preferível usar a versão sem acento como domínio principal e o com acento apenas como redirect.

### 2. Adicionar o domínio no painel do projeto (se ainda não estiver salvo corretamente)
- Em **Vercel → criador-de-curriculos → Settings → Domains**, remover qualquer entrada inconsistente/quebrada do domínio problemático (se houver uma entrada "presa" em estado de erro) e adicioná-lo novamente, digitando o domínio na sua forma normal (a Vercel converte automaticamente para Punycode internamente — não é necessário digitar a forma `xn--...` manualmente).
- Adicionar tanto a versão com `www.` quanto sem `www.`, conforme a preferência do usuário, configurando um redirecionamento de uma para a outra (a Vercel oferece essa opção automaticamente ao adicionar as duas).

### 3. Configurar o DNS no Registro.br
A Vercel vai indicar, ao adicionar o domínio, um dos dois métodos abaixo — seguir o que a própria Vercel recomendar na tela:
- **Método A — Registro A/CNAME (domínio apex):** apontar o registro `A` do domínio raiz para o IP da Vercel (`76.76.21.21`) e o `CNAME` do subdomínio `www` para `cname.vercel-dns.com.`.
- **Método B — Delegação de Nameservers (recomendado pela Vercel quando disponível):** alterar os Nameservers (NS) do domínio no Registro.br para os nameservers da Vercel, permitindo que a própria Vercel gerencie o DNS.
- Essas alterações são feitas no painel do **Registro.br**, na seção de gerenciamento de DNS do domínio — **não** no painel da Vercel.

### 4. Aguardar propagação e validar
- Propagação de DNS para domínios `.br` pode levar de alguns minutos até 24-48h.
- Verificar o status de propagação usando uma ferramenta como `https://dnschecker.org` para o domínio em questão.
- Retornar ao painel da Vercel (Settings → Domains) e confirmar que o domínio passa a exibir status **"Valid Configuration"** / verificado, sem o erro 400 anterior.

### 5. Investigar e reportar o erro de React (separado do problema de DNS)
- O erro `Uncaught Error: Minified React error #418` é um **erro de hidratação (hydration mismatch)** do painel da própria Vercel (não do projeto do usuário) — geralmente causado por cache do navegador ou extensões interferindo no DOM antes da hidratação do React.
- Ação recomendada: testar em aba anônima/outro navegador, limpar cache, e desabilitar extensões do navegador (ex.: bloqueadores de anúncio/tradutores automáticos) ao acessar o painel da Vercel. Isso não deve bloquear a configuração do domínio, mas deixar registrado no diagnóstico caso persista, para reportar ao suporte da Vercel se necessário.

### 6. Confirmar SSL
- Após o domínio ficar validado, confirmar que a Vercel emitiu automaticamente o certificado SSL (Let's Encrypt) para o domínio e que o acesso via `https://` está funcionando sem avisos de certificado inválido.

### 7. Atualizar referências no projeto
- Depois do domínio validado, atualizar (se aplicável) variáveis de ambiente que dependem da URL de produção (ex.: `NEXT_PUBLIC_SITE_URL`, `authDomain` do Firebase — lembrando de também adicionar esse novo domínio customizado na lista de **Authorized domains** do Firebase Authentication, senão o login com Google volta a quebrar nesse novo domínio) e URLs de callback/webhook do Mercado Pago, se usadas.

---

## Critério de aceite

- O domínio customizado (com a grafia definitivamente confirmada pelo usuário) aparece como **verificado/válido** no painel da Vercel, sem erros 400.
- O site carrega corretamente em `https://` pelo novo domínio, com certificado SSL válido.
- Login com Google e demais integrações (Firebase, Mercado Pago) continuam funcionando normalmente também através do novo domínio.

---

## Observação importante para o usuário (reportar de volta antes de executar)

Antes de o Devin agir, é recomendável confirmar com o usuário **qual é exatamente a grafia correta do domínio pretendido**, já que o nome atual (`CURRÍCULORAPIDOCOMIA.COM.BR`) parece ter um erro de digitação/registro (falta separação entre "currículo", "rápido" e "com.br" sugere que o domínio pode ter sido registrado errado, ex. deveria ser `curriculorapido.com.br` sem acento e mais legível). Corrigir a causa raiz (grafia do domínio) evita ter que repetir esse processo de configuração de DNS novamente depois.
