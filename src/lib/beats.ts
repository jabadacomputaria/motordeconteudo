// Grid de beats: gerado por scripts/audio.mjs (ou medido de uma trilha enviada) e salvo em beats.json.

export type Beats = {
  bpm: number;
  durationSec: number;
  beats: number[]; // segundos de cada beat
  bars: number[]; // segundos do primeiro beat de cada compasso
  cues: {beat: number; sfx: string; sec: number}[];
};

export const toFrame = (sec: number, fps: number) => Math.round(sec * fps);

export const beatFrames = (b: Beats, fps: number) => b.beats.map((s) => toFrame(s, fps));
export const barFrames = (b: Beats, fps: number) => b.bars.map((s) => toFrame(s, fps));

// 1 no frame do beat, caindo exponencialmente depois. Puro: só depende de frame.
export const beatPulse = (frame: number, frames: number[], decayFrames = 6) => {
  let last = -Infinity;
  for (const f of frames) {
    if (f <= frame) last = f;
    else break;
  }
  if (last === -Infinity) return 0;
  return Math.exp(-(frame - last) / decayFrames);
};

// Índice do compasso em que o frame está.
export const barIndexAt = (frame: number, bars: number[]) => {
  let idx = 0;
  for (let i = 0; i < bars.length; i++) if (bars[i] <= frame) idx = i;
  return idx;
};
