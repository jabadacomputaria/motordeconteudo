// Peças do filme "Gemini: cem abas, uma resposta" (16:9). Tudo depende só das props (que vêm do frame).
// Sem logotipo oficial: o nome aparece em texto e a "inteligência" é um orbe de luz desenhado aqui.
import React from 'react';
import {rand} from '../../lib/noise';

export const G = {
  white: '#F7F8FB',
  card: '#FFFFFF',
  ink: '#111318',
  muted: '#6B7280',
  faint: '#9AA1AE',
  line: '#E7EAF0',
  blue: '#3D6BFF',
  dark: '#0E1015',
  dark2: '#1A1E26',
  hues: ['#4F7BFF', '#9B6BFF', '#FF6FA8', '#FFB55A', '#3FD39A'],
};

export type Fonts = {ui: string; mono: string};

// ---------------------------------------------------------------------------------------------
// Orbe de luz: núcleo quente, cores girando por dentro, brilho especular e bloom (é uma fonte de luz).
export const Orb: React.FC<{size: number; t: number; glow?: number; spin?: number}> = ({size, t, glow = 1, spin = 1}) => {
  if (size < 0.5) return null;
  const rot = t * 60 * spin;
  return (
    <div style={{position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size}}>
      <div
        style={{
          position: 'absolute',
          left: -size * 1.4,
          top: -size * 1.4,
          width: size * 3.8,
          height: size * 3.8,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(130,145,255,${0.42 * glow}) 0%, rgba(190,120,255,${0.22 * glow}) 22%, rgba(255,140,190,${0.12 * glow}) 38%, rgba(255,200,130,${0.06 * glow}) 52%, rgba(255,255,255,0) 70%)`,
        }}
      />
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 0 ${size * 0.25}px rgba(140,150,255,${0.5 * glow})`}}>
        <div style={{position: 'absolute', inset: -size * 0.35, background: `conic-gradient(from ${rot}deg, #4F7BFF, #9B6BFF, #FF6FA8, #FFB55A, #3FD39A, #4F7BFF)`, filter: `blur(${Math.max(1, size * 0.1)}px)`}} />
        <div style={{position: 'absolute', inset: -size * 0.2, background: `conic-gradient(from ${-rot * 1.7}deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.55) 40deg, rgba(255,255,255,0) 110deg, rgba(255,255,255,0) 360deg)`, filter: `blur(${Math.max(1, size * 0.08)}px)`}} />
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 22%, rgba(255,255,255,0) 58%)'}} />
        <div style={{position: 'absolute', left: '18%', top: '12%', width: '38%', height: '26%', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)', transform: 'rotate(-25deg)'}} />
      </div>
    </div>
  );
};

// Raios de luz saindo do orbe (volumétrico, girando devagar).
export const Rays: React.FC<{size: number; t: number; alpha: number; dark?: boolean}> = ({size, t, alpha, dark = true}) =>
  alpha <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `repeating-conic-gradient(from ${t * 8}deg, rgba(${dark ? '200,210,255' : '150,160,255'},${0.16 * alpha}) 0deg 3deg, rgba(255,255,255,0) 3deg 11deg, rgba(${dark ? '255,200,230' : '255,170,210'},${0.1 * alpha}) 11deg 13deg, rgba(255,255,255,0) 13deg 23deg)`,
        WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 5%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0) 62%)',
        maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 5%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0) 62%)',
        mixBlendMode: dark ? 'screen' : 'multiply',
      }}
    />
  );

// ---------------------------------------------------------------------------------------------
// As abas do caos: janelas de navegador com conteúdos variados.
export const TITLES = [
  'como abrir MEI passo a passo',
  'planilha de custos grátis',
  'calcular preço de venda',
  'consulta CNPJ',
  'modelo de contrato PDF',
  'fornecedores atacado SP',
  'melhor horário pra postar',
  'taxa da maquininha',
  'nota fiscal MEI como emitir',
  'logo grátis online',
  'fluxo de caixa modelo',
  'Instagram para negócios',
  'quanto cobrar de frete',
  'registrar marca INPI',
  'abrir conta PJ',
  'embalagem barata atacado',
  'precificação no delivery',
  'como fazer anúncio',
  'planilha de estoque',
  'Simples Nacional tabela',
  'como responder cliente',
  'site grátis para loja',
  'calendário de posts',
  'pix para empresa',
];
const KINDS = ['article', 'sheet', 'pdf', 'video', 'map', 'shop'] as const;
export type WinKind = (typeof KINDS)[number];
const FAV = ['#4F7BFF', '#E5484D', '#22A55B', '#F2A93B', '#9B6BFF', '#14B8A6', '#F472B6', '#64748B'];

export type Win = {i: number; x: number; y: number; z: number; rx: number; ry: number; rz: number; w: number; h: number; kind: WinKind; title: string; fav: string; spawn: number};

export const makeWins = (n: number, seed: number, endFrame: number): Win[] =>
  Array.from({length: n}).map((_, i) => {
    const r = (k: number) => rand(seed + k * 101, i);
    // espalha numa espiral larga, com profundidade, pra encher o quadro
    const a = i * 2.39996 + r(1) * 0.6;
    const rad = 260 + Math.sqrt(i / n) * 900 * (0.75 + r(2) * 0.5);
    return {
      i,
      x: Math.cos(a) * rad * 1.15,
      y: Math.sin(a) * rad * 0.62,
      z: -900 + r(3) * 1100,
      rx: (r(4) - 0.5) * 26,
      ry: (r(5) - 0.5) * 44,
      rz: (r(6) - 0.5) * 14,
      w: 440 + r(7) * 160,
      h: 290 + r(8) * 90,
      kind: KINDS[Math.floor(r(9) * KINDS.length)],
      title: TITLES[i % TITLES.length],
      fav: FAV[Math.floor(r(10) * FAV.length)],
      // densidade crescente: intervalos cada vez menores
      spawn: i < 4 ? 2 + i * 5 : Math.round(20 + (endFrame - 26) * Math.sqrt((i - 4) / (n - 4))),
    };
  });

const Lines: React.FC<{n: number; w: number; c?: string; gap?: number; h?: number}> = ({n, w, c = '#D5DAE3', gap = 10, h = 8}) => (
  <div>
    {Array.from({length: n}).map((_, k) => (
      <div key={k} style={{height: h, width: `${w - ((k * 37) % 30)}%`, borderRadius: h, background: c, marginTop: k ? gap : 0}} />
    ))}
  </div>
);

export const WinBody: React.FC<{kind: WinKind; fav: string}> = ({kind, fav}) => {
  if (kind === 'sheet')
    return (
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, padding: 10}}>
        {Array.from({length: 36}).map((_, k) => (
          <div key={k} style={{height: 22, background: k < 6 ? '#1E8E5A' : k % 7 === 0 ? '#E8F5EE' : '#F3F5F8'}} />
        ))}
      </div>
    );
  if (kind === 'pdf')
    return (
      <div style={{background: '#525659', height: '100%', display: 'flex', justifyContent: 'center', paddingTop: 12}}>
        <div style={{width: '62%', background: '#fff', padding: 14, boxSizing: 'border-box'}}>
          <div style={{height: 12, width: '70%', background: '#2B2F36', borderRadius: 3}} />
          <div style={{marginTop: 12}}>
            <Lines n={7} w={100} h={5} gap={7} />
          </div>
        </div>
      </div>
    );
  if (kind === 'video')
    return (
      <div style={{padding: 12}}>
        <div style={{height: 150, borderRadius: 8, background: 'linear-gradient(135deg, #20242C, #3A4150)', position: 'relative'}}>
          <div style={{position: 'absolute', left: '50%', top: '50%', marginLeft: -22, marginTop: -16, width: 44, height: 32, borderRadius: 8, background: '#E5484D'}} />
          <div style={{position: 'absolute', left: 0, right: '45%', bottom: 0, height: 4, background: '#E5484D'}} />
        </div>
        <div style={{marginTop: 12}}>
          <Lines n={2} w={90} />
        </div>
      </div>
    );
  if (kind === 'map')
    return (
      <div style={{height: '100%', background: '#E6F1E3', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -20, right: -20, top: 70, height: 14, background: '#fff', transform: 'rotate(-8deg)'}} />
        <div style={{position: 'absolute', top: -20, bottom: -20, left: 180, width: 14, background: '#fff', transform: 'rotate(12deg)'}} />
        <div style={{position: 'absolute', left: 230, top: 90, width: 26, height: 26, borderRadius: '50% 50% 50% 0', background: '#E5484D', transform: 'rotate(-45deg)'}} />
      </div>
    );
  if (kind === 'shop')
    return (
      <div style={{display: 'flex', gap: 10, padding: 12}}>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{flex: 1}}>
            <div style={{height: 100, borderRadius: 8, background: ['#FDE7D3', '#DCE7FF', '#E7F7EC'][k]}} />
            <div style={{height: 8, borderRadius: 4, background: '#D5DAE3', marginTop: 10}} />
            <div style={{height: 10, width: '50%', borderRadius: 4, background: '#22A55B', marginTop: 8}} />
          </div>
        ))}
      </div>
    );
  return (
    <div style={{padding: 14, display: 'flex', gap: 14}}>
      <div style={{flex: 1}}>
        <div style={{height: 16, width: '80%', borderRadius: 4, background: '#2B2F36'}} />
        <div style={{marginTop: 14}}>
          <Lines n={6} w={100} />
        </div>
      </div>
      <div style={{width: '34%', height: 120, borderRadius: 8, background: `linear-gradient(135deg, ${fav}55, ${fav}22)`}} />
    </div>
  );
};

export const BrowserWin: React.FC<{win: Win; fonts: Fonts; shade: number; lightFromX?: number}> = ({win, fonts, shade, lightFromX = 0}) => (
  <div style={{width: win.w, height: win.h, borderRadius: 14, background: '#FFFFFF', overflow: 'hidden', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.45), 0 2px 0 rgba(255,255,255,0.6) inset'}}>
    <div style={{height: 38, background: '#E9ECF1', display: 'flex', alignItems: 'center', gap: 7, padding: '0 12px'}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <div key={c} style={{width: 10, height: 10, borderRadius: 5, background: c}} />
      ))}
      <div style={{marginLeft: 8, height: 28, flex: 1, borderRadius: '8px 8px 0 0', background: '#fff', display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', alignSelf: 'flex-end'}}>
        <div style={{width: 14, height: 14, borderRadius: 4, background: win.fav, flexShrink: 0}} />
        <div style={{fontFamily: fonts.ui, fontWeight: 500, fontSize: 15, color: '#30343B', whiteSpace: 'nowrap', overflow: 'hidden'}}>{win.title}</div>
      </div>
    </div>
    <div style={{height: 30, background: '#fff', borderBottom: '1px solid #EEF0F4', display: 'flex', alignItems: 'center', padding: '0 12px'}}>
      <div style={{height: 18, flex: 1, borderRadius: 9, background: '#F1F3F6'}} />
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 68, bottom: 0}}>
      <WinBody kind={win.kind} fav={win.fav} />
    </div>
    {/* luz: lado virado para a fonte fica claro, o resto escurece com a distância */}
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${90 + win.ry * 1.5 + lightFromX}deg, rgba(150,175,255,0.22), rgba(0,0,0,0) 45%, rgba(0,0,0,0.25))`}} />
    <div style={{position: 'absolute', inset: 0, background: '#05070B', opacity: shade}} />
  </div>
);

// ---------------------------------------------------------------------------------------------
// Texto que nasce do desfoque, letra por letra (com leve deslocamento e escala).
export const BlurText: React.FC<{text: string; frame: number; start: number; stagger?: number; dur?: number; size: number; weight?: number; color?: string; family: string; out?: number; outStagger?: number; spacing?: number}> = ({
  text,
  frame,
  start,
  stagger = 2,
  dur = 14,
  size,
  weight = 500,
  color = G.ink,
  family,
  out,
  outStagger = 1.2,
  spacing = -0.02,
}) => (
  <div style={{display: 'flex', whiteSpace: 'pre', fontFamily: family, fontWeight: weight, fontSize: size, color, letterSpacing: size * spacing, lineHeight: 1.1}}>
    {text.split('').map((ch, i) => {
      const q = Math.max(0, Math.min(1, (frame - start - i * stagger) / dur));
      const e = 1 - Math.pow(1 - q, 3);
      const o = out === undefined ? 0 : Math.max(0, Math.min(1, (frame - out - i * outStagger) / 10));
      const oe = o * o;
      return (
        <span
          key={i}
          style={{
            display: 'inline-block',
            opacity: e * (1 - oe),
            filter: e < 0.99 || oe > 0.01 ? `blur(${((1 - e) * 18 + oe * 16).toFixed(1)}px)` : undefined,
            transform: `translateX(${(1 - e) * 26 - oe * 20}px) translateY(${-oe * 18}px) scale(${1 + (1 - e) * 0.25})`,
          }}
        >
          {ch}
        </span>
      );
    })}
  </div>
);

// Ícones simples de interface.
export const PlusIcon: React.FC<{c?: string; s?: number}> = ({c = G.muted, s = 30}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const SlidersIcon: React.FC<{c?: string; s?: number}> = ({c = G.muted, s = 30}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
);
export const SendIcon: React.FC<{c?: string; s?: number}> = ({c = '#fff', s = 30}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
  </svg>
);
export const CheckIcon: React.FC<{c?: string; s?: number}> = ({c = '#fff', s = 22}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

// Mini pilha de abas (o anexo "100 abas").
export const TabStack: React.FC<{n?: number; spread?: number}> = ({n = 5, spread = 1}) => (
  <div style={{position: 'relative', width: 70, height: 46}}>
    {Array.from({length: n}).map((_, k) => (
      <div
        key={k}
        style={{
          position: 'absolute',
          left: k * 6 * spread,
          top: (n - k) * 2 * spread,
          width: 46,
          height: 32,
          borderRadius: 6,
          background: '#fff',
          border: '1px solid #DDE2EA',
          boxShadow: '0 4px 10px rgba(20,30,60,0.12)',
          transform: `rotate(${(k - n / 2) * 4 * spread}deg)`,
        }}
      >
        <div style={{height: 8, background: '#E9ECF1', borderRadius: '6px 6px 0 0'}} />
        <div style={{width: 8, height: 8, borderRadius: 2, background: FAV[k % FAV.length], margin: '5px 6px'}} />
      </div>
    ))}
  </div>
);
