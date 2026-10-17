// Loudness integrada (ITU-R BS.1770-4) em LUFS, para áudio estéreo a 48 kHz. Sem dependências.

const biquad = (x, b, a) => {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
};

// Filtro K (coeficientes da norma para 48 kHz).
const kWeight = (x) =>
  biquad(
    biquad(x, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]),
    [1, -2, 1],
    [1, -1.99004745483398, 0.99007225036621],
  );

export const integratedLufs = (l, r, sr = 48000) => {
  if (sr !== 48000) throw new Error('loudness.mjs mede só 48 kHz');
  const kl = kWeight(l);
  const kr = kWeight(r);
  const block = Math.round(0.4 * sr);
  const hop = Math.round(0.1 * sr);
  const z = [];
  for (let s = 0; s + block <= kl.length; s += hop) {
    let sum = 0;
    for (let i = s; i < s + block; i++) sum += kl[i] * kl[i] + kr[i] * kr[i];
    z.push(sum / block);
  }
  const lk = (ms) => -0.691 + 10 * Math.log10(ms);
  const abs = z.filter((ms) => lk(ms) > -70);
  if (!abs.length) return -Infinity;
  const rel = lk(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const gated = abs.filter((ms) => lk(ms) > rel);
  return lk(gated.reduce((a, b) => a + b, 0) / gated.length);
};

// Lê um WAV PCM 16-bit estéreo e devolve {L, R, sr}.
export const readWav16 = (buf) => {
  let off = 12;
  let sr = 0;
  let channels = 0;
  while (off < buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'fmt ') {
      channels = buf.readUInt16LE(off + 10);
      sr = buf.readUInt32LE(off + 12);
    }
    if (id === 'data') {
      const n = size / (2 * channels);
      const L = new Float32Array(n);
      const R = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        L[i] = buf.readInt16LE(off + 8 + i * 2 * channels) / 32768;
        R[i] = buf.readInt16LE(off + 8 + i * 2 * channels + (channels > 1 ? 2 : 0)) / 32768;
      }
      return {L, R, sr};
    }
    off += 8 + size;
  }
  throw new Error('WAV sem bloco de dados');
};
