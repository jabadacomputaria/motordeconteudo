// Confere um vídeo pronto: formato do MP4, loudness da trilha e se os golpes caem no grid de beats.
// Uso: node scripts/check.mjs <id>
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {integratedLufs, readWav16} from './loudness.mjs';

const id = process.argv[2] || 'teste-motor';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const mp4 = path.join(root, 'out', `${id}.mp4`);
const wav = path.join(root, 'public', id, 'score.wav');
const beats = JSON.parse(fs.readFileSync(path.join(root, 'src', 'videos', id, 'beats.json'), 'utf8'));
const brief = JSON.parse(fs.readFileSync(path.join(root, 'src', 'videos', id, 'brief.json'), 'utf8'));

let ok = true;
const report = (pass, label, detail) => {
  if (!pass) ok = false;
  console.log(`${pass ? 'OK  ' : 'FALHA'} ${label}: ${detail}`);
};

// 1. MP4: usa o ffprobe do sistema, ou o que vem com o Remotion.
if (fs.existsSync(mp4)) {
  const probeArgs = ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4];
  let raw;
  try {
    raw = execFileSync('ffprobe', probeArgs, {encoding: 'utf8'});
  } catch {
    raw = execFileSync('npx', ['remotion', 'ffprobe', ...probeArgs], {encoding: 'utf8', cwd: root});
  }
  const info = JSON.parse(raw);
  const v = info.streams.find((s) => s.codec_type === 'video');
  const a = info.streams.find((s) => s.codec_type === 'audio');
  const dur = Number(info.format.duration);
  report(v?.codec_name === 'h264', 'Vídeo', `${v?.codec_name} ${v?.width}x${v?.height} ${v?.r_frame_rate}`);
  report(v?.pix_fmt === 'yuv420p', 'Formato de cor', v?.pix_fmt);
  report(v?.width === brief.format.width && v?.height === brief.format.height, 'Tamanho', `${v?.width}x${v?.height}`);
  report(a?.codec_name === 'aac', 'Áudio', `${a?.codec_name} ${a?.sample_rate} Hz`);
  report(Math.abs(dur - beats.durationSec) < 0.1, 'Duração', `${dur.toFixed(2)} s (grid: ${beats.durationSec.toFixed(2)} s)`);
} else {
  report(false, 'MP4', `não encontrado; rode npm run render -- ${id}`);
}

// 2. Loudness da trilha.
const {L, R, sr} = readWav16(fs.readFileSync(wav));
const lufs = integratedLufs(L, R, sr);
report(Math.abs(lufs + 14) <= 0.5, 'Loudness', `${lufs.toFixed(2)} LUFS (alvo -14)`);

// 3. Sincronia: mede onde os golpes graves realmente estão e compara com o beats.json.
// Com voz na mixagem, mede na trilha sozinha (stem.wav), onde os golpes não se misturam com a fala.
const stem = path.join(root, 'public', id, 'stem.wav');
if (fs.existsSync(stem)) {
  const s = readWav16(fs.readFileSync(stem));
  L.set(s.L);
  R.set(s.R);
}
const mono = new Float32Array(L.length);
let lp = 0;
const k = 1 - Math.exp((-2 * Math.PI * 150) / sr);
for (let i = 0; i < L.length; i++) {
  lp += k * ((L[i] + R[i]) / 2 - lp);
  mono[i] = Math.abs(lp);
}
const hop = Math.round(sr * 0.002);
const env = [];
for (let i = 0; i < mono.length; i += hop) {
  let m = 0;
  for (let j = i; j < Math.min(mono.length, i + hop); j++) m = Math.max(m, mono[j]);
  env.push(m);
}
const onset = env.map((v, i) => Math.max(0, v - (env[i - 1] ?? 0)));
const win = Math.round(0.04 / 0.002);
// Só entram os beats que têm golpe de bumbo pelo brief (kickPattern e respiros sem bateria).
const kp = brief.music.kickPattern || [1];
const brk = new Set(brief.music.breakBeats || []);
const withKick = beats.beats.filter((_, i) => kp[i % kp.length] > 0 && !brk.has(i) && brief.music.drums !== false);
const measured = (withKick.length ? withKick : beats.beats).map((t) => {
  const c = Math.round(t / 0.002);
  const lo = Math.max(0, c - win);
  const hi = Math.min(onset.length - 1, c + win);
  let peak = 0;
  for (let i = lo; i <= hi; i++) peak = Math.max(peak, onset[i]);
  // O golpe é o PRIMEIRO ataque forte da janela (o pico pode ser ruído de um SFX por cima).
  let first = c;
  for (let i = lo; i <= hi; i++) {
    if (onset[i] >= peak * 0.5) {
      first = i;
      break;
    }
  }
  return {t, offsetMs: (first - c) * 2, peak};
});
const median = [...measured].sort((a, b) => a.peak - b.peak)[Math.floor(measured.length / 2)].peak;
const hits = measured.filter((m) => m.peak > median * 0.2);
const worst = Math.max(...hits.map((m) => Math.abs(m.offsetMs)));
report(worst <= 12, 'Sincronia', `${hits.length}/${measured.length} beats com golpe medido; maior desvio ${worst} ms (limite 12 ms ≈ 1/3 de frame)`);

process.exit(ok ? 0 : 1);
