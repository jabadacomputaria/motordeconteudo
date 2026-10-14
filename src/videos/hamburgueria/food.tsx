// Desenhos do vídeo da hamburgueria (v2, mais realistas): hambúrguer com luz e textura, queijo que
// escorre em gotas, mordida, cadeado de frente, mapa de bairro em plano inclinado, moto vista de cima
// e a sacola de entrega. Tudo depende só das props.
import React from 'react';
import {rand} from '../../lib/noise';

export const W = {
  bg: '#160806',
  bg2: '#240E08',
  cream: '#FFF3E2',
  muted: '#C9A891',
  orange: '#FF7A00',
  hot: '#FF4D12',
  ember: '#FF5A1F',
  cheese: '#FFB800',
  red: '#F0321E',
  green: '#22C55E',
  card: '#2A120B',
  line: '#4A2418',
  asphalt: '#2A2D34',
};

export type BurgerProps = {
  open?: number; // 0..1: pão de cima levantado
  meat?: number; // 0..1: queda de cada camada (1 = no lugar)
  cheese?: number;
  salad?: number;
  top?: number; // 0..1: pão de cima voltando (1 = fechado)
  squash?: number; // 0..1: amassadinho do pouso
  melt?: number; // 0..1.6: comprimento dos pingos
  bite?: number; // 0..1: mordida
  id: string;
  board?: boolean;
};

const fall = (p: number | undefined, h: number) => (p === undefined ? 0 : -(1 - p) * h);
const visible = (p: number | undefined) => p === undefined || p > 0.001;

// Hambúrguer em SVG (viewBox 640×640): gradientes, brilho, textura e sombra.
export const Burger: React.FC<BurgerProps & {w: number}> = ({w, open = 0, meat = 1, cheese = 1, salad = 1, top, squash = 0, melt = 0.3, bite = 0, id, board = true}) => {
  const topY = top === undefined ? -open * 330 : -(1 - top) * 330;
  const drips = [
    {x: 120, l: 70, w: 34},
    {x: 255, l: 130, w: 40},
    {x: 395, l: 85, w: 34},
    {x: 520, l: 165, w: 42},
  ];
  const g = (n: string) => `${n}-${id}`;
  return (
    <svg width={w} height={w} viewBox="0 0 640 640" style={{overflow: 'visible', display: 'block'}}>
      <defs>
        <radialGradient id={g('bunTop')} cx="0.38" cy="0.22" r="0.85">
          <stop offset="0" stopColor="#FFD08A" />
          <stop offset="0.35" stopColor="#F59A2E" />
          <stop offset="0.75" stopColor="#D06A16" />
          <stop offset="1" stopColor="#9C4A0C" />
        </radialGradient>
        <linearGradient id={g('bunBot')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7B060" />
          <stop offset="0.5" stopColor="#E2862C" />
          <stop offset="1" stopColor="#A9560F" />
        </linearGradient>
        <linearGradient id={g('meat')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A3E1E" />
          <stop offset="0.45" stopColor="#5C2410" />
          <stop offset="1" stopColor="#2E0F05" />
        </linearGradient>
        <linearGradient id={g('cheese')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE07A" />
          <stop offset="0.5" stopColor="#FFB800" />
          <stop offset="1" stopColor="#F08A00" />
        </linearGradient>
        <linearGradient id={g('lettuce')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9BEA5A" />
          <stop offset="1" stopColor="#2E9E1F" />
        </linearGradient>
        <radialGradient id={g('tomato')} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#FF7A5E" />
          <stop offset="0.7" stopColor="#E8321C" />
          <stop offset="1" stopColor="#A81808" />
        </radialGradient>
        <linearGradient id={g('wood')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9A5C30" />
          <stop offset="1" stopColor="#5A3216" />
        </linearGradient>
        <filter id={g('soft')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={g('shadow')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <mask id={g('bite')} maskUnits="userSpaceOnUse" x="-300" y="-1200" width="1240" height="2400">
          <rect x="-300" y="-1200" width="1240" height="2400" fill="#fff" />
          {bite > 0 ? (
            <g transform={`translate(${(1 - bite) * 200} 0)`}>
              <circle cx="612" cy="232" r="92" fill="#000" />
              <circle cx="640" cy="335" r="88" fill="#000" />
              <circle cx="618" cy="440" r="80" fill="#000" />
            </g>
          ) : null}
        </mask>
      </defs>
      {/* sombra no prato */}
      <ellipse cx="320" cy="572" rx="300" ry="26" fill="#000" opacity="0.55" filter={`url(#${g('shadow')})`} />
      {board ? (
        <g>
          <rect x="-20" y="560" width="680" height="44" rx="22" fill={`url(#${g('wood')})`} />
          <rect x="0" y="566" width="640" height="5" rx="2.5" fill="#C98A55" opacity="0.6" />
        </g>
      ) : null}
      <g mask={`url(#${g('bite')})`}>
        {/* pão de baixo: casca e miolo */}
        <path d="M34 478 H606 Q626 478 626 500 V516 Q626 562 576 562 H64 Q14 562 14 516 V500 Q14 478 34 478 Z" fill={`url(#${g('bunBot')})`} />
        <path d="M30 474 H610 Q622 474 622 486 V492 H18 V486 Q18 474 30 474 Z" fill="#FBD7A0" />
        <path d="M60 540 Q320 556 580 540" stroke="#FFD9A0" strokeWidth="6" opacity="0.35" fill="none" strokeLinecap="round" />
        {/* carne */}
        {visible(meat) ? (
          <g transform={`translate(0 ${fall(meat, 1100)})`}>
            <path d="M52 404 Q24 408 26 440 Q28 478 62 480 H578 Q614 478 614 440 Q614 406 586 404 Q560 396 536 404 Q504 394 474 403 Q440 394 404 402 Q368 394 330 402 Q294 394 258 402 Q222 395 186 403 Q150 395 116 403 Q84 396 52 404 Z" fill={`url(#${g('meat')})`} />
            {Array.from({length: 70}).map((_, i) => (
              <circle key={i} cx={40 + rand(11, i) * 560} cy={410 + rand(12, i) * 62} r={1.5 + rand(13, i) * 3.5} fill={rand(14, i) > 0.5 ? '#2A0C03' : '#A8532C'} opacity="0.7" />
            ))}
            <path d="M80 414 Q320 402 560 414" stroke="#C0683A" strokeWidth="5" opacity="0.5" fill="none" strokeLinecap="round" />
          </g>
        ) : null}
        {/* queijo: fatia caindo sobre a carne, borda ondulada e gotas que escorrem */}
        {visible(cheese) ? (
          <g transform={`translate(0 ${fall(cheese, 1100)})`}>
            <path d="M14 388 L626 388 L632 404 Q600 420 566 408 Q536 424 500 410 Q462 426 424 410 Q388 424 350 410 Q314 426 276 410 Q238 424 200 410 Q164 426 126 410 Q90 424 52 410 Q28 420 8 404 Z" fill={`url(#${g('cheese')})`} />
            {drips.map((d, i) => {
              const l = Math.max(0, d.l * melt);
              const y0 = 408;
              const neck = d.w * 0.2;
              const r = d.w * 0.3 * Math.min(1, 0.6 + melt * 0.4);
              return (
                <g key={i}>
                  <path d={`M${d.x - d.w / 2} ${y0} C ${d.x - d.w / 2} ${y0 + l * 0.45}, ${d.x - neck} ${y0 + l * 0.6}, ${d.x - neck} ${y0 + l} L ${d.x + neck} ${y0 + l} C ${d.x + neck} ${y0 + l * 0.6}, ${d.x + d.w / 2} ${y0 + l * 0.45}, ${d.x + d.w / 2} ${y0} Z`} fill={`url(#${g('cheese')})`} />
                  {l > 4 ? <circle cx={d.x} cy={y0 + l + r * 0.4} r={r} fill="#FFB000" /> : null}
                  {l > 10 ? <path d={`M${d.x - d.w * 0.18} ${y0 + 6} Q${d.x - d.w * 0.12} ${y0 + l * 0.5} ${d.x - neck * 0.4} ${y0 + l}`} stroke="#FFF2B0" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8" /> : null}
                  {l > 4 ? <circle cx={d.x - r * 0.35} cy={y0 + l + r * 0.1} r={r * 0.28} fill="#FFF6CC" opacity="0.9" /> : null}
                </g>
              );
            })}
            <path d="M40 392 L600 392" stroke="#FFF2B0" strokeWidth="4" opacity="0.7" strokeLinecap="round" />
          </g>
        ) : null}
        {/* salada: alface franzida e tomate */}
        {visible(salad) ? (
          <g transform={`translate(0 ${fall(salad, 1100)})`}>
            <path d="M10 388 Q30 356 58 380 Q82 348 112 378 Q140 346 170 376 Q198 346 228 378 Q256 348 286 376 Q314 346 344 378 Q372 348 402 376 Q430 346 460 378 Q488 348 518 376 Q546 348 576 378 Q604 352 630 388 Q600 396 560 390 Q320 400 80 390 Q40 396 10 388 Z" fill={`url(#${g('lettuce')})`} />
            <path d="M60 380 Q90 364 120 376 M190 376 Q222 360 252 374 M330 376 Q362 360 392 374 M470 376 Q502 360 532 374" stroke="#D2FFA8" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
            {[150, 320, 490].map((x) => (
              <g key={x}>
                <ellipse cx={x} cy="352" rx="98" ry="22" fill={`url(#${g('tomato')})`} />
                <ellipse cx={x} cy="349" rx="72" ry="13" fill="#FF8C72" opacity="0.6" />
                {[-40, -14, 14, 40].map((dx) => (
                  <ellipse key={dx} cx={x + dx} cy={349 + (dx % 3)} rx="6" ry="3.5" fill="#FFE2A0" opacity="0.85" />
                ))}
              </g>
            ))}
          </g>
        ) : null}
        {/* pão de cima: domo com luz, brilho e gergelim */}
        <g transform={`translate(0 ${topY}) translate(320 352) scale(${1 + squash * 0.04} ${1 - squash * 0.07}) translate(-320 -352)`}>
          <path d="M26 344 C 26 140, 614 140, 614 344 Q614 358 598 358 H42 Q26 358 26 344 Z" fill={`url(#${g('bunTop')})`} />
          <ellipse cx="230" cy="215" rx="150" ry="46" fill="#FFF1D0" opacity="0.38" filter={`url(#${g('soft')})`} transform="rotate(-12 230 215)" />
          <path d="M46 338 Q320 352 594 338" stroke="#8C3F08" strokeWidth="6" opacity="0.35" fill="none" />
          {[
            [170, 248, -20],
            [236, 212, 10],
            [312, 198, -5],
            [390, 206, 25],
            [462, 232, -15],
            [206, 286, 30],
            [296, 262, -30],
            [376, 270, 10],
            [450, 292, -10],
            [128, 306, 15],
            [528, 300, 20],
            [258, 320, -8],
            [410, 318, 18],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`rotate(${r} ${x} ${y})`}>
              <ellipse cx={x + 1.5} cy={y + 2.5} rx="11" ry="5.5" fill="#7A3A08" opacity="0.4" />
              <ellipse cx={x} cy={y} rx="11" ry="5.5" fill="#FFF4DC" />
              <ellipse cx={x - 3} cy={y - 1.5} rx="4" ry="1.8" fill="#fff" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
};

// Cadeado visto de frente: corpo de latão, haste de aço. A chave chega de frente e gira no próprio eixo.
export const Lock: React.FC<{lift: number; swing: number; kp: number; turn: number; id: string}> = ({lift, swing, kp, turn, id}) => {
  const g = (n: string) => `${n}-${id}`;
  return (
    <div style={{position: 'relative', width: 520, height: 720}}>
      {/* haste: sobe e depois gira em torno da perna longa (esquerda) */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 520, height: 420, transform: `translateY(${-lift * 70}px) perspective(1200px) rotateY(${swing * 70}deg)`, transformOrigin: '150px 0'}}>
        <svg width="520" height="420" viewBox="0 0 520 420">
          <defs>
            <linearGradient id={g('steel')} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#6D7781" />
              <stop offset="0.3" stopColor="#F2F6FA" />
              <stop offset="0.55" stopColor="#A9B3BD" />
              <stop offset="1" stopColor="#56606A" />
            </linearGradient>
          </defs>
          <path d="M150 420 V200 A110 110 0 0 1 370 200 V360" stroke={`url(#${g('steel')})`} strokeWidth="56" fill="none" />
          <path d="M138 400 V205 A122 122 0 0 1 200 100" stroke="#fff" strokeWidth="6" opacity="0.6" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <svg style={{position: 'absolute', left: 0, top: 300}} width="520" height="420" viewBox="0 0 520 420">
        <defs>
          <linearGradient id={g('brass')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFE29A" />
            <stop offset="0.35" stopColor="#F2B33A" />
            <stop offset="0.7" stopColor="#C77F12" />
            <stop offset="1" stopColor="#8A5206" />
          </linearGradient>
          <radialGradient id={g('hole')} cx="0.5" cy="0.4" r="0.6">
            <stop offset="0" stopColor="#120800" />
            <stop offset="1" stopColor="#3A2206" />
          </radialGradient>
          <filter id={g('blur')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <rect x="40" y="10" width="440" height="380" rx="56" fill={`url(#${g('brass')})`} />
        <rect x="58" y="28" width="404" height="344" rx="44" fill="none" stroke="#FFF0C0" strokeWidth="4" opacity="0.5" />
        <ellipse cx="170" cy="90" rx="120" ry="40" fill="#FFF8DC" opacity="0.45" filter={`url(#${g('blur')})`} />
        <circle cx="260" cy="190" r="40" fill={`url(#${g('hole')})`} />
        <path d="M244 210 H276 L270 290 H250 Z" fill={`url(#${g('hole')})`} />
      </svg>
      {/* a chave vem da câmera (grande e desfocada) até o buraco e gira */}
      {kp > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            left: 260 - 110,
            top: 300 + 210 - 110,
            width: 220,
            height: 220,
            transform: `translate(${(1 - kp) * 240}px, ${(1 - kp) * 260}px) scale(${1 + (1 - kp) * 3.2}) rotate(${turn * 90}deg)`,
            filter: kp < 0.85 ? `blur(${((1 - kp) * 14).toFixed(1)}px)` : undefined,
            opacity: Math.min(1, kp * 3),
          }}
        >
          <svg width="220" height="220" viewBox="0 0 220 220">
            <defs>
              <linearGradient id={g('key')} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="0.45" stopColor="#C9D1D9" />
                <stop offset="1" stopColor="#6E7882" />
              </linearGradient>
            </defs>
            {/* cabeça da chave (vista de frente) com o furo e o colar que encosta no cadeado */}
            <rect x="96" y="96" width="28" height="70" rx="6" fill="#8D97A1" />
            <path d="M110 6 C 160 6, 186 40, 186 74 C 186 104, 160 122, 130 126 L 130 150 L 90 150 L 90 126 C 60 122, 34 104, 34 74 C 34 40, 60 6, 110 6 Z" fill={`url(#${g('key')})`} />
            <circle cx="110" cy="62" r="20" fill="#3A2206" />
            <path d="M60 50 C 70 26, 100 18, 128 22" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8" />
          </svg>
        </div>
      ) : null}
    </div>
  );
};

// Moto de entrega vista de cima (apontando para cima). Gira no plano conforme a rua.
export const MotoTop: React.FC<{t: number}> = ({t}) => (
  <svg width="120" height="210" viewBox="0 0 120 210" style={{overflow: 'visible'}}>
    <ellipse cx="62" cy="110" rx="52" ry="96" fill="#000" opacity="0.35" />
    {/* rodas */}
    <rect x="50" y="2" width="20" height="46" rx="10" fill="#111" />
    <rect x="50" y="160" width="20" height="46" rx="10" fill="#111" />
    {/* carenagem */}
    <path d="M38 40 Q60 22 82 40 L86 150 Q60 170 34 150 Z" fill="#E8321C" />
    <path d="M46 46 Q60 36 74 46 L76 90 Q60 96 44 90 Z" fill="#FF6A4A" opacity="0.8" />
    {/* guidão */}
    <rect x="10" y="46" width="100" height="10" rx="5" fill="#222" />
    <circle cx="12" cy="51" r="7" fill="#333" />
    <circle cx="108" cy="51" r="7" fill="#333" />
    {/* baú de entrega */}
    <rect x="22" y="128" width="76" height="70" rx="10" fill="#FF7A00" />
    <rect x="22" y="128" width="76" height="16" rx="8" fill="#FFA040" />
    <circle cx="60" cy="168" r="16" fill="#160806" />
    <text x="60" y="175" textAnchor="middle" fontSize="20" fontWeight="800" fill="#FF7A00" fontFamily="Bricolage Grotesque">B</text>
    {/* piloto: ombros, braços e capacete */}
    <ellipse cx="60" cy="98" rx="34" ry="22" fill="#1F3A8A" />
    <path d="M30 92 Q18 70 16 54 M90 92 Q102 70 104 54" stroke="#1F3A8A" strokeWidth="13" strokeLinecap="round" fill="none" />
    <circle cx="60" cy={86 + Math.sin(t * 18) * 0.8} r="22" fill="#F4F4F2" />
    <path d="M44 76 Q60 64 76 76" stroke="#111" strokeWidth="9" strokeLinecap="round" fill="none" />
    <circle cx="53" cy="82" r="5" fill="#fff" />
  </svg>
);

// Casinha vista de cima: telhado de duas águas com cumeeira.
export const HouseTop: React.FC<{x: number; y: number; w: number; h: number; c: string; rot?: boolean}> = ({x, y, w, h, c, rot}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="6" y="8" width={w} height={h} rx="6" fill="#000" opacity="0.3" />
    {rot ? (
      <>
        <rect width={w} height={h / 2} fill={c} />
        <rect y={h / 2} width={w} height={h / 2} fill={c} opacity="0.72" />
        <rect y={h / 2 - 2} width={w} height="4" fill="#fff" opacity="0.35" />
      </>
    ) : (
      <>
        <rect width={w / 2} height={h} fill={c} />
        <rect x={w / 2} width={w / 2} height={h} fill={c} opacity="0.72" />
        <rect x={w / 2 - 2} width="4" height={h} fill="#fff" opacity="0.35" />
      </>
    )}
  </g>
);

// Sacola de papel da entrega, com abas que abrem.
export const Bag: React.FC<{open: number; id: string}> = ({open, id}) => {
  const g = (n: string) => `${n}-${id}`;
  return (
    <svg width="640" height="760" viewBox="0 0 640 760" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={g('kraft')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B87A40" />
          <stop offset="0.45" stopColor="#D9A066" />
          <stop offset="1" stopColor="#A06A34" />
        </linearGradient>
        <radialGradient id={g('glow')} cx="0.5" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#FFB547" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FF7A00" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* interior (aparece quando abre) */}
      <path d="M70 200 L570 200 L540 250 L100 250 Z" fill="#3A2210" />
      <ellipse cx="320" cy="210" rx={240 * open} ry={70 * open} fill={`url(#${g('glow')})`} />
      {/* abas */}
      <g transform={`translate(0 200) scale(1 ${1 - open * 1.8}) translate(0 -200)`}>
        <path d="M70 200 L120 80 L520 80 L570 200 Z" fill="#C88A4E" />
        <path d="M120 80 L520 80 L530 96 L110 96 Z" fill="#A86E36" />
      </g>
      {/* corpo */}
      <path d="M70 200 L570 200 L600 740 L40 740 Z" fill={`url(#${g('kraft')})`} />
      <path d="M70 200 L570 200 L572 230 L68 230 Z" fill="#9A6230" opacity="0.6" />
      <circle cx="320" cy="470" r="110" fill="#FF7A00" />
      <circle cx="320" cy="470" r="92" fill="none" stroke="#FFE2B8" strokeWidth="4" strokeDasharray="10 10" />
      <text x="320" y="500" textAnchor="middle" fontSize="96" fontWeight="800" fill="#160806" fontFamily="Bricolage Grotesque">B</text>
      <text x="320" y="640" textAnchor="middle" fontSize="40" fontWeight="700" fill="#5A3416" fontFamily="Bricolage Grotesque">brasa burger</text>
    </svg>
  );
};

// Olho que se abre, com íris de verdade e o hambúrguer refletido na pupila.
export const Eye: React.FC<{open: number; id: string}> = ({open, id}) => {
  const g = (n: string) => `${n}-${id}`;
  const lid = `M20 210 Q380 ${210 - 230 * open} 740 210 Q380 ${210 + 200 * open} 20 210 Z`;
  return (
    <svg width="760" height="420" viewBox="0 0 760 420" style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id={g('iris')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.35" stopColor="#3A1404" />
          <stop offset="0.55" stopColor="#B4520C" />
          <stop offset="0.85" stopColor="#FF9A2E" />
          <stop offset="1" stopColor="#5A2006" />
        </radialGradient>
        <radialGradient id={g('white')} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0.6" stopColor="#FFF8EE" />
          <stop offset="1" stopColor="#E8C9AE" />
        </radialGradient>
        <clipPath id={g('clip')}>
          <path d={lid} />
        </clipPath>
      </defs>
      <path d={lid} fill={`url(#${g('white')})`} />
      <g clipPath={`url(#${g('clip')})`}>
        <circle cx="380" cy="210" r="140" fill={`url(#${g('iris')})`} />
        {Array.from({length: 36}).map((_, i) => {
          const a = (i * Math.PI) / 18;
          return <line key={i} x1={380 + Math.cos(a) * 62} y1={210 + Math.sin(a) * 62} x2={380 + Math.cos(a) * 132} y2={210 + Math.sin(a) * 132} stroke="#FFB45A" strokeWidth="2" opacity="0.35" />;
        })}
        <circle cx="380" cy="210" r="62" fill="#0A0402" />
        <g transform="translate(343 178) scale(0.115)">
          <Burger w={640} id={g('eyeburger')} board={false} melt={0.3} />
        </g>
        <ellipse cx="430" cy="160" rx="26" ry="18" fill="#fff" opacity="0.85" />
      </g>
      <path d={`M20 210 Q380 ${210 - 230 * open} 740 210`} stroke="#160806" strokeWidth="12" fill="none" strokeLinecap="round" />
    </svg>
  );
};
