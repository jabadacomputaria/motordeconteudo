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
//   cenas grandes  tabStorm (5 s de cliques, teclas e notificações acelerando e cortando seco: caos de abas),
//               suck (ar sendo puxado para um ponto; termina no beat), boom (grave de cinema com cauda de ar),
//               orbIn (luz que nasce: vidro + calor), shimmer (brilho de revelação), resolve (acorde final que abre)
//   chat/IA     tapSoft (toque leve), sendUp (enviar), think (pensando, pulso suave), pluckA/pluckB/pluckC (itens da
//               resposta, notas subindo), morph/morph2 (layout que se transforma)
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

    // cenas grandes
    tabStorm: (t) => {
      const len = 5.0;
      const r = mulberry32(77);
      const h = hpNoise();
      // eventos cada vez mais densos (de ~3/s a ~28/s), de tipos variados, espalhados no estéreo
      let x = 0.05;
      while (x < len - 0.04) {
        const p = x / len;
        const kind = r();
        const pan = r() * 1.6 - 0.8;
        const g = 0.5 + 0.6 * p;
        if (kind < 0.45) {
          const f = 2200 + r() * 2200;
          add(t + x, 0.035, partials([f, f * 1.5], [1, 0.3], [140, 180]), 0.1 * g, pan);
        } else if (kind < 0.8) {
          const sd = Math.floor(r() * 1000);
          add(t + x, 0.02, (y, i, j) => h(j * 5 + sd) * Math.exp(-y * 260), 0.22 * g, pan);
        } else if (kind < 0.93) {
          const f = [988, 1175, 1318, 1568][Math.floor(r() * 4)];
          add(t + x, 0.12, (y) => Math.sin(TAU * f * y) * Math.exp(-y * 28), 0.07 * g, pan);
          add(t + x + 0.06, 0.12, (y) => Math.sin(TAU * f * 1.335 * y) * Math.exp(-y * 28), 0.06 * g, pan);
        } else {
          glide(160, 90, 30, 0.12, 30, 0.25 * g, pan)(t + x);
        }
        x += Math.max(0.035, 0.34 * Math.pow(1 - p, 1.6)) * (0.6 + r() * 0.8);
      }
      // zumbido de tensão subindo por baixo, com corte seco no fim
      let ph1 = 0, ph2 = 0, lp = 0;
      add(t, len, (y) => {
        const p = y / len;
        const f = 70 + 70 * p * p;
        ph1 += (TAU * f) / SR;
        ph2 += (TAU * f * 1.012) / SR;
        const saw = ((ph1 / TAU) % 1) * 2 - 1 + (((ph2 / TAU) % 1) * 2 - 1);
        lp += (0.02 + 0.06 * p) * (saw - lp);
        return lp * p * p * Math.min(1, (len - y) / 0.008);
      }, 0.35);
    },
    suck: (t) => {
      const len = 2.0;
      const a = lpNoise(0.04), b = lpNoise(0.01);
      let ph = 0;
      add(t - len, len, (x, i, j) => {
        const p = x / len;
        const n = a(j * 3 + 11) * (1 - p); // corpo grave no começo
        ph += (TAU * (180 + 1500 * p * p * p)) / SR;
        const env = Math.pow(p, 2.2) * Math.min(1, (len - x) / 0.006);
        return (n * 0.6 + (a(j * 5 + 3) - b(j * 5 + 3)) * 2.2 * p + Math.sin(ph) * 0.18 * p) * env;
      }, 0.9);
    },
    boom: (t) => {
      glide(70, 36, 6, 2.0, 2.2, 0.95)(t);
      const l = lpNoise(0.05);
      add(t, 1.6, (x, i, j) => l(j * 2 + 9) * Math.exp(-x * 2.6), 0.9);
      const h = hpNoise();
      add(t, 0.04, (x, i, j) => h(j * 3 + 1) * Math.exp(-x * 90), 0.4);
    },
    orbIn: (t) => {
      const len = 2.4;
      const fs = [1046, 1568 * 1.004, 2093 * 0.997, 3136 * 1.006];
      add(t, len, (x) => {
        const env = Math.min(1, x / 0.7) * Math.exp(-Math.max(0, x - 0.9) * 1.8);
        const trem = 0.8 + 0.2 * Math.sin(TAU * 5 * x);
        return fs.reduce((s, f, k) => s + Math.sin(TAU * f * x + k) / (k + 1.5), 0) * env * trem;
      }, 0.09, 0);
      add(t, len, (x) => Math.sin(TAU * 110 * x) * Math.min(1, x / 0.9) * Math.exp(-Math.max(0, x - 1.1) * 2), 0.22);
    },
    shimmer: (t) => {
      const r = mulberry32(19);
      const notes = [1568, 1760, 2093, 2349, 2637, 3136, 3520, 4186];
      for (let k = 0; k < 26; k++) {
        const at = 1.1 * Math.pow(k / 26, 1.5);
        const f = notes[Math.floor(r() * notes.length)];
        add(t + at, 0.25, (x) => Math.sin(TAU * f * x) * Math.exp(-x * 14) * Math.min(1, x / 0.004), 0.05 * (1 - k / 32), r() * 1.4 - 0.7);
      }
    },
    resolve: (t) => add(t, 2.8, (x) => {
      const env = Math.min(1, x / 0.35) * Math.exp(-Math.max(0, x - 0.6) * 1.3);
      const chord = [262, 330, 392, 494, 587].reduce((s, f, k) => s + Math.sin(TAU * f * x + k * 0.7) * (1 + 0.15 * Math.sin(TAU * 0.8 * x + k)), 0) / 5;
      return chord * env + Math.sin(TAU * 65.4 * x) * env * 0.6;
    }, 0.2),
    // chat e IA
    tapSoft: (t) => add(t, 0.05, partials([1150, 2300], [1, 0.25], [110, 150]), 0.18, 0.05),
    sendUp: (t) => {
      let ph = 0;
      add(t, 0.16, (x) => {
        ph += (TAU * (480 + 1000 * Math.min(1, x / 0.11))) / SR;
        return Math.sin(ph) * Math.exp(-x * 18) * Math.min(1, x / 0.003);
      }, 0.16, 0.1);
    },
    think: (t) => add(t, 1.9, (x) => {
      const a = 0.5 + 0.5 * Math.sin(TAU * 3 * x);
      const env = Math.min(1, x / 0.2) * Math.min(1, (1.9 - x) / 0.4);
      return (Math.sin(TAU * 660 * x) * a + Math.sin(TAU * 990 * x) * (1 - a) * 0.7) * env;
    }, 0.06, 0),
    pluckA: (t) => add(t, 0.6, partials([784, 1568, 2352], [1, 0.35, 0.12], [9, 14, 20]), 0.16, -0.2),
    pluckB: (t) => add(t, 0.6, partials([988, 1976, 2964], [1, 0.35, 0.12], [9, 14, 20]), 0.16, 0),
    pluckC: (t) => add(t, 0.7, partials([1175, 2350, 3525], [1, 0.35, 0.12], [8, 13, 19]), 0.16, 0.2),
    morph: (t) => {
      const len = 0.7;
      let hold = 0;
      let ph = 0;
      add(t, len, (x, i) => {
        if (i % 160 === 0) hold = noise(i * 7 + 5);
        ph += (TAU * (900 - 500 * (x / len))) / SR;
        const env = Math.sin((Math.PI * x) / len);
        return (hold * 0.35 + Math.sin(ph) * 0.6) * env * env;
      }, 0.16, -0.1);
      add(t + len - 0.02, 0.4, partials([1318, 1976], [1, 0.4], [10, 14]), 0.1);
    },
    morph2: (t) => {
      const len = 0.8;
      let ph = 0;
      add(t, len, (x, i) => {
        const p = x / len;
        ph += (TAU * (300 + 900 * p)) / SR;
        const step = Math.floor(p * 10) % 2 ? 1 : 0.6;
        return Math.sin(ph) * step * Math.sin(Math.PI * p);
      }, 0.15, 0.1);
      const bell = partials([1568, 2093, 2637], [1, 0.6, 0.4], [6, 8, 10]);
      add(t + len - 0.04, 0.9, bell, 0.09);
    },
    // especial: respiro da trilha (tratado no audio.mjs)
    hush: () => {},
  };
};
