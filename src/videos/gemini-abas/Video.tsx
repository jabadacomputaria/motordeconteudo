// "Gemini: cem abas, uma resposta" — filme de vitrine 16:9, só com efeitos sonoros, assinatura Kyneo no fim.
// Atos: o caos das abas (escuro, 3D) → uma luz nasce e congela tudo → as abas são sugadas → flash para o claro
// → o nome nasce do desfoque → saudação e caixa de pedido → o pedido com as 100 abas anexadas → lendo as fontes
// → a resposta se monta → "mais curto" (reorganiza) → "plano da semana" (vira calendário) → cem abas, uma resposta
// → a luz apaga e entra a assinatura. Tudo deriva do frame (prop `frame` ou useCurrentFrame).
import React from 'react';
import {AbsoluteFill, Easing, Html5Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, lin, mix, pop} from '../../lib/anim';
import {beatFrames, type Beats} from '../../lib/beats';
import {loadBrandFonts, type Brand} from '../../lib/brand';
import {noise1D, rand} from '../../lib/noise';
import {BlurText, BrowserWin, CheckIcon, G, Orb, PlusIcon, Rays, SendIcon, SlidersIcon, TabStack, makeWins, type Fonts} from './parts';

export type VideoProps = {id: string; beats: Beats; brand: Brand; seed: number; withAudio?: boolean; fps?: number; frame?: number};

const W = 1920;
const H = 1080;
const CX = W / 2;
const CY = H / 2;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const io = Easing.inOut(Easing.cubic);

type KF = {f: number; x: number; y: number; s: number};
const track = (keys: KF[], f: number) => {
  if (f <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const t = io(clamp01((f - a.f) / Math.max(1, b.f - a.f)));
      return {f, x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), s: mix(a.s, b.s, t)};
    }
  }
  return keys[keys.length - 1];
};

const PROMPT = 'Junta essas 100 abas e me diz por onde começar.';
const STEPS = [
  {t: 'Formalize o negócio', d: 'MEI aberto pelo gov.br, com CNPJ na hora', short: 'Formalize'},
  {t: 'Faça o preço certo', d: 'custo + margem: o gráfico mostra quanto cobrar', short: 'Precifique'},
  {t: 'Comece a vender', d: 'Instagram e WhatsApp no mesmo link', short: 'Venda'},
];
const DAYS = [
  {d: 'Seg', t: 'Abrir o MEI'},
  {d: 'Ter', t: 'Planilha de custos'},
  {d: 'Qua', t: 'Definir preços'},
  {d: 'Qui', t: 'Fotos dos produtos'},
  {d: 'Sex', t: 'Perfil no Instagram'},
  {d: 'Sáb', t: 'Primeiro post'},
  {d: 'Dom', t: 'Responder clientes'},
];

export const Video: React.FC<VideoProps> = ({id, beats, brand, seed, withAudio = true, fps: fpsProp, frame: frameProp}) => {
  loadBrandFonts(brand);
  const current = useCurrentFrame();
  const f = frameProp ?? current;
  const config = useVideoConfig();
  const fps = fpsProp ?? config.fps;
  const b = beatFrames(beats, fps);
  const F = (k: number) => (k < b.length ? b[k] : Math.round((k * 60 * fps) / beats.bpm));
  const fonts: Fonts = {ui: brand.fonts.ui.family, mono: brand.fonts.mono?.family ?? brand.fonts.ui.family};
  const disp = brand.fonts.display.family;
  const ui = fonts.ui;
  const mono = fonts.mono;
  const t = f / fps;
  const tailSec = (beats as Beats & {tailSec?: number}).tailSec;
  const tailStart = tailSec ? Math.round(tailSec * fps) : 1e9;

  // ---------------- assinatura (vertical) centralizada no 16:9, no mesmo preto ----------------
  if (f >= tailStart) {
    const n = Math.min(75, f - tailStart + 1);
    return (
      <AbsoluteFill style={{background: '#0A0A0A'}}>
        {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
        <Img src={staticFile(`${id}/trailer/${String(n).padStart(3, '0')}.jpg`)} style={{position: 'absolute', left: (W - (H * 9) / 16) / 2, top: 0, width: (H * 9) / 16, height: H}} />
      </AbsoluteFill>
    );
  }

  // Marcos (em frames) a partir dos beats.
  const FREEZE = F(10);
  const VORTEX = F(14);
  const FLASH = F(18);
  const GREET = F(22);
  const BOXUP = F(25);
  const TYPE = F(27);
  const CHIP = F(31);
  const SEND = F(32);
  const THINK = F(33);
  const COUNT = F(34);
  const FAN = F(35);
  const ANSWER = F(37);
  const TYPE2 = Math.round((41.5 * 60 * fps) / beats.bpm);
  const SEND2 = F(44);
  const MORPH1 = F(45);
  const TAP = F(48);
  const MSG3 = F(49);
  const MORPH2 = F(50);
  const FLIPS = F(51);
  const CHECKS = F(52);
  const FINALE = F(54);
  const RESOLVE = F(56);
  const OUT = F(59);

  // =========================================================================================
  // ATO 1 a 3: o caos (escuro), a luz e o vórtice
  // =========================================================================================
  const dark = f < FLASH + 2;
  const wins = makeWins(46, seed, FREEZE - 8);
  const fc = Math.min(f, FREEZE); // tempo do caos: congela quando a luz nasce
  const chaosP = fc / FREEZE;
  const freezeP = ease(f, FREEZE, 30); // 0..1 profundidade de campo e dessaturação
  const vortexP = (i: number) => Easing.in(Easing.cubic)(clamp01((f - VORTEX - rand(seed + 33, i) * 16) / 44));
  const orbChaos = track(
    [
      {f: FREEZE, x: CX, y: CY, s: 0},
      {f: FREEZE + 8, x: CX, y: CY, s: 26},
      {f: VORTEX, x: CX, y: CY, s: 210},
      {f: FLASH - 4, x: CX, y: CY, s: 330},
      {f: FLASH, x: CX, y: CY, s: 520},
    ],
    f,
  );
  const flash = f < FLASH - 6 ? 0 : f < FLASH ? (f - (FLASH - 6)) / 6 : Math.max(0, 1 - (f - FLASH) / 16);

  let darkScene: React.ReactNode = null;
  if (dark) {
    const camScale = 1 + chaosP * 0.12 + (1 - Easing.out(Easing.cubic)(clamp01(fc / 20))) * 0.25;
    const shakeA = Math.pow(chaosP, 2) * 9 * (f < FREEZE ? 1 : 0);
    const sx = noise1D(seed + 1, fc * 0.9) * shakeA;
    const sy = noise1D(seed + 2, fc * 0.9) * shakeA;
    // abas abertas na barra do navegador (sobe de 1 a 100)
    const nTabs = Math.max(1, Math.min(100, Math.round(1 + 99 * Math.pow(chaosP, 1.5))));
    const stripW = 1760;
    const tabW = stripW / nTabs;
    // cursor nervoso
    const hop = 11;
    const ci = Math.floor(fc / hop);
    const cq = Easing.out(Easing.back(1.4))(clamp01((fc - ci * hop) / 6));
    const cpt = (k: number) => ({x: 260 + rand(seed + 50, k) * 1400, y: 160 + rand(seed + 51, k) * 760});
    const c0 = cpt(ci);
    const c1 = cpt(ci + 1);
    const cur = {x: mix(c0.x, c1.x, cq), y: mix(c0.y, c1.y, cq)};
    const toasts = [
      {at: 52, t: 'Mensagens', d: '23 novas conversas', c: '#22A55B'},
      {at: 92, t: 'Lembrete', d: 'Pagar o boleto hoje', c: '#F2A93B'},
      {at: 122, t: 'E-mail', d: 'Orçamento pendente', c: '#4F7BFF'},
    ];
    // sucção: tudo que está na frente gira e encolhe para o centro
    const suckAll = Easing.in(Easing.cubic)(clamp01((f - VORTEX) / 46));
    const frontT = `translate(${CX}px, ${CY}px) rotate(${suckAll * 160}deg) scale(${1 - suckAll}) translate(${-CX}px, ${-CY}px)`;
    const bgLift = clamp01((f - (FLASH - 20)) / 20);
    darkScene = (
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 70% at 50% 35%, #232936 0%, #12151C 55%, #090A0E 100%)`}}>
        {/* luz fria do monitor vindo de cima */}
        <div style={{position: 'absolute', left: 260, right: 260, top: -300, height: 700, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(120,150,255,0.18), rgba(0,0,0,0) 70%)'}} />
        {/* barra de abas do navegador: cada aba vai ficando mais fina */}
        <div style={{position: 'absolute', inset: 0, transform: frontT}}>
          <div style={{position: 'absolute', left: 80, top: 34, width: stripW, height: 52, borderRadius: 14, background: 'rgba(30,34,44,0.92)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', padding: '8px 8px 0', boxSizing: 'border-box', filter: `blur(${(freezeP * 3).toFixed(1)}px)`}}>
            {Array.from({length: nTabs}).map((_, k) => (
              <div key={k} style={{width: tabW, flexShrink: 0, height: 44, borderRadius: '10px 10px 0 0', background: k === nTabs - 1 ? '#3A4252' : '#262B36', borderRight: '1px solid #11141A', display: 'flex', alignItems: 'center', gap: 6, padding: tabW > 40 ? '0 8px' : 0, overflow: 'hidden', boxSizing: 'border-box'}}>
                <div style={{width: 12, height: 12, borderRadius: 3, flexShrink: 0, marginLeft: tabW > 40 ? 0 : Math.max(0, (tabW - 12) / 2), background: ['#4F7BFF', '#E5484D', '#22A55B', '#F2A93B', '#9B6BFF'][k % 5]}} />
                {tabW > 120 ? <div style={{fontFamily: ui, fontSize: 14, color: '#C7CCD6', whiteSpace: 'nowrap'}}>{wins[k % wins.length].title}</div> : null}
              </div>
            ))}
          </div>
        </div>
        {/* as janelas em 3D */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            perspective: 1500,
            perspectiveOrigin: `${CX}px ${CY}px`,
            filter: f >= FREEZE ? `blur(${(freezeP * 5 * (1 - suckAll * 0.6)).toFixed(1)}px) saturate(${1 - freezeP * 0.6}) brightness(${1 - freezeP * 0.25 + bgLift * 0.6})` : undefined,
          }}
        >
          <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translate(${sx}px, ${sy}px) scale(${camScale})`}}>
            {wins
              .slice()
              .sort((a, c) => a.z - c.z)
              .map((w) => {
                if (fc < w.spawn) return null;
                const q = pop(fc, w.spawn, fps, 150, 16);
                const v = vortexP(w.i);
                if (v >= 0.995) return null;
                const dx = noise1D(seed + w.i, fc / 45) * 14;
                const dy = noise1D(seed + w.i + 70, fc / 50) * 10;
                const ang = Math.atan2(w.y, w.x) + v * 2.4;
                const rad = Math.hypot(w.x, w.y) * (1 - v);
                const x = v > 0 ? Math.cos(ang) * rad : w.x + dx;
                const y = v > 0 ? Math.sin(ang) * rad : w.y + dy;
                const z = mix(mix(-3600, w.z, q), 200, v);
                const s = Math.pow(1 - v, 1.3);
                const shade = Math.max(0, Math.min(0.55, -w.z / 2400)) * (1 - v);
                return (
                  <div
                    key={w.i}
                    style={{
                      position: 'absolute',
                      left: CX + x - w.w / 2,
                      top: CY + y - w.h / 2,
                      transform: `translateZ(${z}px) rotateX(${w.rx * (2 - q)}deg) rotateY(${w.ry * (2 - q)}deg) rotateZ(${w.rz + v * 220}deg) scale(${s})`,
                    }}
                  >
                    <BrowserWin win={w} fonts={fonts} shade={shade} lightFromX={f >= FREEZE ? 180 * freezeP : 0} />
                  </div>
                );
              })}
          </div>
        </div>
        {/* luz quente do orbe batendo nas janelas (aparece quando a luz nasce) */}
        {f >= FREEZE ? <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(190,170,255,${0.35 * freezeP}) 0%, rgba(255,160,200,${0.14 * freezeP}) 25%, rgba(0,0,0,0) 55%)`, mixBlendMode: 'screen'}} /> : null}
        {/* frente: notificações, contador, cursor */}
        <div style={{position: 'absolute', inset: 0, transform: frontT}}>
          {toasts.map((o, k) => {
            if (fc < o.at) return null;
            const q = pop(fc, o.at, fps, 220, 18);
            return (
              <div key={k} style={{position: 'absolute', right: 70, top: 120 + k * 104, width: 420, height: 88, borderRadius: 20, background: 'rgba(40,44,56,0.86)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', boxSizing: 'border-box', transform: `translateX(${(1 - q) * 480}px)`, boxShadow: '0 20px 40px rgba(0,0,0,0.45)', filter: `blur(${(freezeP * 4).toFixed(1)}px)`}}>
                <div style={{width: 44, height: 44, borderRadius: 12, background: o.c}} />
                <div>
                  <div style={{fontFamily: ui, fontWeight: 600, fontSize: 22, color: '#F2F4F8'}}>{o.t}</div>
                  <div style={{fontFamily: ui, fontSize: 20, color: '#A7AEBB', marginTop: 2}}>{o.d}</div>
                </div>
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 70, bottom: 56, display: 'flex', alignItems: 'baseline', gap: 22, padding: '18px 36px 26px', borderRadius: 36, background: 'rgba(14,16,22,0.82)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', transform: `scale(${mix(1.25, 1, Easing.out(Easing.cubic)(clamp01(fc / 14)))})`, transformOrigin: '0 100%'}}>
            <div style={{fontFamily: mono, fontWeight: 500, fontSize: 170, lineHeight: 1, color: nTabs >= 100 ? '#FF8A8A' : '#F2F4F8', letterSpacing: -6, textShadow: '0 10px 40px rgba(0,0,0,0.5)'}}>{nTabs}</div>
            <div style={{fontFamily: disp, fontWeight: 600, fontSize: 52, color: '#C7CCD6'}}>abas abertas</div>
          </div>
          {f < FREEZE + 20 ? (
            <svg style={{position: 'absolute', left: cur.x, top: cur.y, opacity: 1 - freezeP}} width="34" height="42" viewBox="0 0 24 29">
              <path d="M2 2 L2 24 L8 18.5 L12 27 L16 25.3 L12 17 L20 17 Z" fill="#fff" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          ) : null}
          {f < FREEZE && fc - ci * hop < 8 && fc > 10 ? <div style={{position: 'absolute', left: cur.x - 26, top: cur.y - 26, width: 52, height: 52, borderRadius: 26, border: '3px solid rgba(255,255,255,0.7)', transform: `scale(${0.5 + ((fc - ci * hop) / 8) * 0.9})`, opacity: 1 - (fc - ci * hop) / 8}} /> : null}
        </div>
        {/* o orbe e os raios */}
        {f >= FREEZE ? (
          <div style={{position: 'absolute', left: orbChaos.x, top: orbChaos.y}}>
            <Rays size={2600} t={t} alpha={freezeP} />
            <Orb size={orbChaos.s} t={t} glow={1.2} spin={2} />
          </div>
        ) : null}
        {/* o escuro clareia antes do flash */}
        <div style={{position: 'absolute', inset: 0, background: '#FFFFFF', opacity: bgLift * 0.5}} />
      </AbsoluteFill>
    );
  }

  // =========================================================================================
  // MUNDO CLARO
  // =========================================================================================
  // Orbe ao longo do filme claro.
  const orbK: KF[] = [
    {f: FLASH, x: CX, y: CY, s: 360},
    {f: FLASH + 16, x: 700, y: CY, s: 128},
    {f: GREET + 20, x: 700, y: CY, s: 128},
    {f: GREET + 40, x: 520, y: 300, s: 74},
    {f: SEND, x: 520, y: 300, s: 74},
    {f: SEND + 18, x: 316, y: 214, s: 58},
    {f: FINALE, x: 316, y: 214, s: 58},
    {f: FINALE + 14, x: 210, y: 150, s: 0.1},
    {f: RESOLVE + 18, x: 210, y: 150, s: 0.1},
    {f: RESOLVE + 32, x: 700, y: CY, s: 128},
    {f: OUT - 2, x: 700, y: CY, s: 128},
    {f: OUT + 8, x: 700, y: CY, s: 0.1},
  ];
  const orb = track(orbK, f);
  const thinking = f >= THINK && f < ANSWER;
  const orbGlow = thinking ? 1 + 0.35 * Math.sin((f - THINK) / 3) : 1;

  // Câmera do mundo claro: deriva leve em 3D + empurrões por cena.
  const pushF = io(clamp01((f - TYPE) / (SEND - TYPE))) * (1 - io(clamp01((f - SEND) / 16)));
  const pullK = io(clamp01((f - FINALE) / 20));
  const camS = 1 + pushF * 0.07 + (f >= FLASH && f < GREET ? lin(f, FLASH, GREET - FLASH) * 0.04 : 0);
  const rx = noise1D(seed + 7, f / 80) * 1.6 + pushF * 3;
  const ry = noise1D(seed + 8, f / 90) * 2.2;

  // ---------------- D/E: o nome, a saudação e a pergunta ----------------
  const nameOut = GREET;
  const greetIn = GREET + 6;
  const greetMove = io(clamp01((f - (GREET + 20)) / 20));
  const greetOut = SEND;
  const textScale = mix(1, 0.56, greetMove);
  const dotsOn = f >= GREET + 16 && f < GREET + 36;

  // ---------------- caixa de pedido ----------------
  const boxIn = Easing.out(Easing.cubic)(clamp01((f - BOXUP) / 18));
  const boxDock = io(clamp01((f - SEND) / 16)); // vai para baixo depois de enviar
  const boxW = 1100;
  const boxX = CX - boxW / 2;
  const boxY = mix(mix(1140, 560, boxIn), 878, boxDock);
  const boxH = mix(178, 132, boxDock);
  let boxText = '';
  let caret = false;
  if (f >= TYPE && f < SEND) {
    boxText = PROMPT.slice(0, Math.round(clamp01((f - TYPE) / (CHIP - 6 - TYPE)) * PROMPT.length));
    caret = true;
  }
  if (f >= TYPE2 && f < SEND2) {
    boxText = 'Mais curto.'.slice(0, Math.round(clamp01((f - TYPE2) / 26) * 11));
    caret = true;
  }
  const chipIn = f >= CHIP - 10 && f < SEND ? Easing.out(Easing.cubic)(clamp01((f - (CHIP - 10)) / 12)) : 0;
  const pressAt = [SEND, SEND2].find((x) => f >= x && f < x + 10);
  const press = pressAt === undefined ? 0 : Math.exp(-(f - pressAt) / 3);
  const showBox = f >= BOXUP && f < FINALE + 10;
  const boxExit = io(clamp01((f - FINALE) / 10));

  // ---------------- balão da pessoa (topo direito) ----------------
  const bubbles = [
    {at: SEND, end: SEND2, text: PROMPT, chip: true},
    {at: SEND2, end: MSG3, text: 'Mais curto.', chip: false},
    {at: MSG3, end: FINALE + 6, text: 'Vira um plano da semana.', chip: false},
  ];

  // ---------------- lendo as fontes ----------------
  const readN = Math.round(Easing.out(Easing.cubic)(clamp01((f - COUNT) / 30)) * 100);
  const statusOn = f >= THINK && f < ANSWER + 4;

  // ---------------- a resposta ----------------
  const cardIn = Easing.out(Easing.cubic)(clamp01((f - ANSWER) / 14));
  const m1 = io(clamp01((f - MORPH1) / 18));
  const m2 = io(clamp01((f - MORPH2) / 22));
  const cardX = 270;
  const cardY = 300;
  const cardW = 1380;
  const cardH = mix(mix(520, 300, m1), 520, m2);
  const rowRect = (i: number) => {
    const m1 = io(clamp01((f - MORPH1 - i * 3) / 16));
    const a = {x: 40, y: 128 + i * 122, w: 1300, h: 104};
    const c = {x: 40 + i * 440, y: 132, w: 410, h: 116};
    return {x: mix(a.x, c.x, m1), y: mix(a.y, c.y, m1), w: mix(a.w, c.w, m1), h: mix(a.h, c.h, m1)};
  };
  const colRect = (j: number) => ({x: 40 + j * ((1300 - 6 * 16) / 7 + 16), y: 128, w: (1300 - 6 * 16) / 7, h: 350});
  const parentOf = [0, 0, 1, 1, 2, 2, 2];

  // ---------------- final ----------------
  const ghostIn = (k: number) => Easing.out(Easing.cubic)(clamp01((f - FINALE - 4 - rand(seed + 90, k) * 14) / 12));
  const ghostSuck = (k: number) => Easing.in(Easing.cubic)(clamp01((f - RESOLVE - rand(seed + 91, k) * 8) / 16));
  const finCard = io(clamp01((f - FINALE) / 20));
  const lockOut = io(clamp01((f - (RESOLVE + 20)) / 12));
  const dim = clamp01((f - (OUT - 14)) / 18);

  // Luz do orbe pintando o fundo.
  const spill = `radial-gradient(circle at ${orb.x}px ${orb.y}px, rgba(120,140,255,${0.16 * Math.min(1, orb.s / 60)}) 0%, rgba(200,130,255,${0.08 * Math.min(1, orb.s / 60)}) 22%, rgba(255,170,200,0.03) 40%, rgba(255,255,255,0) 60%)`;

  const card = (style: React.CSSProperties, children: React.ReactNode, key?: string) => (
    <div key={key} style={{position: 'absolute', borderRadius: 28, background: G.card, boxShadow: '0 30px 80px rgba(20,30,70,0.12), 0 2px 8px rgba(20,30,70,0.06)', border: '1px solid rgba(220,226,236,0.9)', ...style}}>
      {children}
    </div>
  );

  const bigTitle = (lines: [string, number, string][], top: number) => (
    <div style={{position: 'absolute', left: 130, top}}>
      {lines.map(([txt, at, col], k) => (
        <div key={k} style={{marginTop: k ? 6 : 0}}>
          <BlurText text={txt} frame={f} start={at} size={120} weight={600} color={col} family={disp} stagger={1.6} spacing={-0.035} out={RESOLVE + 20} />
        </div>
      ))}
    </div>
  );

  return (
    <AbsoluteFill style={{background: G.white, overflow: 'hidden'}}>
      {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
      {dark ? (
        darkScene
      ) : (
        <>
          {/* parede clara com luz de estúdio e a luz colorida do orbe */}
          <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 65% at 50% 38%, #FFFFFF 0%, #F4F6FA 58%, #E6EAF1 100%)'}} />
          <div style={{position: 'absolute', inset: 0, background: spill}} />
          <div style={{position: 'absolute', left: -200, right: -200, bottom: -260, height: 520, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(170,180,210,0.25), rgba(255,255,255,0) 70%)'}} />

          {/* mundo com câmera */}
          <div style={{position: 'absolute', inset: 0, perspective: 2200, perspectiveOrigin: `${CX}px ${CY}px`}}>
            <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transformOrigin: `${CX}px 640px`, transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${camS * mix(1, 0.94, pullK)})`}}>
              {/* ---------- nome e saudação ---------- */}
              {f < greetOut + 16 ? (
                <div style={{position: 'absolute', left: orb.x + orb.s * 0.72, top: orb.y - 84, width: 1000, height: 168, transform: `scale(${textScale})`, transformOrigin: '0 50%'}}>
                  {f < nameOut + 14 ? (
                    <div style={{position: 'absolute', left: 0, top: 0}}>
                      <BlurText text="Gemini" frame={f} start={FLASH + 10} size={150} weight={500} family={disp} stagger={2.2} out={nameOut} />
                    </div>
                  ) : null}
                  {f >= greetIn - 1 ? (
                    <div style={{position: 'absolute', left: 0, top: 0, display: 'flex', alignItems: 'baseline'}}>
                      <BlurText text="Olá, Ana" frame={f} start={greetIn} size={150} weight={500} family={disp} stagger={1.2} dur={11} out={greetOut} />
                      {dotsOn ? (
                        <div style={{display: 'flex', gap: 12, marginLeft: 18}}>
                          {[0, 1, 2].map((k) => (
                            <div key={k} style={{width: 18, height: 18, borderRadius: 9, background: G.ink, transform: `translateY(${-Math.max(0, Math.sin((f - GREET - 16) / 3 - k * 0.9)) * 16}px)`}} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {f >= GREET + 30 && f < greetOut + 16 ? (
                <div style={{position: 'absolute', left: 476, top: 352}}>
                  <BlurText text="Por onde começamos?" frame={f} start={GREET + 32} size={92} weight={500} color={G.muted} family={disp} stagger={1.4} out={greetOut} />
                </div>
              ) : null}

              {/* ---------- balões da pessoa ---------- */}
              {bubbles.map((bb, k) => {
                if (f < bb.at - 1 || f > bb.end + 12) return null;
                const q = Easing.out(Easing.cubic)(clamp01((f - bb.at) / 14));
                const o = clamp01((f - bb.end) / 10);
                return (
                  <div key={k} style={{position: 'absolute', right: 270, top: 88, transform: `translateY(${(1 - q) * 520 - o * 40}px) scale(${mix(0.85, 1, q)})`, transformOrigin: '100% 0', opacity: 1 - o, filter: o > 0 ? `blur(${(o * 10).toFixed(1)}px)` : undefined}}>
                    <div style={{borderRadius: '30px 30px 8px 30px', background: '#E9EEF8', padding: '22px 30px', display: 'flex', alignItems: 'center', gap: 18}}>
                      {bb.chip ? (
                        <div style={{display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 16, padding: '6px 14px 6px 6px'}}>
                          <TabStack n={4} spread={0.7} />
                          <div style={{fontFamily: ui, fontWeight: 500, fontSize: 24, color: G.ink, whiteSpace: 'nowrap'}}>100 abas</div>
                        </div>
                      ) : null}
                      <div style={{fontFamily: ui, fontWeight: 500, fontSize: 36, color: G.ink, whiteSpace: 'nowrap'}}>{bb.text}</div>
                    </div>
                  </div>
                );
              })}

              {/* ---------- lendo as fontes ---------- */}
              {f >= THINK && f < ANSWER + 8 ? (
                <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: mono, fontWeight: 500, fontSize: 380, letterSpacing: -16, color: '#E4E8F1', lineHeight: 1, transform: `scale(${mix(0.9, 1, clamp01((f - THINK) / 10))})`, opacity: 1 - clamp01((f - ANSWER) / 8), filter: f > ANSWER ? `blur(${((f - ANSWER) * 2).toFixed(1)}px)` : undefined}}>
                  {readN}
                </div>
              ) : null}
              {statusOn ? (
                <div style={{position: 'absolute', left: 364, top: 192, opacity: 1 - clamp01((f - ANSWER) / 6)}}>
                  <div style={{fontFamily: ui, fontWeight: 500, fontSize: 40, color: G.muted, display: 'flex', gap: 12, alignItems: 'baseline'}}>
                    <span>Lendo</span>
                    <span style={{fontFamily: mono, color: G.ink, minWidth: 64, display: 'inline-block'}}>{f >= COUNT ? readN : 0}</span>
                    <span>fontes</span>
                  </div>
                </div>
              ) : null}
              {f >= THINK + 6 && f < ANSWER + 2
                ? Array.from({length: 10}).map((_, k) => {
                    const q = Easing.out(Easing.back(1.3))(clamp01((f - THINK - 6 - k * 3) / 14));
                    const back = Easing.in(Easing.cubic)(clamp01((f - (ANSWER - 12) - k * 0.6) / 12));
                    const a = (k / 9 - 0.5) * 0.9;
                    const tx = mix(316, 470 + (k / 9) * 1180, q);
                    const ty = mix(214, 470 - Math.sin((k / 9) * Math.PI) * 130 + (k % 2) * 120, q);
                    const x = mix(tx, 316, back);
                    const y = mix(ty, 214, back);
                    const sc = mix(0.2, 1, q) * (1 - back);
                    const w = wins[k * 3];
                    return (
                      <div key={k} style={{position: 'absolute', left: x - 110, top: y - 70, width: 220, height: 140, transform: `scale(${sc}) rotateY(${(a - 0.1) * -26}deg) rotateZ(${(k - 4.5) * 2}deg)`, opacity: sc > 0.02 ? 1 : 0}}>
                        <div style={{width: 220, height: 140, borderRadius: 16, background: '#fff', boxShadow: '0 20px 40px rgba(20,30,70,0.16)', overflow: 'hidden', border: '1px solid #E3E7EF'}}>
                          <div style={{height: 26, background: '#F1F3F7', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px'}}>
                            <div style={{width: 10, height: 10, borderRadius: 3, background: w.fav}} />
                            <div style={{fontFamily: ui, fontSize: 12, color: G.muted, whiteSpace: 'nowrap', overflow: 'hidden'}}>{w.title}</div>
                          </div>
                          <div style={{padding: 12}}>
                            {[90, 70, 80].map((ww, kk) => (
                              <div key={kk} style={{height: 7, width: `${ww}%`, borderRadius: 4, background: '#E1E5EC', marginTop: kk ? 8 : 0}} />
                            ))}
                          </div>
                          {/* luz do orbe na borda do cartão */}
                          <div style={{position: 'absolute', inset: 0, borderRadius: 16, background: 'linear-gradient(200deg, rgba(150,140,255,0.22), rgba(255,255,255,0) 45%)'}} />
                        </div>
                      </div>
                    );
                  })
                : null}

              {/* ---------- final: cem abas, uma resposta ---------- */}
              {f >= FINALE && f < RESOLVE + 34
                ? Array.from({length: 100}).map((_, k) => {
                    const q = ghostIn(k);
                    const s2 = ghostSuck(k);
                    if (q <= 0 || s2 >= 0.99) return null;
                    const col = k % 10;
                    const row = Math.floor(k / 10);
                    const gx = 60 + col * 186 + (row % 2) * 40 + noise1D(seed + k, f / 40) * 8;
                    const gy = 60 + row * 98 + noise1D(seed + k + 300, f / 40) * 6;
                    const tx = 1100 + 690 * 0.5;
                    const ty = 410 + 130;
                    const x = mix(gx, tx, s2);
                    const y = mix(gy, ty, s2);
                    const w = wins[k % wins.length];
                    return (
                      <div key={k} style={{position: 'absolute', left: x - 75, top: y - 42, width: 150, height: 84, borderRadius: 12, background: '#fff', border: '1px solid #E1E6EE', boxShadow: '0 10px 24px rgba(20,30,70,0.08)', transform: `scale(${q * (1 - s2 * 0.85)}) rotate(${(rand(seed + 92, k) - 0.5) * 10 * (1 - s2) + s2 * 90}deg)`, opacity: 0.55 + 0.45 * s2, overflow: 'hidden'}}>
                        <div style={{height: 18, background: '#EEF1F5', display: 'flex', alignItems: 'center', padding: '0 6px', gap: 4}}>
                          <div style={{width: 8, height: 8, borderRadius: 2, background: w.fav}} />
                          <div style={{height: 5, width: 70, borderRadius: 3, background: '#D5DAE3'}} />
                        </div>
                        <div style={{padding: 8}}>
                          <div style={{height: 5, width: '80%', borderRadius: 3, background: '#E3E7EE'}} />
                          <div style={{height: 5, width: '60%', borderRadius: 3, background: '#E3E7EE', marginTop: 6}} />
                        </div>
                      </div>
                    );
                  })
                : null}
              {f >= FINALE + 2 && f < RESOLVE + 34 ? (
                <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(247,248,251,${0.92 * ghostIn(0)}) 0%, rgba(247,248,251,${0.85 * ghostIn(0)}) 38%, rgba(247,248,251,0) 52%)`}} />
              ) : null}
              {/* ---------- cartão da resposta ---------- */}
              {f >= ANSWER && f < RESOLVE + 20 ? (
                <div
                  style={{
                    position: 'absolute',
                    left: mix(cardX, 1100, finCard) - 50,
                    top: mix(cardY, 410, finCard) - 40,
                    width: (cardW + 100) * mix(1, 0.5, finCard),
                    height: (cardH + 80) * mix(1, 0.5, finCard),
                    borderRadius: 80,
                    background: `conic-gradient(from ${-t * 40}deg, rgba(79,123,255,0.5), rgba(155,107,255,0.4), rgba(255,111,168,0.35), rgba(255,181,90,0.35), rgba(63,211,154,0.35), rgba(79,123,255,0.5))`,
                    filter: 'blur(60px)',
                    opacity: 0.3 * cardIn * (1 - lockOut),
                  }}
                />
              ) : null}
              {f >= ANSWER && f < RESOLVE + 20
                ? card(
                    {
                      left: mix(cardX, 1100, finCard),
                      top: mix(cardY, 410, finCard),
                      width: cardW,
                      height: cardH,
                      transform: `perspective(1600px) translateY(${(1 - cardIn) * 120}px) rotateX(${(1 - cardIn) * 22}deg) scale(${mix(0.9, 1, cardIn) * mix(1, 0.5, finCard) * (1 + ghostSuck(0) * 0.04 * (1 - lockOut))})`,
                      transformOrigin: finCard > 0 ? '0 0' : '50% 0',
                      opacity: 1 - lockOut,
                      filter: lockOut > 0 ? `blur(${(lockOut * 12).toFixed(1)}px)` : undefined,
                    },
                    <>
                      <div style={{position: 'absolute', inset: 0, borderRadius: 28, overflow: 'hidden', pointerEvents: 'none'}}>
                        {[ANSWER + 4, MORPH1 + 8, MORPH2 + 14].map((at, k) => {
                          const sw = clamp01((f - at) / 22);
                          if (sw <= 0 || sw >= 1) return null;
                          return <div key={k} style={{position: 'absolute', top: -200, bottom: -200, width: 260, left: mix(-400, cardW + 200, sw), background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(220,228,255,0.55), rgba(255,255,255,0))', transform: 'rotate(18deg)'}} />;
                        })}
                      </div>
                      <div style={{position: 'absolute', left: 40, top: 34}}>
                        {f < MORPH1 + 10 ? <BlurText text="Por onde começar" frame={f} start={ANSWER + 3} size={54} weight={600} family={disp} stagger={1} out={MORPH1 - 2} /> : null}
                        {f >= MORPH1 + 4 && f < MORPH2 + 10 ? <div style={{position: 'absolute', left: 0, top: 0}}><BlurText text="Em 3 passos" frame={f} start={MORPH1 + 6} size={54} weight={600} family={disp} stagger={1.2} out={MORPH2 - 2} /></div> : null}
                        {f >= MORPH2 + 4 ? <div style={{position: 'absolute', left: 0, top: 0}}><BlurText text="Seu plano da semana" frame={f} start={MORPH2 + 6} size={54} weight={600} family={disp} stagger={1} /></div> : null}
                      </div>
                      {/* passos (layout em lista → em chips) */}
                      {f < MORPH2 + 12
                        ? STEPS.map((st, i) => {
                            const at = F(38 + i);
                            const q = Easing.out(Easing.cubic)(clamp01((f - at + 3) / 12));
                            if (q <= 0) return null;
                            const r = rowRect(i);
                            const gone = clamp01((f - MORPH2) / 8);
                            const mi = io(clamp01((f - MORPH1 - i * 3) / 16));
                            const detail = 1 - clamp01(mi * 2);
                            const badge = Easing.out(Easing.back(2))(clamp01((f - at) / 9));
                            return (
                              <div key={i} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 22, background: mi > 0.01 ? `rgba(237,241,250,${mi})` : 'transparent', transform: `translateY(${(1 - q) * 30}px)`, opacity: q * (1 - gone), filter: q < 0.99 || gone > 0 ? `blur(${((1 - q) * 12 + gone * 10).toFixed(1)}px)` : undefined, display: 'flex', alignItems: 'center', gap: 24, padding: '0 24px', boxSizing: 'border-box', overflow: 'hidden'}}>
                                <div style={{width: 60, height: 60, borderRadius: 30, background: G.blue, color: '#fff', fontFamily: disp, fontWeight: 600, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: `scale(${badge})`}}>{i + 1}</div>
                                <div style={{flex: 1, minWidth: 0}}>
                                  <div style={{fontFamily: disp, fontWeight: 600, fontSize: 42, color: G.ink, whiteSpace: 'nowrap'}}>{mi > 0.5 ? st.short : st.t}</div>
                                  {detail > 0.01 ? <div style={{fontFamily: ui, fontSize: 30, color: G.muted, marginTop: 2, whiteSpace: 'nowrap', opacity: detail}}>{st.d}</div> : null}
                                </div>
                                {detail > 0.01 ? (
                                  <div style={{width: 200, height: 76, flexShrink: 0, opacity: detail, display: 'flex', alignItems: 'flex-end', gap: 10, justifyContent: 'flex-end'}}>
                                    {i === 0 ? (
                                      <div style={{width: 58, height: 72, borderRadius: 10, background: '#F2F5FB', border: '2px solid #DCE3F0', position: 'relative'}}>
                                        <div style={{position: 'absolute', left: 10, right: 10, top: 14, height: 6, borderRadius: 3, background: '#C9D2E3'}} />
                                        <div style={{position: 'absolute', left: 10, right: 20, top: 26, height: 6, borderRadius: 3, background: '#C9D2E3'}} />
                                        <div style={{position: 'absolute', right: -10, bottom: -8, width: 32, height: 32, borderRadius: 16, background: '#22A55B', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${Easing.out(Easing.back(2))(clamp01((f - at - 8) / 8))})`}}>
                                          <CheckIcon s={18} />
                                        </div>
                                      </div>
                                    ) : null}
                                    {i === 1
                                      ? [0.35, 0.55, 0.7, 1].map((hh, k) => (
                                          <div key={k} style={{width: 26, height: 72 * hh * Easing.out(Easing.cubic)(clamp01((f - at - 4 - k * 2) / 10)), borderRadius: 6, background: k === 3 ? G.blue : '#C9D4F5'}} />
                                        ))
                                      : null}
                                    {i === 2 ? (
                                      <div style={{width: 46, height: 76, borderRadius: 10, border: '3px solid #20242C', background: '#fff', position: 'relative', overflow: 'hidden'}}>
                                        <div style={{position: 'absolute', left: 6, top: 10, width: 24, height: 12, borderRadius: 6, background: '#C9D4F5', transform: `scale(${clamp01((f - at - 5) / 6)})`, transformOrigin: '0 50%'}} />
                                        <div style={{position: 'absolute', right: 6, top: 28, width: 22, height: 12, borderRadius: 6, background: '#22A55B', transform: `scale(${clamp01((f - at - 10) / 6)})`, transformOrigin: '100% 50%'}} />
                                        <div style={{position: 'absolute', left: 6, top: 46, width: 26, height: 12, borderRadius: 6, background: '#C9D4F5', transform: `scale(${clamp01((f - at - 15) / 6)})`, transformOrigin: '0 50%'}} />
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })
                        : null}
                      {/* calendário da semana (nasce dos chips) */}
                      {f >= MORPH2
                        ? DAYS.map((dd, j) => {
                            const st = MORPH2 + j * 3;
                            const q = io(clamp01((f - st) / 18));
                            const from = (() => {
                              const pi = parentOf[j];
                              const r = {x: 40 + pi * 440, y: 132, w: 410, h: 116};
                              return r;
                            })();
                            const to = colRect(j);
                            const flip = clamp01((f - (FLIPS - 6) - j * 2) / 12);
                            const rotY = (1 - Easing.out(Easing.cubic)(flip)) * 80;
                            const check = Easing.out(Easing.back(2))(clamp01((f - CHECKS - j * 3) / 9));
                            const done = j < 2;
                            return (
                              <div key={dd.d} style={{position: 'absolute', left: mix(from.x, to.x, q), top: mix(from.y, to.y, q), width: mix(from.w, to.w, q), height: mix(from.h, to.h, q), perspective: 900}}>
                                <div style={{position: 'absolute', inset: 0, borderRadius: 22, background: j === 0 ? '#EEF2FF' : '#F5F7FB', border: `2px solid ${j === 0 ? '#C9D6FF' : '#E6EAF1'}`, transform: `rotateY(${rotY}deg)`, padding: '22px 18px', boxSizing: 'border-box', overflow: 'hidden', boxShadow: '0 14px 30px rgba(20,30,70,0.06)'}}>
                                  <div style={{fontFamily: mono, fontWeight: 500, fontSize: 26, color: j === 0 ? G.blue : G.muted}}>{dd.d}</div>
                                  <div style={{fontFamily: disp, fontWeight: 600, fontSize: 28, color: G.ink, marginTop: 18, lineHeight: 1.15, opacity: q}}>{dd.t}</div>
                                  <div style={{position: 'absolute', left: 18, bottom: 22, width: 44, height: 44, borderRadius: 22, border: `3px solid ${done && check > 0.5 ? '#22A55B' : '#D3D9E4'}`, background: done ? `rgba(34,165,91,${check})` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    {done && check > 0.05 ? (
                                      <div style={{transform: `scale(${check})`}}>
                                        <CheckIcon s={24} />
                                      </div>
                                    ) : null}
                                  </div>
                                  {/* brilho da luz passando no cartão quando ele vira */}
                                  <div style={{position: 'absolute', inset: 0, background: `linear-gradient(110deg, rgba(255,255,255,0) ${flip * 120 - 30}%, rgba(255,255,255,0.75) ${flip * 120 - 15}%, rgba(255,255,255,0) ${flip * 120}%)`}} />
                                </div>
                              </div>
                            );
                          })
                        : null}
                    </>,
                    'answer',
                  )
                : null}

              {f >= FINALE + 2 && f < RESOLVE + 34
                ? bigTitle(
                    [
                      ['Cem abas.', FINALE + 6, G.ink],
                      ['Uma resposta.', RESOLVE + 2, G.blue],
                    ],
                    400,
                  )
                : null}

              {/* ---------- o orbe (luz) ---------- */}
              {orb.s > 0.5 ? (
                <div style={{position: 'absolute', left: orb.x, top: orb.y}}>
                  {f < FLASH + 24 ? <Rays size={2200} t={t} alpha={1 - clamp01((f - FLASH) / 24)} dark={false} /> : null}
                  <Orb size={orb.s} t={t} glow={orbGlow} spin={thinking ? 3 : 1} />
                </div>
              ) : null}

              {/* ---------- lockup final ---------- */}
              {f >= RESOLVE + 26 ? (
                <div style={{position: 'absolute', left: orb.x + 128 * 0.72, top: orb.y, transform: 'translateY(-50%)'}}>
                  <BlurText text="Gemini" frame={f} start={RESOLVE + 28} size={150} weight={500} family={disp} stagger={2} out={OUT - 6} />
                </div>
              ) : null}
            </div>
          </div>

          {/* ---------- caixa de pedido (com a luz atrás) ---------- */}
          {showBox ? (
            <div style={{position: 'absolute', left: boxX, top: boxY, width: boxW, height: boxH, transform: `translateY(${boxExit * 260}px) scale(${1 + pushF * 0.04})`, transformOrigin: '50% 0'}}>
              <div style={{position: 'absolute', left: -60, right: -60, top: -50, bottom: -30, borderRadius: 120, background: `conic-gradient(from ${t * 50}deg, rgba(79,123,255,0.55), rgba(155,107,255,0.45), rgba(255,111,168,0.4), rgba(255,181,90,0.42), rgba(63,211,154,0.4), rgba(79,123,255,0.55))`, filter: 'blur(46px)', opacity: 0.55 + 0.25 * Math.sin(t * 2)}} />
              <div style={{position: 'absolute', inset: 0, borderRadius: 44, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 30px 70px rgba(20,30,70,0.14)', padding: '30px 36px', boxSizing: 'border-box'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 16, height: 46}}>
                  <div style={{fontFamily: ui, fontWeight: 400, fontSize: 34, color: boxText ? G.ink : G.faint, whiteSpace: 'nowrap', overflow: 'hidden'}}>
                    {boxText || 'Pergunte ao Gemini'}
                    {caret ? <span style={{display: 'inline-block', width: 3, height: 38, background: G.blue, marginLeft: 3, verticalAlign: -7}} /> : null}
                  </div>
                </div>
                {chipIn > 0 ? (
                  <div style={{position: 'absolute', left: 140, bottom: 18, display: 'flex', alignItems: 'center', gap: 8, background: '#F1F4F9', borderRadius: 14, padding: '4px 14px 4px 4px', transform: `scale(${chipIn})`, transformOrigin: '0 50%'}}>
                    <TabStack n={4} spread={0.6} />
                    <div style={{fontFamily: ui, fontWeight: 500, fontSize: 22, color: G.ink}}>100 abas</div>
                  </div>
                ) : null}
                <div style={{position: 'absolute', left: 32, bottom: 22, display: 'flex', gap: 22}}>
                  <PlusIcon />
                  <SlidersIcon />
                </div>
                <div style={{position: 'absolute', right: 22, bottom: 18, width: 66, height: 66, borderRadius: 33, background: boxText || chipIn > 0 ? G.ink : '#E6E9EF', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - press * 0.18})`}}>
                  <SendIcon c={boxText || chipIn > 0 ? '#fff' : '#9AA1AE'} s={30} />
                </div>
              </div>
              {press > 0.05 ? <div style={{position: 'absolute', right: 22 + 33 - 60, bottom: 18 + 33 - 60, width: 120, height: 120, borderRadius: 60, border: `4px solid ${G.blue}`, transform: `scale(${1 + (1 - press) * 1.2})`, opacity: press}} /> : null}
              {/* sugestões acima da caixa (refinamento 2) */}
              {f >= TAP - 22 && f < MSG3 + 8
                ? ['Vira um plano da semana', 'Lista de custos', 'Me lembra amanhã'].map((s, k) => {
                    const q = Easing.out(Easing.cubic)(clamp01((f - (TAP - 22) - k * 3) / 12));
                    const tap = k === 0 && f >= TAP ? Math.exp(-(f - TAP) / 4) : 0;
                    const gone = clamp01((f - MSG3) / 8);
                    return (
                      <div key={s} style={{position: 'absolute', left: [0, 400, 690][k], top: -84, height: 62, borderRadius: 31, background: k === 0 ? '#EAF0FF' : '#fff', border: `2px solid ${k === 0 ? '#C9D6FF' : '#E3E7EF'}`, padding: '0 26px', display: 'flex', alignItems: 'center', fontFamily: ui, fontWeight: 500, fontSize: 26, color: k === 0 ? G.blue : G.muted, whiteSpace: 'nowrap', transform: `translateY(${(1 - q) * 40 - gone * 30}px) scale(${1 - tap * 0.08})`, opacity: q * (1 - gone), boxShadow: '0 12px 26px rgba(20,30,70,0.08)'}}>
                        {s}
                      </div>
                    );
                  })
                : null}
            </div>
          ) : null}

          {/* anexo "100 abas" voando para dentro da caixa */}
          {f >= CHIP - 14 && f < CHIP - 1
            ? (() => {
                const q = Easing.inOut(Easing.cubic)(clamp01((f - (CHIP - 14)) / 13));
                return (
                  <div style={{position: 'absolute', left: mix(-140, boxX + 140, q), top: mix(380, boxY + boxH - 66, q), transform: `scale(${mix(3.2, 1, q)}) rotate(${(1 - q) * -30}deg)`, filter: q < 0.9 ? `blur(${((1 - q) * 6).toFixed(1)}px)` : undefined}}>
                    <TabStack n={5} spread={1 + (1 - q) * 1.5} />
                  </div>
                );
              })()
            : null}

          {/* a luz apaga antes da assinatura */}
          {dim > 0 ? <div style={{position: 'absolute', inset: 0, background: '#0A0A0A', opacity: Math.min(1, dim * 1.15)}} /> : null}
          {dim > 0 && orb.s > 0.5 ? (
            <div style={{position: 'absolute', left: CX + (orb.x - CX) * camS * mix(1, 0.94, pullK), top: 640 + (orb.y - 640) * camS * mix(1, 0.94, pullK)}}>
              <Orb size={orb.s * camS * mix(1, 0.94, pullK)} t={t} glow={1.3} spin={2} />
            </div>
          ) : null}
        </>
      )}

      {/* flash da passagem do escuro para o claro */}
      {flash > 0 ? <div style={{position: 'absolute', inset: 0, background: '#FFFFFF', opacity: flash}} /> : null}
      {/* grão leve */}
      <svg style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: dark ? 0.16 : 0.07, pointerEvents: 'none'}} width={W} height={H}>
        <filter id={`grain-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={(seed * 97 + f) % 9973} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter={`url(#grain-${id})`} />
      </svg>
    </AbsoluteFill>
  );
};
