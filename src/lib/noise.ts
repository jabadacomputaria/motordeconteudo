// Ruído determinístico. Nunca use Math.random: o mesmo frame precisa sair igual em qualquer render.

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Mistura vários inteiros numa seed só (para seed + índice + frame, por exemplo).
export const hashSeed = (...parts: number[]) => {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    h ^= Math.floor(p) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
};

// Um número em [0, 1) que depende só de (seed, i). Puro.
export const rand = (seed: number, i: number) => mulberry32(hashSeed(seed, i))();

// Ruído 1D suave em [-1, 1]: interpola valores aleatórios em pontos inteiros de x.
export const noise1D = (seed: number, x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = rand(seed, i) * 2 - 1;
  const b = rand(seed, i + 1) * 2 - 1;
  return a + (b - a) * s;
};
