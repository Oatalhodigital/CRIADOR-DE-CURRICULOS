# Prompt CIRÚRGICO para Devin — SEO técnico + 48 páginas programáticas por profissão

## Contexto

O funil de pagamento já foi auditado e estabilizado (rodadas anteriores: integridade de
pagamento, download, analytics, preparação para Google Ads). Agora o objetivo é **tráfego
orgânico gratuito via busca**, para reduzir a dependência de mídia paga.

Auditoria atual encontrou dois problemas de base:

1. **O site não tem nenhuma infraestrutura de SEO técnico.** Não existe `sitemap.xml` nem
   `robots.txt`; toda página (incluindo `/termos-uso`, `/politica-privacidade`,
   `/politica-reembolso`) usa o mesmo `title`/`description` genéricos definidos globalmente em
   `src/app/layout.tsx` ("Criador de Currículos | LS Soluções Digitais" / "Crie currículos
   profissionais otimizados para ATS em minutos com inteligência artificial."); não há tags
   Open Graph/Twitter Card nem dados estruturados (JSON-LD).
2. **Existe um ativo pronto e não aproveitado:** `src/data/professions.ts` já tem 48 profissões
   cadastradas (`professionOptions`), usadas hoje só como opções de um `<select>` no formulário.
   Isso é a base perfeita para páginas de long-tail SEO — gente que busca "currículo para
   enfermeiro" ou "modelo de currículo para técnico de informática" tem intenção de compra muito
   mais alta do que quem só rolou o feed.

Trate isso com o mesmo rigor das correções anteriores: nada de "parece certo", teste de verdade
antes de considerar concluído. Rode `npm run build` após cada mudança. Commits separados por
tarefa. Ao final: push para `main`, deploy de produção, validação no domínio customizado
(`currículorapidocomia.com.br`).

---

## Tarefa 1 — Fundamentos de SEO técnico

1. **`sitemap.xml` dinâmico** via `src/app/sitemap.ts` (App Router do Next.js —
   `MetadataRoute.Sitemap`), incluindo: home, `/termos-uso`, `/politica-privacidade`,
   `/politica-reembolso`, e todas as páginas de profissão criadas na Tarefa 2 (gerar
   dinamicamente a partir de `professionOptions`, não hardcoded). Incluir `lastModified` e
   prioridade relativa (home = 1.0, páginas de profissão = 0.8).
2. **`robots.txt`** via `src/app/robots.ts`, liberando indexação geral e apontando para o
   `sitemap.xml`, mas bloqueando `/admin` e rotas de `/api/*` (não fazem sentido indexadas).
3. **Metadados por página**, usando `generateMetadata` (ou `export const metadata` estático onde
   fizer sentido) em cada rota hoje órfã de metadados próprios: `/termos-uso`,
   `/politica-privacidade`, `/politica-reembolso` — título e descrição específicos de cada uma,
   não o texto genérico herdado do layout raiz.
4. **Open Graph e Twitter Card** no `layout.tsx` (aplicável a todo o site) e sobrescritos por
   página onde fizer sentido (principalmente nas páginas de profissão da Tarefa 2): `og:title`,
   `og:description`, `og:image` (pode reaproveitar/gerar uma imagem genérica de compartilhamento
   se não houver uma pronta — usar `next/og` `ImageResponse` é uma opção válida para gerar OG
   images dinâmicas por profissão sem depender de arquivos estáticos), `og:url`, `twitter:card
   summary_large_image`.
5. **Dados estruturados (JSON-LD)** na home: schema `SoftwareApplication` ou `Service` (o produto é
   um serviço/ferramenta, não gerar schema de e-commerce físico), com nome, descrição, preço e
   moeda (BRL) refletindo o valor real cobrado hoje — confirme o valor atual antes de hardcodar.
6. **Canonical tags** em todas as páginas, usando `NEXT_PUBLIC_APP_URL` como base, para evitar
   conteúdo duplicado entre variações de domínio (com/sem `www`, `http`/`https`).

**Critério de aceite:** `sitemap.xml` e `robots.txt` acessíveis e válidos em produção; cada URL
relevante com título/descrição/OG próprios (validar com a ferramenta de inspeção de URL do Google
Search Console ou similar); JSON-LD validado sem erros (Rich Results Test do Google).

---

## Tarefa 2 — 48 páginas de aterrissagem por profissão (`/curriculo-para/[profissao]`)

Este é o item de maior potencial de tráfego gratuito. Requer cuidado com qualidade de conteúdo —
o Google penaliza conteúdo raso gerado em massa por IA sem valor real (políticas de "scaled
content abuse"), então cada página precisa ter substância real, não um template com a palavra
trocada.

1. **Rota dinâmica:** `src/app/curriculo-para/[slug]/page.tsx`, com `generateStaticParams`
   gerando uma rota para cada entrada de `professionOptions` (slugify o `value`: minúsculas, sem
   acento, espaços viram hífen — ex.: "Técnico de Enfermagem" → `tecnico-de-enfermagem`).
2. **Conteúdo de cada página** (gerar uma vez, revisar, e persistir como dado estruturado — não
   gerar via IA em tempo real a cada visita, por custo, latência e estabilidade de SEO):
   - Título e H1 específicos: "Currículo para [Profissão]: modelo pronto e dicas de quem entende
     de ATS" (ajustar naturalmente por profissão, evitar repetir a fórmula palavra por palavra de
     forma robótica).
   - 3-5 dicas **específicas daquela profissão** (não genéricas de "currículo em geral") — ex.:
     para Enfermeiro, falar de como descrever plantões/procedimentos/COREN; para Desenvolvedor
     Frontend, como citar stack e projetos com métricas de impacto; para Vendedor, como
     quantificar metas batidas. Use o conhecimento de domínio do próprio produto (o site já usa
     OpenAI para melhorar textos de currículo — pode usar isso para gerar um rascunho por
     profissão, mas um humano deve revisar antes de publicar, para garantir que soa real e não
     genérico).
   - 2-3 exemplos de "bullet points" de currículo antes/depois para aquela profissão (mostra valor
     concreto do produto).
   - CTA para criar o currículo já com a profissão pré-selecionada — passar a profissão como query
     param (`/?profissao=enfermeiro`) e usar isso para pré-preencher o campo correspondente no
     formulário (ver `professionOptions` em `ResumeContext`/`PersonalInfoForm.tsx`), reduzindo
     fricção de quem chegou pela busca.
   - Link para 3-5 outras páginas de profissão relacionadas (internal linking — ajuda indexação e
     tempo de permanência).
3. **Metadados e OG por página** (título/descrição únicos por profissão, usando o padrão da
   Tarefa 1).
4. **Performance:** gerar essas páginas como estáticas (`generateStaticParams` + conteúdo
   pré-definido, sem chamada a IA em runtime) para carregarem instantaneamente — Core Web Vitals
   bons aqui contam tanto para SEO quanto para a experiência de quem chegou org anicamente.

**Critério de aceite:** as 48 páginas existem, cada uma com conteúdo distinto e específico da
profissão (não apenas a palavra trocada em um template), estão no sitemap, carregam como
estáticas, e o CTA pré-seleciona a profissão corretamente no formulário — testado manualmente em
pelo menos 5 profissões variadas (uma técnica, uma de saúde, uma criativa, uma administrativa, uma
de segurança/operacional).

---

## Tarefa 3 — Validação final

1. Rodar o site localmente e conferir `/sitemap.xml` e `/robots.txt` no navegador.
2. Validar pelo menos 3 páginas de profissão no Rich Results Test do Google (JSON-LD, se aplicado
   também nelas) e no depurador de compartilhamento (Open Graph) — prints como evidência.
3. Confirmar, após o deploy, que o Google Search Console (se o usuário tiver acesso configurado) ou
   ao menos uma verificação manual (`site:currículorapidocomia.com.br` no Google, alguns dias
   depois) mostra as novas páginas sendo descobertas — isso é um item de acompanhamento pelo
   usuário, não bloqueia a entrega, mas deve ser documentado no relatório final como próximo passo.

## Diretrizes gerais

- Nenhuma página nova pode ter conteúdo raso/duplicado apenas com a palavra da profissão trocada —
  isso é penalizado pelo Google e não ajuda ninguém de verdade. Cada página precisa entregar valor
  real e específico.
- `npm run build` após cada mudança; commits separados por tarefa.
- Ao final: push, deploy de produção, validação no domínio customizado, relatório final com
  evidência (prints do sitemap, robots.txt, Rich Results Test, e a lista das 48 URLs geradas).
