# Motor de conteúdo motion

Motor para criar vídeos curtos (Reels, TikTok, Shorts) em [HyperFrames](https://github.com/heygen-com/hyperframes)
(composições de vídeo em HTML, renderizadas localmente). O Remotion foi removido — este
projeto está em migração.

A instrução completa do motor (personalidade, contexto, objetivo e perguntas frequentes)
está em `CLAUDE.md`.

## Estado da migração (17/10/2026)

- ✅ Remotion removido do `package.json`; render/check antigos (`render.mjs`,
  `scripts/check.mjs`) apagados.
- ✅ Banco de áudio próprio (trilha + SFX sintetizados em código) preservado em
  `audio-engine/` como extra opcional — não depende de Remotion nem de HyperFrames pra
  funcionar, é puro Node + ffmpeg.
- ✅ Chrome headless e Whisper (transcrição) resolvidos para renderizar localmente.
- ⏳ **Pendente, precisa de você**: a pasta `src/` ainda tem o código-fonte Remotion dos
  vídeos já feitos (hamburgueria, heb-guincho, ia-direcao, kyneo-proposta-visto,
  gemini-abas, teste-3d, teste-motor). O sistema me impediu de apagar essa pasta inteira
  sem sua confirmação direta — veja a conversa para decidir.
- ⏳ **Pendente**: rodar `npx hyperframes init` pra criar a estrutura real do projeto
  HyperFrames (também precisa de confirmação, mesmo motivo acima).

## Banco de áudio (`audio-engine/`)

Trilha e efeitos sonoros sintetizados por código, sem IA e sem arquivo externo — só ruído
com semente fixa (nunca aleatório). Serve como extra pro HyperFrames: gera um `.wav` com
a trilha e os efeitos a partir de uma lista de "cues" (que efeito toca em qual beat).

```bash
npm run audio -- <id>
```

Guia de timbres disponíveis em `audio-engine/sfx-extra.mjs`.
