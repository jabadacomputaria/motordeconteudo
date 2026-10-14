// Peças do vídeo "IA com direção": caixa de pedido, cartões de vídeo, texto cinético, rabisco.
// Tudo é função das props (que vêm do frame). Nada de estado.
import React from 'react';
import {ease, pop} from '../../lib/anim';

export const C = {
  bg: '#F2F4F8',
  card: '#FFFFFF',
  ink: '#0E1116',
  muted: '#8A93A3',
  line: '#E3E7EE',
  trail: '#C9D0DC',
  dark: '#0B0D12',
  darkCard: '#161A22',
  darkLine: '#262C38',
  darkInk: '#F2F4F8',
  darkMuted: '#7D8596',
  accent: '#4B5BFF',
  accent2: '#9B5BFF',
  red: '#FF453A',
  green: '#22C55E',
};

export type Fonts = {display: string; ui: string; mono: string};

// Texto cinético: cada palavra sobe por trás de uma máscara. Sem caixa.
export const Kin: React.FC<{
  t: string;
  size: number;
  enter: number;
  frame: number;
  fps: number;
  family: string;
  color?: string;
  weight?: number;
  colorWords?: Record<string, string>;
  exit?: number;
  align?: 'left' | 'center';
  stagger?: number;
  tracking?: number;
}> = ({t, size, enter, frame, fps, family, color = C.ink, weight = 700, colorWords = {}, exit, align = 'left', stagger = 3, tracking = -0.04}) => {
  if (frame < enter - 1) return null;
  if (exit !== undefined && frame > exit + 14) return null;
  const words = t.split(' ');
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: size * 0.24}}>
      {words.map((w, i) => {
        const rise = pop(frame, enter + i * stagger, fps, 210, 20);
        const out = exit === undefined ? 0 : ease(frame, exit + i * 2, 9);
        const clean = w.replace(/[.,:!?…]/g, '');
        return (
          <div key={i} style={{overflow: 'hidden', padding: `${size * 0.04}px 0 ${size * 0.2}px`, marginBottom: -size * 0.16}}>
            <div style={{fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1, letterSpacing: size * tracking, color: colorWords[clean] ?? color, transform: `translateY(${(1 - rise) * 110 - out * 115}%)`, whiteSpace: 'nowrap'}}>{w}</div>
          </div>
        );
      })}
    </div>
  );
};

// Rabisco vermelho que sublinha (desenha da esquerda para a direita).
export const Scribble: React.FC<{w: number; p: number; color?: string; stroke?: number}> = ({w, p, color = C.red, stroke = 7}) => (
  <svg width={w} height={28} viewBox={`0 0 ${w} 28`} fill="none" style={{display: 'block'}}>
    <path
      d={`M4 18 C ${w * 0.25} 8, ${w * 0.45} 26, ${w * 0.62} 14 S ${w * 0.9} 10, ${w - 4} 16`}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray="1"
      strokeDashoffset={1 - p}
    />
  </svg>
);

export const SendIcon: React.FC<{size: number; color?: string}> = ({size, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
  </svg>
);

export type Row = {label: string; value: string; p: number; extra?: React.ReactNode};

// Caixa de pedido para a IA. As linhas de direção entram crescendo (altura) e subindo por máscara.
export const PromptBox: React.FC<{fonts: Fonts; text: string; caret?: boolean; rows?: Row[]; send?: number; width?: number; placeholder?: string; dim?: number}> = ({fonts, text, caret = false, rows = [], send = 0, width = 900, placeholder = 'Peça um vídeo…'}) => (
  <div style={{width, borderRadius: 44, background: C.card, boxShadow: '0 40px 90px rgba(25,35,70,0.14), 0 2px 0 rgba(25,35,70,0.04)', padding: '34px 40px 30px', boxSizing: 'border-box'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
      <div style={{width: 30, height: 30, borderRadius: 15, background: `conic-gradient(from 200deg, ${C.accent}, ${C.accent2}, ${C.accent})`}} />
      <div style={{fontFamily: fonts.ui, fontWeight: 500, fontSize: 26, color: C.muted}}>Novo pedido</div>
    </div>
    <div style={{marginTop: 22, minHeight: 65, fontFamily: fonts.display, fontWeight: 600, fontSize: 54, lineHeight: 1.2, color: text ? C.ink : C.muted, letterSpacing: -1.5}}>
      {text || placeholder}
      {caret ? <span style={{display: 'inline-block', width: 4, height: 58, background: C.accent, marginLeft: 4, verticalAlign: -8}} /> : null}
    </div>
    {rows.map((r) => {
      if (r.p <= 0.001) return null;
      const h = Math.min(1, r.p);
      return (
        <div key={r.label} style={{height: (r.extra ? 150 : 82) * h, overflow: 'hidden'}}>
          <div style={{transform: `translateY(${(1 - r.p) * 60}px)`, borderTop: `1px solid ${C.line}`, paddingTop: 18, marginTop: 14}}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
              <div style={{fontFamily: fonts.mono, fontWeight: 500, fontSize: 24, color: C.accent, textTransform: 'uppercase', letterSpacing: 2, width: 128, flexShrink: 0}}>{r.label}</div>
              <div style={{fontFamily: fonts.ui, fontWeight: 500, fontSize: 38, color: C.ink, whiteSpace: 'nowrap'}}>{r.value}</div>
            </div>
            {r.extra ? <div style={{marginTop: 12, marginLeft: 146}}>{r.extra}</div> : null}
          </div>
        </div>
      );
    })}
    <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 20}}>
      <div style={{width: 84, height: 84, borderRadius: 42, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - send * 0.16})`}}>
        <SendIcon size={40} />
      </div>
    </div>
  </div>
);

// O vídeo genérico: foto de banco com marca d'água e a frase pronta.
export const GenericCard: React.FC<{fonts: Fonts; w?: number}> = ({fonts, w = 360}) => {
  const k = w / 360;
  return (
    <div style={{width: w, height: 640 * k, borderRadius: 30 * k, overflow: 'hidden', position: 'relative', background: 'linear-gradient(180deg, #A9BCD9 0%, #7E98C2 55%, #5F79A6 100%)', boxShadow: '0 30px 70px rgba(25,35,70,0.22)'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${k})`, transformOrigin: '0 0', width: 360, height: 640}}>
        <div style={{position: 'absolute', right: 50, top: 70, width: 70, height: 70, borderRadius: 35, background: '#E8EEF8', opacity: 0.8}} />
        {[
          [20, 300, 70, 340],
          [95, 240, 80, 400],
          [180, 280, 60, 360],
          [245, 210, 95, 430],
        ].map(([x, y, ww, hh], i) => (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: ww, height: hh, background: i % 2 ? '#4C6592' : '#5A74A1'}}>
            {Array.from({length: 10}).map((_, r) => (
              <div key={r} style={{height: 6, margin: '14px 10px 0', background: 'rgba(255,255,255,0.18)'}} />
            ))}
          </div>
        ))}
        {/* marca d'água de banco de imagem */}
        <div style={{position: 'absolute', inset: -100, transform: 'rotate(-28deg)', display: 'flex', flexWrap: 'wrap', gap: '50px 40px', alignContent: 'center', justifyContent: 'center', opacity: 0.28}}>
          {Array.from({length: 24}).map((_, i) => (
            <div key={i} style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 30, color: '#fff'}}>stock</div>
          ))}
        </div>
        <div style={{position: 'absolute', left: 150, top: 270, width: 64, height: 64, borderRadius: 32, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 0, height: 0, borderLeft: '22px solid #5F79A6', borderTop: '14px solid transparent', borderBottom: '14px solid transparent', marginLeft: 6}} />
        </div>
        <div style={{position: 'absolute', left: 24, right: 24, bottom: 56, fontFamily: fonts.display, fontWeight: 600, fontSize: 36, lineHeight: 1.15, color: '#fff', textAlign: 'center', textShadow: '0 2px 12px rgba(0,0,0,0.35)'}}>Sua empresa, nossa paixão.</div>
      </div>
    </div>
  );
};

// O vídeo com direção: escuro, uma ideia só, com a proposta no visto.
export const DirectedCard: React.FC<{fonts: Fonts; w?: number; t?: number}> = ({fonts, w = 360, t = 0}) => {
  const k = w / 360;
  return (
    <div style={{width: w, height: 640 * k, borderRadius: 30 * k, overflow: 'hidden', position: 'relative', background: C.dark, boxShadow: '0 30px 70px rgba(25,35,70,0.3)'}}>
      <div style={{position: 'absolute', left: 0, top: 0, transform: `scale(${k})`, transformOrigin: '0 0', width: 360, height: 640}}>
        <div style={{position: 'absolute', left: 28, top: 60, fontFamily: fonts.display, fontWeight: 700, fontSize: 54, lineHeight: 1.02, color: C.darkInk, letterSpacing: -2}}>
          Sua proposta
          <br />
          ficou no
          <br />
          <span style={{color: C.accent}}>visto.</span>
        </div>
        <div style={{position: 'absolute', left: 28, right: 28, top: 330, height: 120, borderRadius: 22, background: C.darkCard, padding: 18, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 14}}>
          <div style={{width: 52, height: 64, borderRadius: 8, background: C.red}} />
          <div style={{flex: 1}}>
            <div style={{height: 12, width: '80%', borderRadius: 6, background: C.darkInk, opacity: 0.85}} />
            <div style={{height: 10, width: '50%', borderRadius: 5, background: C.darkMuted, marginTop: 10}} />
          </div>
          <svg width="40" height="28" viewBox="0 0 29 20" fill="none" stroke="#4FB2FF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 11l5 5L17 5" />
            <path d="M12 15l1 1L24 5" />
          </svg>
        </div>
        <svg style={{position: 'absolute', left: 0, bottom: 40}} width="360" height="140" viewBox="0 0 360 140" fill="none">
          <path d={`M20 120 C 120 120, ${150 + Math.sin(t) * 20} 20, 340 20`} stroke={C.accent} strokeWidth="5" />
          <rect x="13" y="113" width="14" height="14" fill={C.darkInk} transform="rotate(45 20 120)" />
          <rect x="333" y="13" width="14" height="14" fill={C.darkInk} transform="rotate(45 340 20)" />
        </svg>
      </div>
    </div>
  );
};

// Onda de voz (barras) determinística.
export const Wave: React.FC<{w: number; h: number; t: number; color?: string; bars?: number; grow?: number}> = ({w, h, t, color = C.accent, bars = 46, grow = 1}) => (
  <div style={{width: w, height: h, display: 'flex', alignItems: 'center', gap: 3}}>
    {Array.from({length: bars}).map((_, i) => {
      const a = 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + t * 6) * Math.cos(i * 0.43 + t * 2.3));
      return <div key={i} style={{flex: 1, height: Math.max(4, h * a * grow), borderRadius: 3, background: color}} />;
    })}
  </div>
);

// Brilho de 4 pontas (para o botão de "mágica").
export const Sparkle: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 1 C 13 9, 15 11, 23 12 C 15 13, 13 15, 12 23 C 11 15, 9 13, 1 12 C 9 11, 11 9, 12 1 Z" />
  </svg>
);

export const Check: React.FC<{size: number; p: number}> = ({size, p}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`}}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  </div>
);

export const usePop = pop;
