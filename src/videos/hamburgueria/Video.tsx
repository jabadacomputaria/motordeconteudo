// "Como eu faria um motion de vendas para uma hamburgueria artesanal delivery" (Kyneo, conteúdo orgânico), v2.
// Abertura Kyneo com cartão de projeto; cadeado de verdade; olho; hambúrguer realista se montando com
// reflexo na mesa; queijo escorrendo em gotas; mordida com som; mapa de bairro em plano inclinado com a
// moto virando nas ruas; a sacola abre e de dentro sai o anúncio; pedido confirmado e assinatura.
// Tudo deriva do frame (prop `frame` ou useCurrentFrame).
import React from 'react';
import {loadFont} from '@remotion/fonts';
import {AbsoluteFill, Easing, Html5Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, lin, mix, pop} from '../../lib/anim';
import {beatFrames, beatPulse, type Beats} from '../../lib/beats';
import {loadBrandFonts, type Brand} from '../../lib/brand';
import {noise1D, rand} from '../../lib/noise';
import {Bag, Burger, Eye, HouseTop, Lock, MotoTop, W, type BurgerProps} from './food';

export type VideoProps = {id: string; beats: Beats; brand: Brand; seed: number; withAudio?: boolean; fps?: number; frame?: number};

let kyneoFont = false;
const loadKyneoFont = () => {
  if (kyneoFont) return;
  kyneoFont = true;
  loadFont({family: 'Unbounded', url: staticFile('fonts/unbounded-latin-700-normal.woff2'), weight: '700'});
  loadFont({family: 'Unbounded', url: staticFile('fonts/unbounded-latin-600-normal.woff2'), weight: '600'});
};

const SCENE_BEATS = [0, 8, 15, 22, 29, 37, 44, 49, 54, 59];

// Texto cinético sem caixa, com jeitos diferentes de entrar:
// rise (sobe por máscara), flip (vira em 3D de baixo), depth (vem da câmera, desfocado),
// slide (desliza inclinado), melt (letras caem e escorrem).
type Mode = 'rise' | 'flip' | 'depth' | 'slide' | 'melt';
const Kin: React.FC<{t: string; size: number; enter: number; frame: number; fps: number; family: string; color?: string; weight?: number; exit?: number; align?: 'left' | 'center'; mode?: Mode; fill?: string}> = ({t, size, enter, frame, fps, family, color = W.cream, weight = 800, exit, align = 'left', mode = 'rise', fill}) => {
  if (frame < enter - 1) return null;
  if (exit !== undefined && frame > exit + 14) return null;
  const out = (i: number) => (exit === undefined ? 0 : ease(frame, exit + i * 2, 9));
  const textStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    fontFamily: family,
    fontWeight: weight,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: -size * 0.03,
    color,
    whiteSpace: 'nowrap',
    ...(fill ? {background: fill, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'} : {}),
    ...extra,
  });
  const justify = align === 'center' ? 'center' : 'flex-start';
  if (mode === 'melt') {
    return (
      <div style={{display: 'flex', justifyContent: justify}}>
        {t.split('').map((ch, i) => {
          const drop = pop(frame, enter + i * 2, fps, 170, 13);
          const drip = ease(frame, enter + 10 + i * 3, 30);
          return (
            <div key={i} style={{position: 'relative'}}>
              <div style={textStyle({transform: `translateY(${(1 - drop) * -140 + drip * 10 - out(i) * 200}px) scaleY(${1 + drip * 0.1})`, transformOrigin: '50% 0', opacity: drop > 0.01 ? 1 : 0})}>{ch === ' ' ? ' ' : ch}</div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: justify, columnGap: size * 0.24, perspective: 900}}>
      {t.split(' ').map((w, i) => {
        const q = pop(frame, enter + i * 3, fps, 200, 20);
        const o = out(i);
        let st: React.CSSProperties = {};
        if (mode === 'rise') st = {transform: `translateY(${(1 - q) * 110 - o * 115}%)`};
        if (mode === 'flip') st = {transform: `rotateX(${(1 - q) * -95 + o * 95}deg)`, transformOrigin: '50% 100%', opacity: q > 0.05 ? 1 : 0};
        if (mode === 'depth') {
          const z = Easing.out(Easing.cubic)(lin(frame, enter + i * 3, 12));
          st = {transform: `scale(${mix(2.6, 1, z) * (1 - o * 0.3)})`, filter: z < 0.98 ? `blur(${((1 - z) * 16).toFixed(1)}px)` : undefined, opacity: Math.min(1, z * 3) * (1 - o)};
        }
        if (mode === 'slide') st = {transform: `translateX(${(1 - q) * 300 - o * 300}px) skewX(${(1 - q) * -20}deg)`, opacity: Math.min(1, q * 2) * (1 - o)};
        return (
          <div key={i} style={{overflow: mode === 'rise' ? 'hidden' : 'visible', padding: `${size * 0.04}px 0 ${size * 0.2}px`, marginBottom: -size * 0.16}}>
            <div style={textStyle(st)}>{w}</div>
          </div>
        );
      })}
    </div>
  );
};

// Bairro do mapa (coordenadas do plano): ruas e quarteirões com casas e árvores.
const SX = [100, 500, 900, 1300];
const SY = [100, 550, 1000, 1450, 1900];
const ROUTE: [number, number][] = [
  [100, 1820],
  [100, 1450],
  [500, 1450],
  [500, 1000],
  [900, 1000],
  [900, 700],
];
const SEGS = ROUTE.slice(1).map((p, i) => ({a: ROUTE[i], b: p, len: Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1])}));
const ROUTE_LEN = SEGS.reduce((s, x) => s + x.len, 0);
const pointAt = (d: number): [number, number] => {
  let r = Math.max(0, Math.min(ROUTE_LEN, d));
  for (const sg of SEGS) {
    if (r <= sg.len) {
      const q = r / sg.len;
      return [mix(sg.a[0], sg.b[0], q), mix(sg.a[1], sg.b[1], q)];
    }
    r -= sg.len;
  }
  return ROUTE[ROUTE.length - 1];
};
const ROOFS = ['#E2603A', '#FF8A5B', '#3E7CB1', '#2BB3A3', '#F2C14E', '#B85C8A', '#6C8EBF', '#E07A5F'];

export const Video: React.FC<VideoProps> = ({id, beats, brand, seed, withAudio = true, fps: fpsProp, frame: frameProp}) => {
  loadBrandFonts(brand);
  loadKyneoFont();
  const current = useCurrentFrame();
  const f = frameProp ?? current;
  const config = useVideoConfig();
  const fps = fpsProp ?? config.fps;
  const b = beatFrames(beats, fps);
  const F = (k: number) => (k < b.length ? b[k] : Math.round((k * 60 * fps) / beats.bpm));
  const disp = brand.fonts.display.family;
  const ui = brand.fonts.ui.family;
  const mono = brand.fonts.mono?.family ?? ui;
  const tailSec = (beats as Beats & {tailSec?: number}).tailSec;
  const tailStart = tailSec ? Math.round(tailSec * fps) : 1e9;
  const kin = {frame: f, fps, family: disp};
  const k = F;

  if (f >= tailStart) {
    const n = Math.min(75, f - tailStart + 1);
    return (
      <AbsoluteFill style={{background: '#0B0B0C'}}>
        {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
        <Img src={staticFile(`${id}/trailer/${String(n).padStart(3, '0')}.jpg`)} style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
    );
  }

  const starts = SCENE_BEATS.map(F);
  let si = 0;
  for (let i = 0; i < starts.length - 1; i++) if (f >= starts[i]) si = i;
  const s = starts[si];
  const e = starts[si + 1];

  const continuous = si === 4 || si === 5 || si === 7;
  const pin = continuous ? 1 : ease(f, s, 9);
  const enterScale = mix(1.18, 1, pin);
  const enterBlur = (1 - pin) * 14;
  const shake = beatPulse(f, [k(19), k(25), k(28), k(40)], 5);
  const push = 1 + lin(f, s, Math.max(1, e - s)) * 0.035;
  const stage: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: `translate(${shake * noise1D(seed + 3, f * 1.7) * 16}px, ${shake * noise1D(seed + 4, f * 1.9) * 16}px) scale(${enterScale * push})`,
    transformOrigin: '50% 48%',
    filter: enterBlur > 0.3 ? `blur(${enterBlur.toFixed(1)}px)` : undefined,
  };

  let scene: React.ReactNode = null;

  // ---------------- 0. Abertura Kyneo + cartão do projeto ----------------
  if (si === 0) {
    const kIn = pop(f, 2, fps, 170, 16);
    const trail = ease(f, 4, 14);
    const up = ease(f, 52, 16);
    const card = Easing.out(Easing.cubic)(lin(f, 56, 18));
    const rows = [74, 88, 102].map((at) => pop(f, at, fps, 220, 18));
    const stampQ = pop(f, 114, fps, 260, 14);
    const wipe = Easing.in(Easing.cubic)(lin(f, 120, e - 120));
    const tag = 'para você, empreendedor';
    const typedN = Math.round(lin(f, 24, 20) * tag.length);
    const items: [string, string][] = [
      ['Cliente', 'Brasa Burger (exemplo)'],
      ['Segmento', 'hamburgueria artesanal'],
      ['Canal', '100% delivery'],
    ];
    scene = (
      <>
        <div style={{position: 'absolute', left: 0, right: 0, top: mix(560, 170, up), display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${mix(1, 0.62, up)})`}}>
          <div style={{position: 'relative', width: 260, height: 260, transform: `translateX(${(1 - kIn) * -260}px) scale(${0.6 + 0.4 * kIn})`}}>
            {[2, 1].map((c) => (
              <Img key={c} src={staticFile(`${id}/simbolo.svg`)} style={{position: 'absolute', inset: 0, width: 260, height: 260, opacity: 0.35 * (1 - trail), transform: `translateX(${-(1 - trail) * c * 50}px)`}} />
            ))}
            <Img src={staticFile(`${id}/simbolo.svg`)} style={{position: 'absolute', inset: 0, width: 260, height: 260}} />
          </div>
          <div style={{overflow: 'hidden', marginTop: 14}}>
            <div style={{fontFamily: 'Unbounded', fontWeight: 700, fontSize: 110, letterSpacing: 14, color: '#F4F4F2', transform: `translateY(${(1 - pop(f, 14, fps, 200, 18)) * 110}%)`}}>KYNEO</div>
          </div>
          <div style={{marginTop: 18, height: 56, fontFamily: ui, fontWeight: 500, fontSize: 46, color: '#A3A7AD'}}>
            {tag.slice(0, typedN)}
            {typedN < tag.length && f >= 24 ? <span style={{display: 'inline-block', width: 3, height: 44, background: '#D4D7DB', marginLeft: 4, verticalAlign: -6}} /> : null}
          </div>
        </div>
        {card > 0.001 ? (
          <div style={{position: 'absolute', left: 90, top: 720, width: 900, perspective: 1400}}>
            <div style={{borderRadius: 40, background: 'linear-gradient(160deg, #26282B, #17181A)', border: '2px solid #4A4D52', padding: '44px 48px', boxSizing: 'border-box', transform: `rotateX(${(1 - card) * 80}deg) translateY(${(1 - card) * 200}px)`, transformOrigin: '50% 100%', boxShadow: '0 40px 90px rgba(0,0,0,0.6)', position: 'relative'}}>
              <div style={{fontFamily: mono, fontSize: 26, letterSpacing: 4, color: '#A3A7AD'}}>NOVO PROJETO</div>
              <div style={{fontFamily: 'Unbounded', fontWeight: 600, fontSize: 62, color: '#F4F4F2', marginTop: 14, letterSpacing: -1}}>Motion de vendas</div>
              {items.map(([l, v], i) => (
                <div key={l} style={{display: 'flex', gap: 24, alignItems: 'baseline', marginTop: 26, borderTop: '1px solid #33363B', paddingTop: 22, opacity: rows[i] > 0.01 ? 1 : 0, transform: `translateX(${(1 - rows[i]) * 60}px)`}}>
                  <div style={{fontFamily: mono, fontSize: 26, color: '#A3A7AD', width: 190}}>{l}</div>
                  <div style={{fontFamily: ui, fontWeight: 600, fontSize: 40, color: '#F4F4F2'}}>{v}</div>
                </div>
              ))}
              {stampQ > 0.01 ? (
                <div style={{position: 'absolute', right: 40, top: 36, width: 128, height: 128, borderRadius: 64, background: `radial-gradient(circle at 35% 30%, #FFB04A, ${W.orange} 60%, #C24A00)`, transform: `scale(${stampQ}) rotate(${(1 - stampQ) * -40}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(255,122,0,0.35)'}}>
                  <Burger w={92} id="stamp" board={false} melt={0.2} />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {wipe > 0 ? <div style={{position: 'absolute', left: 878 - 2300 * wipe, top: 820 - 2300 * wipe, width: 4600 * wipe, height: 4600 * wipe, borderRadius: '50%', background: W.bg}} /> : null}
      </>
    );
  }

  // ---------------- 1. A chave mestra: cadeado de verdade ----------------
  if (si === 1) {
    const kp = Easing.out(Easing.cubic)(lin(f, s + 4, 18));
    const turn = Easing.inOut(Easing.cubic)(lin(f, k(10), 8));
    const lift = Easing.out(Easing.back(2))(lin(f, k(11), 7));
    const swing = Easing.inOut(Easing.cubic)(lin(f, k(11) + 8, 12));
    scene = (
      <>
        <div style={{position: 'absolute', left: 0, right: 0, top: 230}}>
          <Kin t="DESEJO" size={250} enter={s + 10} align="center" mode="depth" fill={`linear-gradient(180deg, #FFF3E2, #FFB45A)`} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 280, top: 560}}>
          <Lock lift={lift} swing={swing} kp={kp} turn={turn} id="lk" />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1420}}>
          <Kin t="é a chave mestra" size={88} enter={k(11) + 2} align="center" mode="flip" color={W.orange} {...kin} />
        </div>
      </>
    );
  }

  // ---------------- 2. Não é precisar, é ver ----------------
  if (si === 2) {
    const strike = ease(f, k(18), 7);
    const eye = Easing.out(Easing.back(1.4))(lin(f, k(19), 14));
    const hitIn = f >= k(19);
    scene = (
      <>
        <div style={{position: 'absolute', left: 90, top: hitIn ? 260 : 560, transform: hitIn ? 'scale(0.72)' : undefined, transformOrigin: '0 0'}}>
          <Kin t="Ninguém pede" size={96} enter={s + 2} color={W.muted} mode="slide" {...kin} />
          <div style={{position: 'relative', marginTop: 10}}>
            <Kin t="porque precisa." size={112} enter={s + 14} color={W.cream} {...kin} />
            {strike > 0 ? <div style={{position: 'absolute', left: 440, top: 58, height: 20, width: strike * 440, background: W.red, borderRadius: 11, transform: 'rotate(-4deg)', transformOrigin: '0 50%', boxShadow: '0 0 0 4px rgba(22,8,6,0.6)'}} /> : null}
          </div>
        </div>
        {hitIn ? (
          <>
            <div style={{position: 'absolute', left: 160, top: 660}}>
              <Eye open={eye} id="eye" />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 1170}}>
              <Kin t="VIU." size={250} enter={k(19)} align="center" mode="depth" fill="linear-gradient(180deg, #FFC24A, #FF5A12)" {...kin} />
            </div>
          </>
        ) : null}
      </>
    );
  }

  // ---------------- 3 a 5. O hambúrguer (contínuo): monta, derrete, leva a mordida ----------------
  if (si >= 3 && si <= 5) {
    const grav = (at: number) => Easing.in(Easing.quad)(lin(f, at - 8, 8));
    const open = ease(f, k(23), 14);
    const meat = grav(k(25));
    const cheese = grav(k(26));
    const salad = grav(k(27));
    const top = f >= k(28) - 8 ? grav(k(28)) : undefined;
    const squash = f >= k(28) ? Math.exp(-(f - k(28)) / 3.5) : 0;
    const melt = f < k(26) ? 0 : si === 3 ? mix(0, 0.35, ease(f, k(26), 18)) : si === 4 ? mix(0.35, 1.0, Easing.inOut(Easing.cubic)(lin(f, s, e - s))) : 1.0;
    const bite = ease(f, k(40), 4);
    const z = si === 3 ? 1 : si === 4 ? mix(1, 1.28, ease(f, s, 30)) : mix(1.28, 1.08, ease(f, s, 16));
    const frameQ = si >= 4 ? Easing.out(Easing.cubic)(lin(f, k(29) + 2, 14)) : 0;
    const bw = 760;
    const bx = 540 - bw / 2;
    const by = 700;
    const showLayer = (p: number) => (p > 0.001 ? p : undefined);
    const props: BurgerProps = {id: 'hero', open, top, squash, melt, bite, meat: showLayer(meat) ?? 0, cheese: showLayer(cheese) ?? 0, salad: showLayer(salad) ?? 0};
    const labels: [string, number][] = [
      ['carne na brasa', k(25)],
      ['cheddar derretido', k(26)],
      ['alface e tomate', k(27)],
    ];
    const crunchT = Math.max(0, f - k(40)) / fps;
    const crumbs = Array.from({length: 14}).map((_, i) => {
      const vx = 250 + rand(seed + 40, i) * 520;
      const vy = -520 - rand(seed + 41, i) * 620;
      return {x: 920 + vx * crunchT, y: 980 + vy * crunchT + 1700 * crunchT * crunchT, r: 9 + rand(seed + 42, i) * 14, rot: crunchT * 500 * (i % 2 ? 1 : -1)};
    });
    scene = (
      <>
        {si === 3 ? (
          <div style={{position: 'absolute', left: 80, top: 180}}>
            <Kin t="camada por camada" size={112} enter={s + 2} mode="flip" {...kin} />
          </div>
        ) : null}
        {si === 4 ? (
          <div style={{position: 'absolute', left: 0, right: 0, top: 210}}>
            <Kin t="DERRETE" size={200} enter={s + 4} align="center" mode="melt" fill="linear-gradient(180deg, #FFE07A, #FFB800 55%, #F08A00)" {...kin} />
          </div>
        ) : null}
        {si === 5 ? (
          <div style={{position: 'absolute', left: 80, top: 220}}>
            <Kin t="o som da mordida" size={108} enter={s + 3} exit={k(41) - 8} mode="slide" {...kin} />
          </div>
        ) : null}
        {si === 5 && f >= k(41) - 2 ? (
          <div style={{position: 'absolute', left: 80, top: 220}}>
            <Kin t="antes do preço" size={108} enter={k(41)} mode="flip" {...kin} />
          </div>
        ) : null}
        <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: '540px 1100px'}}>
          {/* moldura do anúncio entra em plano, deitada, e levanta */}
          {frameQ > 0.001 ? (
            <div style={{position: 'absolute', left: 120, top: 620, width: 840, height: 760, perspective: 1600}}>
              <div style={{width: '100%', height: '100%', borderRadius: 40, border: `3px solid rgba(255,180,90,0.35)`, background: 'linear-gradient(180deg, rgba(60,22,10,0.85), rgba(30,10,5,0.9))', transform: `rotateX(${(1 - frameQ) * 70}deg)`, transformOrigin: '50% 100%', boxShadow: '0 40px 100px rgba(0,0,0,0.5)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '22px 26px'}}>
                  <div style={{width: 52, height: 52, borderRadius: 26, background: `radial-gradient(circle at 35% 30%, #FFB04A, ${W.orange})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: disp, fontWeight: 800, fontSize: 28, color: W.bg}}>B</div>
                  <div>
                    <div style={{fontFamily: ui, fontWeight: 600, fontSize: 26, color: W.cream}}>brasa.burger</div>
                    <div style={{fontFamily: ui, fontSize: 20, color: W.muted}}>Patrocinado</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {/* vapor */}
          <svg style={{position: 'absolute', left: 300, top: 560}} width="480" height="260" viewBox="0 0 480 260" fill="none">
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${120 + i * 120} 250 C ${100 + i * 120 + Math.sin(f / 9 + i) * 30} 190, ${150 + i * 120 + Math.cos(f / 8 + i) * 30} 120, ${120 + i * 120} 40`} stroke={W.cream} strokeOpacity={0.16 * (top !== undefined || si > 3 ? 1 : 0)} strokeWidth="12" strokeLinecap="round" strokeDasharray="60 40" strokeDashoffset={-f * 3} />
            ))}
          </svg>
          {/* reflexo na mesa */}
          <div style={{position: 'absolute', left: bx, top: by + 717, width: bw, height: 380, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.32), rgba(0,0,0,0) 70%)', maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.32), rgba(0,0,0,0) 70%)'}}>
            <div style={{position: 'absolute', left: 0, top: -717, transform: 'translateY(674px) scaleY(-1)'}}>
              <Burger w={bw} {...props} id="refl" />
            </div>
          </div>
          <div style={{position: 'absolute', left: bx, top: by}}>
            <Burger w={bw} {...props} />
          </div>
        </div>
        {si === 3
          ? labels.map(([t, at], i) => {
              const next = i < labels.length - 1 ? labels[i + 1][1] : k(29);
              if (f < at || f >= next) return null;
              return (
                <div key={t} style={{position: 'absolute', left: 0, right: 0, top: 1480, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18}}>
                  <div style={{width: 18, height: 18, borderRadius: 9, background: W.orange, transform: `scale(${pop(f, at, fps, 260, 14)})`}} />
                  <div style={{overflow: 'hidden'}}>
                    <div style={{fontFamily: ui, fontWeight: 600, fontSize: 56, color: W.cream, transform: `translateY(${(1 - pop(f, at + 1, fps, 230, 18)) * 110}%)`}}>{t}</div>
                  </div>
                </div>
              );
            })
          : null}
        {si === 5 && f >= k(40) ? (
          <>
            {crumbs.map((c, i) => (
              <div key={i} style={{position: 'absolute', left: c.x, top: c.y, width: c.r * 2, height: c.r * 1.4, borderRadius: c.r, background: i % 3 ? 'linear-gradient(135deg, #FFC27A, #D9741E)' : '#FFF1D6', transform: `rotate(${c.rot}deg)`, boxShadow: '0 4px 8px rgba(0,0,0,0.4)'}} />
            ))}
            <div style={{position: 'absolute', left: 380, top: 540, transform: 'rotate(-10deg)'}}>
              <Kin t="CRUNCH" size={150} enter={k(40)} mode="depth" fill="linear-gradient(180deg, #FFE07A, #FF7A00)" {...kin} />
            </div>
          </>
        ) : null}
        {si === 5 && f >= k(41) ? (
          <div style={{position: 'absolute', left: 90, top: 1450, transform: `rotate(${mix(-24, -6, pop(f, k(41), fps, 200, 12))}deg) scale(${pop(f, k(41), fps, 200, 12)})`, transformOrigin: '0 0'}}>
            <div style={{width: 300, height: 130, borderRadius: 24, background: 'linear-gradient(160deg, #3A1A10, #24100A)', border: `3px dashed ${W.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontWeight: 500, fontSize: 52, color: W.muted, filter: `blur(${ease(f, k(42), 10) * 4}px)`}}>R$ ??</div>
          </div>
        ) : null}
      </>
    );
  }

  // ---------------- 6. O mapa: bairro em plano inclinado, moto virando nas ruas ----------------
  if (si === 6) {
    const rideStart = s + 8;
    const rideEnd = k(48);
    const d = Easing.inOut(Easing.cubic)(lin(f, rideStart, rideEnd - rideStart)) * ROUTE_LEN;
    const [mx, my] = pointAt(d);
    const ahead = pointAt(d + 34);
    const behind = pointAt(d - 34);
    const heading = (Math.atan2(ahead[1] - behind[1], ahead[0] - behind[0]) * 180) / Math.PI + 90;
    const intro = ease(f, s, 14);
    const camX = mix(700, mx + 60, intro);
    const camY = mix(1250, my - 80, intro);
    const arrive = f >= rideEnd;
    const zoomIn = Easing.in(Easing.cubic)(lin(f, rideEnd + 4, e - rideEnd - 4));
    const zoom = mix(0.72, 1.0, intro) * mix(1, 3.2, zoomIn);
    const pinQ = pop(f, rideEnd - 2, fps, 240, 12);
    const bubble = f < k(46) ? pop(f, s + 8, fps, 220, 16) : Math.max(0, 1 - ease(f, k(46), 6));
    const badge = Easing.out(Easing.back(1.6))(lin(f, k(46), 12));
    const blocks: React.ReactNode[] = [];
    for (let i = 0; i < SX.length - 1; i++)
      for (let j = 0; j < SY.length - 1; j++) {
        const x0 = SX[i] + 60;
        const y0 = SY[j] + 60;
        const bwid = SX[i + 1] - SX[i] - 120;
        const bh = SY[j + 1] - SY[j] - 120;
        const idx = i * 10 + j;
        blocks.push(
          <g key={`b${idx}`}>
            <rect x={x0 - 10} y={y0 - 10} width={bwid + 20} height={bh + 20} rx="18" fill="#B8B2A8" />
            <rect x={x0} y={y0} width={bwid} height={bh} rx="12" fill="#4FAE4A" />
            {[0, 1].map((cx) =>
              [0, 1].map((cy) => (
                <HouseTop key={`${cx}${cy}`} x={x0 + 14 + cx * (bwid / 2)} y={y0 + 16 + cy * (bh / 2)} w={bwid / 2 - 30} h={bh / 2 - 40} c={ROOFS[(idx * 3 + cx * 2 + cy) % ROOFS.length]} rot={(idx + cx + cy) % 2 === 0} />
              )),
            )}
            {[0, 1, 2].map((t) => (
              <circle key={t} cx={x0 + 20 + rand(seed + idx, t) * (bwid - 40)} cy={y0 + bh - 14 - rand(seed + idx + 5, t) * 20} r={14 + rand(seed + idx + 9, t) * 10} fill="#2F8F3A" stroke="#7FD06A" strokeWidth="3" />
            ))}
          </g>,
        );
      }
    scene = (
      <>
        <div style={{position: 'absolute', inset: 0, perspective: 1800, perspectiveOrigin: '540px 500px', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 540, top: 1150, width: 1400, height: 2100, transformOrigin: '0 0', transformStyle: 'preserve-3d', transform: `rotateX(46deg) scale(${zoom}) translate(${-camX}px, ${-camY}px)`}}>
            <svg width="1400" height="2100" viewBox="0 0 1400 2100" style={{position: 'absolute', left: 0, top: 0}}>
              <rect width="1400" height="2100" fill={W.asphalt} />
              {SX.map((x) => (
                <line key={`vx${x}`} x1={x} y1="0" x2={x} y2="2100" stroke="#F4F4F2" strokeWidth="4" strokeDasharray="30 30" opacity="0.5" />
              ))}
              {SY.map((y) => (
                <line key={`hy${y}`} x1="0" y1={y} x2="1400" y2={y} stroke="#F4F4F2" strokeWidth="4" strokeDasharray="30 30" opacity="0.5" />
              ))}
              {blocks}
              {/* rota */}
              <path d={'M ' + ROUTE.map((p) => `${p[0]} ${p[1]}`).join(' L ')} stroke={W.orange} strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
              <path d={'M ' + ROUTE.map((p) => `${p[0]} ${p[1]}`).join(' L ')} stroke={W.orange} strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`0 ${d} ${ROUTE_LEN}`} />
              {/* hamburgueria (ponto de partida) */}
              <circle cx={ROUTE[0][0]} cy={ROUTE[0][1] + 40} r="46" fill={W.orange} stroke="#fff" strokeWidth="6" />
              <text x={ROUTE[0][0]} y={ROUTE[0][1] + 56} textAnchor="middle" fontSize="44" fontWeight="800" fill={W.bg} fontFamily="Bricolage Grotesque">B</text>
            </svg>
            {/* moto (no plano, gira conforme a rua) */}
            <div style={{position: 'absolute', left: mx - 60, top: my - 105, width: 120, height: 210, transform: `rotate(${heading}deg) scale(1.35)`, transformOrigin: '60px 105px'}}>
              <MotoTop t={f / fps} />
            </div>
            {/* seta "você" em pé no endereço de entrega */}
            <div style={{position: 'absolute', left: 1010 - 120, top: 700 - 260, width: 240, height: 260, transformOrigin: '50% 100%', transform: `rotateX(-46deg) translateY(${(1 - pinQ) * -60 + Math.sin(f / 5) * 6}px) scale(${0.6 + 0.4 * pinQ})`}}>
              <div style={{background: `linear-gradient(180deg, #FFB04A, ${W.orange})`, borderRadius: 999, padding: '18px 0', textAlign: 'center', fontFamily: disp, fontWeight: 800, fontSize: 64, color: W.bg, boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}}>você</div>
              <svg width="240" height="100" viewBox="0 0 240 100" style={{display: 'block'}}>
                <path d="M120 96 L84 30 H108 V0 H132 V30 H156 Z" fill={W.orange} />
              </svg>
            </div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 80, top: 160}}>
          <Kin t="tempo de entrega" size={104} enter={s + 2} mode="depth" {...kin} />
        </div>
        {bubble > 0.01 ? (
          <div style={{position: 'absolute', left: 90, top: 330, transform: `scale(${bubble})`, transformOrigin: '0 100%', background: 'rgba(42,18,11,0.92)', border: `2px solid ${W.line}`, borderRadius: 30, padding: '20px 30px', fontFamily: disp, fontWeight: 700, fontSize: 48, color: W.muted}}>chega que horas?</div>
        ) : null}
        {badge > 0.01 && !arrive ? (
          <div style={{position: 'absolute', left: 90, top: 320, perspective: 1000}}>
            <div style={{transform: `rotateY(${(1 - badge) * -90}deg)`, transformOrigin: '0 50%', background: `linear-gradient(180deg, #FFB04A, ${W.orange} 55%, #E85A00)`, borderRadius: 999, padding: '22px 44px', fontFamily: disp, fontWeight: 800, fontSize: 60, color: W.bg, letterSpacing: -1, boxShadow: '0 30px 60px rgba(0,0,0,0.45), inset 0 3px 0 rgba(255,255,255,0.45)', whiteSpace: 'nowrap'}}>Chega em 25 min</div>
          </div>
        ) : null}
        {arrive ? (
          <div style={{position: 'absolute', left: 90, top: 310}}>
            <Kin t="entregue." size={110} enter={rideEnd} mode="flip" fill="linear-gradient(180deg, #FFC24A, #FF5A12)" {...kin} />
          </div>
        ) : null}
      </>
    );
  }

  // ---------------- 7 e 8. A sacola abre, o anúncio sai de dentro; botão fixo; pedido confirmado ----------------
  if (si === 7 || si === 8) {
    const bagIn = si === 7 ? Easing.out(Easing.cubic)(lin(f, s, 10)) : 1;
    const flap = si === 7 ? Easing.inOut(Easing.cubic)(lin(f, s + 4, 12)) : 1;
    const rise = si === 7 ? Easing.out(Easing.cubic)(lin(f, s + 12, 22)) : 1;
    const bagOut = si === 7 ? Easing.in(Easing.cubic)(lin(f, s + 30, 14)) : 1;
    const pulse = beatPulse(f, b, 7);
    const cyc = si === 7 ? Math.max(0, Math.min(3, Math.floor((f - k(50)) / (k(51) - k(50))) + 1)) : 0;
    const tap = si === 8 ? (f >= k(54) ? Math.exp(-(f - k(54)) / 4) : 0) : 0;
    const confirmed = si === 8 ? pop(f, k(55) - 4, fps, 200, 16) : 0;
    const price = si === 8 ? pop(f, k(56), fps, 240, 15) : 0;
    const PW = 660;
    const PH = 1180;
    const bagTop = 820;
    const mouthY = bagTop + 200;
    const phoneTop = mix(mouthY + 40, 440, rise);
    const cut = Math.max(0, phoneTop + PH - mouthY) * (1 - bagOut);
    const media = (i: number) => {
      if (i === 1)
        return (
          <svg width="600" height="600" viewBox="0 0 600 600">
            <rect width="600" height="600" fill={W.asphalt} />
            <path d="M80 520 V380 H300 V220 H520 V80" stroke={W.orange} strokeWidth="16" fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx="520" cy="80" r="30" fill={W.cream} />
            <circle cx="80" cy="520" r="30" fill={W.orange} />
            <text x="300" y="320" textAnchor="middle" fontSize="70" fontWeight="800" fill={W.cream} fontFamily="Bricolage Grotesque">25 min</text>
          </svg>
        );
      if (i === 2)
        return (
          <div style={{width: 600, height: 600, background: 'linear-gradient(180deg, #FFE07A, #FFB800 60%, #F08A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: disp, fontWeight: 800, fontSize: 120, color: W.bg, letterSpacing: -4}}>cheddar</div>
        );
      if (i === 3)
        return (
          <div style={{width: 600, height: 600, background: `linear-gradient(180deg, #FF9A3A, ${W.hot})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: disp, fontWeight: 800, fontSize: 104, color: W.bg, textAlign: 'center', lineHeight: 0.95, letterSpacing: -3}}>
            feito na
            <br />
            brasa
          </div>
        );
      return (
        <div style={{width: 600, height: 600, background: 'radial-gradient(circle at 50% 60%, #5A2210, #1E0A05)', position: 'relative'}}>
          <div style={{position: 'absolute', left: 30, top: 40}}>
            <Burger w={540} id="ad" melt={1.2} bite={1} />
          </div>
        </div>
      );
    };
    scene = (
      <>
        <div style={{position: 'absolute', left: 80, top: 170}}>
          {si === 7 ? <Kin t="o botão fica" size={104} enter={s + 14} mode="rise" {...kin} /> : <Kin t="Desejo primeiro." size={112} enter={s + 1} mode="flip" {...kin} />}
        </div>
        {si === 8 ? (
          <div style={{position: 'absolute', left: 80, top: 300}}>
            <Kin t="Preço depois." size={112} enter={k(56)} mode="depth" fill="linear-gradient(180deg, #FFC24A, #FF5A12)" {...kin} />
          </div>
        ) : null}
        {/* sacola (atrás) */}
        {si === 7 && bagOut < 1 ? (
          <div style={{position: 'absolute', left: 220, top: bagTop, transform: `translateY(${bagOut * 1100}px) scale(${mix(1.25, 1, bagIn)})`, filter: bagIn < 0.98 ? `blur(${((1 - bagIn) * 12).toFixed(1)}px)` : undefined}}>
            <Bag open={flap} id="bag" />
          </div>
        ) : null}
        {/* celular saindo da sacola */}
        <div style={{position: 'absolute', left: 540 - PW / 2, top: phoneTop, width: PW, height: PH, clipPath: cut > 0 ? `inset(0 0 ${cut}px 0)` : undefined}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: 80, background: '#0A0605', border: '12px solid #3A2A20', boxSizing: 'border-box', overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.6)'}}>
            {confirmed < 0.5 ? (
              <div style={{position: 'absolute', left: 18, right: 18, top: 70}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '10px 6px'}}>
                  <div style={{width: 56, height: 56, borderRadius: 28, background: `radial-gradient(circle at 35% 30%, #FFB04A, ${W.orange})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: disp, fontWeight: 800, fontSize: 30, color: W.bg}}>B</div>
                  <div>
                    <div style={{fontFamily: ui, fontWeight: 600, fontSize: 28, color: W.cream}}>brasa.burger</div>
                    <div style={{fontFamily: ui, fontSize: 21, color: W.muted}}>Patrocinado</div>
                  </div>
                </div>
                <div style={{position: 'relative', width: 600, height: 600, borderRadius: 24, overflow: 'hidden', marginTop: 10}}>
                  {media(cyc)}
                  <div style={{position: 'absolute', right: 20, bottom: 20, background: `linear-gradient(180deg, #FFB04A, ${W.orange} 55%, #E85A00)`, borderRadius: 999, padding: '20px 32px', fontFamily: disp, fontWeight: 800, fontSize: 38, color: W.bg, transform: `scale(${1 + pulse * 0.08 - tap * 0.12})`, boxShadow: '0 16px 30px rgba(0,0,0,0.45), inset 0 3px 0 rgba(255,255,255,0.45)'}}>Pedir agora</div>
                  {tap > 0.05 ? <div style={{position: 'absolute', right: 70, bottom: 30, width: 120, height: 120, borderRadius: 60, border: `5px solid ${W.cream}`, transform: `scale(${1 + (1 - tap) * 1.4})`, opacity: tap}} /> : null}
                </div>
                {[520, 430, 300].map((w, i) => (
                  <div key={i} style={{height: 16, width: w, borderRadius: 8, background: '#2E2018', marginTop: i ? 16 : 30}} />
                ))}
              </div>
            ) : (
              <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 200, transform: `scale(${0.9 + 0.1 * confirmed})`}}>
                <div style={{width: 210, height: 210, borderRadius: 105, background: 'radial-gradient(circle at 35% 30%, #6EF09A, #16A34A 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(34,197,94,0.35)'}}>
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                </div>
                <div style={{fontFamily: disp, fontWeight: 800, fontSize: 68, color: W.cream, marginTop: 40, letterSpacing: -2}}>Pedido confirmado</div>
                <div style={{width: 520, marginTop: 60, display: 'flex', alignItems: 'center', gap: 20, background: '#1E0E08', borderRadius: 28, padding: 18, boxSizing: 'border-box'}}>
                  <Burger w={130} id="mini" board={false} melt={0.8} />
                  <div>
                    <div style={{fontFamily: ui, fontWeight: 600, fontSize: 34, color: W.cream}}>Brasa clássico</div>
                    <div style={{fontFamily: disp, fontWeight: 800, fontSize: 48, color: W.orange, marginTop: 6, transform: `scale(${price})`, transformOrigin: '0 50%'}}>R$ 34,90</div>
                  </div>
                </div>
                <div style={{width: 520, height: 14, borderRadius: 7, background: '#2E2018', marginTop: 50, overflow: 'hidden'}}>
                  <div style={{width: `${lin(f, k(55), e - k(55)) * 60}%`, height: '100%', background: W.orange}} />
                </div>
                <div style={{fontFamily: ui, fontSize: 30, color: W.muted, marginTop: 16}}>a caminho</div>
              </div>
            )}
            {/* reflexo do vidro */}
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.08) 42%, rgba(255,255,255,0) 52%)', pointerEvents: 'none'}} />
          </div>
        </div>
      </>
    );
  }

  const brandScene = si === 0;
  return (
    <AbsoluteFill style={{background: brandScene ? '#0B0B0C' : W.bg, overflow: 'hidden'}}>
      {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
      {!brandScene ? (
        <>
          <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 25% 18%, rgba(255,122,0,0.32) 0%, rgba(255,122,0,0) 70%), radial-gradient(ellipse 70% 40% at 85% 95%, rgba(240,50,30,0.28) 0%, rgba(240,50,30,0) 70%), radial-gradient(ellipse 70% 45% at 50% 62%, rgba(255,150,40,0.22) 0%, rgba(0,0,0,0) 70%)'}} />
          {Array.from({length: 10}).map((_, i) => {
            const speed = 2 + rand(seed + 7, i) * 3;
            const y = 1950 - ((f * speed + rand(seed + 8, i) * 1900) % 2000);
            const x = rand(seed + 9, i) * 1080 + noise1D(seed + i, f / 40) * 40;
            const r = 4 + rand(seed + 10, i) * 7;
            return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r, background: i % 3 ? '#FF9A2E' : '#FFD27A', opacity: 0.45 + 0.35 * rand(seed + 11, i), filter: 'blur(1px)'}} />;
          })}
        </>
      ) : null}
      <div style={stage}>{scene}</div>
      <svg style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.18, pointerEvents: 'none'}} width="1080" height="1920">
        <filter id={`grain-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={(seed * 97 + f) % 9973} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter={`url(#grain-${id})`} />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
