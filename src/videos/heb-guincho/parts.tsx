// Peças do vídeo HEB (guincho de corda). Tudo é função das props (que vêm do frame). Nada de estado.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {ease, mix, pop} from '../../lib/anim';

export const C = {
  bg: '#06182A',
  deep: '#041120',
  surface: '#0D2338',
  ink: '#F3F5F7',
  muted: '#8EA2B6',
  accent: '#E8692A',
  line: '#2B4A68',
  light: '#E9EDF1',
  navyInk: '#06182A',
};

export type Fonts = {display: string; ui: string; mono: string};

// Quadro de um clipe já recortado (sem marca d'água, legenda nem carimbo de data).
export const clipSrc = (id: string, name: string, i: number, ext = 'jpg') => staticFile(`${id}/clips/${name}/${String(Math.max(0, Math.round(i))).padStart(3, '0')}.${ext}`);

export const CLIP_LEN: Record<string, number> = {drone: 178, worker: 76, winch: 151, tower: 115};
export const clampIdx = (name: string, i: number) => Math.max(0, Math.min(CLIP_LEN[name] - 1, Math.round(i)));

// Imagem posicionada em pixels de tela (x, y, escala). Não usa object-fit: a posição é exata.
export const Plate: React.FC<{src: string; x: number; y: number; s?: number; w: number; h: number; style?: React.CSSProperties}> = ({src, x, y, s = 1, w, h, style}) => (
  <Img src={src} style={{position: 'absolute', left: x, top: y, width: w * s, height: h * s, ...style}} />
);

// Fatias: o mesmo conteúdo cortado em faixas que chegam em tempos diferentes, de lados alternados.
// É o jeito deste vídeo de trabalhar as camadas: a tela vira andares (como os níveis de uma torre).
export const Bands: React.FC<{
  n: number;
  frame: number;
  start: number;
  axis?: 'x' | 'y';
  dist?: number;
  stagger?: number;
  dur?: number;
  out?: number; // frame de saída (faixas saem de novo, invertidas)
  box?: {x: number; y: number; w: number; h: number}; // faixa dentro do contêiner (mesmo tamanho do contêiner)
  children: React.ReactNode;
}> = ({n, frame, start, axis = 'x', dist = 1100, stagger = 2, dur = 13, out, box = {x: 0, y: 0, w: 1080, h: 1920}, children}) => (
  <>
    {Array.from({length: n}).map((_, i) => {
      const p = ease(frame, start + i * stagger, dur);
      const q = out === undefined ? 0 : ease(frame, out + i * stagger * 0.7, dur * 0.8);
      const side = i % 2 ? -1 : 1;
      const off = (1 - p) * dist * side - q * dist * side;
      const blur = Math.min(18, Math.abs(off) * 0.02);
      const a0 = axis === 'x' ? box.y + (box.h * i) / n : box.x + (box.w * i) / n;
      const a1 = axis === 'x' ? box.y + (box.h * (i + 1)) / n : box.x + (box.w * (i + 1)) / n;
      const clip = axis === 'x' ? `inset(${a0 - 0.5}px 0 ${box.y + box.h - a1 - 0.5}px 0)` : `inset(0 ${box.x + box.w - a1 - 0.5}px 0 ${a0 - 0.5}px)`;
      if (p <= 0.001 || q >= 0.999) return null;
      return (
        <div key={i} style={{position: 'absolute', inset: 0, clipPath: clip, transform: axis === 'x' ? `translateX(${off}px)` : `translateY(${off}px)`, filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined}}>
          {children}
        </div>
      );
    })}
  </>
);

// Texto cinético sem caixa: cada palavra sobe por trás de uma máscara.
export const Kin: React.FC<{
  t: string;
  size: number;
  enter: number;
  frame: number;
  fps: number;
  family: string;
  color?: string;
  weight?: number;
  exit?: number;
  exitDir?: 1 | -1;
  stagger?: number;
  tracking?: number;
  lineHeight?: number;
  stroke?: string;
}> = ({t, size, enter, frame, fps, family, color = C.ink, weight = 800, exit, exitDir = -1, stagger = 3, tracking = -0.035, lineHeight = 0.92, stroke}) => {
  if (frame < enter - 1) return null;
  if (exit !== undefined && frame > exit + 16) return null;
  const words = t.split(' ');
  return (
    <div style={{display: 'flex', flexWrap: 'nowrap', columnGap: size * 0.24}}>
      {words.map((w, i) => {
        const rise = pop(frame, enter + i * stagger, fps, 220, 21);
        const out = exit === undefined ? 0 : ease(frame, exit + i * 2, 9);
        return (
          <div key={i} style={{overflow: 'hidden', padding: `${size * 0.06}px ${size * 0.02}px ${size * 0.1}px`, margin: `${-size * 0.06}px ${-size * 0.02}px ${-size * 0.1}px`}}>
            <div
              style={{
                fontFamily: family,
                fontWeight: weight,
                fontSize: size,
                lineHeight,
                letterSpacing: size * tracking,
                color: stroke ? 'transparent' : color,
                WebkitTextStroke: stroke ? `${Math.max(2, size * 0.012)}px ${stroke}` : undefined,
                transform: `translateY(${(1 - rise) * 112 + out * 118 * exitDir}%)`,
                whiteSpace: 'nowrap',
              }}
            >
              {w}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Rótulo pequeno de bastidor (mono, maiúsculas espaçadas), entra deslizando por máscara.
export const Label: React.FC<{t: string; frame: number; enter: number; family: string; size?: number; color?: string; exit?: number}> = ({t, frame, enter, family, size = 30, color = C.muted, exit}) => {
  const p = ease(frame, enter, 12);
  const q = exit === undefined ? 0 : ease(frame, exit, 8);
  if (p <= 0) return null;
  return (
    <div style={{overflow: 'hidden'}}>
      <div style={{fontFamily: family, fontWeight: 500, fontSize: size, letterSpacing: size * 0.22, color, whiteSpace: 'nowrap', transform: `translateX(${(1 - p) * -105 + q * -105}%)`}}>{t}</div>
    </div>
  );
};

// Odômetro: cada dígito rola até o valor final, com atraso entre colunas.
export const Odometer: React.FC<{value: string; frame: number; start: number; dur?: number; size: number; family: string; color: string; weight?: number; spins?: number}> = ({value, frame, start, dur = 18, size, family, color, weight = 800, spins = 1}) => {
  if (frame < start) return null;
  const chars = value.split('');
  let col = 0;
  return (
    <div style={{display: 'flex', fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1, color, letterSpacing: -size * 0.03}}>
      {chars.map((ch, i) => {
        if (!/[0-9]/.test(ch)) {
          return (
            <div key={i} style={{height: size, overflow: 'hidden'}}>
              <div style={{transform: `translateY(${(1 - ease(frame, start + dur * 0.5, 8)) * 100}%)`}}>{ch}</div>
            </div>
          );
        }
        const k = col++;
        const target = Number(ch) + 10 * spins;
        const p = ease(frame, start + k * 3, dur);
        const pos = p * target;
        return (
          <div key={i} style={{height: size * 1.0, overflow: 'hidden', position: 'relative'}}>
            <div style={{transform: `translateY(${-(pos % 10) * size}px)`, filter: p > 0.02 && p < 0.9 ? `blur(${((1 - p) * 4).toFixed(1)}px)` : undefined}}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => (
                <div key={j} style={{height: size, textAlign: 'center'}}>
                  {d}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Mira de foco: quatro cantos que fecham no alvo (sem brilho), com cruz central.
export const Reticle: React.FC<{x: number; y: number; w: number; h: number; frame: number; enter: number; fps: number; color?: string; label?: string; family?: string}> = ({x, y, w, h, frame, enter, fps, color = C.accent, label, family}) => {
  if (frame < enter) return null;
  const p = pop(frame, enter, fps, 190, 16);
  const s = mix(1.6, 1, p);
  const ww = w * s;
  const hh = h * s;
  const L = 44;
  const sw = 6;
  const corner = (cx: number, cy: number, dx: number, dy: number) => `M${cx + dx * L} ${cy}L${cx} ${cy}L${cx} ${cy + dy * L}`;
  const x0 = x - ww / 2;
  const y0 = y - hh / 2;
  const x1 = x + ww / 2;
  const y1 = y + hh / 2;
  const lab = ease(frame, enter + 6, 10);
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: Math.min(1, p * 1.6)}}>
        <g fill="none" stroke={color} strokeWidth={sw} strokeLinecap="square">
          <path d={corner(x0, y0, 1, 1)} />
          <path d={corner(x1, y0, -1, 1)} />
          <path d={corner(x0, y1, 1, -1)} />
          <path d={corner(x1, y1, -1, -1)} />
        </g>
        <g stroke={color} strokeWidth={3}>
          <line x1={x - 14} y1={y} x2={x + 14} y2={y} />
          <line x1={x} y1={y - 14} x2={x} y2={y + 14} />
        </g>
      </svg>
      {label && family ? (
        <div style={{position: 'absolute', left: x0, top: y1 + 14, overflow: 'hidden'}}>
          <div style={{background: color, color: C.navyInk, fontFamily: family, fontWeight: 600, fontSize: 30, letterSpacing: 4, padding: '8px 14px', transform: `translateY(${(1 - lab) * 110}%)`, whiteSpace: 'nowrap'}}>{label}</div>
        </div>
      ) : null}
    </>
  );
};

// Grade técnica de fundo (papel de projeto), deslizando devagar.
export const Grid: React.FC<{frame: number; color?: string; step?: number; speed?: number}> = ({frame, color = 'rgba(142,162,182,0.075)', step = 90, speed = 0.35}) => {
  const off = (frame * speed) % step;
  return (
    <div
      style={{
        position: 'absolute',
        inset: -step,
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: `${step}px ${step}px`,
        transform: `translateY(${-off}px)`,
      }}
    />
  );
};

// Linha de cota vertical (desenho técnico): setas nas pontas e marcações que acendem com o progresso.
export const DimLine: React.FC<{x: number; y0: number; y1: number; draw: number; fill: number; color?: string; on?: string; ticks?: number}> = ({x, y0, y1, draw, fill, color = C.muted, on = C.accent, ticks = 20}) => {
  const h = y1 - y0;
  const yTop = y1 - h * draw;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <line x1={x} y1={y1} x2={x} y2={yTop} stroke={color} strokeWidth={3} />
      {Array.from({length: ticks + 1}).map((_, i) => {
        const ty = y1 - (h * i) / ticks;
        if (ty < yTop - 0.5) return null;
        const lit = i / ticks <= fill + 1e-6;
        const long = i % 5 === 0;
        return <line key={i} x1={x - (long ? 26 : 14)} y1={ty} x2={x} y2={ty} stroke={lit ? on : color} strokeWidth={lit ? 4 : 2} />;
      })}
      {draw > 0.98 ? <path d={`M${x - 14} ${y0 + 22}L${x} ${y0}L${x + 14} ${y0 + 22}`} fill="none" stroke={fill > 0.99 ? on : color} strokeWidth={4} /> : null}
      <path d={`M${x - 14} ${y1 - 22}L${x} ${y1}L${x + 14} ${y1 - 22}`} fill="none" stroke={color} strokeWidth={4} />
    </svg>
  );
};

// Relógio técnico: 60 marcas, setor da manhã preenchido em laranja conforme o ponteiro anda.
export const Dial: React.FC<{cx: number; cy: number; r: number; prog: number; enter: number; frame: number; fps: number; mono: string}> = ({cx, cy, r, prog, enter, frame, fps, mono}) => {
  const p = pop(frame, enter, fps, 160, 18);
  const s = mix(0.6, 1, p);
  // 7h → 12h. Ângulo 0 = 12h, sentido horário.
  const a0 = (7 / 12) * 360;
  const a1 = a0 + prog * (360 - a0);
  const pt = (deg: number, rr: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)];
  };
  const rs = r * 0.86;
  const [sx, sy] = pt(a0, rs);
  const [ex, ey] = pt(a1, rs);
  const large = a1 - a0 > 180 ? 1 : 0;
  const sector = prog > 0.001 ? `M${cx} ${cy}L${sx} ${sy}A${rs} ${rs} 0 ${large} 1 ${ex} ${ey}Z` : '';
  const minuteDeg = a0 * 12 + prog * (360 - a0) * 12; // ponteiro dos minutos gira 12x mais rápido
  const [hx, hy] = pt(a1, r * 0.5);
  const [mx, my] = pt(minuteDeg, r * 0.74);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, transform: `scale(${s})`, transformOrigin: `${cx}px ${cy}px`, opacity: Math.min(1, p * 2)}}>
      <circle cx={cx} cy={cy} r={r} fill={C.surface} stroke={C.line} strokeWidth={3} />
      {sector ? <path d={sector} fill={C.accent} opacity={0.92} /> : null}
      {Array.from({length: 60}).map((_, i) => {
        const big = i % 5 === 0;
        const [x1, y1] = pt(i * 6, r * 0.96);
        const [x2, y2] = pt(i * 6, r * (big ? 0.86 : 0.91));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={big ? C.ink : C.muted} strokeWidth={big ? 5 : 2} opacity={big ? 1 : 0.6} />;
      })}
      {[12, 3, 6, 9].map((h) => {
        const [tx, ty] = pt(h * 30, r * 0.7);
        return (
          <text key={h} x={tx} y={ty + 14} textAnchor="middle" fontFamily={mono} fontSize={40} fill={C.muted}>
            {String(h).padStart(2, '0')}
          </text>
        );
      })}
      <line x1={cx} y1={cy} x2={mx} y2={my} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={16} fill={C.accent} />
      <circle cx={cx} cy={cy} r={6} fill={C.navyInk} />
    </svg>
  );
};

// Cartão de diária (folha de calendário), cai e bate com carimbo.
export const DayCard: React.FC<{n: number; x: number; y: number; rot: number; frame: number; enter: number; fps: number; fonts: Fonts; stampAt: number}> = ({n, x, y, rot, frame, enter, fps, fonts, stampAt}) => {
  if (frame < enter - 6) return null;
  const p = pop(frame, enter, fps, 260, 17);
  const fall = (1 - p) * -700;
  const st = pop(frame, stampAt, fps, 320, 15);
  const shake = frame >= enter && frame < enter + 6 ? Math.sin((frame - enter) * 2.6) * (6 - (frame - enter)) * 1.4 : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 280, height: 360, transform: `translateY(${fall}px) rotate(${rot + shake * 0.3}deg)`, transformOrigin: '50% 100%'}}>
      <div style={{position: 'absolute', inset: 0, background: C.light, borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.35)'}}>
        <div style={{height: 78, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px'}}>
          <span style={{fontFamily: fonts.mono, fontSize: 28, letterSpacing: 4, color: C.muted}}>DIA</span>
          <span style={{display: 'flex', gap: 34}}>
            <span style={{width: 14, height: 14, borderRadius: 7, background: C.bg, boxShadow: `0 0 0 3px ${C.muted}`}} />
            <span style={{width: 14, height: 14, borderRadius: 7, background: C.bg, boxShadow: `0 0 0 3px ${C.muted}`}} />
          </span>
        </div>
        <div style={{fontFamily: fonts.display, fontWeight: 800, fontSize: 190, color: C.navyInk, textAlign: 'center', lineHeight: 1, marginTop: 22, letterSpacing: -6}}>{n}</div>
        <div style={{fontFamily: fonts.mono, fontSize: 26, letterSpacing: 5, color: '#5B6F84', textAlign: 'center', marginTop: 8}}>DIÁRIA</div>
      </div>
      {frame >= stampAt ? (
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: 150,
            padding: '6px 16px',
            border: `6px solid ${C.accent}`,
            borderRadius: 10,
            color: C.accent,
            fontFamily: fonts.display,
            fontWeight: 800,
            fontSize: 44,
            letterSpacing: 2,
            transform: `rotate(-14deg) scale(${mix(1.8, 1, st)})`,
            opacity: Math.min(1, st * 2),
            background: 'rgba(233,237,241,0.55)',
          }}
        >
          PAGA
        </div>
      ) : null}
    </div>
  );
};
