// Sintetiza trilha + SFX de um vídeo a partir do brief.json, grava o beats.json e normaliza para -14 LUFS.
// Uso: node scripts/audio.mjs <id-do-video>
// Saídas: public/<id>/score.wav e src/videos/<id>/beats.json
// Sem dependências: a medição de loudness (ITU-R BS.1770, em loudness.mjs) e o limitador são feitos em JS.

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {integratedLufs} from './loudness.mjs';
import {extraSfx} from './sfx-extra.mjs';

const SR = 48000;
const TARGET_LUFS = -14;
const CEILING_DB = -1.5; // pico de amostra; margem para picos entre amostras

const id = process.argv[2] || 'teste-motor';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const videoDir = path.join(root, 'src', 'videos', id);
const brief = JSON.parse(fs.readFileSync(path.join(videoDir, 'brief.json'), 'utf8'));
const {bpm, bars, seed = 1, rootHz = 55, progression = [0], drums = true, pad: padOn = true, breakBeats: breaks = [], kickPattern = [1, 0.85, 0.85, 0.85]} = brief.music;

const spb = 60 / bpm;
const totalBeats = bars * 4;
const scoreSec = totalBeats * spb;

// Áudio externo (voz do ElevenLabs e vinheta/assinatura no fim), decodificado pelo ffmpeg.
const decode = (rel) => {
  const file = path.join(root, 'public', rel);
  const args = ['-v', 'error', '-i', file, '-vn', '-ac', '2', '-ar', String(SR), '-f', 'f32le', '-'];
  let raw;
  try {
    raw = execFileSync('ffmpeg', args, {maxBuffer: 1 << 30});
  } catch {
    raw = execFileSync('npx', ['remotion', 'ffmpeg', ...args], {maxBuffer: 1 << 30, cwd: root});
  }
  const f = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
  const n = f.length / 2;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    l[i] = f[2 * i];
    r[i] = f[2 * i + 1];
  }
  return {l, r, sec: n / SR};
};
const voice = brief.voice ? decode(brief.voice.src) : null;
const tail = brief.tail ? decode(brief.tail.src) : null;
const tailAt = tail ? brief.tail.atBeat * spb : 0;
if (voice && voice.sec + (brief.voice.offsetSec || 0) > (tail ? tailAt : scoreSec) + 0.05) {
  console.warn(`Atenção: a voz (${voice.sec.toFixed(2)} s) passa do fim da trilha; aumente "bars" no brief.`);
}
// Com assinatura no fim, a trilha para quando ela começa e o vídeo dura até o fim dela.
const durationSec = tail ? tailAt + tail.sec : scoreSec;
const musicSec = tail ? tailAt : scoreSec;
const N = Math.round(durationSec * SR);
const NM = Math.round(musicSec * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
// Efeitos (SFX) num canal separado: não descem junto com a trilha embaixo da voz.
const SFL = new Float32Array(N);
const SFR = new Float32Array(N);
let toSfx = false;
let cueGain = 1;

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
    if (toSfx) {
      SFL[j] += v * gl * cueGain;
      SFR[j] += v * gr * cueGain;
    } else {
      L[j] += v * gl;
      R[j] += v * gr;
    }
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
    let sub = 0;
    let sub2 = 0;
    // Termina no beat: o pico vem antes e o golpe do bumbo fica limpo.
    add(t - len, len, (x, i, j) => {
      const k = 0.02 + 0.25 * Math.sin((Math.PI * x) / len);
      lp += k * (noise(j * 3 + 5) - lp);
      // Tira o grave abaixo de ~250 Hz (dois estágios): o whoosh não pode ser confundido com o bumbo do beat.
      sub += 0.033 * (lp - sub);
      const h1 = lp - sub;
      sub2 += 0.033 * (h1 - sub2);
      return (h1 - sub2) * Math.pow(Math.sin((Math.PI * x) / len), 2);
    }, 1.2, 0);
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
  type: (t) => {
    // Digitação: cliques curtos e irregulares (seed) durante dois beats.
    const r = mulberry32(seed * 31 + Math.round(t * 1000));
    let x = 0;
    while (x < spb * 2) {
      const f = 2400 + r() * 1800;
      add(t + x, 0.025, (y) => Math.sin(2 * Math.PI * f * y) * Math.exp(-y * 220), 0.12 + r() * 0.06, r() * 0.4 - 0.2);
      x += 0.07 + r() * 0.08;
    }
  },
  clap: (t) => {
    // Claquete: estalo seco de madeira (ruído curto e brilhante) com um baque grave por baixo.
    let lp = 0;
    add(t, 0.05, (x, i, j) => {
      const n = noise(j * 17 + 7);
      lp += 0.5 * (n - lp);
      return (n - lp) * Math.exp(-x * 90);
    }, 1.1, 0);
    let ph = 0;
    add(t, 0.12, (x) => {
      ph += (2 * Math.PI * (180 + 120 * Math.exp(-x * 60))) / SR;
      return Math.sin(ph) * Math.exp(-x * 35);
    }, 0.6);
  },
  slash: (t) => {
    // Corte: varrida rápida de ruído agudo.
    const len = 0.16;
    let prev = 0;
    add(t - 0.04, len, (x, i, j) => {
      const n = noise(j * 23 + 11);
      const hp = n - prev;
      prev = n;
      const env = Math.sin((Math.PI * x) / len);
      return hp * env * env;
    }, 0.55, 0.2);
  },
  clank: (t) => {
    // Metal travando: parciais inarmônicos agudos (aço) com um estalo curto na frente.
    const parts = [[1180, 1], [1730, 0.7], [2610, 0.5], [3390, 0.35]];
    for (const [hz, g] of parts) add(t, 0.35, (x) => Math.sin(2 * Math.PI * hz * x) * Math.exp(-x * (14 + hz / 300)), 0.16 * g, 0.15);
    let prev = 0;
    add(t, 0.02, (x, i, j) => {
      const n = noise(j * 41 + 9);
      const hp = n - prev;
      prev = n;
      return hp * Math.exp(-x * 200);
    }, 0.8, 0.1);
  },
  ratchet: (t) => {
    // Catraca de guincho: estalos regulares e secos durante um beat.
    const n = Math.max(4, Math.round(spb / 0.045));
    for (let k = 0; k < n; k++) {
      add(t + k * (spb / n), 0.02, (x) => Math.sin(2 * Math.PI * 1900 * x) * Math.exp(-x * 260), 0.14 * (1 - (k / n) * 0.4), k % 2 ? 0.2 : -0.2);
    }
  },
  flip: (t) => {
    // Folhas de calendário: três raspadas curtas de papel.
    for (let k = 0; k < 3; k++) {
      let lp = 0;
      add(t + k * 0.07, 0.05, (x, i, j) => {
        const n = noise(j * 29 + k * 101);
        lp += 0.3 * (n - lp);
        return lp * Math.exp(-x * 60);
      }, 0.5, k % 2 ? 0.25 : -0.25);
    }
  },
  crunch: (t) => {
    // Mordida crocante: estalos curtos e irregulares de ruído brilhante, por cerca de 0,3 s.
    const r = mulberry32(seed * 13 + Math.round(t * 1000));
    let x = 0;
    while (x < 0.38) {
      let prev = 0;
      const g = (0.5 + r() * 0.5) * (1 - x / 0.45);
      add(t + x, 0.03, (y, i, j) => {
        const n = noise(j * 37 + 3);
        const hp = n - prev;
        prev = n;
        return hp * Math.exp(-y * 120);
      }, 4.5 * g, r() * 0.5 - 0.25);
      x += 0.01 + r() * 0.025;
    }
    // corpo da mordida: um baque curto e abafado por baixo dos estalos
    let ph = 0;
    add(t, 0.12, (y) => {
      ph += (2 * Math.PI * (260 + 120 * Math.exp(-y * 40))) / SR;
      return Math.sin(ph) * Math.exp(-y * 30);
    }, 0.5);
  },
  moto: (t) => {
    // Moto passando: ronco médio que sobe e se afasta (sem grave, para não virar bumbo).
    const len = spb * 3;
    let ph = 0;
    let lp = 0;
    add(t, len, (x) => {
      const p = x / len;
      const f = 150 + 90 * Math.sin(Math.PI * p);
      ph += (2 * Math.PI * f) / SR;
      const saw = ((ph / (2 * Math.PI)) % 1) * 2 - 1;
      lp += 0.08 * (saw - lp);
      return (saw - lp) * Math.sin(Math.PI * p) * (0.85 + 0.15 * Math.sin(2 * Math.PI * 28 * x));
    }, 0.22, 0);
  },
  chime: (t) => add(t, 1.6, (x) => [880, 1320, 1760].reduce((s, f, k) => s + Math.sin(2 * Math.PI * f * x) / (k + 1), 0) * Math.exp(-x * 3), 0.16, 0),
};
// Sons com contexto (scripts/sfx-extra.mjs): um timbre por acontecimento na tela.
for (const [name, fn] of Object.entries(extraSfx({add, SR, noise, mulberry32}))) {
  if (sfx[name]) throw new Error(`SFX duplicado: ${name}`);
  sfx[name] = fn;
}

// --- arranjo -------------------------------------------------------------
const beats = [];
for (let b = 0; b < totalBeats; b++) beats.push(+(b * spb).toFixed(6));
const barStarts = beats.filter((_, i) => i % 4 === 0);
const breakBeats = new Set(breaks); // beats sem bateria (respiro), definidos no brief.json

for (let b = 0; b < totalBeats; b++) {
  const t = beats[b];
  const bar = Math.floor(b / 4);
  const kg = kickPattern[b % kickPattern.length];
  if (drums && !breakBeats.has(b) && kg > 0) kick(t, kg);
  if (drums && !breakBeats.has(b) && bar > 0) hat(t + spb / 2, 1, b % 2 ? 0.3 : -0.3);
  const hz = semis(rootHz, progression[bar % progression.length]);
  if (drums && !breakBeats.has(b)) bass(t + spb / 2, hz, spb / 2);
}
// pad:false + drums:false no brief = vídeo só de efeitos (sem trilha musical).
if (padOn) barStarts.forEach((t, bar) => pad(t, semis(rootHz, progression[bar % progression.length]), spb * 4));

const cues = (brief.cues || []).map((c) => ({...c, sec: +(c.beat * spb).toFixed(6)}));

// Respiro: num cue "hush" a trilha some nos ~0,6 s antes do beat e volta no golpe (destaca o impacto).
for (const c of cues.filter((c) => c.sfx === 'hush')) {
  const a = c.sec - 0.62;
  for (let i = Math.max(0, Math.round((a - 0.08) * SR)); i < Math.min(N, Math.round((c.sec + 0.05) * SR)); i++) {
    const t = i / SR;
    const down = Math.min(1, Math.max(0, (t - (a - 0.08)) / 0.08));
    const up = Math.min(1, Math.max(0, (t - c.sec) / 0.05));
    const g = 1 - 0.9 * down * (1 - up);
    L[i] *= g;
    R[i] *= g;
  }
}

// Variedade: o mesmo som repetido cansa (e baixar o volume não resolve). Avisa antes de render.
{
  const count = {};
  for (const c of cues) if (c.sfx !== 'hush') count[c.sfx] = (count[c.sfx] || 0) + 1;
  const many = Object.entries(count).filter(([k, n]) => n > 3 || (['whoosh', 'swish', 'zip'].includes(k) && n > 1));
  if (many.length) console.warn(`Atenção, sons repetidos demais: ${many.map(([k, n]) => `${k} x${n}`).join(', ')}. Troque por sons com contexto (veja scripts/sfx-extra.mjs).`);
}
toSfx = true;
// Volume por tipo de efeito (brief.sfxLevels, em dB, ex.: {"whoosh": -9}) e por cue (campo "db").
const sfxLevels = brief.sfxLevels || {};
for (const c of cues) {
  if (!sfx[c.sfx]) throw new Error(`SFX desconhecido: ${c.sfx}`);
  cueGain = Math.pow(10, ((sfxLevels[c.sfx] ?? 0) + (c.db ?? 0)) / 20);
  sfx[c.sfx](c.sec);
}
cueGain = 1;
toSfx = false;

// Fade curto no fim da trilha para não estalar; depois dela, silêncio (a assinatura tem som próprio).
const fade = Math.round(0.05 * SR);
for (let i = 0; i < fade; i++) {
  const g = i / fade;
  L[NM - 1 - i] *= g;
  R[NM - 1 - i] *= g;
}
for (let i = NM; i < N; i++) L[i] = R[i] = 0;
for (let i = NM; i < N; i++) SFL[i] = SFR[i] = 0;

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

const normalize = () => {
  for (let pass = 0; pass < 4; pass++) {
    const lufs = integratedLufs(L, R, SR);
    scale(TARGET_LUFS - lufs);
    limit(CEILING_DB);
  }
};
const comb = (a, b2) => {
  const o = new Float32Array(N);
  for (let i = 0; i < N; i++) o[i] = a[i] + b2[i];
  return o;
};
// Trilha + efeitos no mesmo nível de antes (-14 LUFS juntos).
{
  const k0 = Math.pow(10, (TARGET_LUFS - integratedLufs(comb(L, SFL), comb(R, SFR), SR)) / 20);
  for (let i = 0; i < N; i++) {
    L[i] *= k0;
    R[i] *= k0;
    SFL[i] *= k0;
    SFR[i] *= k0;
  }
}
// Trilha + efeitos juntos (stem): é nela que o check mede a sincronia dos golpes com o grid.
const stemL = comb(L, SFL);
const stemR = comb(R, SFR);
{
  let pk = 0;
  for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(stemL[i]), Math.abs(stemR[i]));
  if (pk > 0.89) for (let i = 0; i < N; i++) (stemL[i] *= 0.89 / pk), (stemR[i] *= 0.89 / pk);
}

if (voice || tail) {
  // A trilha fica por baixo da voz: desce duckDb dB enquanto ela fala e volta nos respiros.
  const gainOf = (db) => Math.pow(10, db / 20);
  const bedDb = brief.voice?.bedDb ?? -4; // nível da trilha nos respiros, em relação à voz
  const duck = new Float32Array(N).fill(1);
  if (voice) {
    const off = Math.round((brief.voice.offsetSec || 0) * SR);
    const win = Math.round(0.02 * SR);
    const env = new Float32Array(N);
    for (let s0 = 0; s0 < voice.l.length; s0 += win) {
      let sum = 0;
      for (let i = s0; i < Math.min(voice.l.length, s0 + win); i++) sum += voice.l[i] * voice.l[i] + voice.r[i] * voice.r[i];
      const db = 10 * Math.log10(sum / (2 * win) + 1e-12);
      for (let i = s0; i < s0 + win; i++) if (off + i < N) env[off + i] = db > -45 ? 1 : 0;
    }
    // Ataque rápido (40 ms) e volta lenta (350 ms), com lookahead de 60 ms para descer antes da sílaba.
    const target = gainOf(brief.voice.duckDb ?? -8);
    const look = Math.round(0.06 * SR);
    const att = Math.exp(-1 / (0.04 * SR));
    const rel = Math.exp(-1 / (0.35 * SR));
    let g = 1;
    let active = 0;
    for (let i = 0; i < N; i++) {
      if (i + look < N && env[i + look]) active = Math.round(0.12 * SR);
      else if (active > 0) active--;
      const want = active > 0 ? target : 1;
      g = want < g ? want + (g - want) * att : want + (g - want) * rel;
      duck[i] = g;
    }
    // Voz normalizada sozinha, depois somada à trilha.
    const vl = new Float32Array(N);
    const vr = new Float32Array(N);
    for (let i = 0; i < voice.l.length && off + i < N; i++) {
      vl[off + i] = voice.l[i];
      vr[off + i] = voice.r[i];
    }
    const vk = gainOf(TARGET_LUFS - integratedLufs(vl, vr, SR));
    const bk = gainOf(bedDb);
    const sk = gainOf(brief.voice.sfxDb ?? -1); // efeitos: não abaixam com a voz
    for (let i = 0; i < N; i++) {
      L[i] = L[i] * bk * duck[i] + SFL[i] * sk + vl[i] * vk;
      R[i] = R[i] * bk * duck[i] + SFR[i] * sk + vr[i] * vk;
    }
  } else {
    for (let i = 0; i < N; i++) {
      L[i] += SFL[i];
      R[i] += SFR[i];
    }
  }
  if (tail) {
    const at = Math.round(tailAt * SR);
    const tl = new Float32Array(tail.l.length);
    const tr = new Float32Array(tail.r.length);
    tl.set(tail.l);
    tr.set(tail.r);
    const tk = gainOf(TARGET_LUFS - integratedLufs(tl, tr, SR));
    for (let i = 0; i < tail.l.length && at + i < N; i++) {
      L[at + i] += tail.l[i] * tk;
      R[at + i] += tail.r[i] * tk;
    }
  }
  normalize();
} else {
  for (let i = 0; i < N; i++) {
    L[i] += SFL[i];
    R[i] += SFR[i];
  }
  normalize();
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
if (voice || tail) {
  // Grava primeiro a trilha sozinha (stem), depois a mixagem final (score.wav).
  const mixL = L.slice();
  const mixR = R.slice();
  L.set(stemL);
  R.set(stemR);
  writeWav(path.join(root, 'public', id, 'stem.wav'));
  L.set(mixL);
  R.set(mixR);
}
writeWav(wavPath);

const beatsJson = {bpm, durationSec: +durationSec.toFixed(6), musicSec: +musicSec.toFixed(6), ...(tail ? {tailSec: +tailAt.toFixed(6)} : {}), beats, bars: barStarts, cues};
fs.writeFileSync(path.join(videoDir, 'beats.json'), JSON.stringify(beatsJson, null, 2) + '\n');

console.log(`Áudio: ${path.relative(root, wavPath)}`);
console.log(`Duração ${durationSec.toFixed(2)} s · ${totalBeats} beats a ${bpm} BPM · ${cues.length} SFX`);
console.log(`Loudness ${finalLufs.toFixed(2)} LUFS (alvo ${TARGET_LUFS}) · pico ${peakDb().toFixed(2)} dBFS`);
