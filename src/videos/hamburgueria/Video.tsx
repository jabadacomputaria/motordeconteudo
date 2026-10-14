// "Como eu faria um motion de vendas para uma hamburgueria artesanal delivery" (Kyneo, conteúdo orgânico).
// Abre com a marca Kyneo e um cartão de projeto; depois o desejo: chave, olho, hambúrguer se montando,
// queijo escorrendo para fora do anúncio, mordida com som, motoboy no mapa, botão de pedir e confirmação.
// Tudo deriva do frame (prop `frame` ou useCurrentFrame).
import React from 'react';
import {loadFont} from '@remotion/fonts';
import {AbsoluteFill, Easing, Html5Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, lin, mix, pop} from '../../lib/anim';
import {beatFrames, beatPulse, type Beats} from '../../lib/beats';
import {loadBrandFonts, type Brand} from '../../lib/brand';
import {noise1D, rand} from '../../lib/noise';
import {Burger, Eye, Lock, Moto, W} from './food';

export type VideoProps = {id: string; beats: Beats; brand: Brand; seed: number; withAudio?: boolean; fps?: number; frame?: number};

// A abertura usa o logotipo da Kyneo (Unbounded), além das fontes da hamburgueria.
let kyneoFont = false;
const loadKyneoFont = () => {
  if (kyneoFont) return;
  kyneoFont = true;
  loadFont({family: 'Unbounded', url: staticFile('fonts/unbounded-latin-700-normal.woff2'), weight: '700'});
  loadFont({family: 'Unbounded', url: staticFile('fonts/unbounded-latin-600-normal.woff2'), weight: '600'});
};

const SCENE_BEATS = [0, 8, 15, 22, 29, 37, 44, 49, 54, 59];

// Texto cinético sem caixa: cada palavra sobe por trás de uma máscara.
const Kin: React.FC<{t: string; size: number; enter: number; frame: number; fps: number; family: string; color?: string; weight?: number; exit?: number; align?: 'left' | 'center'; tracking?: number}> = ({t, size, enter, frame, fps, family, color = W.cream, weight = 800, exit, align = 'left', tracking = -0.03}) => {
  if (frame < enter - 1) return null;
  if (exit !== undefined && frame > exit + 14) return null;
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: size * 0.24}}>
      {t.split(' ').map((w, i) => {
        const rise = pop(frame, enter + i * 3, fps, 210, 20);
        const out = exit === undefined ? 0 : ease(frame, exit + i * 2, 9);
        return (
          <div key={i} style={{overflow: 'hidden', padding: `${size * 0.04}px 0 ${size * 0.2}px`, marginBottom: -size * 0.16}}>
            <div style={{fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1, letterSpacing: size * tracking, color, transform: `translateY(${(1 - rise) * 110 - out * 115}%)`, whiteSpace: 'nowrap'}}>{w}</div>
          </div>
        );
      })}
    </div>
  );
};

// Rota do motoboy no mapa (pontos em px de tela) e a posição numa fração p do caminho.
const ROUTE = [
  [200, 1420],
  [200, 1150],
  [520, 1150],
  [520, 880],
  [860, 880],
  [860, 640],
];
const along = (p: number) => {
  const segs = ROUTE.slice(1).map((pt, i) => {
    const a = ROUTE[i];
    return {a, b: pt, len: Math.hypot(pt[0] - a[0], pt[1] - a[1])};
  });
  const total = segs.reduce((s, x) => s + x.len, 0);
  let d = Math.max(0, Math.min(1, p)) * total;
  for (const sg of segs) {
    if (d <= sg.len) {
      const q = d / sg.len;
      return {x: mix(sg.a[0], sg.b[0], q), y: mix(sg.a[1], sg.b[1], q), dir: sg.b[0] < sg.a[0] ? -1 : 1};
    }
    d -= sg.len;
  }
  const l = ROUTE[ROUTE.length - 1];
  return {x: l[0], y: l[1], dir: 1};
};

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
  const k = F;

  // Entrada de cada cena: corte com zoom curto e borrão (exceto as cenas contínuas do hambúrguer).
  const continuous = si === 4 || si === 5;
  const pin = continuous ? 1 : ease(f, s, 9);
  const enterScale = mix(1.18, 1, pin);
  const enterBlur = (1 - pin) * 14;
  const shake = beatPulse(f, [k(19), k(25), k(28), k(40)], 5);
  const push = 1 + lin(f, s, Math.max(1, e - s)) * 0.04;
  const stage: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: `translate(${shake * noise1D(seed + 3, f * 1.7) * 16}px, ${shake * noise1D(seed + 4, f * 1.9) * 16}px) scale(${enterScale * push})`,
    transformOrigin: '50% 48%',
    filter: enterBlur > 0.3 ? `blur(${enterBlur.toFixed(1)}px)` : undefined,
  };

  const brandScene = si === 0;
  let scene: React.ReactNode = null;

  // ---------------- 0. Abertura Kyneo + cartão do projeto ----------------
  if (si === 0) {
    const kIn = pop(f, 2, fps, 170, 16);
    const trail = ease(f, 4, 14);
    const up = ease(f, 52, 16);
    const card = pop(f, 58, fps, 160, 18);
    const rows = [74, 88, 102].map((at) => pop(f, at, fps, 220, 18));
    const stampQ = pop(f, 114, fps, 260, 14);
    const wipe = Easing.in(Easing.cubic)(lin(f, 120, e - 120));
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
          <div style={{overflow: 'hidden', marginTop: 18}}>
            <div style={{fontFamily: ui, fontWeight: 500, fontSize: 46, color: '#A3A7AD', transform: `translateY(${(1 - pop(f, 26, fps, 200, 18)) * 110}%)`}}>para você, empreendedor</div>
          </div>
        </div>
        {card > 0.01 ? (
          <div style={{position: 'absolute', left: 90, top: 720, width: 900, borderRadius: 40, background: '#1C1D1F', border: '2px solid #4A4D52', padding: '44px 48px', boxSizing: 'border-box', transform: `translateY(${(1 - card) * 500}px)`}}>
            <div style={{fontFamily: mono, fontSize: 26, letterSpacing: 4, color: '#A3A7AD'}}>NOVO PROJETO</div>
            <div style={{fontFamily: 'Unbounded', fontWeight: 600, fontSize: 62, color: '#F4F4F2', marginTop: 14, letterSpacing: -1}}>Motion de vendas</div>
            {items.map(([l, v], i) => (
              <div key={l} style={{display: 'flex', gap: 24, alignItems: 'baseline', marginTop: 26, borderTop: '1px solid #2E3034', paddingTop: 22, opacity: rows[i] > 0.01 ? 1 : 0, transform: `translateX(${(1 - rows[i]) * 60}px)`}}>
                <div style={{fontFamily: mono, fontSize: 26, color: '#A3A7AD', width: 190}}>{l}</div>
                <div style={{fontFamily: ui, fontWeight: 600, fontSize: 40, color: '#F4F4F2'}}>{v}</div>
              </div>
            ))}
            {stampQ > 0.01 ? (
              <div style={{position: 'absolute', right: 40, top: 36, width: 120, height: 120, borderRadius: 60, background: W.orange, transform: `scale(${stampQ}) rotate(${(1 - stampQ) * -40}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{transform: 'scale(1)'}}>
                  <Burger w={86} id="stamp" board={false} melt={0.2} />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {/* Passagem para o mundo da hamburgueria: um círculo laranja nasce do selo e cobre a tela */}
        {wipe > 0 ? <div style={{position: 'absolute', left: 870 - 2200 * wipe, top: 816 - 2200 * wipe, width: 4400 * wipe, height: 4400 * wipe, borderRadius: '50%', background: W.bg}} /> : null}
      </>
    );
  }

  // ---------------- 1. A chave mestra ----------------
  if (si === 1) {
    const kq = ease(f, s + 6, 18);
    const turn = ease(f, k(10), 8);
    const open = pop(f, k(11), fps, 200, 12);
    scene = (
      <>
        <div style={{position: 'absolute', left: 0, right: 0, top: 260}}>
          <Kin t="DESEJO" size={250} enter={s + 12} align="center" color={W.cream} {...kin} />
        </div>
        <div style={{position: 'absolute', left: 280, top: 540}}>
          <Lock open={open} k={kq} turn={turn} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1440}}>
          <Kin t="é a chave mestra" size={84} enter={k(11) + 4} align="center" color={W.orange} {...kin} />
        </div>
      </>
    );
  }

  // ---------------- 2. Não é precisar, é ver ----------------
  if (si === 2) {
    const strike = ease(f, k(18), 7);
    const eye = Easing.out(Easing.back(1.6))(lin(f, k(19), 14));
    const hitIn = f >= k(19);
    scene = (
      <>
        <div style={{position: 'absolute', left: 90, top: hitIn ? 300 : 560, transform: hitIn ? 'scale(0.7)' : undefined, transformOrigin: '0 0'}}>
          <Kin t="Ninguém pede" size={96} enter={s + 2} color={W.muted} {...kin} />
          <div style={{position: 'relative', marginTop: 10}}>
            <Kin t="porque precisa." size={112} enter={s + 14} color={W.cream} {...kin} />
            {strike > 0 ? <div style={{position: 'absolute', left: 440, top: 58, height: 20, width: strike * 440, background: W.red, borderRadius: 11, transform: 'rotate(-4deg)', transformOrigin: '0 50%'}} /> : null}
          </div>
        </div>
        {hitIn ? (
          <>
            <div style={{position: 'absolute', left: 160, top: 700}}>
              <Eye open={eye} />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 1180, transform: `scale(${mix(1.4, 1, pop(f, k(19), fps, 220, 13))})`}}>
              <div style={{textAlign: 'center', fontFamily: disp, fontWeight: 800, fontSize: 230, color: W.orange, letterSpacing: -6, lineHeight: 1}}>VIU.</div>
            </div>
          </>
        ) : null}
      </>
    );
  }

  // ---------------- 3 a 5. O hambúrguer (contínuo): monta, derrete, leva a mordida ----------------
  if (si >= 3 && si <= 5) {
    const open = si === 3 ? ease(f, k(23), 12) : 1;
    const meat = pop(f, k(25), fps, 180, 11);
    const cheese = pop(f, k(26), fps, 180, 11);
    const salad = pop(f, k(27), fps, 180, 11);
    const top = f >= k(28) - 10 ? pop(f, k(28) - 10, fps, 170, 12) : undefined;
    const melt = mix(0.05, 0.5, ease(f, k(26) + 2, 30)) + (f >= k(29) ? lin(f, k(29), k(36) - k(29)) * 1.6 : 0);
    const bite = ease(f, k(40), 4);
    // Câmera: na montagem, quadro inteiro; ao derreter, aproxima do queijo; na mordida, volta.
    const z = si === 3 ? 1 : si === 4 ? mix(1, 1.32, ease(f, s, 30)) : mix(1.32, 1.08, ease(f, s, 16));
    const frame = si >= 4 ? ease(f, k(29) + 2, 12) : 0;
    const bw = 760;
    const bx = 540 - bw / 2;
    const by = 700;
    const labels: [string, number, number][] = [
      ['carne na brasa', k(25), 1040],
      ['cheddar', k(26), 985],
      ['alface e tomate', k(27), 935],
    ];
    const crunchQ = pop(f, k(40), fps, 300, 12);
    const crumbs = Array.from({length: 10}).map((_, i) => {
      const t = Math.max(0, f - k(40)) / fps;
      const vx = 300 + rand(seed + 40, i) * 500;
      const vy = -500 - rand(seed + 41, i) * 600;
      return {x: 900 + vx * t, y: 980 + vy * t + 1600 * t * t, r: 10 + rand(seed + 42, i) * 14, rot: t * 400 * (i % 2 ? 1 : -1)};
    });
    const tagFlip = si === 5 ? ease(f, k(42), 10) : 0;
    scene = (
      <>
        {/* palavras grandes atrás */}
        {si === 3 ? (
          <div style={{position: 'absolute', left: 80, top: 190}}>
            <Kin t="camada por camada" size={112} enter={s + 2} color={W.cream} {...kin} />
          </div>
        ) : null}
        {si === 4 ? (
          <div style={{position: 'absolute', left: 0, right: 0, top: 230}}>
            <Kin t="DERRETE" size={210} enter={s + 4} align="center" color={W.cheese} {...kin} />
          </div>
        ) : null}
        {si === 5 ? (
          <div style={{position: 'absolute', left: 80, top: 230}}>
            <Kin t="o som da mordida" size={110} enter={s + 3} exit={k(41) - 8} color={W.cream} {...kin} />
          </div>
        ) : null}
        {si === 5 && f >= k(41) - 2 ? (
          <div style={{position: 'absolute', left: 80, top: 230}}>
            <Kin t="antes do preço" size={110} enter={k(41)} color={W.cream} {...kin} />
          </div>
        ) : null}
        <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: '540px 1100px'}}>
          {/* moldura do anúncio: o queijo passa por cima da borda */}
          {frame > 0.01 ? (
            <div style={{position: 'absolute', left: 120, top: 620, width: 840, height: 760, borderRadius: 40, border: `4px solid ${W.line}`, background: W.bg2, transform: `scale(${0.92 + 0.08 * frame})`, opacity: frame}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '22px 26px'}}>
                <div style={{width: 52, height: 52, borderRadius: 26, background: W.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: disp, fontWeight: 800, fontSize: 28, color: W.bg}}>B</div>
                <div>
                  <div style={{fontFamily: ui, fontWeight: 600, fontSize: 26, color: W.cream}}>brasa.burger</div>
                  <div style={{fontFamily: ui, fontSize: 20, color: W.muted}}>Patrocinado</div>
                </div>
              </div>
            </div>
          ) : null}
          {/* vapor */}
          <svg style={{position: 'absolute', left: 300, top: 560}} width="480" height="260" viewBox="0 0 480 260" fill="none">
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${120 + i * 120} 250 C ${100 + i * 120 + Math.sin(f / 9 + i) * 30} 190, ${150 + i * 120 + Math.cos(f / 8 + i) * 30} 120, ${120 + i * 120} 40`} stroke={W.cream} strokeOpacity={0.18 * (top !== undefined || si > 3 ? 1 : 0)} strokeWidth="10" strokeLinecap="round" strokeDasharray="60 40" strokeDashoffset={-f * 3} />
            ))}
          </svg>
          <div style={{position: 'absolute', left: bx, top: by}}>
            <Burger w={bw} id="hero" open={open} meat={meat || -1} cheese={cheese || -1} salad={salad || -1} top={top} melt={melt} bite={bite} />
          </div>
        </div>
        {/* legenda da camada que acabou de cair (troca a cada camada) */}
        {si === 3
          ? labels.map(([t, at], i) => {
              const next = i < labels.length - 1 ? labels[i + 1][1] : k(29);
              if (f < at || f >= next) return null;
              return (
                <div key={t} style={{position: 'absolute', left: 0, right: 0, top: 1450, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18}}>
                  <div style={{width: 18, height: 18, borderRadius: 9, background: W.orange, transform: `scale(${pop(f, at, fps, 260, 14)})`}} />
                  <div style={{overflow: 'hidden'}}>
                    <div style={{fontFamily: ui, fontWeight: 600, fontSize: 56, color: W.cream, transform: `translateY(${(1 - pop(f, at + 1, fps, 230, 18)) * 110}%)`}}>{t}</div>
                  </div>
                </div>
              );
            })
          : null}
        {/* mordida: farelos e o CRUNCH */}
        {si === 5 && f >= k(40) ? (
          <>
            {crumbs.map((c, i) => (
              <div key={i} style={{position: 'absolute', left: c.x, top: c.y, width: c.r * 2, height: c.r * 1.4, borderRadius: c.r, background: i % 3 ? W.bun : '#FFF1D6', transform: `rotate(${c.rot}deg)`}} />
            ))}
            <div style={{position: 'absolute', left: 400, top: 560, transform: `rotate(-10deg) scale(${crunchQ})`, fontFamily: disp, fontWeight: 800, fontSize: 140, color: W.orange, letterSpacing: -4, WebkitTextStroke: `6px ${W.bg}`}}>CRUNCH</div>
          </>
        ) : null}
        {/* etiqueta de preço escondida: o preço fica para depois */}
        {si === 5 && f >= k(41) ? (
          <div style={{position: 'absolute', left: 90, top: 1440, transform: `rotate(${mix(-20, -6, pop(f, k(41), fps, 200, 12))}deg) scale(${pop(f, k(41), fps, 200, 12)})`, transformOrigin: '0 0'}}>
            <div style={{width: 300, height: 130, borderRadius: 24, background: W.card, border: `3px dashed ${W.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontWeight: 500, fontSize: 52, color: W.muted, filter: `blur(${tagFlip * 4}px)`}}>R$ ??</div>
          </div>
        ) : null}
      </>
    );
  }

  // ---------------- 6. O mapa: motoboy e o tempo de entrega ----------------
  if (si === 6) {
    const ride = Easing.inOut(Easing.cubic)(lin(f, k(45), e - k(45) + 30));
    const pos = along(ride * 0.55);
    const bubble = f < k(46) ? pop(f, s + 6, fps, 220, 16) : Math.max(0, 1 - ease(f, k(46), 6));
    const badge = pop(f, k(46), fps, 240, 14);
    const routeLen = ROUTE.slice(1).reduce((acc, p, i) => acc + Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]), 0);
    const pathD = 'M ' + ROUTE.map((p) => `${p[0]} ${p[1]}`).join(' L ');
    scene = (
      <>
        {/* quarteirões */}
        <svg style={{position: 'absolute', inset: 0}} width="1080" height="1920" viewBox="0 0 1080 1920">
          {Array.from({length: 7}).map((_, r) =>
            Array.from({length: 4}).map((__, c) => (
              <rect key={`${r}-${c}`} x={-60 + c * 320 + 40} y={420 + r * 270 + 40} width="240" height="190" rx="26" fill={(r + c) % 5 === 0 ? '#22301A' : '#24170F'} />
            )),
          )}
          <path d={pathD} stroke={W.line} strokeWidth="34" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d={pathD} stroke={W.orange} strokeWidth="12" fill="none" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${routeLen}`} strokeDashoffset={routeLen * (1 - ease(f, s + 2, 16))} />
        </svg>
        {/* pontos: hamburgueria e casa */}
        <div style={{position: 'absolute', left: ROUTE[0][0] - 60, top: ROUTE[0][1] - 130, width: 120, height: 120, borderRadius: 60, background: W.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'}}>
          <Burger w={84} id="pinA" board={false} melt={0.2} />
        </div>
        <div style={{position: 'absolute', left: ROUTE[5][0] - 60, top: ROUTE[5][1] - 130, width: 120, height: 120, borderRadius: 60, background: W.cream, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill={W.bg}>
            <path d="M3 11 L12 3 L21 11 V21 H15 V15 H9 V21 H3 Z" />
          </svg>
        </div>
        <div style={{position: 'absolute', left: pos.x - 85, top: pos.y - 120}}>
          <Moto dir={pos.dir} t={f / fps} />
        </div>
        <div style={{position: 'absolute', left: 80, top: 200}}>
          <Kin t="tempo de entrega" size={104} enter={s + 2} color={W.cream} {...kin} />
        </div>
        {bubble > 0.01 ? (
          <div style={{position: 'absolute', left: 90, top: 400, transform: `scale(${bubble})`, transformOrigin: '0 100%', background: W.card, border: `2px solid ${W.line}`, borderRadius: 30, padding: '20px 28px', fontFamily: ui, fontWeight: 500, fontSize: 36, color: W.muted}}>chega que horas?</div>
        ) : null}
        {badge > 0.01 ? (
          <div style={{position: 'absolute', left: 90, top: 380, transform: `scale(${badge})`, transformOrigin: '20% 50%', background: W.orange, borderRadius: 999, padding: '22px 36px', display: 'flex', alignItems: 'baseline', gap: 14, boxShadow: '0 30px 60px rgba(0,0,0,0.4)'}}>
            <div style={{fontFamily: ui, fontWeight: 600, fontSize: 32, color: W.bg}}>chega em</div>
            <div style={{fontFamily: mono, fontWeight: 500, fontSize: 64, color: W.bg}}>25 min</div>
          </div>
        ) : null}
      </>
    );
  }

  // ---------------- 7 e 8. O anúncio no celular, o botão que não sai do canto, o pedido ----------------
  if (si === 7 || si === 8) {
    const phoneIn = si === 7 ? pop(f, s, fps, 160, 18) : 1;
    const pulse = beatPulse(f, b, 7);
    const cyc = si === 7 ? Math.max(0, Math.min(3, Math.floor((f - k(50)) / (k(51) - k(50))) + 1)) : 0;
    const tap = si === 8 ? (f >= k(54) ? Math.exp(-(f - k(54)) / 4) : 0) : 0;
    const confirmed = si === 8 ? pop(f, k(55) - 4, fps, 200, 16) : 0;
    const price = si === 8 ? pop(f, k(56), fps, 240, 15) : 0;
    const PW = 660;
    const PH = 1240;
    const media = (i: number) => {
      if (i === 1)
        return (
          <svg width="600" height="600" viewBox="0 0 600 600">
            <rect width="600" height="600" fill="#24170F" />
            <path d="M80 520 V380 H300 V220 H520 V80" stroke={W.orange} strokeWidth="14" fill="none" strokeLinejoin="round" strokeDasharray="30 20" />
            <circle cx="520" cy="80" r="26" fill={W.cream} />
            <circle cx="80" cy="520" r="26" fill={W.orange} />
          </svg>
        );
      if (i === 2)
        return (
          <div style={{width: 600, height: 600, background: W.cheese, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: disp, fontWeight: 800, fontSize: 120, color: W.bg, letterSpacing: -4}}>cheddar</div>
        );
      if (i === 3)
        return (
          <div style={{width: 600, height: 600, background: W.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: disp, fontWeight: 800, fontSize: 104, color: W.bg, textAlign: 'center', lineHeight: 0.95, letterSpacing: -3}}>
            feito na
            <br />
            brasa
          </div>
        );
      return (
        <div style={{width: 600, height: 600, background: W.bg2, position: 'relative'}}>
          <div style={{position: 'absolute', left: 30, top: 40}}>
            <Burger w={540} id="ad" melt={1.2} bite={1} />
          </div>
        </div>
      );
    };
    scene = (
      <>
        <div style={{position: 'absolute', left: 80, top: 170}}>
          {si === 7 ? <Kin t="o botão fica" size={104} enter={s + 2} color={W.cream} {...kin} /> : <Kin t="Desejo primeiro." size={112} enter={s + 1} color={W.cream} {...kin} />}
        </div>
        {si === 8 ? (
          <div style={{position: 'absolute', left: 80, top: 300}}>
            <Kin t="Preço depois." size={112} enter={k(56)} color={W.orange} {...kin} />
          </div>
        ) : null}
        <div style={{position: 'absolute', left: 540 - PW / 2, top: 470, width: PW, height: PH, borderRadius: 80, background: '#0A0605', border: '12px solid #3A2A20', boxSizing: 'border-box', overflow: 'hidden', transform: `translateY(${(1 - phoneIn) * 900}px)`}}>
          {confirmed < 0.5 ? (
            <div style={{position: 'absolute', left: 18, right: 18, top: 70}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '10px 6px'}}>
                <div style={{width: 56, height: 56, borderRadius: 28, background: W.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: disp, fontWeight: 800, fontSize: 30, color: W.bg}}>B</div>
                <div>
                  <div style={{fontFamily: ui, fontWeight: 600, fontSize: 28, color: W.cream}}>brasa.burger</div>
                  <div style={{fontFamily: ui, fontSize: 21, color: W.muted}}>Patrocinado</div>
                </div>
              </div>
              <div style={{position: 'relative', width: 600, height: 600, borderRadius: 24, overflow: 'hidden', marginTop: 10}}>
                {media(cyc)}
                {/* o botão fixo no canto */}
                <div style={{position: 'absolute', right: 20, bottom: 20, background: W.orange, borderRadius: 999, padding: '20px 30px', fontFamily: ui, fontWeight: 600, fontSize: 34, color: W.bg, transform: `scale(${1 + pulse * 0.08 - tap * 0.12})`, boxShadow: '0 16px 30px rgba(0,0,0,0.45)'}}>Pedir agora</div>
                {tap > 0.05 ? <div style={{position: 'absolute', right: 70, bottom: 30, width: 120, height: 120, borderRadius: 60, border: `5px solid ${W.cream}`, transform: `scale(${1 + (1 - tap) * 1.4})`, opacity: tap}} /> : null}
              </div>
              {[520, 430, 300].map((w, i) => (
                <div key={i} style={{height: 16, width: w, borderRadius: 8, background: '#2E2018', marginTop: i ? 16 : 30}} />
              ))}
            </div>
          ) : (
            <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 220, transform: `scale(${0.9 + 0.1 * confirmed})`}}>
              <div style={{width: 200, height: 200, borderRadius: 100, background: W.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7" />
                </svg>
              </div>
              <div style={{fontFamily: disp, fontWeight: 800, fontSize: 68, color: W.cream, marginTop: 40, letterSpacing: -2}}>Pedido confirmado</div>
              <div style={{width: 500, marginTop: 60, display: 'flex', alignItems: 'center', gap: 20}}>
                <Burger w={130} id="mini" board={false} melt={0.8} />
                <div>
                  <div style={{fontFamily: ui, fontWeight: 600, fontSize: 34, color: W.cream}}>Brasa clássico</div>
                  <div style={{fontFamily: mono, fontSize: 44, color: W.orange, marginTop: 8, transform: `scale(${price})`, transformOrigin: '0 50%'}}>R$ 34,90</div>
                </div>
              </div>
              <div style={{width: 500, height: 14, borderRadius: 7, background: '#2E2018', marginTop: 60, overflow: 'hidden'}}>
                <div style={{width: `${lin(f, k(55), e - k(55)) * 60}%`, height: '100%', background: W.orange}} />
              </div>
              <div style={{fontFamily: ui, fontSize: 30, color: W.muted, marginTop: 16}}>a caminho</div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Fundo quente com brilho de brasa e fagulhas subindo devagar.
  const bg = brandScene ? '#0B0B0C' : W.bg;
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
      {!brandScene ? (
        <>
          <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 45% at 50% 62%, rgba(255,138,31,0.22) 0%, rgba(255,90,31,0.06) 45%, rgba(0,0,0,0) 70%)'}} />
          {Array.from({length: 9}).map((_, i) => {
            const speed = 2 + rand(seed + 7, i) * 3;
            const y = 1950 - ((f * speed + rand(seed + 8, i) * 1900) % 2000);
            const x = rand(seed + 9, i) * 1080 + noise1D(seed + i, f / 40) * 40;
            const r = 4 + rand(seed + 10, i) * 6;
            return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r, background: W.orange, opacity: 0.35 + 0.3 * rand(seed + 11, i), filter: 'blur(1.5px)'}} />;
          })}
        </>
      ) : null}
      <div style={stage}>{scene}</div>
      <svg style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.2, pointerEvents: 'none'}} width="1080" height="1920">
        <filter id={`grain-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={(seed * 97 + f) % 9973} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter={`url(#grain-${id})`} />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
