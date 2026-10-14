// Kyneo · "A proposta ficou no visto" (v2).
// Um set escuro com cinco estações lado a lado: o celular da Solare (A), o celular da Marina (B),
// o contrato do concorrente (C), as versões da proposta (D) e o set de cinema (E). A câmera passa
// entre elas conforme a voz. Três camadas de profundidade (fundo, meio, frente) dão o jogo de planos;
// os textos entram sem caixa, uns atrás dos objetos e outros na frente.
// Tudo deriva do frame (prop `frame` ou useCurrentFrame).
import React from 'react';
import {AbsoluteFill, Easing, Html5Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, lin, mix, pop} from '../../lib/anim';
import {beatFrames, beatPulse, type Beats} from '../../lib/beats';
import {loadBrandFonts, type Brand} from '../../lib/brand';
import {noise1D, rand} from '../../lib/noise';
import {Avatar, BlankTile, ChatA, ChatB, Clapper, CompanyLogo, FilmReel, MiniTile, PHONE, Phone, Profile, REPLY, ReelView, SCREEN, SOL, SolarePost, tileRect, type Fonts, type Pal} from './parts';

export type VideoProps = {id: string; beats: Beats; brand: Brand; seed: number; withAudio?: boolean; fps?: number; frame?: number};

const A_X = 0;
const B_X = 1400;
const C_X = 2900;
const D_X = 4300;
const E_X = 5800;
const ANCHOR = {x: 540, y: 1040};

type Cam = {x: number; y: number; s: number; ry: number};
type Key = Cam & {f: number; e?: 'whip' | 'smooth' | 'push'};

const EASES = {
  smooth: Easing.bezier(0.45, 0, 0.2, 1),
  whip: Easing.bezier(0.8, 0, 0.12, 1),
  push: Easing.bezier(0.3, 0, 0.1, 1),
};

const camAt = (keys: Key[], f: number): Cam => {
  if (f <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const t = EASES[b.e ?? 'smooth']((f - a.f) / Math.max(1, b.f - a.f));
      return {x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), s: mix(a.s, b.s, t), ry: mix(a.ry, b.ry, t)};
    }
  }
  return keys[keys.length - 1];
};

// Texto cinético sem caixa: cada palavra sobe por trás de uma máscara e a frase desliza devagar
// (mais rápido na frente, mais devagar no fundo), o que separa os planos.
type KProps = {
  t: string;
  size: number;
  x: number;
  y: number;
  enter: number;
  exit?: number;
  depth: number; // 0.3 fundo · 1 frente
  frame: number;
  fps: number;
  family: string;
  weight?: number;
  color: string;
};
const Kinetic: React.FC<KProps> = ({t, size, x, y, enter, exit, depth, frame, fps, family, weight = 600, color}) => {
  if (frame < enter - 1) return null;
  if (exit !== undefined && frame > exit + 14) return null;
  const words = t.split(' ');
  const slide = (1 - ease(frame, enter, 22)) * 160 * depth;
  const drift = (frame - enter) * 0.9 * depth;
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', gap: size * 0.26, transform: `translateX(${slide - drift}px)`, whiteSpace: 'nowrap'}}>
      {words.map((w, i) => {
        const rise = pop(frame, enter + i * 3, fps, 200, 20);
        const out = exit === undefined ? 0 : ease(frame, exit + i * 2, 10);
        return (
          <div key={i} style={{overflow: 'hidden', padding: `${size * 0.06}px 0 ${size * 0.28}px`}}>
            <div style={{fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 0.92, letterSpacing: -size * 0.035, color, transform: `translateY(${(1 - rise) * 108 - out * 112}%)`}}>{w}</div>
          </div>
        );
      })}
    </div>
  );
};

// Ângulo do ponteiro dos minutos: parado, depois duas voltas e meia com aceleração e freio.
const spinAt = (frame: number, a: number, b: number) => {
  const t = Math.max(0, Math.min(1, (frame - a) / (b - a)));
  const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  return 0.6 + e * Math.PI * 2 * 2.5;
};

export const Video: React.FC<VideoProps> = ({id, beats, brand, seed, withAudio = true, fps: fpsProp, frame: frameProp}) => {
  loadBrandFonts(brand);
  const current = useCurrentFrame();
  const frame = frameProp ?? current;
  const config = useVideoConfig();
  const fps = fpsProp ?? config.fps;
  const b = beatFrames(beats, fps);
  const F = (k: number) => b[k];
  const c = brand.colors;
  const p: Pal = {
    bg: c.bg,
    surface: c.surface,
    ink: c.ink,
    muted: c.muted,
    trail: c.trail ?? c.muted,
    line: c.line ?? c.muted,
    signal: c.signal ?? c.accent,
    screen: '#0F1012',
    bubbleOut: '#26282C',
    bubbleIn: '#18191C',
    hair: 'rgba(212,215,219,0.12)',
  };
  const fonts: Fonts = {display: brand.fonts.display.family, ui: brand.fonts.ui.family, mono: brand.fonts.mono?.family ?? brand.fonts.ui.family};
  const tailSec = (beats as Beats & {tailSec?: number}).tailSec;
  const tailStart = tailSec ? Math.round(tailSec * fps) : 1e9;

  // --- assinatura no fim (quadros extraídos do arquivo, puro por frame) ------------------------
  if (frame >= tailStart) {
    const n = Math.min(75, frame - tailStart + 1);
    return (
      <AbsoluteFill style={{background: c.bg}}>
        {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
        <Img src={staticFile(`${id}/trailer/${String(n).padStart(3, '0')}.jpg`)} style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
    );
  }

  // --- câmera -------------------------------------------------------------------------------
  const keys: Key[] = [
    {f: 0, x: 52, y: -96, s: 2.3, ry: -7},
    {f: F(2), x: 52, y: -96, s: 2.1, ry: -5, e: 'push'},
    {f: F(3) - 4, x: 40, y: -80, s: 2.0, ry: -4},
    {f: F(3) + 9, x: B_X, y: -110, s: 1.2, ry: 8, e: 'whip'},
    {f: F(6), x: B_X - 6, y: -120, s: 1.24, ry: 5},
    {f: F(10) - 8, x: B_X, y: -130, s: 1.3, ry: 3},
    {f: F(10) + 4, x: A_X, y: -150, s: 1.3, ry: -8, e: 'whip'},
    {f: F(13) - 8, x: A_X + 10, y: -160, s: 1.38, ry: -5},
    {f: F(13) + 4, x: C_X, y: 0, s: 1.0, ry: 0, e: 'whip'},
    {f: F(16) - 8, x: C_X + 10, y: -10, s: 1.07, ry: 0},
    {f: F(16) + 3, x: D_X, y: 20, s: 1.08, ry: 0, e: 'whip'},
    {f: F(21) - 6, x: D_X, y: 10, s: 1.14, ry: 0},
    {f: F(21) + 6, x: B_X, y: -66, s: 1.1, ry: 5, e: 'whip'},
    {f: F(23) - 9, x: B_X, y: -70, s: 1.13, ry: 4},
    {f: F(23) - 1, x: E_X, y: 40, s: 1.14, ry: 0, e: 'whip'},
    {f: F(30) - 8, x: E_X + 20, y: 30, s: 1.22, ry: 0},
    {f: F(30) + 3, x: B_X, y: -66, s: 1.1, ry: 0, e: 'whip'},
    {f: F(34), x: B_X, y: -40, s: 1.16, ry: -2},
    {f: F(35) + 8, x: B_X, y: -30, s: 1.22, ry: -4, e: 'push'},
    {f: F(38) - 4, x: B_X, y: -10, s: 1.25, ry: -3},
    {f: F(38) + 8, x: B_X, y: 330, s: 1.6, ry: 2, e: 'push'},
    {f: F(40) + 1, x: B_X, y: 310, s: 1.62, ry: 2},
    {f: F(40) + 12, x: A_X, y: -150, s: 1.3, ry: -7, e: 'whip'},
    {f: F(42), x: A_X, y: -150, s: 1.34, ry: -5},
    {f: F(44), x: A_X - 30, y: -175, s: 1.44, ry: -2, e: 'push'},
  ];
  const cam0 = camAt(keys, frame);
  const camPrev = camAt(keys, frame - 1);
  const shake = beatPulse(frame, [F(14), F(19), F(23)], 5);
  const cam = {
    x: cam0.x + noise1D(seed, frame / 45) * 5 + shake * noise1D(seed + 9, frame * 1.7) * 10,
    y: cam0.y + noise1D(seed + 1, frame / 52) * 5 + shake * noise1D(seed + 10, frame * 1.9) * 10,
    s: cam0.s * (1 + shake * 0.014),
    ry: cam0.ry,
  };
  const rz = noise1D(seed + 2, frame / 70) * 0.25;
  const vx = (cam0.x - camPrev.x) * cam0.s;
  const vy = (cam0.y - camPrev.y) * cam0.s;
  const blurX = Math.min(40, Math.abs(vx) * 0.3);
  const blurY = Math.min(20, Math.abs(vy) * 0.3);
  const near = (x: number, r = 2300) => Math.abs(cam.x - x) < r;
  // Camada do mundo com fator de profundidade k (k<1 fundo, k>1 frente).
  const layer = (k: number): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${ANCHOR.x}px, ${ANCHOR.y}px) rotate(${rz}deg) scale(${cam.s * k}) translate(${-cam.x}px, ${-cam.y}px)`,
  });

  // --- celular A (Solare) -------------------------------------------------------------------
  const ticksBlue = ease(frame, F(1), 6);
  const ticksPop = frame >= F(1) ? Math.exp(-(frame - F(1)) / 6) * Math.min(1, (frame - F(1)) / 2) : 0;
  const clock = frame < F(11) ? '21:14' : frame < F(12) ? '23:47' : frame < F(40) ? '08:12' : '09:02';
  const statusA = frame < F(10) ? 'online' : frame < F(12) ? 'visto por último hoje às 21:16' : frame < F(41) ? 'visto por último ontem às 21:16' : 'online';
  const dayChip = frame < F(12) ? 'Hoje' : 'Ontem';
  const reply = pop(frame, F(41), fps, 200, 16);
  const clockIn = pop(frame, F(10) + 4, fps, 200, 15);
  const spin = spinAt(frame, F(11) - 2, F(12) + 10);

  // --- celular B (Marina) ------------------------------------------------------------------
  const screenB: 'insta' | 'insta2' | 'reel' | 'chat' = frame < F(21) ? 'insta' : frame < F(35) ? 'insta2' : frame < F(38) ? 'reel' : 'chat';
  const dateChip = pop(frame, F(6), fps, 240, 15);
  const blankAt = (i: number) => F(21) + 2 + i * 2;
  const fillAt = (i: number) => F(30 + Math.floor(i / 3)) + (i % 3) * 4;
  let filled = 0;
  for (let i = 0; i < 9; i++) if (frame >= fillAt(i)) filled++;
  const postsCount = String(9 + filled);
  const tap = frame >= F(34) ? lin(frame, F(34), 12) : 0;
  const expand = ease(frame, F(35) - 2, 12);
  const reelT = (frame - F(35)) / fps;
  const progress = lin(frame, F(35), F(38) - F(35));
  const like = frame >= F(37) ? lin(frame, F(37), 8) : 0;
  const typedN = Math.round(lin(frame, F(38) + 2, F(40) - F(38) - 6) * REPLY.length);
  const sendPress = frame >= F(40) ? Math.exp(-(frame - F(40)) / 4) : 0;
  const sent = pop(frame, F(40) + 1, fps, 230, 18);
  const reelClose = screenB === 'chat' ? 1 - ease(frame, F(38), 10) : 0;

  const renderTile = (i: number) => {
    if (screenB === 'insta') {
      return (
        <>
          <SolarePost i={i} fonts={fonts} />
          {i === 0 && dateChip > 0.01 ? (
            <div style={{position: 'absolute', left: 10, top: 10, transform: `scale(${dateChip})`, transformOrigin: '0 0', background: p.bg, color: p.ink, fontFamily: fonts.mono, fontSize: 30, padding: '6px 12px', borderRadius: 8}}>12 MAR</div>
          ) : null}
        </>
      );
    }
    const blank = ease(frame, blankAt(i), 6);
    const fill = pop(frame, fillAt(i), fps, 230, 15);
    if (fill > 0.01) {
      return (
        <div style={{position: 'absolute', inset: 0, transform: `scale(${0.55 + 0.45 * fill}) rotate(${(1 - fill) * (i % 2 ? 6 : -6)}deg)`}}>
          <MiniTile p={p} fonts={fonts} i={i} />
        </div>
      );
    }
    return (
      <>
        {blank < 1 ? (
          <div style={{position: 'absolute', inset: 0, transform: `scale(${1 - blank})`}}>
            <SolarePost i={i} fonts={fonts} />
          </div>
        ) : null}
        {blank > 0 ? <BlankTile p={p} /> : null}
      </>
    );
  };

  let screenBNode: React.ReactNode;
  if (screenB === 'chat') screenBNode = <ChatB p={p} fonts={fonts} typed={REPLY.slice(0, typedN)} caret={frame < F(40)} send={sendPress} sent={sent} />;
  else {
    const prof = <Profile p={p} fonts={fonts} posts={postsCount} renderTile={renderTile} />;
    if (expand > 0) {
      const r = tileRect(4);
      const w = mix(r.w, SCREEN.w, expand);
      const h = mix(r.h, SCREEN.h, expand);
      screenBNode = (
        <>
          {prof}
          <div style={{position: 'absolute', left: mix(r.x, 0, expand), top: mix(r.y, 0, expand), width: w, height: h, overflow: 'hidden', borderRadius: 40 * expand}}>
            <div style={{width: SCREEN.w, height: SCREEN.h, transform: `scale(${w / SCREEN.w})`, transformOrigin: '0 0'}}>
              <ReelView p={p} fonts={fonts} t={Math.max(0, reelT)} progress={progress} like={like} />
            </div>
          </div>
        </>
      );
    } else screenBNode = prof;
  }
  const tapRing =
    tap > 0 && tap < 1 ? (
      <div style={{position: 'absolute', left: tileRect(4).x + tileRect(4).w / 2 - 60, top: tileRect(4).y + tileRect(4).h / 2 - 60, width: 120, height: 120, borderRadius: 60, border: `4px solid ${p.ink}`, transform: `scale(${0.4 + tap * 0.9})`, opacity: 1 - tap}} />
    ) : null;

  // --- contrato do concorrente (C) ---------------------------------------------------------
  const sign = lin(frame, F(13) + 6, 16);
  const stamp = pop(frame, F(14), fps, 320, 16);
  const paperInk = '#1B1B1D';
  const paperGray = '#CFCBC2';

  // --- versões da proposta (D) -------------------------------------------------------------
  const fan = (i: number) => pop(frame, F(16) - 6 + i * 2, fps, 180, 16);
  const checks = [F(16) + 6, F(17), F(18)].map((f) => pop(frame, f, fps, 260, 14));
  const perfilRow = pop(frame, F(19), fps, 220, 13);
  const perfilBlink = frame >= F(19) ? (Math.floor((frame - F(19)) / 7) % 2 === 0 ? 1 : 0.35) : 1;

  // --- cinema (E) -------------------------------------------------------------------------
  const clapOpen = frame < F(23) - 5 ? 1 : 1 - ease(frame, F(23) - 5, 5);
  const cut = ease(frame, F(27) + 1, 6);
  const split = pop(frame, F(28), fps, 200, 14);
  const reelAngle = frame * 1.6;
  const stripShift = (frame * 9) % 140;

  // --- calendário: os meses que passaram desde março, voando do post para a câmera -------------
  const MONTHS = ['ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT'];

  const filterId = `mb-${id}`;
  const blurOn = blurX > 0.6 || blurY > 0.6;
  const handle = noise1D(seed + 5, frame / 60) * 40;
  const blurWrap: React.CSSProperties = {position: 'absolute', inset: 0, filter: blurOn ? `url(#${filterId})` : undefined};

  // Texto: palavras grandes ficam atrás (o objeto cobre a base das letras); as pequenas, na frente.
  const BIG = 178;
  const bigY = 262;
  const smallY = 150;
  const kin = {frame, fps, family: fonts.display};

  return (
    <AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
      {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={`${blurX.toFixed(2)} ${blurY.toFixed(2)}`} />
        </filter>
        <filter id={`dof-${id}`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </svg>

      {/* ---------- FUNDO (k=0.75): curva da marca e as bobinas do cinema ---------- */}
      <div style={blurWrap}>
        <div style={layer(0.75)}>
          <svg style={{position: 'absolute', left: -1400, top: -900}} width="9200" height="1800" viewBox="0 0 9200 1800" fill="none">
            <path d={`M0 1500 C ${1500 + handle} 1500, ${2100 - handle} 260, 3600 260 S 6400 1300, 9200 600`} stroke={p.line} strokeOpacity="0.08" strokeWidth="3" />
            <circle cx={1500 + handle} cy="1500" r="9" fill={p.line} fillOpacity="0.12" />
            <circle cx={2100 - handle} cy="260" r="9" fill={p.line} fillOpacity="0.12" />
            <rect x="3588" y="248" width="24" height="24" fill={p.line} fillOpacity="0.14" transform="rotate(45 3600 260)" />
          </svg>
          {near(E_X) ? (
            <>
              <div style={{position: 'absolute', left: E_X - 120, top: -980}}>
                <FilmReel p={p} size={980} angle={reelAngle} opacity={0.22} />
              </div>
              <div style={{position: 'absolute', left: E_X - 820, top: -1060}}>
                <FilmReel p={p} size={560} angle={-reelAngle * 1.3} opacity={0.16} />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* ---------- TEXTO DE FUNDO (atrás dos objetos) ---------- */}
      <Kinetic t="MARÇO" size={BIG} x={52} y={bigY - 36} enter={F(6) + 2} exit={F(10) - 10} depth={0.3} color={p.ink} {...kin} />
      <Kinetic t="VISTO" size={BIG} x={52} y={bigY} enter={F(10) + 3} exit={F(13) - 9} depth={0.3} color={p.ink} {...kin} />
      <Kinetic t="PERFIL" size={166} x={52} y={bigY + 14} enter={F(19)} exit={F(23) - 10} depth={0.3} color={p.ink} {...kin} />
      <Kinetic t="VÍDEO" size={BIG} x={52} y={bigY} enter={F(30) + 3} exit={F(34) - 4} depth={0.3} color={p.ink} {...kin} />
      <Kinetic t="PREÇO" size={BIG} x={52} y={bigY - 36} enter={F(41) + 3} depth={0.3} color={p.ink} {...kin} />

      {/* ---------- MEIO (k=1): celulares, contrato, versões, claquete ---------- */}
      <div style={blurWrap}>
        <div style={layer(1)}>
          {/* Faixa de filme atrás da claquete */}
          {near(E_X) ? (
            <div style={{position: 'absolute', left: E_X - 1100, top: 120, width: 2200, height: 150, background: '#151517', transform: 'rotate(-14deg)', overflow: 'hidden', borderTop: `2px solid ${p.trail}`, borderBottom: `2px solid ${p.trail}`}}>
              <div style={{position: 'absolute', left: -stripShift, top: 0, display: 'flex', gap: 20}}>
                {Array.from({length: 18}).map((_, i) => (
                  <div key={i} style={{width: 120, height: 150, position: 'relative'}}>
                    <div style={{position: 'absolute', left: 10, top: 10, width: 24, height: 14, borderRadius: 3, background: p.bg}} />
                    <div style={{position: 'absolute', left: 10, bottom: 10, width: 24, height: 14, borderRadius: 3, background: p.bg}} />
                    <div style={{position: 'absolute', left: 6, right: 6, top: 34, bottom: 34, borderRadius: 4, background: i % 3 === 0 ? '#3A3C40' : '#2A2C30'}} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {near(A_X) ? (
            <div style={{position: 'absolute', left: A_X - PHONE.w / 2, top: -PHONE.h / 2, transform: `perspective(2600px) rotateY(${cam.ry}deg)`}}>
              <Phone p={p} fonts={fonts} time={clock} ry={cam.ry}>
                <ChatA p={p} fonts={fonts} s={{status: statusA, dayChip, ticksBlue, ticksPop, reply}} />
              </Phone>
            </div>
          ) : null}

          {near(B_X) ? (
            <div style={{position: 'absolute', left: B_X - PHONE.w / 2, top: -PHONE.h / 2, transform: `perspective(2600px) rotateY(${cam.ry}deg)`}}>
              <Phone p={p} fonts={fonts} time={screenB === 'chat' ? '09:01' : '21:20'} ry={cam.ry} tone="silver">
                {screenBNode}
                {screenB === 'insta2' ? tapRing : null}
                {reelClose > 0 ? (
                  <div style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - reelClose) * 100}%)`}}>
                    <ReelView p={p} fonts={fonts} t={Math.max(0, reelT)} progress={1} like={1} />
                  </div>
                ) : null}
              </Phone>
            </div>
          ) : null}

          {/* Contrato do concorrente */}
          {near(C_X) ? (
            <div style={{position: 'absolute', left: C_X - 380, top: -520, width: 760, height: 1040, borderRadius: 10, background: '#F1EFEA', padding: '54px 58px', boxSizing: 'border-box', transform: 'rotate(-2deg)', boxShadow: '0 50px 120px rgba(0,0,0,0.6)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <CompanyLogo kind="fotonix" size={70} />
                <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 32, color: paperInk}}>Fotonix Solar</div>
                <div style={{marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 22, color: '#8A8578'}}>Nº 0412</div>
              </div>
              <div style={{fontFamily: fonts.display, fontWeight: 600, fontSize: 40, color: paperInk, marginTop: 52, lineHeight: 1.15}}>CONTRATO DE FORNECIMENTO</div>
              <div style={{fontFamily: fonts.ui, fontSize: 26, color: '#6B675E', marginTop: 16}}>Usina solar 75 kWp · Atlas Alimentos</div>
              {[600, 640, 520, 610, 580, 420].map((w, i) => (
                <div key={i} style={{height: 13, width: w, borderRadius: 6, background: paperGray, marginTop: i ? 18 : 44}} />
              ))}
              <div style={{position: 'absolute', left: 58, right: 58, bottom: 70, display: 'flex', gap: 50}}>
                {[0, 1].map((k) => (
                  <div key={k} style={{flex: 1}}>
                    <svg width="290" height="90" viewBox="0 0 290 90" fill="none">
                      <path
                        d={k ? 'M20 60 C 50 10, 70 80, 100 40 S 150 20, 170 55 S 230 30, 270 40' : 'M15 55 C 40 15, 60 75, 90 35 C 110 10, 120 70, 150 50 C 175 35, 200 65, 230 30 L 270 45'}
                        stroke="#1F3B8C"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray="520"
                        strokeDashoffset={k ? 0 : 520 * (1 - sign)}
                      />
                    </svg>
                    <div style={{height: 3, background: paperInk}} />
                    <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 12}}>
                      {k ? <CompanyLogo kind="fotonix" size={34} /> : <Avatar who="marina" size={34} />}
                      <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 22, color: paperInk}}>{k ? 'Fotonix Solar' : 'Marina · Atlas'}</div>
                    </div>
                  </div>
                ))}
              </div>
              {stamp > 0.01 ? (
                <div style={{position: 'absolute', left: 250, top: 470, transform: `rotate(-14deg) scale(${mix(2.4, 1, stamp)})`, opacity: Math.min(1, stamp * 3), border: `9px solid ${SOL.red}`, borderRadius: 14, padding: '10px 28px', color: SOL.red, fontFamily: fonts.display, fontWeight: 600, fontSize: 84, letterSpacing: 2, mixBlendMode: 'multiply'}}>FECHADO</div>
              ) : null}
            </div>
          ) : null}

          {/* Versões da proposta: v1 a v6 em leque, a v7 na frente com a lista */}
          {near(D_X) ? (
            <>
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const q = fan(i);
                const rot = mix(0, -16 + i * 5.2, q);
                const dx = mix(0, -260 + i * 90, q);
                const dy = mix(0, -40 + Math.abs(i - 2.5) * 22, q);
                return (
                  <div key={i} style={{position: 'absolute', left: D_X - 340 + dx, top: -470 + dy, width: 680, height: 900, borderRadius: 26, background: '#2A2C30', border: `2px solid ${p.muted}`, transform: `rotate(${rot}deg)`, transformOrigin: '50% 100%', padding: 30, boxSizing: 'border-box'}}>
                    <div style={{fontFamily: fonts.mono, fontSize: 30, color: p.ink}}>v{i + 1}</div>
                    {[420, 360, 400].map((w, k) => (
                      <div key={k} style={{height: 12, width: w, borderRadius: 6, background: p.trail, marginTop: k ? 14 : 26, opacity: 0.5}} />
                    ))}
                  </div>
                );
              })}
              <div style={{position: 'absolute', left: D_X - 380, top: -440, width: 760, borderRadius: 30, background: p.surface, border: `2px solid ${p.trail}`, padding: '46px 52px', boxSizing: 'border-box', boxShadow: '0 40px 100px rgba(0,0,0,0.6)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                    <CompanyLogo kind="solare" size={56} />
                    <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 40, color: p.ink}}>Proposta comercial</div>
                  </div>
                  <div style={{fontFamily: fonts.mono, fontSize: 26, color: p.bg, background: p.ink, borderRadius: 10, padding: '6px 14px'}}>v7</div>
                </div>
                {[620, 540, 590].map((w, i) => (
                  <div key={i} style={{height: 13, width: w, borderRadius: 7, background: p.trail, marginTop: i ? 16 : 30, opacity: 0.7}} />
                ))}
                <div style={{marginTop: 36}}>
                  {['Escopo', 'Prazo', 'Preço', 'Perfil'].map((t, i) => {
                    const done = i < 3 ? checks[i] : 0;
                    const isPerfil = i === 3;
                    if (isPerfil && perfilRow <= 0.01) return <div key={t} style={{height: 84}} />;
                    return (
                      <div key={t} style={{display: 'flex', alignItems: 'center', gap: 26, height: 84, borderTop: `1px solid ${p.hair}`, transform: isPerfil ? `translateX(${(1 - perfilRow) * 80}px)` : undefined, opacity: isPerfil ? Math.min(1, perfilRow * 1.5) : 1}}>
                        <div style={{width: 46, height: 46, borderRadius: 10, border: `3px solid ${isPerfil ? p.ink : SOL.green}`, background: done > 0.5 ? SOL.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isPerfil ? perfilBlink : 1}}>
                          {done > 0.01 ? (
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{transform: `scale(${done})`}}>
                              <path d="M5 12.5l4.5 4.5L19 7" />
                            </svg>
                          ) : null}
                        </div>
                        <div style={{fontFamily: fonts.ui, fontWeight: isPerfil ? 600 : 500, fontSize: 38, color: isPerfil ? p.ink : p.muted}}>{t}</div>
                        {!isPerfil && done > 0.5 ? <div style={{marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 22, color: p.muted}}>revisado</div> : null}
                        {isPerfil ? <div style={{marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 24, color: p.ink}}>ninguém olhou</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          {/* Claquete da produtora */}
          {near(E_X) ? (
            <div style={{position: 'absolute', left: E_X - 380, top: -330}}>
              <Clapper p={p} fonts={fonts} w={760} open={clapOpen} cut={cut} split={split} />
            </div>
          ) : null}
        </div>
      </div>

      {/* ---------- FRENTE (k=1.18): relógio e folhas do calendário ---------- */}
      <div style={blurWrap}>
        <div style={layer(1.18)}>
          {near(A_X) && clockIn > 0.01 && frame < F(14) ? (
            <div style={{position: 'absolute', left: A_X - 320, top: -65, width: 250, height: 250, transform: `scale(${clockIn})`}}>
              <svg width="250" height="250" viewBox="0 0 250 250">
                <circle cx="125" cy="125" r="118" fill="#141416" stroke={p.line} strokeWidth="6" />
                {Array.from({length: 12}).map((_, i) => {
                  const a = (i * Math.PI) / 6;
                  return <line key={i} x1={125 + Math.cos(a) * 92} y1={125 + Math.sin(a) * 92} x2={125 + Math.cos(a) * 106} y2={125 + Math.sin(a) * 106} stroke={p.muted} strokeWidth={i % 3 === 0 ? 6 : 3} strokeLinecap="round" />;
                })}
                <line x1="125" y1="125" x2={125 + Math.sin(spin / 12) * 56} y2={125 - Math.cos(spin / 12) * 56} stroke={p.ink} strokeWidth="9" strokeLinecap="round" />
                <line x1="125" y1="125" x2={125 + Math.sin(spin) * 86} y2={125 - Math.cos(spin) * 86} stroke={p.signal} strokeWidth="6" strokeLinecap="round" />
                <circle cx="125" cy="125" r="9" fill={p.ink} />
              </svg>
            </div>
          ) : null}
          {near(B_X)
            ? MONTHS.map((m, i) => {
                const st = F(8) - 6 + i * 3;
                const q = (frame - st) / 18;
                if (q <= 0 || q >= 1) return null;
                const e = Easing.in(Easing.quad)(q);
                const ox = B_X - 180;
                const oy = 80;
                const tx = ox + (rand(seed + 3, i) - 0.5) * 1600;
                const ty = oy - 300 - rand(seed + 4, i) * 700;
                const sc = mix(0.35, 2.6, e);
                return (
                  <div
                    key={m}
                    style={{
                      position: 'absolute',
                      left: mix(ox, tx, e) - 110,
                      top: mix(oy, ty, e) - 130,
                      width: 220,
                      height: 260,
                      borderRadius: 14,
                      background: '#F1EFEA',
                      overflow: 'hidden',
                      transform: `scale(${sc}) rotate(${(rand(seed + 5, i) - 0.5) * 70 * e}deg)`,
                      filter: e > 0.55 ? `url(#dof-${id})` : undefined,
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div style={{height: 64, background: SOL.red}} />
                    <div style={{textAlign: 'center', fontFamily: fonts.display, fontWeight: 600, fontSize: 58, color: '#1B1B1D', marginTop: 40}}>{m}</div>
                  </div>
                );
              })
            : null}
        </div>
      </div>

      {/* ---------- TEXTO DA FRENTE ---------- */}
      <Kinetic t="ÚLTIMO POST" size={66} x={64} y={smallY} enter={F(6)} exit={F(10) - 10} depth={1} color={p.muted} {...kin} />
      <Kinetic t="NO" size={86} x={64} y={smallY - 20} enter={F(10)} exit={F(13) - 9} depth={1} color={p.muted} {...kin} />
      <Kinetic t="ACESSÍVEL" size={124} x={56} y={bigY - 40} enter={F(27)} exit={F(30) - 8} depth={1} color={p.ink} {...kin} />
      <Kinetic t="ESTE" size={86} x={64} y={smallY - 20} enter={F(30)} exit={F(34) - 4} depth={1} color={p.muted} {...kin} />
      <Kinetic t="ANTES DO" size={86} x={64} y={smallY - 20} enter={F(41)} depth={1} color={p.muted} {...kin} />

      {/* Grão de filme (determinístico) e vinheta */}
      <svg style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.22, pointerEvents: 'none'}} width="1080" height="1920">
        <filter id={`grain-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={(seed * 97 + frame) % 9973} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter={`url(#grain-${id})`} />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 85% 70% at 50% 52%, transparent 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
