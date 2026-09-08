# Adicionar vídeo demonstrativo na página inicial (hero)

## Contexto

Vou anexar dois arquivos a este prompt:
- `demo-curriculo-homepage.mp4` — vídeo de ~16 segundos, sem áudio, 1280×720, ~600KB.
- `demo-poster.jpg` — imagem de capa (poster) para exibir antes do vídeo carregar/tocar.

O vídeo é uma **animação ilustrativa do fluxo real do produto** (preenchimento de dados, prévia do currículo em tempo real, avanço pelas etapas, tela de "Currículo pronto!"), feita com a marca, cores, textos e preços reais do site — **não é uma gravação de tela do produto em produção**. Serve para o visitante entender rapidamente como funciona antes de clicar em "Criar Meu Currículo Agora". Se no futuro vocês quiserem trocar por uma gravação de tela real do fluxo em produção, basta substituir o arquivo mantendo o mesmo nome/caminho — não é necessário agora.

## O que fazer

### 1. Adicionar os arquivos ao projeto

Coloque os dois arquivos em `public/videos/`:
- `public/videos/demo-curriculo.mp4`
- `public/videos/demo-poster.jpg`

### 2. Inserir o vídeo na página inicial

Adicione um bloco de vídeo na home, próximo ao hero (ao lado ou logo abaixo do headline/CTA "Criar Meu Currículo Agora" — o objetivo é o visitante ver rapidamente como o currículo é montado antes de decidir clicar). Use algo equivalente a:

```tsx
<video
  className="demo-video" // estilizar: max-width 100%, aspect-ratio 16/9, border-radius e sombra consistentes com o design system existente
  poster="/videos/demo-poster.jpg"
  autoPlay
  muted
  loop
  playsInline
  preload="metadata"
  aria-label="Demonstração de como criar um currículo no site"
>
  <source src="/videos/demo-curriculo.mp4" type="video/mp4" />
</video>
```

Pontos importantes de implementação:

- **`muted` + `playsInline` são obrigatórios** para autoplay funcionar no Safari/iOS — sem os dois juntos, o autoplay é bloqueado silenciosamente em iPhone.
- **`loop`** para repetir continuamente (o vídeo tem ~16s, curto o suficiente para loop não incomodar).
- **Sem controles visíveis** (não usar o atributo `controls`) já que é decorativo/ilustrativo e não tem áudio — mas considere adicionar um botão discreto de play/pause se o design permitir, para acessibilidade e para usuários que preferem controlar a reprodução.
- **`preload="metadata"`** em vez de `"auto"`, para não competir com o carregamento inicial da página em conexões móveis.
- **Reproduzir só quando visível**: implemente um `IntersectionObserver` simples que só chama `.play()` quando o vídeo entra no viewport e `.pause()` quando sai — evita gastar dados/CPU do visitante com um vídeo tocando fora de tela, especialmente em mobile.
- **Fallback**: se o navegador não suportar o vídeo (raro, mas mobile antigo/dados ultra-limitados), o `poster` já cobre isso — a imagem estática aparece no lugar.
- **Responsivo**: em mobile, considere posicionar o vídeo abaixo do headline/CTA (empilhado), não ao lado, para não espremer o texto.

### 3. Performance

- O arquivo já está otimizado (H.264, faststart, ~600KB) — não deveria impactar o Lighthouse/Core Web Vitals de forma perceptível, mas confirme com um Lighthouse run antes/depois no mobile.
- Confirme que o vídeo não causa layout shift (CLS): reserve o espaço dele no layout (ex.: `aspect-ratio: 16/9` no container) antes do vídeo carregar, para que o `poster` já ocupe o espaço final.

## Teste obrigatório antes de considerar concluído

1. Abrir a home em iPhone real (ou emulador Safari iOS) e confirmar que o vídeo toca automaticamente, mudo, em loop.
2. Abrir em Android/Chrome e confirmar o mesmo comportamento.
3. Rolar a página para longe do vídeo e confirmar (via DevTools/Performance) que ele pausa quando sai do viewport, e volta a tocar ao rolar de volta.
4. Rodar Lighthouse mobile na home antes e depois da mudança — confirmar que a pontuação de Performance não caiu de forma relevante.
5. Confirmar visualmente que não há deslocamento de layout (CLS) quando o vídeo carrega.

## Ao final

Atualize `RELATORIO-CORRECOES-FUNIL.md` (ou o changelog equivalente do projeto) registrando a adição do vídeo demonstrativo na home.
