// Biblioteca de sons com contexto: cada acontecimento na tela tem um timbre próprio.
// Regra do estúdio: não repetir o mesmo som de transição (nada de whoosh em todo corte).
// Use o nome no campo "sfx" dos cues do brief. Todos sintetizados, sem arquivos.
//
// Guia rápido (o que soa como o quê):
//   interface   glass, glass2, tickLow, readTicks (visto azul), bubbleBlip (digitando), notify (mensagem chegou),
//               playBlip (play), routeTick (rota andando), counterRoll (número contando), cashRoll (preço subindo)
//   papel       slide (cartão entra), paperSlide (documento desliza), page/page2/page3 (folhas, meses; o flip antigo continua valendo), stamp (carimbo),
//               cardFlick/cardFlick2/cardFlick3 (cartões em leque, sobem de tom)
//   metal       clankLock (cadeado batendo), latch (trinco abrindo)
//   caneta      scribble (risco), pen (círculo vermelho)
//   impacto     bwomp (algo se abre/explode suave), thumpLow, thumpSoft, darkHit (corte para o escuro), slap (algo mole cai),
//               wetPop (fatia molhada), rustle (folhas crocantes)
//   luz/virada  lightOn (luz acende), brightOpen (virada para o claro, acorde maior), ding (confirmação), ping (sonar/mapa)
//   comida      sizzle (fritura), drip/drip2 (pingos), crunchBite (mordida com farelos)
//   relógio     tickClock, tockClock
//   ar (no máximo 1 por vídeo)  zip (entrada rápida tonal), swish (passagem curta)
//   especial    hush: não toca nada; a trilha some ~0,6 s ANTES desse beat e volta no golpe (respiro antes do impacto)

export const extraSfx = ({add, SR, noise, mulberry32}) => {
  const TAU = Math.PI * 2;
  const sineGlide = (f0, f1, k) => {
    let ph = 0;
    return (x) => {
      ph += (TAU * (f1 + (f0 - f1) * Math.exp(-x * k))) / SR;
      return Math.sin(ph);
    };
  };
  const partials = (freqs, amps, decays) => (x) => freqs.reduce((s, f, k) => s + amps[k] * Math.sin(TAU * f * x) * Math.exp(-x * decays[k]), 0);
  const hpNoise = () => {
    let prev = 0;
    return (j) => {
      const n = noise(Math.abs(j));
      const v = n - prev;
      prev = n;
      return v;
    };
  };
  const lpNoise = (k) => {
    let lp = 0;
    return (j) => {
      lp += k * (noise(Math.abs(j)) - lp);
      return lp;
    };
  };
  const band = (kHi, kLo, seed, len, decay, gain, pan = 0) => {
    const a = lpNoise(kHi);
    const b = lpNoise(kLo);
    return (t) => add(t, len, (x, i, j) => (a(j * 3 + seed) - b(j * 3 + seed)) * Math.exp(-x * decay), gain, pan);
  };
  const glide = (f0, f1, k, len, decay, gain, pan = 0) => (t) => {
    const f = sineGlide(f0, f1, k);
    add(t, len, (x) => f(x) * Math.exp(-x * decay), gain, pan);
  };

  return {
    // interface
    glass: (t) => add(t, 0.09, partials([2600, 3900], [1, 0.5], [45, 60]), 0.16, 0.1),
    glass2: (t) => add(t, 0.09, partials([3300, 4950], [1, 0.5], [40, 55]), 0.16, -0.1),
    tickLow: (t) => add(t, 0.06, partials([900, 1350], [1, 0.4], [90, 120]), 0.2),
    readTicks: (t) => {
      add(t, 0.05, partials([2400, 3600], [1, 0.4], [110, 140]), 0.14);
      add(t + 0.09, 0.05, partials([3000, 4500], [1, 0.4], [110, 140]), 0.14);
    },
    bubbleBlip: (t) => [0, 0.12, 0.24].forEach((d, k) => add(t + d, 0.06, (x) => Math.sin(TAU * (700 + k * 90) * x) * Math.exp(-x * 60), 0.08)),
    notify: (t) => {
      add(t, 0.2, (x) => Math.sin(TAU * 1174 * x) * Math.exp(-x * 14), 0.15);
      add(t + 0.1, 0.35, (x) => Math.sin(TAU * 1568 * x) * Math.exp(-x * 9), 0.15);
    },
    playBlip: (t) => {
      add(t, 0.08, (x) => Math.sin(TAU * 880 * x) * Math.exp(-x * 40), 0.12);
      add(t + 0.08, 0.1, (x) => Math.sin(TAU * 1320 * x) * Math.exp(-x * 35), 0.12);
    },
    routeTick: (t) => [1800, 2200, 2700].forEach((f, k) => add(t + k * 0.12, 0.06, partials([f, f * 1.5], [1, 0.35], [100, 130]), 0.14)),
    counterRoll: (t) => {
      for (let k = 0; k < 14; k++) add(t + 1.5 * (1 - Math.pow(1 - k / 14, 1.6)), 0.03, partials([1500 + k * 40], [1], [180]), 0.08, 0.1);
    },
    cashRoll: (t) => {
      for (let k = 0; k < 18; k++) add(t + 1.1 * (k / 18), 0.025, partials([1100 + k * 60], [1], [200]), 0.08, -0.1);
      add(t + 1.12, 0.6, partials([2093, 2637], [1, 0.6], [6, 8]), 0.1);
    },
    // papel
    slide: (t) => {
      const a = lpNoise(0.2), b = lpNoise(0.02);
      add(t, 0.16, (x, i, j) => (a(j * 3 + 1) - b(j * 3 + 1)) * Math.pow(Math.sin((Math.PI * x) / 0.16), 2), 0.9);
    },
    paperSlide: (t) => {
      const a = lpNoise(0.25), b = lpNoise(0.03);
      add(t - 0.1, 0.22, (x, i, j) => (a(j * 3 + 5) - b(j * 3 + 5)) * Math.sin((Math.PI * x) / 0.22), 0.5);
    },
    page: band(0.45, 0.06, 41, 0.09, 45, 0.5, -0.2),
    page2: band(0.55, 0.08, 77, 0.08, 50, 0.45, 0.2),
    page3: band(0.35, 0.05, 93, 0.11, 38, 0.5, 0),
    stamp: (t) => {
      glide(140, 60, 22, 0.35, 12, 0.75)(t);
      band(0.6, 0.1, 3, 0.06, 60, 1.0)(t);
    },
    cardFlick: (t) => add(t, 0.07, (x) => Math.sin(TAU * (900 + 5000 * x) * x) * Math.exp(-x * 45), 0.18, -0.25),
    cardFlick2: (t) => add(t, 0.07, (x) => Math.sin(TAU * (1100 + 5000 * x) * x) * Math.exp(-x * 45), 0.18, 0.25),
    cardFlick3: (t) => add(t, 0.07, (x) => Math.sin(TAU * (1350 + 5000 * x) * x) * Math.exp(-x * 45), 0.2, 0),
    // metal
    clankLock: (t) => {
      add(t, 1.0, partials([310, 780, 1330, 2210, 3140], [1, 0.7, 0.5, 0.35, 0.2], [7, 9, 12, 16, 22]), 0.3);
      const n = hpNoise();
      add(t, 0.02, (x, i, j) => n(j * 5 + 3) * Math.exp(-x * 400), 0.5);
      glide(110, 55, 20, 0.45, 9, 0.6)(t);
    },
    latch: (t) => {
      add(t, 0.05, partials([3100, 1900], [1, 0.6], [140, 110]), 0.3);
      add(t + 0.085, 0.05, partials([3700, 2300], [1, 0.6], [140, 110]), 0.34);
      add(t + 0.085, 0.45, partials([4200, 5600], [1, 0.4], [16, 22]), 0.1);
    },
    // caneta
    scribble: (t) => {
      const h = hpNoise();
      add(t, 0.3, (x, i, j) => h(j * 3 + 9) * (0.55 + 0.45 * Math.sin(TAU * 24 * x)) * Math.sin((Math.PI * x) / 0.3), 0.2);
    },
    pen: (t) => {
      const h = hpNoise();
      add(t, 0.42, (x, i, j) => h(j * 3 + 19) * (0.5 + 0.5 * Math.sin(TAU * 17 * x)) * Math.sin((Math.PI * x) / 0.42), 0.17, 0.1);
    },
    // impacto
    bwomp: glide(150, 70, 16, 0.22, 14, 0.35),
    thumpLow: (t) => {
      glide(100, 42, 12, 0.32, 10, 0.65)(t);
      const l = lpNoise(0.15);
      add(t, 0.06, (x, i, j) => l(j * 2 + 17) * Math.exp(-x * 50), 0.3);
    },
    thumpSoft: glide(120, 48, 12, 0.6, 6, 0.55),
    darkHit: (t) => {
      glide(90, 38, 9, 1.1, 3.2, 0.65)(t);
      const l = lpNoise(0.08);
      add(t, 0.5, (x, i, j) => l(j * 2 + 9) * Math.exp(-x * 7), 0.4);
    },
    slap: (t) => {
      band(0.5, 0.05, 11, 0.06, 70, 1.1)(t);
      glide(220, 100, 30, 0.1, 30, 0.3)(t);
    },
    wetPop: glide(460, 160, 45, 0.1, 40, 0.4),
    rustle: (t) => {
      const r = mulberry32(77);
      const hits = Array.from({length: 22}, () => [r() * 0.17, 0.3 + r() * 0.7]);
      const h = hpNoise();
      add(t, 0.22, (x, i, j) => {
        let v = 0;
        for (const [ht, a] of hits) if (x >= ht) v += a * Math.exp(-(x - ht) * 380);
        return h(j * 5 + 1) * v;
      }, 0.3, 0.15);
    },
    // luz e viradas
    lightOn: (t) => {
      glide(110, 45, 14, 0.5, 9, 0.7)(t);
      const l = lpNoise(0.3);
      add(t, 0.05, (x, i, j) => l(j * 2) * Math.exp(-x * 70), 0.5);
      add(t + 0.04, 1.0, (x) => (Math.sin(TAU * (110 + 70 * Math.min(1, x / 0.5)) * x) + 0.4 * Math.sin(TAU * 220 * x)) * Math.exp(-x * 3.2) * Math.min(1, x / 0.05), 0.12);
      add(t + 0.03, 0.7, partials([1760, 2640], [1, 0.4], [6, 9]), 0.08);
    },
    brightOpen: (t) => add(t, 1.4, (x) => ([523, 659, 784, 1046].reduce((s, f, k) => s + Math.sin(TAU * f * x + k), 0) * Math.min(1, x / 0.12) * Math.exp(-x * 2.4)) / 4, 0.16),
    ding: (t) => {
      const bell = (f) => partials([f, f * 2.76, f * 5.4], [1, 0.4, 0.15], [3, 5, 8]);
      add(t, 1.5, bell(1318), 0.18);
      add(t + 0.11, 1.5, bell(1975), 0.16);
    },
    ping: (t) => [[0, 0.34], [0.22, 0.17], [0.44, 0.085]].forEach(([dt, a]) => add(t + dt, 1.1, (x) => Math.sin(TAU * 1320 * x) * Math.exp(-x * 4.5) * Math.min(1, x / 0.004), a, dt ? 0.3 : 0)),
    // comida
    sizzle: (t) => {
      const len = 2.5;
      const r = mulberry32(5);
      const pops = Array.from({length: 60}, () => [r() * len, 0.4 + r() * 0.6]);
      const h = hpNoise();
      add(t, len, (x, i, j) => {
        const env = Math.min(1, x / 0.35) * Math.min(1, (len - x) / 0.6);
        let c = 0;
        for (const [pt, a] of pops) if (x >= pt && x < pt + 0.012) c += a * (1 - (x - pt) / 0.012);
        return (h(j * 2 + 3) * 0.22 + h(j * 7 + 1) * c * 0.9) * env;
      }, 0.16, 0.1);
    },
    drip: glide(1000, 520, 55, 0.12, 40, 0.2, -0.2),
    drip2: glide(780, 420, 50, 0.12, 38, 0.18, 0.2),
    crunchBite: (t) => {
      const r = mulberry32(31);
      [[0, 1], [0.046, 0.75], [0.101, 0.55]].forEach(([dt, a], k) => band(0.55, 0.05, 21 + k * 7, 0.1, 80, 1.1 * a)(t + dt));
      glide(180, 80, 25, 0.18, 22, 0.5)(t);
      const h = hpNoise();
      for (let k = 0; k < 14; k++) add(t + 0.06 + r() * 0.4, 0.012, (x, i, j) => h(j * 11 + k) * Math.exp(-x * 400), 0.2 + r() * 0.2, r() * 2 - 1);
    },
    // relógio
    tickClock: (t) => add(t, 0.05, partials([2100, 4200], [1, 0.3], [120, 160]), 0.2, -0.15),
    tockClock: (t) => add(t, 0.05, partials([1600, 3200], [1, 0.3], [120, 160]), 0.2, 0.15),
    // ar (no máximo um por vídeo)
    zip: (t) => add(t, 0.28, (x) => Math.sin(TAU * (260 + 840 * (1 - Math.exp(-x * 12))) * x * 0.5) * Math.exp(-x * 11), 0.22),
    swish: (t) => {
      const a = lpNoise(0.35), b = lpNoise(0.03);
      add(t - 0.05, 0.2, (x, i, j) => (a(j * 3 + 7) - b(j * 3 + 7)) * Math.pow(Math.sin((Math.PI * x) / 0.2), 2), 0.55);
    },
    // especial: respiro da trilha (tratado no audio.mjs)
    hush: () => {},
  };
};
