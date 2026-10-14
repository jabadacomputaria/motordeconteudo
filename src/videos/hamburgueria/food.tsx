// Desenhos do vídeo da hamburgueria: o hambúrguer em camadas, o queijo que escorre, a mordida,
// o mapa com o motoboy, o celular com o anúncio e o cadeado. Tudo depende só das props.
import React from 'react';

export const W = {
  bg: '#140C08',
  bg2: '#1E120B',
  cream: '#FFF4E6',
  muted: '#B49A86',
  orange: '#FF8A1F',
  ember: '#FF5A1F',
  cheese: '#FFC234',
  cheeseDark: '#F2A51A',
  bun: '#E29A45',
  bunDark: '#C9772E',
  bunBottom: '#D88A3D',
  meat: '#5B2D1C',
  meatDark: '#3A1A10',
  lettuce: '#5DBB3F',
  lettuceDark: '#3E9A2A',
  tomato: '#E5402F',
  tomatoIn: '#F26B5B',
  wood: '#6E4426',
  red: '#E5402F',
  green: '#3BB273',
  card: '#21150F',
  line: '#3A281D',
};

export type BurgerProps = {
  open?: number; // 0..1: pão de cima levantado
  meat?: number; // 0..1+: queda de cada camada (com mola, pode passar de 1)
  cheese?: number;
  salad?: number;
  top?: number; // queda do pão de cima de volta
  melt?: number; // 0..1.5: comprimento dos pingos do queijo
  bite?: number; // 0..1: mordida
  id: string;
  board?: boolean;
};

const drop = (p: number | undefined, h = 900) => (p === undefined ? 0 : -(1 - p) * h);

// Hambúrguer desenhado em SVG (viewBox 640×640). As camadas caem de cima até o lugar.
export const Burger: React.FC<BurgerProps & {w: number}> = ({w, open = 0, meat = 1, cheese = 1, salad = 1, top, melt = 0.4, bite = 0, id, board = true}) => {
  const topY = top === undefined ? -open * 330 : -(1 - top) * 330;
  const drips = [
    {x: 80, l: 70},
    {x: 190, l: 120},
    {x: 300, l: 60},
    {x: 420, l: 150},
    {x: 540, l: 90},
  ];
  const show = (p: number) => p > -0.2 && p !== 0;
  return (
    <svg width={w} height={w} viewBox="0 0 640 640" style={{overflow: 'visible', display: 'block'}}>
      <defs>
        <linearGradient id={`bun-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2B261" />
          <stop offset="0.55" stopColor={W.bun} />
          <stop offset="1" stopColor={W.bunDark} />
        </linearGradient>
        <linearGradient id={`cheese-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD45E" />
          <stop offset="1" stopColor={W.cheeseDark} />
        </linearGradient>
        <mask id={`bite-${id}`} maskUnits="userSpaceOnUse" x="-200" y="-1200" width="1040" height="2400">
          <rect x="-200" y="-1200" width="1040" height="2400" fill="#fff" />
          {bite > 0 ? (
            <g transform={`translate(${(1 - bite) * 160} 0)`}>
              <circle cx="600" cy="240" r="96" fill="#000" />
              <circle cx="630" cy="345" r="92" fill="#000" />
              <circle cx="606" cy="450" r="84" fill="#000" />
            </g>
          ) : null}
        </mask>
      </defs>
      {board ? <rect x="-10" y="560" width="660" height="40" rx="20" fill={W.wood} /> : null}
      <g mask={`url(#bite-${id})`}>
        {/* pão de baixo */}
        <path d="M40 470 H600 Q620 470 620 490 V520 Q620 560 580 560 H60 Q20 560 20 520 V490 Q20 470 40 470 Z" fill={W.bunBottom} />
        <rect x="30" y="470" width="580" height="14" rx="7" fill="#EDA552" />
        {/* carne */}
        {show(meat) ? (
          <g transform={`translate(0 ${drop(meat)})`}>
            <path d="M58 398 Q30 400 30 432 Q30 470 62 472 H578 Q610 470 610 432 Q610 400 582 398 Q560 392 540 398 Q500 390 470 397 Q430 390 400 398 Q360 391 320 398 Q280 390 240 397 Q200 391 170 398 Q130 391 100 397 Q80 392 58 398 Z" fill={W.meat} />
            {[120, 230, 340, 450].map((x) => (
              <path key={x} d={`M${x} 410 L${x + 60} 462`} stroke={W.meatDark} strokeWidth="9" strokeLinecap="round" opacity="0.7" />
            ))}
            {[90, 180, 270, 380, 500, 560].map((x, i) => (
              <circle key={x} cx={x} cy={420 + (i % 2) * 22} r="4" fill="#8A4A30" />
            ))}
          </g>
        ) : null}
        {/* queijo: fatia e pingos que crescem enquanto derrete */}
        {show(cheese) ? (
          <g transform={`translate(0 ${drop(cheese)})`}>
            <path d="M18 386 L622 386 L630 404 L10 404 Z" fill={`url(#cheese-${id})`} />
            {drips.map((d, i) => {
              const l = Math.max(0, d.l * melt);
              return <path key={i} d={`M${d.x - 26} 402 Q${d.x - 24} ${404 + l * 0.6} ${d.x - 6} ${404 + l} Q${d.x} ${410 + l} ${d.x + 6} ${404 + l} Q${d.x + 24} ${404 + l * 0.6} ${d.x + 26} 402 Z`} fill={W.cheese} />;
            })}
          </g>
        ) : null}
        {/* salada */}
        {show(salad) ? (
          <g transform={`translate(0 ${drop(salad)})`}>
            <path d="M14 384 Q40 350 70 380 Q100 346 132 380 Q164 348 196 380 Q228 346 260 380 Q292 348 324 380 Q356 346 388 380 Q420 348 452 380 Q484 346 516 380 Q548 348 580 380 Q610 352 628 384 Z" fill={W.lettuce} />
            <path d="M40 376 Q70 360 100 374 M200 372 Q230 356 262 372 M380 372 Q412 356 444 372 M520 374 Q552 358 584 374" stroke={W.lettuceDark} strokeWidth="5" fill="none" strokeLinecap="round" />
            {[150, 320, 490].map((x) => (
              <g key={x}>
                <ellipse cx={x} cy="352" rx="96" ry="22" fill={W.tomato} />
                <ellipse cx={x} cy="349" rx="70" ry="13" fill={W.tomatoIn} />
              </g>
            ))}
          </g>
        ) : null}
        {/* pão de cima com gergelim */}
        <g transform={`translate(0 ${topY})`}>
          <path d="M30 340 C 30 150, 610 150, 610 340 Q610 352 596 352 H44 Q30 352 30 340 Z" fill={`url(#bun-${id})`} />
          <path d="M120 230 C 200 180, 300 175, 360 180" stroke="#F7C680" strokeWidth="16" strokeLinecap="round" fill="none" opacity="0.6" />
          {[
            [170, 245, -20],
            [240, 210, 10],
            [320, 200, -5],
            [400, 212, 25],
            [470, 240, -15],
            [210, 280, 30],
            [300, 260, -30],
            [380, 268, 10],
            [450, 290, -10],
            [130, 300, 15],
            [520, 300, 20],
          ].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="11" ry="6" fill="#FFF1D6" transform={`rotate(${r} ${x} ${y})`} />
          ))}
        </g>
      </g>
    </svg>
  );
};

// Cadeado com a chave.
export const Lock: React.FC<{open: number; k: number; turn: number}> = ({open, k, turn}) => (
  <svg width="520" height="700" viewBox="0 0 520 700" style={{overflow: 'visible'}}>
    <path d={`M140 ${300 - open * 90} V190 A120 120 0 0 1 380 190 V${300 - open * 10}`} stroke="#E8C27A" strokeWidth="44" fill="none" strokeLinecap="round" transform={`rotate(${-open * 18} 380 300)`} />
    <rect x="60" y="280" width="400" height="330" rx="48" fill="#FFB547" />
    <rect x="60" y="280" width="400" height="60" rx="30" fill="#FFCB73" />
    <circle cx="260" cy="430" r="34" fill="#7A4A12" />
    <rect x="248" y="440" width="24" height="70" rx="10" fill="#7A4A12" />
    {/* chave entrando e girando */}
    <g transform={`translate(${(1 - k) * 520} 0) rotate(${turn * 90} 260 470)`} opacity={k > 0.01 ? 1 : 0}>
      <rect x="250" y="452" width="240" height="22" rx="8" fill="#F4F0E8" />
      <rect x="430" y="474" width="18" height="26" rx="4" fill="#F4F0E8" />
      <rect x="400" y="474" width="14" height="18" rx="4" fill="#F4F0E8" />
      <circle cx="520" cy="463" r="54" fill="none" stroke="#F4F0E8" strokeWidth="22" />
    </g>
  </svg>
);

// Olho que se abre (com o hambúrguer refletido na pupila).
export const Eye: React.FC<{open: number}> = ({open}) => (
  <svg width="760" height="420" viewBox="0 0 760 420" style={{overflow: 'visible'}}>
    <defs>
      <clipPath id="eye-clip">
        <path d={`M20 210 Q380 ${210 - 210 * open} 740 210 Q380 ${210 + 210 * open} 20 210 Z`} />
      </clipPath>
    </defs>
    <path d={`M20 210 Q380 ${210 - 210 * open} 740 210 Q380 ${210 + 210 * open} 20 210 Z`} fill={W.cream} />
    <g clipPath="url(#eye-clip)">
      <circle cx="380" cy="210" r="140" fill={W.orange} />
      <circle cx="380" cy="210" r="70" fill={W.bg} />
      <g transform="translate(345 182) scale(0.11)">
        <Burger w={640} id="eye" board={false} melt={0.3} />
      </g>
      <circle cx="420" cy="170" r="20" fill="#fff" opacity="0.8" />
    </g>
    <path d={`M20 210 Q380 ${210 - 210 * open} 740 210`} stroke={W.cream} strokeWidth="10" fill="none" strokeLinecap="round" />
  </svg>
);

// Motoboy de entrega (vira para o lado em que anda).
export const Moto: React.FC<{dir: number; t: number}> = ({dir, t}) => (
  <svg width="170" height="130" viewBox="0 0 170 130" style={{transform: `scaleX(${dir})`, overflow: 'visible'}}>
    <circle cx="38" cy="102" r="22" fill="#1A120D" stroke={W.cream} strokeWidth="6" />
    <circle cx="132" cy="102" r="22" fill="#1A120D" stroke={W.cream} strokeWidth="6" />
    <path d="M38 102 L70 70 H120 L132 102" stroke={W.cream} strokeWidth="10" fill="none" strokeLinejoin="round" />
    <rect x="18" y="26" width="58" height="52" rx="8" fill={W.orange} />
    <text x="47" y="62" textAnchor="middle" fontSize="26" fontWeight="800" fill={W.bg} fontFamily="Bricolage Grotesque">B</text>
    <path d="M84 70 L96 34 L118 34" stroke="#2E6BD9" strokeWidth="16" strokeLinecap="round" fill="none" />
    <circle cx="104" cy={22 + Math.sin(t * 20) * 1.5} r="18" fill={W.red} />
    <rect x="104" y="14" width="18" height="10" rx="4" fill="#1A120D" />
  </svg>
);
