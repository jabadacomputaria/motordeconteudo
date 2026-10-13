# Motor de conteúdo motion

Motor para criar vídeos curtos (Reels, TikTok, Shorts) em código, com o [Remotion](https://www.remotion.dev).
Cada vídeo é um arquivo de cenas em React, com trilha e efeitos sonoros sintetizados por código e um processo
de revisão obrigatório antes do render final.

## O fluxo de um vídeo

1. **Roteiro:** rode a skill `/copy-video` no Claude. Ela devolve gancho, copy, tabela "o que aparece na tela" e texto da voz.
2. **Cenas:** a tabela vira um `Video.tsx` (o Claude escreve; você não precisa programar).
3. **Áudio:** `npm run audio -- <id>` gera a trilha, os efeitos e o grid de beats (`beats.json`), já em -14 LUFS.
4. **Revisão:** `npm run sheet -- <id>` gera a contact sheet (um quadro por beat). Nota de 1 a 10 em seis critérios: gancho nos 2 primeiros segundos, leitura no celular, movimento, variedade, marca e sincronia. Corrige os 3 piores e repete até tudo ficar 8 ou mais.
5. **Render final:** `npm run render -- <id>` gera `out/<id>.mp4` (H.264, yuv420p, CRF 16).
6. **Conferência:** `npm run check -- <id>` confere formato, loudness e se os golpes caem no beat.

## Primeira vez no seu Mac

Precisa do Node.js 20 ou mais novo instalado.

```bash
git clone https://github.com/jabadacomputaria/motordeconteudo.git
cd motordeconteudo
npm install
npm run studio        # abre o Remotion Studio no navegador para ver os vídeos
```

Na primeira vez que renderizar, o Remotion baixa sozinho o navegador que usa para desenhar os quadros.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run studio` | Abre o preview interativo (Remotion Studio) |
| `npm run audio -- teste-motor` | Sintetiza trilha + SFX, grava `beats.json`, normaliza para -14 LUFS |
| `npm run sheet -- teste-motor` | Contact sheet em `out/teste-motor-sheet.png` |
| `node render.mjs teste-motor --frame 120` | Um quadro em tamanho real, para checar leitura |
| `npm run render -- teste-motor` | Render final em `out/teste-motor.mp4` |
| `npm run check -- teste-motor` | Confere o MP4, o loudness e a sincronia |

## Estrutura

```
src/
  index.ts, Root.tsx         registro das composições (vídeo + contact sheet de cada um)
  ContactSheet.tsx           grade com o vídeo em cada beat
  lib/
    noise.ts                 ruído com seed (mulberry32); nunca Math.random
    brand.ts                 tipo da marca e carregamento das fontes
    beats.ts                 grid de beats → frames, pulso no beat
    anim.ts                  molas e easings puros (função do frame)
    Headline.tsx             título que sobe por máscara (sem fade)
  videos/
    registry.ts              lista de vídeos
    teste-motor/             vídeo-teste
      brief.json             formato, música (BPM, compassos), SFX por beat
      brand.json             cores e fontes DESTE vídeo
      beats.json             gerado pelo npm run audio
      Video.tsx              as cenas
public/
  fonts/                     arquivos de fonte (woff2)
  <id>/score.wav             trilha gerada
scripts/
  audio.mjs                  síntese + loudness
  loudness.mjs               medidor ITU-R BS.1770 (LUFS)
  check.mjs                  conferência final
render.mjs                   contact sheet, quadro avulso e render final
```

## Vídeo novo

1. Copie `src/videos/teste-motor` para `src/videos/<novo-id>` e troque o `id` no `brief.json`.
2. Ajuste `brand.json` com as cores e fontes do cliente. A marca muda por vídeo de propósito.
3. Ajuste a música no `brief.json`: `bpm`, `bars` (compassos) e `cues` (que efeito sonoro toca em qual beat).
4. Reescreva o `Video.tsx` a partir da tabela da copy.
5. Registre o vídeo em `src/videos/registry.ts`.
6. Siga o fluxo acima.

Fonte nova: instale o pacote `@fontsource/<nome>` pelo npm, copie os `.woff2` para `public/fonts/` e aponte no `brand.json`.

## Ainda não feito

- **Narração (voz do ElevenLabs) no vídeo:** hoje só entram trilha e SFX. Falta incluir o arquivo da voz e baixar a trilha quando a voz fala.
- **Trilha enviada pronta:** o `beats.json` hoje vem da trilha sintetizada. Para uma música enviada, falta o detector que mede o grid.

## Licença do Remotion

Gratuito para pessoa física e empresas com até 3 funcionários. Acima disso exige a Company License.
Ver https://www.remotion.dev/docs/license
