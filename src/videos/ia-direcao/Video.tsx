// "IA com direção": vídeo de vitrine, sem marca, com a assinatura no fim.
// Estilo de filme de produto: fundo claro com cenas escuras, foco que puxa, números que contam,
// caixas e cartões em planos diferentes. Dezesseis cenas, uma por frase, cortadas no beat.
// Tudo deriva do frame (prop `frame` ou useCurrentFrame).
import React from 'react';
import {AbsoluteFill, Easing, Html5Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, lin, mix, pop} from '../../lib/anim';
import {beatFrames, beatPulse, type Beats} from '../../lib/beats';
import {loadBrandFonts, type Brand} from '../../lib/brand';
import {noise1D, rand} from '../../lib/noise';
import {C, Check, DirectedCard, GenericCard, Kin, PromptBox, Scribble, SendIcon, Sparkle, Wave, type Fonts, type Row} from './ui';

export type VideoProps = {id: string; beats: Beats; brand: Brand; seed: number; withAudio?: boolean; fps?: number; frame?: number};

// Início de cada cena, em beats (uma cena por frase da voz). A última entrada é a assinatura.
const SCENE_BEATS = [0, 6, 13, 17, 21, 25, 32, 38, 42, 48, 54, 59, 67, 72, 77, 80, 84];
type Enter = 'none' | 'focus' | 'zoom' | 'up' | 'left' | 'right';
const ENTER: Enter[] = ['focus', 'none', 'zoom', 'up', 'focus', 'none', 'left', 'focus', 'right', 'none', 'none', 'zoom', 'focus', 'left', 'up', 'zoom'];
const DARK = new Set([3, 11]);

const BASE = 'faz um vídeo pra minha empresa';
const typed = (text: string, frame: number, start: number, end: number) => text.slice(0, Math.round(lin(frame, start, end - start) * text.length));

export const Video: React.FC<VideoProps> = ({id, beats, brand, seed, withAudio = true, fps: fpsProp, frame: frameProp}) => {
  loadBrandFonts(brand);
  const current = useCurrentFrame();
  const frame = frameProp ?? current;
  const config = useVideoConfig();
  const fps = fpsProp ?? config.fps;
  const b = beatFrames(beats, fps);
  const F = (k: number) => (k < b.length ? b[k] : Math.round((k * 60 * fps) / beats.bpm));
  const fonts: Fonts = {display: brand.fonts.display.family, ui: brand.fonts.ui.family, mono: brand.fonts.mono?.family ?? brand.fonts.ui.family};
  const tailSec = (beats as Beats & {tailSec?: number}).tailSec;
  const tailStart = tailSec ? Math.round(tailSec * fps) : 1e9;
  const f = frame;

  if (f >= tailStart) {
    const n = Math.min(75, f - tailStart + 1);
    return (
      <AbsoluteFill style={{background: '#0B0B0C'}}>
        {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
        <Img src={staticFile(`${id}/trailer/${String(n).padStart(3, '0')}.jpg`)} style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
    );
  }

  const starts = SCENE_BEATS.map((k) => F(k));
  let si = 0;
  for (let i = 0; i < starts.length - 1; i++) if (f >= starts[i]) si = i;
  const s = starts[si];
  const e = starts[si + 1];
  const t = f - s;
  const k = (bt: number) => F(bt); // frame de um beat
  const ui = fonts.ui;
  const disp = fonts.display;
  const mono = fonts.mono;
  const kin = {frame: f, fps, family: disp};

  // --- fundo -----------------------------------------------------------------------------
  const dark = DARK.has(si);
  const hit = si === 5 && f >= k(29);
  const bg = hit ? C.accent : dark ? C.dark : C.bg;
  const blob = (i: number) => {
    const x = 200 + rand(seed + si * 7, i) * 700 + noise1D(seed + i, f / 90) * 60;
    const y = 300 + rand(seed + si * 7 + 1, i) * 1300 + noise1D(seed + i + 9, f / 80) * 60;
    const col = i % 2 ? 'rgba(155,91,255,0.16)' : 'rgba(75,91,255,0.14)';
    return <div key={i} style={{position: 'absolute', left: x - 450, top: y - 450, width: 900, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${col} 0%, rgba(0,0,0,0) 65%)`}} />;
  };

  // --- entrada da cena (transição) ---------------------------------------------------------
  const kind = ENTER[si];
  const pin = ease(f, s, 9);
  let tx = 0;
  let ty = 0;
  let sc = 1;
  let blurCss = 0;
  let dirBlurX = 0;
  let dirBlurY = 0;
  if (kind === 'left') {
    tx = (1 - pin) * 1000;
    dirBlurX = (1 - pin) * 40;
  } else if (kind === 'right') {
    tx = -(1 - pin) * 1000;
    dirBlurX = (1 - pin) * 40;
  } else if (kind === 'up') {
    ty = (1 - pin) * 1500;
    dirBlurY = (1 - pin) * 40;
  } else if (kind === 'zoom') {
    sc = mix(1.4, 1, pin);
    blurCss = (1 - pin) * 16;
  } else if (kind === 'focus') {
    sc = mix(1.07, 1, pin);
    blurCss = (1 - ease(f, s, 14)) * 20;
  }
  // Empurrão lento da câmera e tremida nos golpes.
  const shake = beatPulse(f, [k(22), k(29), k(40), k(78)], 5);
  const push = 1 + lin(f, s, Math.max(1, e - s)) * 0.035;
  const sx = shake * noise1D(seed + 3, f * 1.7) * 14;
  const sy = shake * noise1D(seed + 4, f * 1.9) * 14;
  const stage: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: `translate(${tx + sx}px, ${ty + sy}px) scale(${sc * push})`,
    transformOrigin: '50% 45%',
    filter: [blurCss > 0.3 ? `blur(${blurCss.toFixed(1)}px)` : '', dirBlurX + dirBlurY > 0.5 ? `url(#dir-${id})` : ''].join(' ').trim() || undefined,
  };

  // --- cenas ------------------------------------------------------------------------------
  let scene: React.ReactNode = null;

  if (si === 0) {
    // "Você pediu: faz um vídeo pra minha empresa."
    const text = typed(BASE, f, 33, 74);
    const send = f >= 79 ? Math.exp(-(f - 79) / 4) : 0;
    scene = (
      <>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${mix(1.22, 1, Easing.out(Easing.cubic)(lin(f, 0, 40)))})`, transformOrigin: '540px 900px'}}>
          <div style={{position: 'absolute', left: 90, top: 520}}>
            <Kin t="Você pediu:" size={120} enter={-7} color={C.ink} {...kin} />
          </div>
          <div style={{position: 'absolute', left: 90, top: 740}}>
            <PromptBox fonts={fonts} text={text} caret={f < 80} send={send} />
          </div>
          {['Criar imagem', 'Escrever post', 'Gerar vídeo'].map((c, i) => {
            const q = pop(f, 6 + i * 4, fps, 200, 16);
            const on = i === 2 && f >= 26;
            return (
              <div key={c} style={{position: 'absolute', left: 90 + i * 300, top: 1100, transform: `translateY(${(1 - q) * 80}px)`, opacity: q > 0.01 ? 1 : 0, borderRadius: 999, padding: '20px 30px', background: on ? C.ink : C.card, color: on ? '#fff' : C.ink, fontFamily: ui, fontWeight: 500, fontSize: 32, boxShadow: '0 16px 40px rgba(25,35,70,0.1)', whiteSpace: 'nowrap'}}>{c}</div>
            );
          })}
          {send > 0.05 ? <div style={{position: 'absolute', left: 90 + 900 - 40 - 42 - 72, top: 740 + 300 - 30 - 42 - 72, width: 144, height: 144, borderRadius: 72, border: `4px solid ${C.accent}`, transform: `scale(${1 + (1 - send) * 1.2})`, opacity: send}} /> : null}
        </div>
      </>
    );
  }

  if (si === 1) {
    // "A IA entregou frase pronta e foto genérica."
    const up = ease(f, s, 12);
    const load = f < k(7);
    const card = pop(f, k(7), fps, 170, 14);
    const shimmer = ((f - s) * 30) % 900;
    const l1 = pop(f, k(8), fps, 200, 18);
    const l2 = pop(f, k(9), fps, 200, 18);
    scene = (
      <>
        <div style={{position: 'absolute', left: 90, top: mix(740, 250, up), transform: `scale(${mix(1, 0.8, up)})`, transformOrigin: '50% 0'}}>
          <PromptBox fonts={fonts} text={BASE} />
        </div>
        <div style={{position: 'absolute', left: 340, top: 620}}>
          {load ? (
            <div style={{width: 400, height: 711, borderRadius: 32, background: '#E4E8F0', overflow: 'hidden', position: 'relative'}}>
              <div style={{position: 'absolute', top: 0, bottom: 0, left: shimmer - 300, width: 200, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.8), rgba(255,255,255,0))'}} />
            </div>
          ) : null}
          {!load ? (
            <div style={{transform: `scale(${0.82 + 0.18 * card}) translateY(${(1 - card) * 60}px)`}}>
              <GenericCard fonts={fonts} w={400} />
            </div>
          ) : null}
        </div>
        {l2 > 0.01 ? (
          <div style={{position: 'absolute', left: 50, top: 720, transform: `translateX(${(1 - l2) * -80}px)`}}>
            <div style={{fontFamily: disp, fontWeight: 700, fontSize: 46, color: C.ink, letterSpacing: -1}}>foto</div>
            <div style={{fontFamily: disp, fontWeight: 700, fontSize: 46, color: C.ink, letterSpacing: -1}}>genérica</div>
            <Scribble w={210} p={ease(f, k(9) + 3, 8)} />
          </div>
        ) : null}
        {l1 > 0.01 ? (
          <div style={{position: 'absolute', left: 762, top: 1120, transform: `translateX(${(1 - l1) * 80}px)`}}>
            <div style={{fontFamily: disp, fontWeight: 700, fontSize: 46, color: C.ink, letterSpacing: -1}}>frase</div>
            <div style={{fontFamily: disp, fontWeight: 700, fontSize: 46, color: C.ink, letterSpacing: -1}}>pronta</div>
            <Scribble w={180} p={ease(f, k(8) + 3, 8)} />
          </div>
        ) : null}
      </>
    );
  }

  if (si === 2) {
    // "Igual ao vídeo do seu concorrente." Dois iguais; a câmera abre e mostra um muro de iguais.
    const eq = pop(f, k(14), fps, 260, 14);
    const wall = ease(f, k(15), 22);
    const z = mix(1, 0.4, wall);
    const cards: React.ReactNode[] = [];
    for (let r = -3; r <= 3; r++)
      for (let c = -3; c <= 4; c++) {
        if (r === 0 && (c === 0 || c === 1)) continue;
        cards.push(
          <div key={`${r}:${c}`} style={{position: 'absolute', left: 120 + c * 480, top: 600 + r * 760}}>
            <GenericCard fonts={fonts} />
          </div>,
        );
      }
    scene = (
      <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: '540px 920px'}}>
        {wall > 0.001 ? cards : null}
        <div style={{position: 'absolute', left: 120, top: 600}}>
          <GenericCard fonts={fonts} />
        </div>
        <div style={{position: 'absolute', left: 600, top: 600}}>
          <GenericCard fonts={fonts} />
        </div>
        <div style={{position: 'absolute', left: 120, top: 470}}>
          <Kin t="Você" size={70} enter={s + 2} color={C.ink} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 600, top: 470}}>
          <Kin t="Concorrente" size={70} enter={s + 6} color={C.red} {...kin} />
        </div>
        {eq > 0.01 ? (
          <div style={{position: 'absolute', left: 540 - 70, top: 860, width: 140, height: 140, borderRadius: 70, background: C.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: disp, fontWeight: 700, fontSize: 110, lineHeight: 1, transform: `scale(${eq})`}}>=</div>
        ) : null}
      </div>
    );
  }

  if (si === 3) {
    // "E ninguém parou de rolar." Feed escuro rolando rápido; contador parado no zero.
    const off = (f - s) * 52;
    const posts = ['#FF7A59', '#2BD4A4', '#FFC24B', '#5AA9FF', '#B48CFF', '#FF5F8F', '#3DD6E0'];
    scene = (
      <>
        <div style={{position: 'absolute', left: 90, top: 110, display: 'flex', alignItems: 'baseline', gap: 26}}>
          <div style={{fontFamily: mono, fontWeight: 500, fontSize: 210, lineHeight: 1, color: C.darkInk}}>0</div>
          <div style={{fontFamily: disp, fontWeight: 600, fontSize: 52, color: C.darkMuted}}>visualizações</div>
        </div>
        <div style={{position: 'absolute', left: 230, top: 400, width: 620, height: 1180, borderRadius: 70, border: `10px solid ${C.darkLine}`, background: '#05060A', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 30, right: 30, top: 40 - (off % (7 * 720)), filter: `url(#feed-${id})`}}>
            {Array.from({length: 16}).map((_, i) => {
              const isGen = i % 7 === 3;
              return (
                <div key={i} style={{height: 690, marginBottom: 30, borderRadius: 30, overflow: 'hidden', background: isGen ? 'transparent' : posts[i % posts.length], position: 'relative'}}>
                  {isGen ? (
                    <GenericCard fonts={fonts} w={540} />
                  ) : (
                    <>
                      <div style={{position: 'absolute', left: 40, top: 60, width: 300, height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.85)'}} />
                      <div style={{position: 'absolute', left: 40, top: 112, width: 200, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.6)'}} />
                      <div style={{position: 'absolute', right: -60, bottom: -60, width: 320, height: 320, borderRadius: 160, background: 'rgba(255,255,255,0.25)'}} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  if (si === 4 || si === 5) {
    // "Aí a culpa foi pra IA..." / "Não falta IA... falta direção."
    const arrows = [
      {x: -420, y: -260, r: 30, at: s + 2},
      {x: 440, y: -160, r: 160, at: s + 6},
      {x: -360, y: 330, r: -40, at: s + 10},
    ];
    const stamp = si === 4 ? pop(f, k(22), fps, 320, 16) : 0;
    const strike = si === 5 ? ease(f, k(27), 7) : 0;
    const iaShake = si === 5 && f > k(27) + 6 && !hit ? noise1D(seed + 11, f * 2.3) * 4 : 0;
    if (!hit) {
      scene = (
        <>
          {si === 5 ? (
            <div style={{position: 'absolute', left: 0, right: 0, top: 430}}>
              <Kin t="Não falta" size={96} enter={s + 2} color={C.muted} align="center" {...kin} />
            </div>
          ) : null}
          <div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontFamily: disp, fontWeight: 700, fontSize: 560, lineHeight: 1, letterSpacing: -30, color: C.ink, transform: `translateX(${iaShake}px)`}}>IA</div>
          {si === 4
            ? arrows.map((a, i) => {
                const q = pop(f, a.at, fps, 220, 16);
                if (q <= 0.01) return null;
                return (
                  <div key={i} style={{position: 'absolute', left: 540 + a.x * mix(1.8, 1, q) - 90, top: 840 + a.y * mix(1.8, 1, q) - 30, transform: `rotate(${a.r}deg)`}}>
                    <svg width="180" height="60" viewBox="0 0 180 60" fill="none" stroke={C.red} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 30 H160 M125 8 L165 30 L125 52" />
                    </svg>
                  </div>
                );
              })
            : null}
          {stamp > 0.01 ? (
            <div style={{position: 'absolute', left: 540 - 250, top: 1240, width: 500, textAlign: 'center', transform: `rotate(-10deg) scale(${mix(2.3, 1, stamp)})`, border: `12px solid ${C.red}`, borderRadius: 24, color: C.red, fontFamily: disp, fontWeight: 700, fontSize: 130, letterSpacing: 4, padding: '10px 0', opacity: Math.min(1, stamp * 3)}}>CULPA</div>
          ) : null}
          {strike > 0 ? <div style={{position: 'absolute', left: 150, top: 830, height: 30, width: 780 * strike, background: C.red, borderRadius: 15, transform: 'rotate(-8deg)', transformOrigin: '0 50%'}} /> : null}
        </>
      );
    } else {
      // O golpe: fundo índigo, a bússola trava e DIREÇÃO entra.
      const q = pop(f, k(29), fps, 190, 12);
      const needle = mix(-140, 0, Easing.out(Easing.back(2))(Math.min(1, (f - k(29)) / 16)));
      scene = (
        <>
          <svg style={{position: 'absolute', left: 540 - 700, top: 1380 - 700}} width="1400" height="1400" viewBox="0 0 1400 1400" fill="none">
            <g transform={`rotate(${(f - k(29)) * 0.4} 700 700)`} stroke="rgba(255,255,255,0.22)">
              <circle cx="700" cy="700" r="640" strokeWidth="3" />
              <circle cx="700" cy="700" r="520" strokeWidth="2" strokeDasharray="6 18" />
              {Array.from({length: 72}).map((_, i) => {
                const a = (i * Math.PI) / 36;
                const r1 = i % 9 === 0 ? 590 : 615;
                return <line key={i} x1={700 + Math.cos(a) * r1} y1={700 + Math.sin(a) * r1} x2={700 + Math.cos(a) * 640} y2={700 + Math.sin(a) * 640} strokeWidth={i % 9 === 0 ? 6 : 2} />;
              })}
            </g>
            <g transform={`rotate(${needle} 700 700)`}>
              <path d="M700 330 L736 700 L700 750 L664 700 Z" fill="rgba(255,255,255,0.92)" />
              <path d="M700 1170 L740 700 L660 700 Z" fill="rgba(255,255,255,0.25)" />
            </g>
          </svg>
          <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', transform: `scale(${mix(1.5, 1, q)})`}}>
            <div style={{fontFamily: disp, fontWeight: 600, fontSize: 90, color: 'rgba(255,255,255,0.75)', letterSpacing: -2}}>falta</div>
            <div style={{fontFamily: disp, fontWeight: 700, fontSize: 196, color: '#fff', letterSpacing: -8, lineHeight: 1, marginTop: 6}}>DIREÇÃO</div>
          </div>
        </>
      );
    }
  }

  if (si === 6) {
    // "Ela faz exatamente o que você descreve." Pedido e resultado em espelho.
    const segs = [
      {txt: 'um círculo', a: s + 2, b: s + 12},
      {txt: ' azul', a: s + 18, b: s + 24},
      {txt: ' girando', a: s + 32, b: s + 40},
    ];
    let text = '';
    for (const g of segs) text += typed(g.txt, f, g.a, g.b);
    const circ = pop(f, k(33), fps, 220, 13);
    const blue = ease(f, k(34), 6);
    const spin = f > k(35) ? (f - k(35)) * 7 : 0;
    const col = blue > 0.5 ? C.accent : C.ink;
    scene = (
      <>
        <div style={{position: 'absolute', left: 90, top: 250}}>
          <Kin t="exatamente" size={124} enter={s + 2} color={C.accent} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 90, top: 450}}>
          <PromptBox fonts={fonts} text={text} caret placeholder="" />
        </div>
        <div style={{position: 'absolute', left: 90, top: 820, width: 900, height: 720, borderRadius: 44, background: C.card, boxShadow: '0 40px 90px rgba(25,35,70,0.12)', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 30, top: 26, fontFamily: mono, fontSize: 24, color: C.muted}}>resultado</div>
          {circ > 0.01 ? (
            <svg style={{position: 'absolute', left: 450 - 230, top: 370 - 230, transform: `scale(${circ}) rotate(${spin}deg)`}} width="460" height="460" viewBox="0 0 460 460">
              <circle cx="230" cy="230" r="200" fill={col} />
              <circle cx="230" cy="230" r="222" fill="none" stroke={col} strokeWidth="6" strokeDasharray="30 22" opacity="0.5" />
              <circle cx="230" cy="70" r="26" fill="#fff" opacity="0.9" />
            </svg>
          ) : null}
        </div>
      </>
    );
  }

  if (si === 7) {
    // "Pedido vago, vídeo vago." Tudo fora de foco.
    const breathe = 7 + Math.sin((f - s) / 5) * 3;
    scene = (
      <>
        <div style={{position: 'absolute', left: 90, top: 240}}>
          <Kin t="Pedido vago," size={120} enter={s + 1} color={C.ink} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 90, top: 440, filter: `blur(${breathe}px)`, transform: 'scale(0.86)', transformOrigin: '0 0'}}>
          <PromptBox fonts={fonts} text="faz um vídeo" />
        </div>
        <div style={{position: 'absolute', left: 90, top: 830}}>
          <Kin t="vídeo vago." size={120} enter={k(40)} color={C.ink} {...kin} />
        </div>
        {f >= k(40) - 2 ? (
          <div style={{position: 'absolute', left: 360, top: 1010, filter: `blur(${breathe + 6}px)`, transform: `scale(${0.9 + 0.1 * pop(f, k(40), fps)})`, transformOrigin: '50% 0'}}>
            <GenericCard fonts={fonts} w={330} />
          </div>
        ) : null}
      </>
    );
  }

  if (si >= 8 && si <= 10) {
    // Cena contínua: o pedido ganha direção e o resultado vai entrando em foco.
    const tB = k(42);
    const rP = pop(f, k(44), fps, 200, 18);
    const rD = pop(f, k(46), fps, 200, 18);
    const rT = pop(f, k(48), fps, 200, 18);
    const rV = pop(f, k(54), fps, 200, 18);
    const rR = pop(f, k(55), fps, 200, 18);
    const thumbs = [49, 50, 51, 52, 53].map((bt) => pop(f, k(bt), fps, 240, 15));
    const beatDot = beatPulse(f, b, 6);
    const rows: Row[] = [
      {label: 'Público', value: 'empresas que mandam proposta', p: rP},
      {label: 'Dor', value: 'proposta que fica no visto', p: rD},
      {
        label: 'Tela',
        value: 'frase por frase',
        p: rT,
        extra: (
          <div style={{display: 'flex', gap: 10}}>
            {thumbs.map((q, i) => (
              <div key={i} style={{width: 58, height: 92, borderRadius: 10, background: i === 2 ? C.accent : C.ink, transform: `scale(${q})`, opacity: q > 0.01 ? 1 : 0, position: 'relative', overflow: 'hidden'}}>
                <div style={{position: 'absolute', left: 8, right: 8, top: 12, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.8)'}} />
                <div style={{position: 'absolute', left: 8, width: 26, top: 26, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.5)'}} />
                <div style={{position: 'absolute', left: 12, right: 12, bottom: 12, height: 30, borderRadius: 6, border: '2px solid rgba(255,255,255,0.6)'}} />
              </div>
            ))}
          </div>
        ),
      },
      {label: 'Voz', value: 'calma, segura', p: rV, extra: <Wave w={560} h={60} t={f / fps} grow={Math.min(1, rV)} />},
      {
        label: 'Ritmo',
        value: '127 bpm',
        p: rR,
        extra: (
          <div style={{display: 'flex', gap: 18, alignItems: 'center', height: 60}}>
            {Array.from({length: 8}).map((_, i) => {
              const on = i === Math.floor((f - k(55)) / ((60 * fps) / beats.bpm)) % 8;
              return <div key={i} style={{width: 26, height: 26, borderRadius: 13, background: on ? C.accent : C.line, transform: `scale(${on ? 1 + beatDot * 0.4 : 1})`}} />;
            })}
          </div>
        ),
      },
    ];
    const focus = [rP, rD, rT, rV, rR].reduce((a, q) => a + Math.min(1, q), 0); // 0..5
    const resBlur = Math.max(0, 18 - focus * 3.6);
    const forward = ease(f, k(56) + 4, 16);
    const resIn = pop(f, tB + 2, fps, 160, 16);
    const res = (
      <div style={{position: 'absolute', left: mix(620, 320, forward), top: mix(980, 600, forward), transform: `scale(${mix(0.95, 1.18, forward) * (0.85 + 0.15 * resIn)}) rotate(${mix(6, 0, forward)}deg)`, transformOrigin: '50% 0', filter: resBlur > 0.3 ? `blur(${resBlur.toFixed(1)}px)` : undefined}}>
        <DirectedCard fonts={fonts} w={400} t={f / fps} />
      </div>
    );
    scene = (
      <>
        {forward < 0.5 ? res : null}
        <div style={{position: 'absolute', left: 70, top: 250, transform: `scale(${mix(1, 0.94, forward)}) translateY(${forward * -40}px)`, transformOrigin: '0 0', filter: forward > 0.02 ? `blur(${(forward * 6).toFixed(1)}px)` : undefined}}>
          <PromptBox fonts={fonts} text={BASE} rows={rows} width={940} />
        </div>
        {forward >= 0.5 ? res : null}
      </>
    );
  }

  if (si === 11) {
    // "A IA escreve, anima e encaixa tudo na voz." Linha do tempo escura, números contando.
    const total = Math.round(beats.durationSec * fps);
    const count = (to: number) => Math.round(Easing.out(Easing.cubic)(lin(f, s + 2, 40)) * to);
    const vW = pop(f, k(60), fps, 220, 16);
    const vA = pop(f, k(62), fps, 220, 16);
    const vE = pop(f, k(63), fps, 220, 16);
    const snap = ease(f, k(63) + 2, 10);
    const head = lin(f, k(64), e - k(64) - 4);
    const ready = pop(f, k(65), fps, 220, 14);
    const lanes = 700;
    const snapX = [0.08, 0.27, 0.44, 0.61, 0.78, 0.93];
    const verb = (w: string, q: number, top: number) => (
      <div style={{position: 'absolute', left: 90, top, display: 'flex', alignItems: 'center', gap: 26}}>
        <Check size={64} p={q} />
        <div style={{overflow: 'hidden'}}>
          <div style={{fontFamily: disp, fontWeight: 700, fontSize: 100, color: C.darkInk, letterSpacing: -4, lineHeight: 1.05, transform: `translateY(${(1 - q) * 110}%)`}}>{w}</div>
        </div>
      </div>
    );
    const fmt = (n: number) => n.toLocaleString('pt-BR');
    scene = (
      <>
        {verb('escreve', vW, 130)}
        {verb('anima', vA, 250)}
        {verb('encaixa', vE, 370)}
        <div style={{position: 'absolute', left: 60, top: 560, width: 960, height: 820, borderRadius: 40, background: C.darkCard, border: `2px solid ${C.darkLine}`, padding: 36, boxSizing: 'border-box'}}>
          <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
            {[
              [String(count(16)), 'cenas'],
              [String(count(127)), 'bpm'],
              [fmt(count(total)), 'frames'],
            ].map(([n, l]) => (
              <div key={l} style={{borderRadius: 18, background: '#0F1219', border: `1px solid ${C.darkLine}`, padding: '14px 22px', display: 'flex', alignItems: 'baseline', gap: 10}}>
                <div style={{fontFamily: mono, fontWeight: 500, fontSize: 46, color: C.darkInk}}>{n}</div>
                <div style={{fontFamily: ui, fontSize: 24, color: C.darkMuted}}>{l}</div>
              </div>
            ))}
            {ready > 0.01 ? <div style={{marginLeft: 'auto', transform: `scale(${ready})`, background: C.green, color: '#04210F', fontFamily: ui, fontWeight: 500, fontSize: 26, borderRadius: 999, padding: '10px 20px'}}>pronto</div> : null}
          </div>
          {[
            ['Roteiro', 0],
            ['Animação', 1],
            ['Voz', 2],
          ].map(([label, i]) => {
            const top = 150 + (i as number) * 190;
            return (
              <div key={label as string} style={{position: 'absolute', left: 36, right: 36, top}}>
                <div style={{fontFamily: ui, fontWeight: 500, fontSize: 26, color: C.darkMuted, marginBottom: 14}}>{label}</div>
                <div style={{position: 'relative', height: 120, borderRadius: 18, background: '#0F1219', overflow: 'hidden', width: lanes + 188}}>
                  {i === 0
                    ? snapX.slice(0, 5).map((x, j) => {
                        const q = pop(f, k(60) + j * 3, fps, 240, 16);
                        const jitter = (1 - snap) * (rand(seed + 21, j) - 0.5) * 60;
                        return (
                          <div key={j} style={{position: 'absolute', left: x * (lanes + 188) + jitter, top: 22, width: 130, height: 76, borderRadius: 12, background: C.darkInk, transform: `scaleX(${q})`, transformOrigin: '0 50%', padding: 12, boxSizing: 'border-box'}}>
                            <div style={{height: 8, borderRadius: 4, background: '#9AA3B5', width: '80%'}} />
                            <div style={{height: 8, borderRadius: 4, background: '#9AA3B5', width: '55%', marginTop: 10}} />
                          </div>
                        );
                      })
                    : null}
                  {i === 1 ? (
                    <svg style={{position: 'absolute', left: 0, top: 0}} width={lanes + 188} height="120" viewBox={`0 0 ${lanes + 188} 120`}>
                      <path d={`M ${snapX.map((x, j) => `${x * (lanes + 188) + 10} ${j % 2 ? 30 : 90}`).join(' L ')}`} stroke={C.accent} strokeWidth="4" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - ease(f, k(62), 12)} />
                      {snapX.map((x, j) => {
                        const q = pop(f, k(62) + j * 2, fps, 260, 14);
                        const cx = x * (lanes + 188) + 10;
                        const cy = j % 2 ? 30 : 90;
                        return <rect key={j} x={cx - 13} y={cy - 13} width="26" height="26" fill={C.darkInk} transform={`rotate(45 ${cx} ${cy}) scale(1)`} style={{transformBox: 'fill-box', transformOrigin: 'center', transform: `rotate(45deg) scale(${q})`}} />;
                      })}
                    </svg>
                  ) : null}
                  {i === 2 ? (
                    <div style={{position: 'absolute', left: 16, right: 16, top: 30}}>
                      <Wave w={lanes + 150} h={60} t={f / fps} color={C.accent2} bars={70} />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
          {/* linhas de encaixe */}
          {snap > 0.01
            ? snapX.slice(0, 5).map((x, j) => (
                <div key={j} style={{position: 'absolute', left: 36 + x * (lanes + 188), top: 180, width: 3, height: 560 * snap, background: `repeating-linear-gradient(180deg, ${C.green} 0 10px, transparent 10px 18px)`}} />
              ))
            : null}
          {head > 0 ? <div style={{position: 'absolute', left: 36 + head * (lanes + 188), top: 140, width: 5, height: 620, borderRadius: 3, background: '#fff'}} /> : null}
        </div>
      </>
    );
  }

  if (si === 12) {
    // "Esse vídeo aqui saiu de um pedido assim." O próprio vídeo tocando acelerado numa tela.
    const inner = 14 + (((f - s) * 9) % 920);
    const arrow = ease(f, s + 22, 14);
    const pw = 470;
    const ph = (pw * 16) / 9;
    const allRows: Row[] = [
      {label: 'Público', value: 'empresas que mandam proposta', p: 1},
      {label: 'Dor', value: 'proposta que fica no visto', p: 1},
      {label: 'Tela', value: 'frase por frase', p: 1},
      {label: 'Voz', value: 'calma, segura', p: 1},
      {label: 'Ritmo', value: '127 bpm', p: 1},
    ];
    scene = (
      <>
        <div style={{position: 'absolute', left: 90, top: 150}}>
          <Kin t="Esse vídeo" size={140} enter={s + 1} color={C.ink} colorWords={{vídeo: C.accent}} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 80, top: 420, width: pw + 24, height: ph + 24, borderRadius: 56, background: C.ink, padding: 12, boxSizing: 'border-box', boxShadow: '0 50px 100px rgba(25,35,70,0.3)', transform: `scale(${0.9 + 0.1 * pop(f, s, fps, 160, 16)})`}}>
          <div style={{width: pw, height: ph, borderRadius: 46, overflow: 'hidden', position: 'relative'}}>
            <div style={{width: 1080, height: 1920, transform: `scale(${pw / 1080})`, transformOrigin: '0 0'}}>
              <Video id={id} beats={beats} brand={brand} seed={seed} withAudio={false} fps={fps} frame={inner} />
            </div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 600, top: 520, transform: `scale(0.43) translateX(${(1 - pop(f, s + 8, fps, 180, 16)) * 400}px)`, transformOrigin: '0 0'}}>
          <PromptBox fonts={fonts} text={BASE} rows={allRows} />
        </div>
        <svg style={{position: 'absolute', left: 560, top: 920}} width="300" height="260" viewBox="0 0 300 260" fill="none">
          <path d="M220 10 C 230 140, 140 200, 30 220" stroke={C.accent} strokeWidth="8" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - arrow} />
          {arrow > 0.95 ? <path d="M58 196 L28 221 L64 236" stroke={C.accent} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /> : null}
        </svg>
      </>
    );
  }

  if (si === 13) {
    // "E quem dirige o pedido sai na frente." O seu vídeo passa os outros no feed.
    const swap = pop(f, k(74), fps, 150, 15);
    const bar = (to: number, at: number) => Easing.out(Easing.cubic)(lin(f, at, 22)) * to;
    const items = [
      {name: 'Concorrente A', slot: mix(0, 1, swap), dir: false, val: bar(0.42, s + 4)},
      {name: 'Concorrente B', slot: mix(1, 2, swap), dir: false, val: bar(0.36, s + 6)},
      {name: 'Você · com direção', slot: mix(2, 0, swap), dir: true, val: bar(0.3, s + 8) + bar(0.62, k(74))},
    ];
    scene = (
      <>
        <div style={{position: 'absolute', left: 90, top: 200}}>
          <Kin t="sai na frente" size={124} enter={s + 2} color={C.ink} colorWords={{frente: C.accent}} {...kin} />
        </div>
        {items.map((it) => {
          const top = 560 + it.slot * 250;
          const rank = Math.round(it.slot) + 1;
          return (
            <div key={it.name} style={{position: 'absolute', left: 90, top, width: 900, height: 210, borderRadius: 36, background: C.card, boxShadow: it.dir ? `0 30px 70px rgba(75,91,255,0.25), 0 0 0 4px ${C.accent}` : '0 20px 50px rgba(25,35,70,0.1)', display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px', boxSizing: 'border-box', zIndex: it.dir ? 2 : 1}}>
              <div style={{fontFamily: mono, fontWeight: 500, fontSize: 56, color: it.dir ? C.accent : C.muted, width: 80}}>#{rank}</div>
              <div style={{width: 84, height: 150, borderRadius: 14, overflow: 'hidden', flexShrink: 0}}>
                {it.dir ? <DirectedCard fonts={fonts} w={84} /> : <GenericCard fonts={fonts} w={84} />}
              </div>
              <div style={{flex: 1}}>
                <div style={{fontFamily: disp, fontWeight: 600, fontSize: 38, color: C.ink, letterSpacing: -1}}>{it.name}</div>
                <div style={{marginTop: 18, height: 18, borderRadius: 9, background: C.line, overflow: 'hidden'}}>
                  <div style={{width: `${Math.min(1, it.val) * 100}%`, height: '100%', borderRadius: 9, background: it.dir ? `linear-gradient(90deg, ${C.accent}, ${C.accent2})` : C.trail}} />
                </div>
              </div>
              {it.dir && swap > 0.3 ? (
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{transform: `scale(${swap})`}}>
                  <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
                </svg>
              ) : null}
            </div>
          );
        })}
      </>
    );
  }

  if (si === 14) {
    // "Sem fórmula mágica." O botão mágico é riscado e os brilhos caem.
    const cut = ease(f, k(78), 6);
    const fall = f > k(78) + 2 ? Math.pow((f - k(78) - 2) / 14, 2) : 0;
    const grey = ease(f, k(78) + 2, 8);
    const bob = Math.sin((f - s) / 5) * 8;
    scene = (
      <>
        {Array.from({length: 9}).map((_, i) => {
          const a = (i / 9) * Math.PI * 2 + (f - s) / 30;
          const r = 380 + rand(seed + 31, i) * 120;
          const x = 540 + Math.cos(a) * r;
          const y = 900 + Math.sin(a) * r * 0.55 + fall * (300 + rand(seed + 32, i) * 400);
          return (
            <div key={i} style={{position: 'absolute', left: x - 30, top: y - 30, transform: `rotate(${fall * 200 * (i % 2 ? 1 : -1)}deg)`, filter: `grayscale(${grey})`}}>
              <Sparkle size={40 + (i % 3) * 18} color={i % 2 ? '#FF5FA2' : '#8B5CFF'} />
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 130, top: 820 + bob + fall * 60, width: 820, height: 180, borderRadius: 90, background: 'linear-gradient(90deg, #FF5FA2, #8B5CFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, transform: `rotate(${grey * 4}deg)`, filter: `grayscale(${grey})`, boxShadow: '0 40px 90px rgba(139,92,255,0.35)'}}>
          <Sparkle size={64} color="#fff" />
          <div style={{fontFamily: disp, fontWeight: 700, fontSize: 60, color: '#fff', letterSpacing: -1}}>Gerar vídeo mágico</div>
        </div>
        {cut > 0 ? <div style={{position: 'absolute', left: 100, top: 900 + fall * 60, height: 26, width: 880 * cut, background: C.red, borderRadius: 13, transform: 'rotate(-7deg)', transformOrigin: '0 50%'}} /> : null}
      </>
    );
  }

  if (si === 15) {
    // "Direção antes do clique." O pedido completo, o cursor e o clique que leva à assinatura.
    const allRows: Row[] = [
      {label: 'Público', value: 'empresas que mandam proposta', p: 1},
      {label: 'Dor', value: 'proposta que fica no visto', p: 1},
      {label: 'Tela', value: 'frase por frase', p: 1},
      {label: 'Voz', value: 'calma, segura', p: 1},
      {label: 'Ritmo', value: '127 bpm', p: 1},
    ];
    const boxTop = 560;
    const boxScale = 0.9;
    const btnX = 90 + (900 - 40 - 42) * boxScale;
    const btnY = boxTop + (695 - 30 - 42) * boxScale;
    const move = Easing.inOut(Easing.cubic)(lin(f, s + 2, k(82) - s - 6));
    const cx = mix(980, btnX + 10, move);
    const cy = mix(1600, btnY + 14, move);
    const press = f >= k(82) ? Math.exp(-(f - k(82)) / 4) : 0;
    const dive = Easing.in(Easing.quad)(lin(f, k(82) + 3, e - k(82) - 3));
    const z = mix(1, 48, dive);
    scene = (
      <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: `${btnX}px ${btnY}px`}}>
        <div style={{position: 'absolute', left: 90, top: 150}}>
          <Kin t="Direção" size={160} enter={s + 1} color={C.accent} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 90, top: 340}}>
          <Kin t="antes do clique." size={96} enter={s + 10} color={C.ink} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 90, top: boxTop, transform: `scale(${boxScale})`, transformOrigin: '0 0'}}>
          <PromptBox fonts={fonts} text={BASE} rows={allRows} send={press} />
        </div>
        {press > 0.05 ? <div style={{position: 'absolute', left: btnX - 80, top: btnY - 80, width: 160, height: 160, borderRadius: 80, border: `5px solid ${C.accent}`, transform: `scale(${1 + (1 - press) * 1.4})`, opacity: press}} /> : null}
        <svg style={{position: 'absolute', left: cx, top: cy, transform: `scale(${1 - press * 0.15})`}} width="70" height="84" viewBox="0 0 24 29">
          <path d="M2 2 L2 24 L8 18.5 L12 27 L16 25.3 L12 17 L20 17 Z" fill={C.ink} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id={`dir-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={`${dirBlurX.toFixed(1)} ${dirBlurY.toFixed(1)}`} />
        </filter>
        <filter id={`feed-${id}`}>
          <feGaussianBlur stdDeviation="0 9" />
        </filter>
      </svg>
      {!dark && !hit ? [0, 1, 2].map(blob) : null}
      {/* Cartões fora de foco nas bordas: dão profundidade (planos de fundo) às cenas claras */}
      {!dark && !hit
        ? [0, 1, 2, 3].map((i) => {
            const left = i % 2 === 0;
            const w = 220 + rand(seed + 50 + si, i) * 160;
            const x = (left ? -120 + rand(seed + 60 + si, i) * 160 : 900 + rand(seed + 60 + si, i) * 140) + noise1D(seed + 70 + i, f / 70) * 30 - (f - s) * (left ? 0.6 : -0.6);
            const y = 200 + i * 420 + rand(seed + 80 + si, i) * 200 + noise1D(seed + 90 + i, f / 60) * 30;
            return (
              <div key={`bk${i}`} style={{position: 'absolute', left: x, top: y, width: w, height: w * (i % 3 === 0 ? 1.78 : 0.62), borderRadius: 28, background: C.card, boxShadow: '0 30px 60px rgba(25,35,70,0.12)', filter: `blur(${10 + (i % 3) * 5}px)`, transform: `rotate(${(rand(seed + 95 + si, i) - 0.5) * 16}deg)`, opacity: 0.85}} />
            );
          })
        : null}
      <div style={stage}>{scene}</div>
      {/* Grão de filme e vinheta */}
      <svg style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: dark || hit ? 0.2 : 0.12, pointerEvents: 'none'}} width="1080" height="1920">
        <filter id={`grain-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={(seed * 97 + f) % 9973} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter={`url(#grain-${id})`} />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 90% 75% at 50% 50%, transparent 60%, ${dark || hit ? 'rgba(0,0,0,0.5)' : 'rgba(40,50,90,0.10)'} 100%)`, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
