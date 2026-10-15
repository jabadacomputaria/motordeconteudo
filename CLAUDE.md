# Motor de conteúdo motion

Projeto Remotion para vídeos curtos verticais. O dono (Juan) não programa: explique em português simples,
sem jargão, e entregue o vídeo pronto, não instruções.

## Regras do estúdio (valem sempre)

### Contrato de render
- Todo filme é função pura do tempo. No Remotion: tudo deriva de `useCurrentFrame()` (ou da prop `frame`,
  que é o equivalente a `window.seek(t)` e é usada pela contact sheet). `t = frame / fps`.
- Proibido: CSS transitions, setTimeout/setInterval, requestAnimationFrame, useState/useEffect para animar,
  estado entre frames. Ruído só com seed (`src/lib/noise.ts`, mulberry32), nunca `Math.random`.
- Render com `node render.mjs <id>`: H.264, yuv420p (bt709), CRF 16, AAC 320k.

### Visual
- Proibido: título centralizado sobre gradiente, tudo entrando com fade, rótulos de canto e bordas no quadro,
  glow em interface, explosão genérica de partículas.
- Uma fonte de título e uma de interface. Uma cor de destaque, salvo se o brief pedir outra coisa.
- A marca vem do `brand.json` de cada vídeo (muda por vídeo).
- A cada 2 a 4 segundos algo novo acontece na tela. Um objeto herói fica no vídeo inteiro e muda de estado.
- Texto principal grande o bastante para ler no celular; conteúdo importante fora dos ~300 px de baixo (interface do Reels).
- Palavra em máscara (sobe por trás de um corte) precisa de `white-space: nowrap` e caber na largura: se quebrar
  linha, a máscara fica alta e o texto escondido aparece. Cuidado com Ç e acentos cortados pela máscara ou pelo objeto.

### 3D (objeto que precisa parecer de verdade)
- Comida, produto, metal, vidro: vetor chapado dá "cara de desenho". Faça o objeto herói em 3D com `src/lib/three`:
  `Stage3D` (câmera, reflexo de ambiente, sombra suave), `StudioLights` (luz principal quente, contraluz, preenchimento;
  `lit` acende/apaga) e `materials.ts` (texturas com semente, sólidos de revolução, cores por vértice, corte de mordida).
  Exemplo pronto: `src/videos/teste-3d` (cadeado de metal que cai, abre e a luz acende).
- Continua função pura do frame: calcule posição, ângulo e câmera (`camAt`) a partir do frame e passe por props.
  Proibido `useFrame`, relógio ou animação interna do three.
- O que funcionou: silhueta no escuro que acende no beat (revelação), objeto que se desmonta e as peças caem uma a uma,
  material derretendo por deformação de vértices, câmera que aproxima em keyframes, tremida curta no impacto.
- Render do 3D: rápido no Mac (placa de vídeo); em servidor sem placa é bem mais lento. `render.mjs` escolhe sozinho
  (`REMOTION_GL` força: `angle` ou `swangle`).

### Som
- Trilha e SFX sintetizados em código (`scripts/audio.mjs`), salvo se vier uma trilha.
- Hits no grid de beats (`beats.json`). Loudness -14 LUFS.
- Um som por acontecimento, com timbre que combina com o que aparece (cadeado = metal, carimbo, folhas, mensagem
  chegando, crocância...). A lista com o guia está em `scripts/sfx-extra.mjs`.
- Não repetir som de transição: whoosh/swish/zip no máximo 1 vez por vídeo e nenhum som mais de 3 vezes
  (o `audio.mjs` avisa e o `check.mjs` reprova). Baixar o volume NÃO resolve repetição: troque o som.
- Nem todo corte precisa de som. Para um golpe importante, ponha um cue `hush` no mesmo beat: a trilha some
  ~0,6 s antes e volta no impacto.

### Loop antes de mostrar qualquer coisa
1. `node render.mjs <id> --sheet` e OLHE a contact sheet (e quadros em tamanho real com `--frame N`).
2. Nota de 1 a 10: gancho nos 2 primeiros segundos, leitura no celular, qualidade do movimento,
   variedade, fidelidade à marca, sincronia com o som.
3. Corrija os 3 piores problemas. Repita até tudo ficar 8 ou mais.
4. Só então o render final, seguido de `node scripts/check.mjs <id>` (precisa passar inteiro: formato, volume,
   sincronia e variedade de sons).

## Fluxo de um vídeo novo
O roteiro vem da skill `/copy-video` (tabela "o que aparece na tela" + texto da voz).
Copie `src/videos/teste-motor`, ajuste `brief.json` e `brand.json`, escreva o `Video.tsx`, registre em
`src/videos/registry.ts`, rode `npm run audio -- <id>` e siga o loop.

## Ambiente
- Em servidores sem acesso ao download do navegador do Remotion, `render.mjs` usa `REMOTION_BROWSER`
  ou um headless_shell conhecido. No Mac, o Remotion baixa o dele sozinho.
- Versões do Remotion fixadas em 4.0.535 em todos os pacotes `@remotion/*`; atualize todos juntos.
