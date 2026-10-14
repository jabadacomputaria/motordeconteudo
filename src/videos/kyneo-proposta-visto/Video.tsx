// Kyneo · "A proposta ficou no visto".
// Dois celulares num mesmo set escuro: o seu (à esquerda, a conversa com o cliente) e o do cliente
// (à direita, o seu perfil e as conversas dele). A câmera passa de um para o outro conforme a voz.
// Tudo deriva do frame (prop `frame` ou useCurrentFrame). Cortes ancorados nas frases, no beat mais próximo.
import React from 'react';
import {AbsoluteFill, Easing, Html5Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, lin, mix, pop} from '../../lib/anim';
import {beatFrames, beatPulse, type Beats} from '../../lib/beats';
import {loadBrandFonts, type Brand} from '../../lib/brand';
import {noise1D} from '../../lib/noise';
import {BlankTile, ChatA, ChatB, ChatList, MiniTile, OldPost, PHONE, Phone, Profile, REPLY, ReelView, SCREEN, tileRect, type Fonts, type Pal} from './parts';

export type VideoProps = {id: string; beats: Beats; brand: Brand; seed: number; withAudio?: boolean; fps?: number; frame?: number};

// Posição dos celulares no set (coordenadas do mundo; o centro do celular A é a origem).
const A_X = 0;
const B_X = 1400;
const ANCHOR = {x: 540, y: 1040}; // ponto da tela onde a câmera mira

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

// Bloco de destaque por inversão (marca Kyneo): o bloco branco abre da esquerda, o texto sobe por máscara.
const InvBlock: React.FC<{lines: {t: string; size: number}[]; enter: number; exit?: number; frame: number; fps: number; fonts: Fonts; p: Pal; top: number}> = ({lines, enter, exit, frame, fps, fonts, p, top}) => {
  if (frame < enter) return null;
  if (exit !== undefined && frame > exit + 10) return null;
  return (
    <div style={{position: 'absolute', left: 72, top, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10}}>
      {lines.map((l, i) => {
        const st = enter + i * 3;
        const open = ease(frame, st, 8);
        const rise = pop(frame, st + 3, fps, 220, 20);
        const out = exit === undefined ? 0 : ease(frame, exit + i * 2, 8);
        return (
          <div key={i} style={{position: 'relative', padding: `${l.size * 0.12}px ${l.size * 0.2}px`, overflow: 'hidden'}}>
            <div style={{position: 'absolute', inset: 0, background: p.ink, transformOrigin: out > 0 ? '100% 50%' : '0% 50%', transform: `scaleX(${out > 0 ? 1 - out : open})`}} />
            <div style={{position: 'relative', fontFamily: fonts.display, fontWeight: 600, fontSize: l.size, lineHeight: 1.05, letterSpacing: -l.size * 0.02, color: p.bg, transform: `translateY(${(1 - rise) * 110 - out * 110}%)`, whiteSpace: 'nowrap'}}>{l.t}</div>
          </div>
        );
      })}
    </div>
  );
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
    tile: '#202225',
    hair: 'rgba(212,215,219,0.12)',
  };
  const fonts: Fonts = {display: brand.fonts.display.family, ui: brand.fonts.ui.family, mono: brand.fonts.mono?.family ?? brand.fonts.ui.family};
  const tailStart = Math.round((beats as Beats & {tailSec?: number}).tailSec ? (beats as Beats & {tailSec: number}).tailSec * fps : 1e9);

  // --- câmera -------------------------------------------------------------------------------
  const keys: Key[] = [
    {f: 0, x: 52, y: -96, s: 2.3, ry: -7},
    {f: F(2), x: 52, y: -96, s: 2.1, ry: -5, e: 'push'},
    {f: F(3) - 4, x: 40, y: -80, s: 2.0, ry: -4},
    {f: F(3) + 9, x: B_X, y: -70, s: 1.28, ry: 9, e: 'whip'},
    {f: F(6) - 4, x: B_X - 10, y: -40, s: 1.3, ry: 6},
    {f: F(6) + 8, x: B_X, y: 200, s: 1.36, ry: 4, e: 'push'},
    {f: F(8), x: B_X, y: 230, s: 1.42, ry: 3},
    {f: F(10) - 8, x: B_X, y: 250, s: 1.46, ry: 3},
    {f: F(10) + 4, x: A_X, y: -60, s: 1.35, ry: -9, e: 'whip'},
    {f: F(11), x: A_X + 10, y: -100, s: 1.48, ry: -6, e: 'push'},
    {f: F(13) - 8, x: A_X + 20, y: -110, s: 1.54, ry: -4},
    {f: F(13) + 3, x: B_X, y: -150, s: 1.4, ry: 8, e: 'whip'},
    {f: F(16) - 10, x: B_X - 10, y: -140, s: 1.44, ry: 6},
    {f: F(16) + 8, x: 700, y: 60, s: 0.66, ry: 0, e: 'push'},
    {f: F(19), x: 700, y: 50, s: 0.63, ry: 0},
    {f: F(21) - 2, x: 700, y: 50, s: 0.65, ry: 0},
    {f: F(21) + 10, x: B_X, y: 220, s: 1.36, ry: 5, e: 'whip'},
    {f: F(23), x: B_X, y: 200, s: 1.32, ry: 4},
    {f: F(30) - 4, x: B_X, y: 220, s: 1.32, ry: 2},
    {f: F(30) + 6, x: B_X, y: 230, s: 1.42, ry: 0, e: 'push'},
    {f: F(34), x: B_X, y: 220, s: 1.46, ry: -2},
    {f: F(35) + 8, x: B_X, y: -30, s: 1.22, ry: -4, e: 'push'},
    {f: F(38) - 4, x: B_X, y: -10, s: 1.25, ry: -3},
    {f: F(38) + 8, x: B_X, y: 300, s: 1.45, ry: 2, e: 'push'},
    {f: F(40) + 1, x: B_X, y: 280, s: 1.47, ry: 2},
    {f: F(40) + 12, x: A_X, y: 80, s: 1.35, ry: -7, e: 'whip'},
    {f: F(42), x: A_X, y: 90, s: 1.4, ry: -5},
    {f: F(44), x: A_X - 60, y: 150, s: 1.85, ry: -2, e: 'push'},
  ];
  const cam0 = camAt(keys, frame);
  const camPrev = camAt(keys, frame - 1);
  const shake = beatPulse(frame, [F(13), F(19), F(23)], 5);
  const cam = {
    x: cam0.x + noise1D(seed, frame / 45) * 5 + shake * noise1D(seed + 9, frame * 1.7) * 8,
    y: cam0.y + noise1D(seed + 1, frame / 52) * 5 + shake * noise1D(seed + 10, frame * 1.9) * 8,
    s: cam0.s * (1 + shake * 0.012),
    ry: cam0.ry,
  };
  const rz = noise1D(seed + 2, frame / 70) * 0.25;
  const vx = (cam0.x - camPrev.x) * cam0.s;
  const vy = (cam0.y - camPrev.y) * cam0.s;
  const blurX = Math.min(36, Math.abs(vx) * 0.3);
  const blurY = Math.min(20, Math.abs(vy) * 0.3);

  // --- celular A (o seu) --------------------------------------------------------------------
  const ticksBlue = ease(frame, F(1), 6);
  const ticksPop = frame >= F(1) ? Math.exp(-(frame - F(1)) / 6) * Math.min(1, (frame - F(1)) / 2) : 0;
  const clock = frame < F(11) ? '21:14' : frame < F(12) ? '23:47' : frame < F(40) ? '08:12' : '09:02';
  const statusA = frame < F(10) ? 'online' : frame < F(12) ? 'visto por último hoje às 21:16' : frame < F(41) ? 'visto por último ontem às 21:16' : 'online';
  const dayChip = frame < F(12) ? 'Hoje' : 'Ontem';
  const reply = pop(frame, F(41), fps, 200, 16);

  // --- celular B (o do cliente) ---------------------------------------------------------------
  const screenB: 'insta' | 'list' | 'insta2' | 'reel' | 'chat' =
    frame < F(13) - 6 ? 'insta' : frame < F(21) ? 'list' : frame < F(35) ? 'insta2' : frame < F(38) ? 'reel' : 'chat';
  const scroll = frame < F(8) ? 0 : interpolate(frame, [F(8), F(8) + 8, F(8) + 14, F(8) + 26], [0, 420, 360, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 0, 0.2, 1)});
  const endLabel = interpolate(frame, [F(8) + 6, F(8) + 9, F(8) + 20, F(8) + 25], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dateChip = pop(frame, F(6), fps, 240, 15);
  const rival = pop(frame, F(13), fps, 170, 15);
  const blankAt = (i: number) => F(21) + 4 + i * 2;
  const fillAt = (i: number) => F(30 + Math.floor(i / 3)) + (i % 3) * 4;
  const postsCount = frame < F(30) ? '9' : String(9 + OLDN(frame, fillAt));
  const tap = frame >= F(34) ? lin(frame, F(34), 12) : 0;
  const expand = ease(frame, F(35) - 2, 12);
  const reelT = (frame - F(35)) / fps;
  const progress = lin(frame, F(35), F(38) - F(35));
  const like = frame >= F(37) ? lin(frame, F(37), 8) : 0;
  const typedN = Math.round(lin(frame, F(38) + 2, F(40) - F(38) - 6) * REPLY.length);
  const sendPress = frame >= F(40) ? Math.exp(-(frame - F(40)) / 4) : 0;
  const sent = pop(frame, F(40) + 1, fps, 230, 18);

  const renderTile = (i: number) => {
    if (screenB === 'insta') {
      return (
        <>
          <OldPost p={p} fonts={fonts} i={i} />
          {i === 0 && dateChip > 0.01 ? (
            <div style={{position: 'absolute', left: 12, bottom: 12, transform: `scale(${dateChip})`, transformOrigin: '0 100%', background: p.ink, color: p.bg, fontFamily: fonts.mono, fontSize: 34, padding: '8px 14px', borderRadius: 8, boxShadow: `0 0 0 4px ${p.bg}`}}>12 MAR</div>
          ) : null}
        </>
      );
    }
    // insta2: os posts antigos viram quadrados em branco; depois enchem com as peças deste vídeo.
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
            <OldPost p={p} fonts={fonts} i={i} />
          </div>
        ) : null}
        {blank > 0 ? <BlankTile p={p} /> : null}
      </>
    );
  };

  // Tela do celular B
  let screenBNode: React.ReactNode;
  if (screenB === 'list') screenBNode = <ChatList p={p} fonts={fonts} rival={rival} dim={rival} />;
  else if (screenB === 'chat')
    screenBNode = <ChatB p={p} fonts={fonts} typed={REPLY.slice(0, typedN)} caret={frame < F(40)} send={sendPress} sent={sent} />;
  else {
    const prof = <Profile p={p} fonts={fonts} posts={postsCount} scroll={scroll} renderTile={renderTile} endLabel={endLabel} />;
    if (screenB === 'reel' || expand > 0) {
      // O reel do meio cresce do quadrado até a tela cheia.
      const r = tileRect(4);
      const x = mix(r.x, 0, expand);
      const y = mix(r.y, 0, expand);
      const w = mix(r.w, SCREEN.w, expand);
      const h = mix(r.h, SCREEN.h, expand);
      screenBNode = (
        <>
          {prof}
          {expand > 0 ? (
            <div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', borderRadius: 40 * expand}}>
              <div style={{width: SCREEN.w, height: SCREEN.h, transform: `scale(${w / SCREEN.w})`, transformOrigin: '0 0'}}>
                <ReelView p={p} fonts={fonts} t={Math.max(0, reelT)} progress={progress} like={like} />
              </div>
            </div>
          ) : null}
        </>
      );
    } else screenBNode = prof;
  }
  const reelClose = screenB === 'chat' ? 1 - ease(frame, F(38), 10) : 0;

  // Toque no quadrado do meio
  const tapRing =
    tap > 0 && tap < 1 ? (
      <div
        style={{
          position: 'absolute',
          left: tileRect(4).x + tileRect(4).w / 2 - 60,
          top: tileRect(4).y + tileRect(4).h / 2 - 60,
          width: 120,
          height: 120,
          borderRadius: 60,
          border: `4px solid ${p.ink}`,
          transform: `scale(${0.4 + tap * 0.9})`,
          opacity: 1 - tap,
        }}
      />
    ) : null;

  // --- documento da proposta (a virada) -------------------------------------------------------
  const docIn = pop(frame, F(16) - 2, fps, 120, 16);
  const docOut = ease(frame, F(21) - 2, 12);
  const checks = [F(16) + 6, F(17), F(18)].map((f) => pop(frame, f, fps, 260, 14));
  const perfilRow = pop(frame, F(19), fps, 220, 13);
  const perfilBlink = frame >= F(19) ? (Math.floor((frame - F(19)) / 7) % 2 === 0 ? 1 : 0.35) : 1;
  const showDoc = frame >= F(16) - 2 && docOut < 1;

  // --- etiqueta de preço da produtora -------------------------------------------------------
  const tagIn = pop(frame, F(23), fps, 140, 9);
  const strike = ease(frame, F(27) + 2, 9);
  const collapse = pop(frame, F(28), fps, 200, 14);
  const tagFall = frame >= F(30) - 6 ? Math.pow((frame - (F(30) - 6)) / 14, 2) : 0;
  const showTag = frame >= F(23) && tagFall < 1.6;
  const swing = (1 - tagIn) * 22 + Math.sin((frame - F(23)) / 7) * 5 * Math.exp(-(frame - F(23)) / 26) - tagFall * 18;

  // --- fundo: curva de animação da marca, com paralaxe ----------------------------------------
  const curveX = -cam.x * 0.35 * cam.s;
  const curveY = -cam.y * 0.35 * cam.s;
  const handle = noise1D(seed + 5, frame / 60) * 40;

  const worldTransform = `translate(${ANCHOR.x}px, ${ANCHOR.y}px) rotate(${rz}deg) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)`;
  const phoneStyle = (cx: number): React.CSSProperties => ({position: 'absolute', left: cx - PHONE.w / 2, top: -PHONE.h / 2, transform: `perspective(2600px) rotateY(${cam.ry}deg)`});
  const filterId = `mb-${id}`;
  const blurOn = blurX > 0.6 || blurY > 0.6;

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

  return (
    <AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
      {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={`${blurX.toFixed(2)} ${blurY.toFixed(2)}`} />
        </filter>
      </svg>

      {/* Curva da marca ao fundo, bem discreta */}
      <svg style={{position: 'absolute', left: curveX - 600, top: curveY + 200}} width="3200" height="1800" viewBox="0 0 3200 1800" fill="none">
        <path d={`M0 1500 C ${900 + handle} 1500, ${1300 - handle} 260, 2400 260 S 3200 900, 3200 900`} stroke={p.line} strokeOpacity="0.09" strokeWidth="3" />
        <path d={`M0 1500 L ${900 + handle} 1500 M2400 260 L ${1300 - handle} 260`} stroke={p.line} strokeOpacity="0.06" strokeWidth="2" />
        <circle cx={900 + handle} cy="1500" r="9" fill={p.line} fillOpacity="0.12" />
        <circle cx={1300 - handle} cy="260" r="9" fill={p.line} fillOpacity="0.12" />
        <rect x="2388" y="248" width="24" height="24" fill={p.line} fillOpacity="0.14" transform="rotate(45 2400 260)" />
      </svg>

      {/* Mundo: os dois celulares */}
      <div style={{position: 'absolute', inset: 0, filter: blurOn ? `url(#${filterId})` : undefined}}>
        <div style={{position: 'absolute', left: 0, top: 0, transform: worldTransform, transformOrigin: '0 0'}}>
          <div style={phoneStyle(A_X)}>
            <Phone p={p} fonts={fonts} time={clock} ry={cam.ry}>
              <ChatA p={p} fonts={fonts} s={{status: statusA, dayChip, ticksBlue, ticksPop, reply}} />
            </Phone>
          </div>
          <div style={phoneStyle(B_X)}>
            <Phone p={p} fonts={fonts} time={screenB === 'list' || screenB === 'chat' ? '08:15' : '21:20'} ry={cam.ry} tone="silver">
              {screenBNode}
              {screenB === 'insta2' ? tapRing : null}
              {reelClose > 0 ? (
                <div style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - reelClose) * 100}%)`}}>
                  <ReelView p={p} fonts={fonts} t={Math.max(0, reelT)} progress={1} like={1} />
                </div>
              ) : null}
            </Phone>
          </div>
        </div>
      </div>

      {/* Documento da proposta: revisado item por item, menos o perfil */}
      {showDoc ? (
        <div
          style={{
            position: 'absolute',
            left: 150,
            top: 560,
            width: 780,
            borderRadius: 34,
            background: p.surface,
            border: `2px solid ${p.trail}`,
            padding: '48px 54px',
            boxSizing: 'border-box',
            transform: `translateY(${(1 - docIn) * 1200}px) translateX(${-docOut * 1300}px) perspective(2000px) rotateX(${(1 - docIn) * 18}deg) rotate(${(1 - docIn) * -4 - docOut * 6}deg)`,
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 46, color: p.ink}}>Proposta comercial</div>
            <div style={{fontFamily: fonts.mono, fontSize: 24, color: p.muted, border: `1px solid ${p.trail}`, borderRadius: 10, padding: '6px 12px'}}>v7</div>
          </div>
          {[640, 560, 600].map((w, i) => (
            <div key={i} style={{height: 14, width: w, borderRadius: 7, background: p.trail, marginTop: i ? 16 : 30, opacity: 0.7}} />
          ))}
          <div style={{marginTop: 44}}>
            {['Escopo', 'Prazo', 'Preço', 'Perfil'].map((t, i) => {
              const done = i < 3 ? checks[i] : 0;
              const isPerfil = i === 3;
              if (isPerfil && perfilRow <= 0.01) return <div key={t} style={{height: 84}} />;
              return (
                <div
                  key={t}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 26,
                    height: 84,
                    borderTop: `1px solid ${p.hair}`,
                    transform: isPerfil ? `translateX(${(1 - perfilRow) * 80}px)` : undefined,
                    opacity: isPerfil ? Math.min(1, perfilRow * 1.5) : 1,
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 10,
                      border: `3px solid ${isPerfil ? p.ink : p.muted}`,
                      background: done > 0.5 ? p.muted : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isPerfil ? perfilBlink : 1,
                    }}
                  >
                    {done > 0.01 ? (
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={p.bg} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{transform: `scale(${done})`}}>
                        <path d="M5 12.5l4.5 4.5L19 7" />
                      </svg>
                    ) : null}
                  </div>
                  <div style={{fontFamily: fonts.ui, fontWeight: isPerfil ? 600 : 500, fontSize: 38, color: isPerfil ? p.ink : p.muted}}>{t}</div>
                  {!isPerfil && done > 0.5 ? <div style={{marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 22, color: p.muted}}>revisado</div> : null}
                  {isPerfil ? <div style={{marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 22, color: p.ink}}>ninguém olhou</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Etiqueta da produtora: cai, é riscada e o preço encolhe */}
      {showTag ? (
        <div style={{position: 'absolute', left: 540 - 250, top: 0, width: 500, height: 1920, transform: `translateY(${(1 - tagIn) * -700 + tagFall * 900}px)`}}>
          <div style={{position: 'absolute', left: 250, top: 0, width: 3, height: 700, opacity: tagFall > 0 ? 0 : 1, background: p.line, transformOrigin: '50% 0', transform: `rotate(${-swing * 0.2}deg)`}} />
          <div style={{position: 'absolute', left: 0, top: 690, width: 500, transformOrigin: '50% 0', transform: `rotate(${swing}deg)`}}>
            <div style={{position: 'relative', borderRadius: 30, background: p.ink, padding: '70px 40px 46px', boxSizing: 'border-box', textAlign: 'center'}}>
              <div style={{position: 'absolute', left: 250 - 20, top: 22, width: 40, height: 40, borderRadius: 20, background: p.bg}} />
              <div style={{fontFamily: fonts.display, fontWeight: 600, fontSize: 52, color: p.bg, letterSpacing: -1}}>PRODUTORA</div>
              <div style={{position: 'relative', height: 130, marginTop: 14, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                {[0, 1, 2, 3, 4].map((k) => {
                  const keep = k === 2;
                  const gone = keep ? 0 : collapse;
                  return (
                    <div
                      key={k}
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 110,
                        color: p.bg,
                        width: keep ? 70 : 70 * (1 - gone),
                        overflow: 'visible',
                        transform: `translateY(${gone * 260}px) rotate(${gone * (k < 2 ? -40 : 40)}deg)`,
                        opacity: 1 - gone,
                      }}
                    >
                      $
                    </div>
                  );
                })}
                <div style={{position: 'absolute', left: -10, top: 60, height: 10, width: `${strike * 104}%`, background: p.bg, borderRadius: 5, transform: 'rotate(-6deg)', transformOrigin: '0 50%'}} />
              </div>
              <div style={{fontFamily: fonts.ui, fontWeight: 500, fontSize: 28, color: p.trail, marginTop: 8}}>por vídeo</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Destaques por inversão (só as palavras da tabela) */}
      <InvBlock lines={[{t: 'ÚLTIMO POST:', size: 62}, {t: 'MARÇO', size: 128}]} enter={F(6)} exit={F(10) - 8} frame={frame} fps={fps} fonts={fonts} p={p} top={170} />
      <InvBlock lines={[{t: 'NO VISTO', size: 124}]} enter={F(10)} exit={F(16) - 8} frame={frame} fps={fps} fonts={fonts} p={p} top={190} />
      <InvBlock lines={[{t: 'PERFIL', size: 150}]} enter={F(19)} exit={F(23) - 6} frame={frame} fps={fps} fonts={fonts} p={p} top={190} />
      <InvBlock lines={[{t: 'ACESSÍVEL', size: 108}]} enter={F(27)} exit={F(30) - 8} frame={frame} fps={fps} fonts={fonts} p={p} top={190} />
      <InvBlock lines={[{t: 'ESTE VÍDEO', size: 108}]} enter={F(30)} exit={F(34) - 4} frame={frame} fps={fps} fonts={fonts} p={p} top={190} />
      <InvBlock lines={[{t: 'ANTES DO', size: 96}, {t: 'PREÇO', size: 140}]} enter={F(41)} frame={frame} fps={fps} fonts={fonts} p={p} top={150} />

      {/* Grão de filme (determinístico: a semente muda por frame) e vinheta */}
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

// Quantos quadrados já foram preenchidos (para o contador de posts subir junto).
function OLDN(frame: number, fillAt: (i: number) => number) {
  let n = 0;
  for (let i = 0; i < 9; i++) if (frame >= fillAt(i)) n++;
  return n;
}

