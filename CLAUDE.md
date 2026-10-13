# Motor de conteúdo motion (VisualPro)

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

### Som
- Trilha e SFX sintetizados em código (`scripts/audio.mjs`), salvo se vier uma trilha.
- Hits no grid de beats (`beats.json`). Loudness -14 LUFS.

### Loop antes de mostrar qualquer coisa
1. `node render.mjs <id> --sheet` e OLHE a contact sheet (e quadros em tamanho real com `--frame N`).
2. Nota de 1 a 10: gancho nos 2 primeiros segundos, leitura no celular, qualidade do movimento,
   variedade, fidelidade à marca, sincronia com o som.
3. Corrija os 3 piores problemas. Repita até tudo ficar 8 ou mais.
4. Só então o render final, seguido de `node scripts/check.mjs <id>` (precisa passar inteiro).

## Fluxo de um vídeo novo
O roteiro vem da skill `/copy-video` (tabela "o que aparece na tela" + texto da voz).
Copie `src/videos/teste-motor`, ajuste `brief.json` e `brand.json`, escreva o `Video.tsx`, registre em
`src/videos/registry.ts`, rode `npm run audio -- <id>` e siga o loop.

## Ambiente
- Em servidores sem acesso ao download do navegador do Remotion, `render.mjs` usa `REMOTION_BROWSER`
  ou um headless_shell conhecido. No Mac, o Remotion baixa o dele sozinho.
- Versões do Remotion fixadas em 4.0.535 em todos os pacotes `@remotion/*`; atualize todos juntos.
