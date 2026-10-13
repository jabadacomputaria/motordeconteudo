// Sintetiza trilha + SFX de um vídeo a partir do brief.json, grava o beats.json e normaliza para -14 LUFS.
// Uso: node scripts/audio.mjs <id-do-video>
// Saídas: public/<id>/score.wav e src/videos/<id>/beats.json
// Sem dependências: a medição de loudness (ITU-R BS.1770, em loudness.mjs) e o limitador são feitos em JS.

import fs from 'node:fs';
import path from 'node:path';
import {integratedLufs} from './loudness.mjs';

const SR = 48000;
const TARGET_LUFS = -14;
const CEILING_DB = -1.5; // pico de amostra; margem para picos entre amostras

const id = process.argv[2] || 'teste-motor';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const videoDir = path.join(root, 'src', 'videos', id);
const brief = JSON.parse(fs.readFileSync(path.join(videoDir, 'brief.json'), 'utf8'));
const {bpm, bars, seed = 1, rootHz = 55, progression = [0], drums = true, breakBeats: breaks = []} = brief.music;

const spb = 60 / bpm;
const totalBeats = bars * 4;
const durationSec = totalBeats * spb;
const tailSec = 0; // a trilha termina junto com o vídeo
const N = Math.round((durationSec + tailSec) * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);

// --- utilidades -----------------------------------------------------------
const mulberry32 = (s) => {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const rng = mulberry32(seed);
const noiseBuf = new Float32Array(SR * 2).map(() => rng() * 2 - 1);
const noise = (i) => noiseBuf[i % noiseBuf.length];
const semis = (hz, s) => hz * Math.pow(2, s / 12);

// Adiciona um som começando em t0 (s), com pan em [-1, 1].
const add = (t0, lenSec, fn, gain = 1, pan = 0) => {
  const start = Math.round(t0 * SR);
  const len = Math.round(lenSec * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < len; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    const v = fn(i / SR, i, j);
    L[j] += v * gl;
    R[j] += v * gr;
  }
};

// --- instrumentos ----------------------------------------------------------
const kick = (t0, g = 1) => {
  let ph = 0;
  add(t0, 0.32, (t) => {
    const f = 45 + 105 * Math.exp(-t * 38);
    ph += (2 * Math.PI * f) / SR;
    return Math.sin(ph) * Math.exp(-t * 9) * (t < 0.002 ? t / 0.002 : 1);
  }, 0.9 * g);
};

const hat = (t0, g = 1, pan = 0.25) => {
  let prev = 0;
  add(t0, 0.06, (t, i, j) => {
    const n = noise(j * 7 + 13);
    const hp = n - prev;
    prev = n;
    return hp * Math.exp(-t * 70);
  }, 0.16 * g, pan);
};

const bass = (t0, hz, len) => {
  let ph = 0;
  add(t0, len, (t) => {
    ph += (2 * Math.PI * hz) / SR;
    const env = Math.min(1, t / 0.005) * Math.exp(-t * 5);
    return (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)) * env;
  }, 0.32);
};

const pad = (t0, hz, len) => {
  const notes = [0, 3, 7, 10].map((s) => semis(hz * 4, s));
  add(t0, len, (t) => {
    const env = Math.min(1, t / 0.4) * Math.min(1, (len - t) / 0.3);
    let v = 0;
    notes.forEach((f, k) => (v += Math.sin(2 * Math.PI * f * t + k) * (1 + 0.3 * Math.sin(2 * Math.PI * 0.5 * t + k))));
    return (v / notes.length) * env;
  }, 0.09, 0);
};

// --- SFX ---------------------------------------------------------------
const sfx = {
  tick: (t) => add(t, 0.03, (x) => Math.sin(2 * Math.PI * 3200 * x) * Math.exp(-x * 160), 0.22, 0.1),
  pop: (t) => {
    let ph = 0;
    add(t, 0.12, (x) => {
      ph += (2 * Math.PI * (520 + 700 * Math.exp(-x * 40))) / SR;
      return Math.sin(ph) * Math.exp(-x * 30);
    }, 0.35, -0.1);
  },
  whoosh: (t) => {
    const len = 0.45;
    let lp = 0;
    add(t - 0.3, len, (x, i, j) => {
      const k = 0.02 + 0.25 * Math.sin((Math.PI * x) / len);
      lp += k * (noise(j * 3 + 5) - lp);
      return lp * Math.pow(Math.sin((Math.PI * x) / len), 2);
    }, 0.9, 0);
  },
  thud: (t) => {
    let ph = 0;
    add(t, 0.4, (x) => {
      ph += (2 * Math.PI * (40 + 60 * Math.exp(-x * 20))) / SR;
      return Math.sin(ph) * Math.exp(-x * 7);
    }, 0.8);
  },
  riser: (t) => {
    const len = spb * 2;
    let ph = 0;
    let lp = 0;
    add(t, len, (x, i, j) => {
      const p = x / len;
      ph += (2 * Math.PI * (180 + 900 * p * p)) / SR;
      lp += (0.05 + 0.4 * p) * (noise(j * 11 + 3) - lp);
      return (Math.sin(ph) * 0.5 + lp * 0.8) * p * p;
    }, 0.45);
  },
  hit: (t) => {
    kick(t, 1.2);
    add(t, 0.6, (x, i, j) => noise(j * 5 + 1) * Math.exp(-x * 9), 0.28);
  },
  click: (t) => {
    sfx.tick(t);
    sfx.tick(t + 0.07);
  },
  chime: (t) => add(t, 1.6, (x) => [880, 1320, 1760].reduce((s, f, k) => s + Math.sin(2 * Math.PI * f * x) / (k + 1), 0) * Math.exp(-x * 3), 0.16, 0),
};

// --- arranjo -------------------------------------------------------------
const beats = [];
for (let b = 0; b < totalBeats; b++) beats.push(+(b * spb).toFixed(6));
const barStarts = beats.filter((_, i) => i % 4 === 0);
const breakBeats = new Set(breaks); // beats sem bateria (respiro), definidos no brief.json

for (let b = 0; b < totalBeats; b++) {
  const t = beats[b];
  const bar = Math.floor(b / 4);
  if (drums && !breakBeats.has(b)) kick(t, b % 4 === 0 ? 1 : 0.85);
  if (drums && !breakBeats.has(b) && bar > 0) hat(t + spb / 2, 1, b % 2 ? 0.3 : -0.3);
  const hz = semis(rootHz, progression[bar % progression.length]);
  if (drums && !breakBeats.has(b)) bass(t + spb / 2, hz, spb / 2);
}
barStarts.forEach((t, bar) => pad(t, semis(rootHz, progression[bar % progression.length]), spb * 4));

const cues = (brief.cues || []).map((c) => ({...c, sec: +(c.beat * spb).toFixed(6)}));
for (const c of cues) {
  if (!sfx[c.sfx]) throw new Error(`SFX desconhecido: ${c.sfx}`);
  sfx[c.sfx](c.sec);
}

// Fade curto no fim para não estalar.
const fade = Math.round(0.05 * SR);
for (let i = 0; i < fade; i++) {
  const g = i / fade;
  L[N - 1 - i] *= g;
  R[N - 1 - i] *= g;
}

const peakDb = () => {
  let p = 0;
  for (let i = 0; i < N; i++) p = Math.max(p, Math.abs(L[i]), Math.abs(R[i]));
  return 20 * Math.log10(p);
};

// Limitador com lookahead de 5 ms e release de 60 ms.
const limit = (ceilingDb) => {
  const c = Math.pow(10, ceilingDb / 20);
  const need = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const p = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    need[i] = p > c ? c / p : 1;
  }
  const look = Math.round(0.005 * SR);
  const rel = Math.exp(-1 / (0.06 * SR));
  let g = 1;
  for (let i = 0; i < N; i++) {
    let target = 1;
    for (let k = i; k < Math.min(N, i + look); k++) target = Math.min(target, need[k]);
    g = target < g ? target : target + (g - target) * rel;
    L[i] *= g;
    R[i] *= g;
  }
};

const scale = (db) => {
  const k = Math.pow(10, db / 20);
  for (let i = 0; i < N; i++) {
    L[i] *= k;
    R[i] *= k;
  }
};

for (let pass = 0; pass < 4; pass++) {
  const lufs = integratedLufs(L, R, SR);
  scale(TARGET_LUFS - lufs);
  limit(CEILING_DB);
}
// Garantia final: o limitador pode deixar o pico um fio acima do teto.
if (peakDb() > CEILING_DB) scale(CEILING_DB - peakDb());
const finalLufs = integratedLufs(L, R, SR);

// --- grava WAV 16-bit estéreo ----------------------------------------------
const writeWav = (file) => {
  const buf = Buffer.alloc(44 + N * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + N * 4, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    const d = (rng() - rng()) / 65536; // dither triangular
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((L[i] + d) * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((R[i] + d) * 32767))), 46 + i * 4);
  }
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, buf);
};

const wavPath = path.join(root, 'public', id, 'score.wav');
writeWav(wavPath);

const beatsJson = {bpm, durationSec: +durationSec.toFixed(6), beats, bars: barStarts, cues};
fs.writeFileSync(path.join(videoDir, 'beats.json'), JSON.stringify(beatsJson, null, 2) + '\n');

console.log(`Áudio: ${path.relative(root, wavPath)}`);
console.log(`Duração ${durationSec.toFixed(2)} s · ${totalBeats} beats a ${bpm} BPM · ${cues.length} SFX`);
console.log(`Loudness ${finalLufs.toFixed(2)} LUFS (alvo ${TARGET_LUFS}) · pico ${peakDb().toFixed(2)} dBFS`);
