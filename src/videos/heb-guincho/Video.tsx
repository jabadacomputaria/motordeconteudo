// HEB · guincho de corda para içamento em torres (reedição do criativo original, com a voz original).
// Ideia de camadas: a tela é tratada como os andares de uma torre. A filmagem real entra fatiada em
// faixas, o texto grande fica ATRÁS dos objetos (céu trocado atrás da treliça, operador recortado na
// frente do número, janela da filmagem por cima do "60") e os desenhos técnicos ficam POR CIMA da
// filmagem (cota de altura, mira, contorno do montante, trava). Um cabo com um bloco laranja sobe pela
// borda esquerda do começo ao fim: o vídeo inteiro é o içamento. Uma cena por frase, cortada no beat.
// Tudo deriva do frame (prop `frame` ou useCurrentFrame).
import React from 'react';
import {AbsoluteFill, Easing, Html5Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, lin, mix, pop} from '../../lib/anim';
import {beatFrames, beatPulse, type Beats} from '../../lib/beats';
import {loadBrandFonts, type Brand} from '../../lib/brand';
import {noise1D} from '../../lib/noise';
import {Bands, C, clampIdx, clipSrc, Dial, DayCard, DimLine, Grid, Kin, Label, Odometer, Plate, Reticle, type Fonts} from './parts';
import track from './track.json';

export type VideoProps = {id: string; beats: Beats; brand: Brand; seed: number; withAudio?: boolean; fps?: number; frame?: number};

// Início de cada cena, em beats (uma por frase). A última entrada é a assinatura da Kyneo.
const SCENE_BEATS = [0, 7, 12, 16, 17, 20, 23, 25, 28, 32, 39, 44, 47];
type Move = 'none' | 'up' | 'down' | 'left' | 'right' | 'zoom' | 'focus';
const ENTER: Move[] = ['none', 'up', 'left', 'zoom', 'none', 'none', 'right', 'focus', 'up', 'zoom', 'none', 'focus'];
const EXIT: Move[] = ['up', 'left', 'none', 'none', 'none', 'right', 'none', 'up', 'none', 'none', 'none', 'none'];

const W = 1080;
const pt = (arr: number[][], i: number) => arr[Math.max(0, Math.min(arr.length - 1, Math.round(i)))];
const grade: React.CSSProperties = {filter: 'contrast(1.06) saturate(0.92) brightness(0.97)'};

// Filmagem em duotone azul-marinho (modo "projeto técnico"), com opacidade controlada.
const Duo: React.FC<{src: string; x: number; y: number; s?: number; w: number; h: number; amount: number; blur?: number}> = ({src, x, y, s = 1, w, h, amount, blur = 0}) =>
  amount <= 0.001 ? null : (
    <div style={{position: 'absolute', left: x, top: y, width: w * s, height: h * s, overflow: 'hidden', opacity: amount, isolation: 'isolate'}}>
      <Plate src={src} x={0} y={0} s={s} w={w} h={h} style={{filter: `grayscale(1) contrast(1.2) brightness(1.3)${blur ? ` blur(${blur}px)` : ''}`}} />
      <div style={{position: 'absolute', inset: 0, background: '#2F6AA6', mixBlendMode: 'multiply'}} />
    </div>
  );

export const Video: React.FC<VideoProps> = ({id, beats, brand, seed, withAudio = true, fps: fpsProp, frame: frameProp}) => {
  loadBrandFonts(brand);
  const current = useCurrentFrame();
  const f = frameProp ?? current;
  const config = useVideoConfig();
  const fps = fpsProp ?? config.fps;
  const b = beatFrames(beats, fps);
  const F = (k: number) => (k < b.length ? b[k] : Math.round((k * 60 * fps) / beats.bpm));
  const fonts: Fonts = {display: brand.fonts.display.family, ui: brand.fonts.ui.family, mono: brand.fonts.mono?.family ?? brand.fonts.ui.family};
  const disp = fonts.display;
  const mono = fonts.mono;
  const ui = fonts.ui;
  const kin = {frame: f, fps, family: disp};
  const tailSec = (beats as Beats & {tailSec?: number}).tailSec;
  const tailStart = tailSec ? Math.round(tailSec * fps) : 1e9;

  // --- assinatura da Kyneo no fim (quadros do arquivo da marca, puro por frame) ----------------
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
  const k = (bt: number) => F(bt);

  // --- entrada e saída da cena (whip com borrão de movimento) ---------------------------------
  const pin = ease(f, s, 10);
  const pout = Math.max(0, (f - (e - 6)) / 6);
  const pe = pout * pout;
  let tx = 0;
  let ty = 0;
  let sc = 1;
  let blurX = 0;
  let blurY = 0;
  let blurAll = 0;
  const ent = ENTER[si];
  if (ent === 'up') (ty += (1 - pin) * 1400), (blurY += (1 - pin) * 40);
  if (ent === 'down') (ty -= (1 - pin) * 1400), (blurY += (1 - pin) * 40);
  if (ent === 'left') (tx += (1 - pin) * 1100), (blurX += (1 - pin) * 40);
  if (ent === 'right') (tx -= (1 - pin) * 1100), (blurX += (1 - pin) * 40);
  if (ent === 'zoom') (sc *= mix(1.35, 1, pin)), (blurAll += (1 - pin) * 14);
  if (ent === 'focus') (sc *= mix(1.08, 1, pin)), (blurAll += (1 - ease(f, s, 14)) * 22);
  const ex = EXIT[si];
  if (ex === 'up') (ty -= pe * 1400), (blurY += pe * 40);
  if (ex === 'left') (tx -= pe * 1100), (blurX += pe * 40);
  if (ex === 'right') (tx += pe * 1100), (blurX += pe * 40);
  // Empurrão lento da câmera e tremida nos golpes.
  const shake = beatPulse(f, [k(0), k(13), k(14), k(16), k(21), k(37), k(42)], 5);
  const push = 1 + lin(f, s, Math.max(1, e - s)) * 0.035;
  const sx = shake * noise1D(seed + 3, f * 1.7) * 16;
  const sy = shake * noise1D(seed + 4, f * 1.9) * 16;
  const filt = [blurAll > 0.3 ? `blur(${blurAll.toFixed(1)}px)` : '', blurX + blurY > 0.5 ? `url(#dir-${id}-${f})` : ''].join(' ').trim();
  const stage: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: `translate(${tx + sx}px, ${ty + sy}px) scale(${sc * push})`,
    transformOrigin: '50% 45%',
    filter: filt || undefined,
  };

  const light = si === 8;
  const orange = si === 3;
  let bg = C.bg;
  if (light) bg = C.light;
  if (orange) bg = C.accent;

  let scene: React.ReactNode = null;

  // ============ 0 · "Subir ou descer um equipamento a 60 metros" ============
  if (si === 0) {
    const idx = clampIdx('drone', f + 6);
    const sh = Easing.bezier(0.7, 0, 0.2, 1)(Math.min(1, Math.max(0, (f - 58) / 16)));
    const bx = mix(0, 590, sh);
    const by = mix(0, 250, sh);
    const bw = mix(W, 350, sh);
    const bh = mix(1920, 1350, sh);
    const imgX = mix(-240, 115, sh);
    const box = `inset(${by}px ${W - bx - bw}px ${1920 - by - bh}px ${bx}px round ${mix(0, 26, sh)}px)`;
    const count = ease(f, 66, 24);
    scene = (
      <>
        <Grid frame={f} />
        <div style={{position: 'absolute', left: 36, top: 540}}>
          <Odometer value="60" frame={f} start={64} dur={22} size={560} family={disp} color={C.accent} />
        </div>
        <DimLine x={548} y0={250} y1={1600} draw={ease(f, 60, 18)} fill={count} />
        <div style={{position: 'absolute', inset: 0, clipPath: box}}>
          <Bands n={6} frame={f} start={-6} dist={760} stagger={1.5} dur={14}>
            <Plate src={clipSrc(id, 'drone', idx)} x={imgX} y={0} s={1.4436} w={1080} h={1330} style={{filter: `brightness(${mix(0.62, 0.95, sh)}) contrast(1.12) saturate(${mix(0.75, 0.9, sh)})`}} />
            <div style={{position: 'absolute', inset: 0, background: C.bg, opacity: mix(0.28, 0, sh)}} />
          </Bands>
        </div>
        {/* SUBIR sobe, DESCER desce: as palavras fazem o que dizem */}
        <div style={{position: 'absolute', left: 64, top: 300, transform: `translateY(${-f * 1.3}px)`}}>
          <Kin t="SUBIR" size={262} enter={1} exit={54} exitDir={-1} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 74, top: 640}}>
          <Label t="OU" frame={f} enter={16} exit={54} family={mono} size={44} color={C.ink} />
        </div>
        <div style={{position: 'absolute', left: 64, top: 1180, transform: `translateY(${Math.max(0, f - 20) * 1.3}px)`}}>
          <Kin t="DESCER" size={218} enter={20} exit={54} exitDir={1} color={C.accent} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 64, top: 470}}>
          <Label t="EQUIPAMENTO A" frame={f} enter={62} family={mono} size={34} />
        </div>
        <div style={{position: 'absolute', left: 60, top: 1130}}>
          <Kin t="METROS" size={112} enter={84} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 64, top: 1290}}>
          <Label t="DE ALTURA" frame={f} enter={90} family={mono} size={34} />
        </div>
      </>
    );
  }

  // ============ 1 · "ainda toma a manhã inteira da sua equipe" ============
  if (si === 1) {
    const prog = Easing.bezier(0.45, 0, 0.3, 1)(Math.min(1, Math.max(0, (f - 112) / 54)));
    const mins = Math.round((prog * 300) / 5) * 5;
    const hh = String(7 + Math.floor(mins / 60)).padStart(2, '0');
    const mm = String(mins % 60).padStart(2, '0');
    const chip = ease(f, k(10), 12);
    scene = (
      <>
        <Grid frame={f} />
        <div style={{position: 'absolute', left: 64, top: 300}}>
          <Label t="AINDA TOMA A" frame={f} enter={s + 2} family={mono} size={34} />
        </div>
        <div style={{position: 'absolute', left: 60, top: 380}}>
          <Kin t="MANHÃ" size={232} enter={s + 4} {...kin} />
        </div>
        <Dial cx={510} cy={930} r={330} prog={prog} enter={s + 3} frame={f} fps={fps} mono={mono} />
        <div style={{position: 'absolute', left: 510 - 130, top: 930 + 120, width: 260, textAlign: 'center', fontFamily: mono, fontSize: 52, color: C.ink, opacity: ease(f, s + 8, 8)}}>
          {hh}:{mm}
        </div>
        <div style={{position: 'absolute', left: 60, top: 1300}}>
          <Kin t="INTEIRA" size={132} enter={k(9)} color={C.accent} {...kin} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 64,
            top: 1470,
            display: chip > 0 ? 'flex' : 'none',
            alignItems: 'center',
            gap: 18,
            padding: '20px 30px',
            borderRadius: 60,
            background: C.surface,
            border: `2px solid ${C.line}`,
            transform: `translateX(${(1 - chip) * -700}px)`,
          }}
        >
          <span style={{width: 18, height: 18, borderRadius: 9, background: C.accent}} />
          <span style={{fontFamily: ui, fontWeight: 600, fontSize: 40, color: C.ink, letterSpacing: 1}}>Sua equipe</span>
          <span style={{fontFamily: mono, fontSize: 32, color: C.muted, letterSpacing: 3}}>OCUPADA ATÉ 12:00</span>
        </div>
      </>
    );
  }

  // ============ 2 · "e você paga três diárias?" ============
  if (si === 2) {
    const tension = lin(f, k(15), 15);
    scene = (
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + tension * 0.05})`, transformOrigin: '50% 60%'}}>
        <Grid frame={f} />
        <div style={{position: 'absolute', left: 70, top: 520}}>
          <Kin t="E VOCÊ PAGA" size={96} enter={s + 1} {...kin} />
        </div>
        <DayCard n={1} x={70} y={740} rot={-7} frame={f} enter={s + 5} stampAt={s + 10} fps={fps} fonts={fonts} />
        <DayCard n={2} x={380} y={705} rot={3} frame={f} enter={k(13)} stampAt={k(13) + 5} fps={fps} fonts={fonts} />
        <DayCard n={3} x={660} y={750} rot={8} frame={f} enter={k(14)} stampAt={k(14) + 5} fps={fps} fonts={fonts} />
        <div style={{position: 'absolute', left: 66, top: 1210}}>
          <Kin t="DIÁRIAS" size={150} enter={k(14) + 2} {...kin} />
        </div>
        {f >= k(15) ? (
          <div
            style={{
              position: 'absolute',
              left: 560,
              top: 1340,
              fontFamily: disp,
              fontWeight: 800,
              fontSize: 250,
              lineHeight: 1,
              color: C.accent,
              letterSpacing: -8,
              transform: `scale(${mix(2.2, 1, pop(f, k(15), fps, 300, 16))}) rotate(-4deg)`,
              transformOrigin: '30% 60%',
            }}
          >
            ×3
          </div>
        ) : null}
      </div>
    );
  }

  // ============ 3 · "Por isso," (golpe de cor cheia na virada) ============
  if (si === 3) {
    scene = (
      <>
        <Grid frame={f} color="rgba(6,24,42,0.10)" />
        <div style={{position: 'absolute', left: 64, top: 640}}>
          <Kin t="POR" size={290} enter={s - 1} color={C.navyInk} stagger={0} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 64, top: 910}}>
          <Kin t="ISSO" size={290} enter={s + 1} color={C.navyInk} stagger={0} {...kin} />
        </div>
      </>
    );
  }

  // ============ 4 e 5 · "esse guincho de corda" / "prende no montante da torre." ============
  if (si === 4 || si === 5) {
    const idx = clampIdx('winch', 20 + (f - k(17)));
    const [wx, wy] = pt(track.winch, idx);
    const PY = 560;
    const duo = si === 5 ? ease(f, k(20), 8) : 0;
    const legT = Math.min(1, Math.max(0, (idx - 65) / 40));
    const legX = wx + mix(122, 84, legT);
    const legW = mix(160, 104, legT);
    const mountY = PY + wy + 118;
    const draw = ease(f, k(20) + 2, 14);
    const clampP = pop(f, k(21), fps, 320, 15);
    const gap = mix(130, 0, f >= k(21) - 3 ? clampP : 0);
    const content = (
      <>
        <div style={{position: 'absolute', inset: 0, background: C.bg}} />
        <Grid frame={f} />
        <div style={{position: 'absolute', left: 54, top: 420}}>
          <Kin t="GUINCHO" size={172} enter={k(17) + 3} exit={k(20) - 2} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 60, top: 300}}>
          <Kin t="PRENDE NO" size={104} enter={k(20) + 1} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 54, top: 410}}>
          <Kin t="MONTANTE" size={152} enter={k(20) + 5} color={C.accent} {...kin} />
        </div>
        <Plate src={clipSrc(id, 'winch', idx)} x={0} y={PY} w={1080} h={1130} style={grade} />
        <Duo src={clipSrc(id, 'winch', idx)} x={0} y={PY} w={1080} h={1130} amount={duo * 0.92} />
        {si === 4 ? <Reticle x={wx} y={PY + wy} w={380} h={300} frame={f} enter={k(18)} fps={fps} label="DE CORDA" family={mono} /> : null}
        {si === 5 ? (
          <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
            {/* contorno do montante (linhas de projeto sobre a filmagem real) */}
            <g stroke={C.ink} strokeWidth={3} fill="none" strokeDasharray="1400" strokeDashoffset={1400 * (1 - draw)}>
              <line x1={legX - legW / 2} y1={PY} x2={legX - legW / 2} y2={PY + 1130} />
              <line x1={legX + legW / 2} y1={PY} x2={legX + legW / 2} y2={PY + 1130} />
            </g>
            {/* cota da largura do montante */}
            <g stroke={C.muted} strokeWidth={2} opacity={draw}>
              <line x1={legX - legW / 2} y1={PY + 60} x2={legX + legW / 2} y2={PY + 60} />
              <line x1={legX - legW / 2} y1={PY + 46} x2={legX - legW / 2} y2={PY + 74} />
              <line x1={legX + legW / 2} y1={PY + 46} x2={legX + legW / 2} y2={PY + 74} />
            </g>
            {/* trava: dois colchetes laranja que fecham no montante */}
            {f >= k(20) + 6 ? (
              <g stroke={C.accent} strokeWidth={10} fill="none" strokeLinecap="square">
                <path d={`M${legX - legW / 2 - 18 - gap + 34} ${mountY - 70}H${legX - legW / 2 - 18 - gap}V${mountY + 70}H${legX - legW / 2 - 18 - gap + 34}`} />
                <path d={`M${legX + legW / 2 + 18 + gap - 34} ${mountY - 70}H${legX + legW / 2 + 18 + gap}V${mountY + 70}H${legX + legW / 2 + 18 + gap - 34}`} />
              </g>
            ) : null}
          </svg>
        ) : null}
        {si === 5 && f >= k(21) ? (
          <div style={{position: 'absolute', left: legX + legW / 2 + 60, top: mountY - 26, overflow: 'hidden'}}>
            <div style={{fontFamily: mono, fontSize: 32, letterSpacing: 5, color: C.navyInk, background: C.accent, padding: '8px 14px', transform: `translateX(${(1 - ease(f, k(21) + 2, 9)) * -110}%)`}}>TRAVADO</div>
          </div>
        ) : null}
        {si === 5 ? (
          <div style={{position: 'absolute', left: 64, top: PY + 1130 - 90, opacity: draw}}>
            <Label t="DA TORRE" frame={f} enter={k(21) + 4} family={mono} size={34} color={C.ink} />
          </div>
        ) : null}
      </>
    );
    scene = (
      <>
        <div style={{position: 'absolute', inset: 0, background: C.accent}} />
        <Bands n={5} frame={f} start={k(17) - 3} dist={1100} stagger={2} dur={12}>
          {content}
        </Bands>
      </>
    );
  }

  // ============ 6 · "Pedal no pé," ============
  if (si === 6) {
    const press = pop(f, k(24), fps, 300, 14);
    const pressed = f >= k(24);
    const ang = pressed ? mix(-15, -4, press) : -15;
    const idx = clampIdx('winch', 60 + (f - k(23)));
    const [wx, wy] = pt(track.winch, idx);
    const IX = 500;
    const IY = 780;
    const IW = 450;
    const IH = 500;
    const flow = pressed ? lin(f, k(24), 12) : 0;
    const cable = `M620 1500C770 1500 725 1390 725 ${IY + IH}`;
    const pin2 = ease(f, s + 5, 12);
    scene = (
      <>
        <Grid frame={f} />
        <div style={{position: 'absolute', left: 64, top: 300}}>
          <Kin t="PEDAL" size={214} enter={s + 2} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 64, top: 520}}>
          <Kin t="NO PÉ" size={214} enter={s + 6} color={C.accent} {...kin} />
        </div>
        {/* janela com o guincho: acorda quando o pedal é pisado */}
        <div style={{position: 'absolute', left: IX, top: IY, width: IW, height: IH, overflow: 'hidden', borderRadius: 24, outline: `5px solid ${pressed ? C.accent : C.line}`, transform: `translateY(${(1 - ease(f, s + 3, 12)) * 300}px)`}}>
          <Plate src={clipSrc(id, 'winch', idx)} x={IW / 2 - wx * 1.05} y={IH / 2 - wy * 1.05} s={1.05} w={1080} h={1130} style={{filter: pressed ? 'contrast(1.06) saturate(0.95)' : 'grayscale(0.9) brightness(0.55)'}} />
        </div>
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          {/* cabo do pedal até o guincho */}
          <path d={cable} fill="none" stroke={C.line} strokeWidth={7} opacity={pin2} />
          {pressed ? <path d={cable} fill="none" stroke={C.accent} strokeWidth={7} strokeDasharray="800" strokeDashoffset={800 * (1 - flow)} /> : null}
          {/* pedal em vista lateral (desenho técnico, sem enfeite) */}
          <g transform={`translate(0 ${(1 - pin2) * 260})`}>
            <rect x={70} y={1480} width={560} height={44} rx={10} fill={C.surface} stroke={C.ink} strokeWidth={4} />
            <g transform={`rotate(${ang} 110 1468)`}>
              <rect x={96} y={1424} width={510} height={42} rx={12} fill={C.surface} stroke={pressed ? C.accent : C.ink} strokeWidth={5} />
              {Array.from({length: 9}).map((_, i) => (
                <line key={i} x1={170 + i * 48} y1={1433} x2={170 + i * 48} y2={1457} stroke={C.muted} strokeWidth={4} />
              ))}
            </g>
            <circle cx={110} cy={1468} r={18} fill={C.bg} stroke={C.ink} strokeWidth={5} />
            <path d={`M545 1480l-14 -8l28 -8l-28 -8l28 -8l-14 -6`} transform={`translate(0 ${(pressed ? press : 0) * 16}) scale(1 ${1 - (pressed ? press : 0) * 0.45})`} style={{transformOrigin: '545px 1480px'}} fill="none" stroke={C.muted} strokeWidth={4} />
            {pressed ? <circle cx={420} cy={1440} r={mix(14, 170, lin(f, k(24), 14))} fill="none" stroke={C.accent} strokeWidth={5} opacity={1 - lin(f, k(24), 14)} /> : null}
          </g>
        </svg>
      </>
    );
  }

  // ============ 7 · "um operador conduz." ============
  if (si === 7) {
    const idx = clampIdx('worker', 8 + (f - k(25)));
    const S = 1.25;
    const X = -135;
    const Y = 300;
    scene = (
      <>
        <Duo src={clipSrc(id, 'worker', idx)} x={X} y={Y} s={S} w={1080} h={1130} amount={1} blur={3} />
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: Y + 30, background: C.bg}} />
        <div style={{position: 'absolute', left: 0, top: Y + 1130 * S - 30, width: 1080, height: 400, background: C.bg}} />
        <div style={{position: 'absolute', left: 64, top: 330}}>
          <Label t="UM" frame={f} enter={s + 1} family={mono} size={40} color={C.ink} />
        </div>
        <div style={{position: 'absolute', left: 40, top: 380, transform: `translateY(${-(f - s) * 0.6}px)`}}>
          <Kin t="1" size={780} enter={s + 1} color={C.accent} {...kin} />
        </div>
        {/* o operador recortado fica na frente do número; OPERADOR passa na frente dele */}
        <Plate src={clipSrc(id, 'worker_cut', idx, 'png')} x={X} y={Y} s={S} w={1080} h={1130} style={grade} />
        <div style={{position: 'absolute', left: 58, top: 1230, transform: `translateX(${-(f - s) * 0.9}px)`}}>
          <Kin t="OPERADOR" size={150} enter={s + 6} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 700, top: 980, overflow: 'hidden'}}>
          <div style={{fontFamily: mono, fontSize: 34, letterSpacing: 6, color: C.navyInk, background: C.accent, padding: '10px 16px', transform: `translateY(${(1 - ease(f, k(26) + 2, 9)) * 110}%)`}}>CONDUZ</div>
        </div>
      </>
    );
  }

  // ============ 8 · "Ágil e prático como deve ser." ============
  if (si === 8) {
    const idx = clampIdx('tower', f - k(28));
    const tilt = lin(f, s, e - s);
    const S = 1.72;
    const TX = -300;
    const TY = mix(10, -150, tilt);
    scene = (
      <>
        <div style={{position: 'absolute', left: 60, top: 520, transform: `translateY(${-tilt * 60}px)`}}>
          <Kin t="ÁGIL" size={300} enter={s + 2} color={C.accent} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 64, top: 1010, transform: `translateY(${-tilt * 60}px)`}}>
          <Kin t="E PRÁTICO" size={150} enter={k(30)} color={C.navyInk} {...kin} />
        </div>
        {/* a treliça (céu removido) passa NA FRENTE das palavras */}
        <Plate src={clipSrc(id, 'tower_fg', idx, 'png')} x={TX} y={TY} s={S} w={1080} h={1130} style={{filter: 'contrast(1.15) brightness(0.8) saturate(0.6)'}} />
        <div style={{position: 'absolute', left: 540, top: 1330}}>
          <Label t="COMO DEVE SER" frame={f} enter={k(31)} family={mono} size={40} color={C.navyInk} />
        </div>
      </>
    );
  }

  // ============ 9 · "Variantes de 150 quilos até uma tonelada." ============
  if (si === 9) {
    const idx = clampIdx('tower', 10 + (f - k(32)));
    const [lx, ly] = pt(track.load, idx);
    const S = 1.15;
    const BX = 100;
    const BY = 250;
    const BW = 860;
    const BH = 860;
    const IX = BX + BW / 2 - 530 * S;
    const IY = BY + BH / 2 - 420 * S;
    const cap = ease(f, k(35), 22);
    const kg = Math.round(mix(150, 1000, cap));
    const ton = f >= k(37);
    const barX0 = 100;
    const barX1 = 940;
    const bar = ease(f, k(34) + 6, 12);
    const mx = mix(barX0, barX1, cap);
    scene = (
      <>
        <Grid frame={f} />
        <div style={{position: 'absolute', left: BX, top: BY, width: BW, height: BH, borderRadius: 26, overflow: 'hidden', transform: `scale(${mix(0.92, 1, ease(f, s, 14))})`}}>
          <Plate src={clipSrc(id, 'tower', idx)} x={IX - BX} y={IY - BY} s={S} w={1080} h={1130} style={grade} />
        </div>
        <Reticle x={IX + lx * S} y={IY + ly * S} w={mix(250, 330, cap)} h={mix(330, 420, cap)} frame={f} enter={s + 6} fps={fps} label={ton ? '1 T' : `${kg.toLocaleString('pt-BR')} KG`} family={mono} />
        <div style={{position: 'absolute', left: 100, top: 1150}}>
          <Label t="VARIANTES DE" frame={f} enter={s + 3} family={mono} size={36} />
        </div>
        <div style={{position: 'absolute', left: 92, top: 1210, display: 'flex', alignItems: 'baseline', gap: 22}}>
          {!ton ? (
            f < k(35) ? (
              <Odometer value="150" frame={f} start={k(33) + 4} dur={14} size={210} family={disp} color={C.ink} />
            ) : (
              <div style={{fontFamily: disp, fontWeight: 800, fontSize: 210, lineHeight: 1, color: C.ink, letterSpacing: -6, fontVariantNumeric: 'tabular-nums'}}>{kg.toLocaleString('pt-BR')}</div>
            )
          ) : (
            <div style={{fontFamily: disp, fontWeight: 800, fontSize: 210, lineHeight: 1, color: C.accent, letterSpacing: -6, transform: `scale(${mix(1.5, 1, pop(f, k(37), fps, 300, 15))})`, transformOrigin: '0% 80%'}}>1</div>
          )}
          <div style={{fontFamily: disp, fontWeight: 800, fontSize: ton ? 96 : 84, color: ton ? C.ink : C.muted, opacity: ease(f, k(33) + 8, 8)}}>{ton ? 'TONELADA' : 'KG'}</div>
        </div>
        {/* régua de capacidade: 150 kg → 1 t */}
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: bar}}>
          <line x1={barX0} y1={1520} x2={mix(barX0, barX1, bar)} y2={1520} stroke={C.line} strokeWidth={10} strokeLinecap="round" />
          <line x1={barX0} y1={1520} x2={mx} y2={1520} stroke={C.accent} strokeWidth={10} strokeLinecap="round" />
          {Array.from({length: 18}).map((_, i) => {
            const x = mix(barX0, barX1, i / 17);
            return <line key={i} x1={x} y1={1490} x2={x} y2={i % 17 === 0 ? 1474 : 1500} stroke={x <= mx ? C.accent : C.muted} strokeWidth={3} />;
          })}
          <circle cx={mx} cy={1520} r={20} fill={C.ink} stroke={C.accent} strokeWidth={6} />
          <text x={barX0} y={1578} fontFamily={mono} fontSize={30} fill={C.muted} letterSpacing={3}>150 KG</text>
          <text x={barX1} y={1578} fontFamily={mono} fontSize={30} fill={ton ? C.accent : C.muted} letterSpacing={3} textAnchor="end">1 T</text>
        </svg>
      </>
    );
  }

  // ============ 10 · "Modelos a partir de 3 mil reais." ============
  if (si === 10) {
    const idx = clampIdx('winch', 25 + (f - k(39)));
    const [wx, wy] = pt(track.winch, idx);
    const WX = 340;
    const WY = 380;
    const WW = 610;
    const WH = 760;
    const hit = f >= k(42) ? Math.exp(-(f - k(42)) / 5) : 0;
    scene = (
      <>
        <Grid frame={f} />
        <div style={{position: 'absolute', left: 60, top: 250}}>
          <Kin t="MODELOS" size={150} enter={s + 1} {...kin} />
        </div>
        {/* janela estabilizada no guincho (vira foto de produto), em perspectiva */}
        <div style={{position: 'absolute', inset: 0, perspective: 1600}}>
          <div style={{position: 'absolute', left: WX, top: WY, width: WW, height: WH, transform: `rotateY(${mix(-20, -7, ease(f, s, 40))}deg)`, transformOrigin: '100% 50%'}}>
            <Bands n={4} axis="y" frame={f} start={s} dist={900} stagger={2} dur={12} box={{x: 0, y: 0, w: WW, h: WH}}>
              <div style={{position: 'absolute', left: 0, top: 0, width: WW, height: WH, borderRadius: 24, overflow: 'hidden'}}>
                <Plate src={clipSrc(id, 'winch', idx)} x={WW / 2 - wx * 1.25} y={WH / 2 - wy * 1.25} s={1.25} w={1080} h={1130} style={grade} />
              </div>
            </Bands>
          </div>
        </div>
        <div style={{position: 'absolute', left: 70, top: 1180}}>
          <Label t="A PARTIR DE" frame={f} enter={k(40)} family={mono} size={36} color={C.ink} />
        </div>
        <div style={{position: 'absolute', left: 70, top: 1236}}>
          <Kin t="R$" size={96} enter={k(40) + 4} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 58, top: 1340, transform: `scale(${1 + hit * 0.08})`, transformOrigin: '0% 100%'}}>
          <Odometer value="3.000" frame={f} start={k(40) + 8} dur={14} size={240} family={disp} color={C.accent} spins={2} />
        </div>
      </>
    );
  }

  // ============ 11 · "Clique em Saiba Mais." ============
  if (si === 11) {
    const cx = 520;
    const cy = 830;
    const r = 360;
    const ring = ease(f, s, 18);
    const circ = 2 * Math.PI * r;
    const press = f >= k(46) ? pop(f, k(46), fps, 320, 12) : 0;
    const pressed = f >= k(46);
    const cta = ease(f, s + 8, 12);
    scene = (
      <>
        <div style={{position: 'absolute', inset: 0, background: C.deep}} />
        <Plate src={clipSrc(id, 'tower_fg', 100, 'png')} x={-340} y={-80 - (f - s) * 1.2} s={1.9} w={1080} h={1130} style={{filter: 'brightness(0)', opacity: 0.55}} />
        <Grid frame={f} />
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth={7} strokeDasharray={circ} strokeDashoffset={circ * (1 - ring)} transform={`rotate(-90 ${cx} ${cy})`} />
          <rect x={cx - 150 * ease(f, s + 12, 10)} y={cy + 92} width={300 * ease(f, s + 12, 10)} height={10} rx={5} fill={C.accent} />
        </svg>
        <div style={{position: 'absolute', left: cx - 400, width: 800, top: cy - 205, display: 'flex', justifyContent: 'center', overflow: 'hidden'}}>
          <div style={{fontFamily: ui, fontWeight: 600, fontSize: 32, letterSpacing: 9, color: C.accent, transform: `translateY(${(1 - ease(f, s + 4, 10)) * 110}%)`, whiteSpace: 'nowrap'}}>IÇAMENTO EM TORRES</div>
        </div>
        <div style={{position: 'absolute', left: cx - 400, width: 800, top: cy - 150, display: 'flex', justifyContent: 'center'}}>
          <Kin t="HEB" size={250} enter={s + 6} tracking={-0.02} {...kin} />
        </div>
        <div style={{position: 'absolute', left: cx - 400, width: 800, top: cy + 135, display: 'flex', justifyContent: 'center', overflow: 'hidden'}}>
          <div style={{fontFamily: ui, fontWeight: 600, fontSize: 36, letterSpacing: 7, color: C.ink, transform: `translateY(${(1 - ease(f, s + 14, 10)) * 110}%)`, whiteSpace: 'nowrap'}}>GUINCHOS E SOLUÇÕES</div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: cx - 300,
            top: 1330,
            width: 600,
            height: 124,
            borderRadius: 62,
            border: `5px solid ${C.accent}`,
            background: pressed ? C.accent : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            transform: `translateY(${(1 - cta) * 260}px) scale(${pressed ? mix(0.92, 1, press) : 1})`,
            opacity: cta > 0 ? 1 : 0,
          }}
        >
          <span style={{fontFamily: disp, fontWeight: 800, fontSize: 54, letterSpacing: 2, color: pressed ? C.navyInk : C.ink}}>SAIBA MAIS</span>
          <svg width={50} height={50} viewBox="0 0 50 50">
            <path d="M8 25H40M28 12L41 25L28 38" fill="none" stroke={pressed ? C.navyInk : C.accent} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {pressed ? (
          <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
            <circle cx={cx + 120} cy={1392} r={mix(20, 170, lin(f, k(46), 14))} fill="none" stroke={C.accent} strokeWidth={4} opacity={1 - lin(f, k(46), 14)} />
          </svg>
        ) : null}
        <div style={{position: 'absolute', left: 64, top: 1240, opacity: 0}} />
      </>
    );
  }

  // --- o herói: cabo com bloco laranja subindo pela borda esquerda do começo ao fim -----------
  const lift = Easing.bezier(0.4, 0, 0.3, 1)(Math.min(1, f / (tailStart - 1)));
  const blockY = mix(1560, 150, lift);
  const heroInk = light || orange ? C.navyInk : C.muted;
  const blockCol = orange ? C.navyInk : C.accent;
  const sway = noise1D(seed + 9, f / 25) * 3;

  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={`dir-${id}-${f}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={`${blurX.toFixed(1)} ${blurY.toFixed(1)}`} />
        </filter>
        <filter id={`grain-${id}-${f}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={(seed * 97 + f) % 9973} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div style={stage}>{scene}</div>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={22 + sway} y1={0} x2={22 + sway} y2={blockY} stroke={heroInk} strokeWidth={2} opacity={0.6} />
        <rect x={15 + sway} y={blockY} width={14} height={24} rx={3} fill={blockCol} />
        <line x1={22 + sway} y1={blockY + 24} x2={22 + sway} y2={blockY + 38} stroke={blockCol} strokeWidth={3} />
      </svg>
      <div style={{position: 'absolute', inset: 0, filter: `url(#grain-${id}-${f})`, opacity: 0.07, mixBlendMode: 'overlay'}} />
    </AbsoluteFill>
  );
};
