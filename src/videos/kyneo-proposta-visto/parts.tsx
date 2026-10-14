// Peças de interface do vídeo "a proposta ficou no visto": celular, avatares, conversas, perfil, reel.
// A empresa de exemplo é a Solare Energia (energia solar para empresas); o cliente é a Marina, da Atlas.
// Tudo é desenhado em código e depende só das props (que vêm do frame). Nada de estado.
import React from 'react';
import {Img, staticFile} from 'remotion';

export type Pal = {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  trail: string;
  line: string;
  signal: string;
  screen: string;
  bubbleOut: string;
  bubbleIn: string;
  hair: string;
};

export type Fonts = {display: string; ui: string; mono: string};

export const SCREEN = {w: 572, h: 1212};
export const PHONE = {w: 600, h: 1240, bezel: 14, r: 92};

// Cores da empresa de exemplo (dentro do celular; o quadro do vídeo segue a Kyneo).
export const SOL = {
  orange: '#F28C28',
  yellow: '#FFC845',
  sky: '#5BB6E8',
  skyLight: '#BFE6F7',
  navy: '#1E3A5F',
  panel: '#24467A',
  green: '#3BB273',
  purple: '#6C5CE7',
  red: '#E5484D',
};

// ---------------------------------------------------------------------------------------------
// Ícones
export const Ticks: React.FC<{color: string; size?: number}> = ({color, size = 30}) => (
  <svg width={size * 1.45} height={size} viewBox="0 0 29 20" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 11l5 5L17 5" />
    <path d="M12 15l1 1L24 5" />
  </svg>
);

const Chevron: React.FC<{color: string}> = ({color}) => (
  <svg width="22" height="36" viewBox="0 0 11 18" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2L2 9l7 7" />
  </svg>
);

export const Heart: React.FC<{color: string; fill?: string; size?: number}> = ({color, fill = 'none', size = 50}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="1.9" strokeLinejoin="round">
    <path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.8 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.4 0 5.6 3.3 4.4 6.7C19.5 15.9 12 20.5 12 20.5z" />
  </svg>
);

const BubbleIcon: React.FC<{color: string; size?: number}> = ({color, size = 46}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinejoin="round">
    <path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.5z" />
  </svg>
);

const Plane: React.FC<{color: string; size?: number}> = ({color, size = 46}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinejoin="round">
    <path d="M21.5 3.5L10 14M21.5 3.5l-7 17-4.5-6.5L3 9.5z" />
  </svg>
);

export const ReelGlyph: React.FC<{color: string; size?: number}> = ({color, size = 22}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M10 8.8v6.4l5.2-3.2z" fill={color} />
  </svg>
);

// ---------------------------------------------------------------------------------------------
// Avatares: pessoas (ilustração simples) e logos de empresas.
type Person = {bg: string; skin: string; hair: string; shirt: string; style: 'long' | 'short' | 'bun' | 'curly'};
export const PEOPLE: Record<string, Person> = {
  marina: {bg: '#2FB5A8', skin: '#B9825E', hair: '#2A1B14', shirt: '#F4F4F2', style: 'long'},
  rafa: {bg: '#F2B640', skin: '#E8B996', hair: '#5A3A22', shirt: '#1E3A5F', style: 'short'},
  bia: {bg: '#E76F8E', skin: '#8D5A3B', hair: '#1B120D', shirt: '#F4F4F2', style: 'curly'},
  leo: {bg: '#7C8CF8', skin: '#F0C8A8', hair: '#C9A15B', shirt: '#2E2E33', style: 'bun'},
};

export const Avatar: React.FC<{who: keyof typeof PEOPLE; size: number}> = ({who, size}) => {
  const p = PEOPLE[who];
  const hair: Record<Person['style'], React.ReactNode> = {
    long: <path d="M28 46c0-16 9-26 22-26s22 10 22 26v26c-4 3-9 4-12 4V48c-6-2-14-6-20-12-2 6-3 10-3 16v24c-4 0-7-1-9-3z" fill={p.hair} />,
    short: <path d="M30 42c0-14 9-22 20-22s20 8 20 22c-4-6-10-9-20-9s-16 3-20 9z" fill={p.hair} />,
    bun: (
      <>
        <circle cx="50" cy="17" r="8" fill={p.hair} />
        <path d="M30 44c0-14 9-22 20-22s20 8 20 22c-5-7-11-10-20-10s-15 3-20 10z" fill={p.hair} />
      </>
    ),
    curly: <path d="M26 46c-4-14 6-28 24-28s28 14 24 28c-2-8-6-10-8-10 0 6-4 6-6 3-4 4-14 4-18 0-2 3-6 3-6-3-2 0-6 2-10 10z" fill={p.hair} />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{borderRadius: '50%', display: 'block', flexShrink: 0}}>
      <circle cx="50" cy="50" r="50" fill={p.bg} />
      <ellipse cx="50" cy="104" rx="36" ry="30" fill={p.shirt} />
      <rect x="43" y="56" width="14" height="16" rx="6" fill={p.skin} />
      <circle cx="50" cy="45" r="19" fill={p.skin} />
      {hair[p.style]}
    </svg>
  );
};

export type Logo = 'solare' | 'fotonix' | 'contab' | 'banco' | 'fornecedor';
export const CompanyLogo: React.FC<{kind: Logo; size: number}> = ({kind, size}) => {
  const bg = {solare: SOL.orange, fotonix: SOL.purple, contab: SOL.green, banco: '#2D6CDF', fornecedor: '#8D6E63'}[kind];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{display: 'block', flexShrink: 0}}>
      <circle cx="50" cy="50" r="50" fill={bg} />
      {kind === 'solare' ? (
        <g stroke="#fff" strokeWidth="5" strokeLinecap="round">
          <circle cx="50" cy="50" r="13" fill="#fff" stroke="none" />
          {Array.from({length: 8}).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={50 + Math.cos(a) * 20} y1={50 + Math.sin(a) * 20} x2={50 + Math.cos(a) * 29} y2={50 + Math.sin(a) * 29} />;
          })}
        </g>
      ) : null}
      {kind === 'fotonix' ? <path d="M50 24l22 13v26L50 76 28 63V37z M50 42a8 8 0 1 0 0.01 0z" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" /> : null}
      {kind === 'contab' ? (
        <g fill="#fff">
          <rect x="30" y="52" width="10" height="18" rx="2" />
          <rect x="45" y="40" width="10" height="30" rx="2" />
          <rect x="60" y="30" width="10" height="40" rx="2" />
        </g>
      ) : null}
      {kind === 'banco' ? (
        <g fill="#fff">
          <path d="M26 42L50 28l24 14z" />
          <rect x="30" y="46" width="7" height="20" />
          <rect x="46" y="46" width="7" height="20" />
          <rect x="62" y="46" width="7" height="20" />
          <rect x="26" y="68" width="48" height="6" />
        </g>
      ) : null}
      {kind === 'fornecedor' ? (
        <g fill="#fff">
          <rect x="24" y="38" width="34" height="24" rx="3" />
          <path d="M58 44h10l8 9v9H58z" />
          <circle cx="34" cy="66" r="6" />
          <circle cx="66" cy="66" r="6" />
        </g>
      ) : null}
    </svg>
  );
};

// ---------------------------------------------------------------------------------------------
// O aparelho: moldura com aro metálico, ilha no topo e reflexo de vidro que acompanha o giro.
export const Phone: React.FC<{p: Pal; fonts: Fonts; time: string; ry: number; children: React.ReactNode; tone?: 'dark' | 'silver'}> = ({p, fonts, time, ry, children, tone = 'dark'}) => {
  const rim = tone === 'silver' ? `linear-gradient(135deg, ${p.line}, ${p.trail} 40%, ${p.muted} 70%, ${p.trail})` : `linear-gradient(135deg, ${p.trail}, #26282B 35%, ${p.trail} 65%, #26282B)`;
  const sheen = 0.5 + ry / 40;
  return (
    <div style={{width: PHONE.w, height: PHONE.h, borderRadius: PHONE.r, background: rim, padding: 3, boxSizing: 'border-box', boxShadow: '0 60px 120px rgba(0,0,0,0.65)'}}>
      <div style={{width: '100%', height: '100%', borderRadius: PHONE.r - 3, background: '#060607', padding: PHONE.bezel - 3, boxSizing: 'border-box'}}>
        <div style={{position: 'relative', width: SCREEN.w, height: SCREEN.h, borderRadius: PHONE.r - PHONE.bezel, overflow: 'hidden', background: p.screen}}>
          {children}
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 46px 0'}}>
            <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 24, color: p.ink}}>{time}</div>
            <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
              {[8, 12, 16, 20].map((h) => (
                <div key={h} style={{width: 5, height: h * 0.8, borderRadius: 2, background: p.ink}} />
              ))}
              <div style={{width: 40, height: 20, borderRadius: 6, border: `2px solid ${p.muted}`, marginLeft: 8, padding: 2, boxSizing: 'border-box'}}>
                <div style={{width: '70%', height: '100%', borderRadius: 3, background: p.ink}} />
              </div>
            </div>
          </div>
          <div style={{position: 'absolute', left: SCREEN.w / 2 - 72, top: 14, width: 144, height: 40, borderRadius: 20, background: '#000'}} />
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${sheen * 100 - 22}%, rgba(255,255,255,0.055) ${sheen * 100 - 8}%, transparent ${sheen * 100 + 6}%)`, pointerEvents: 'none'}} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// Conversas
export const PdfBubble: React.FC<{p: Pal; fonts: Fonts; ticksBlue: number; ticksPop?: number; time?: string; side?: 'out' | 'in'}> = ({p, fonts, ticksBlue, ticksPop = 0, time = '21:14', side = 'out'}) => (
  <div style={{width: 430, borderRadius: 30, background: side === 'out' ? p.bubbleOut : p.bubbleIn, padding: 16, boxSizing: 'border-box'}}>
    <div style={{display: 'flex', gap: 18, alignItems: 'center', background: 'rgba(0,0,0,0.28)', borderRadius: 20, padding: 16}}>
      <div style={{width: 66, height: 82, borderRadius: 10, background: SOL.red, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10, boxSizing: 'border-box', flexShrink: 0}}>
        <div style={{fontFamily: fonts.mono, fontSize: 18, color: '#fff'}}>PDF</div>
      </div>
      <div style={{minWidth: 0}}>
        <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 25, color: p.ink, whiteSpace: 'nowrap'}}>Proposta_comercial.pdf</div>
        <div style={{fontFamily: fonts.ui, fontWeight: 400, fontSize: 21, color: p.muted, marginTop: 6}}>12 páginas · 2,4 MB</div>
      </div>
    </div>
    <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 10, paddingRight: 4}}>
      <div style={{fontFamily: fonts.mono, fontSize: 19, color: p.muted}}>{time}</div>
      {side === 'out' ? (
        <div style={{position: 'relative', width: 30 * 1.45, height: 30, transform: `scale(${1 + ticksPop * 0.5})`, transformOrigin: '50% 60%'}}>
          <div style={{position: 'absolute', inset: 0}}>
            <Ticks color={p.muted} />
          </div>
          <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - ticksBlue) * 100}% 0 0)`}}>
            <Ticks color={p.signal} />
          </div>
        </div>
      ) : null}
    </div>
  </div>
);

const ChatHeader: React.FC<{p: Pal; fonts: Fonts; name: string; avatar: React.ReactNode; status: string}> = ({p, fonts, name, avatar, status}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 62, height: 104, display: 'flex', alignItems: 'center', gap: 18, padding: '0 28px', borderBottom: `1px solid ${p.hair}`, background: p.screen}}>
    <Chevron color={p.ink} />
    {avatar}
    <div>
      <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 30, color: p.ink}}>{name}</div>
      <div style={{fontFamily: fonts.ui, fontWeight: 400, fontSize: 21, color: p.muted, marginTop: 2, whiteSpace: 'nowrap'}}>{status}</div>
    </div>
  </div>
);

const Composer: React.FC<{p: Pal; fonts: Fonts; text?: string; caret?: boolean; send?: number}> = ({p, fonts, text = '', caret = false, send = 0}) => (
  <div style={{position: 'absolute', left: 20, right: 20, bottom: 34, display: 'flex', gap: 14, alignItems: 'flex-end'}}>
    <div style={{flex: 1, minHeight: 74, borderRadius: 37, background: p.bubbleIn, border: `1px solid ${p.hair}`, padding: '20px 28px', boxSizing: 'border-box', fontFamily: fonts.ui, fontSize: 26, color: text ? p.ink : p.muted, lineHeight: 1.3}}>
      {text || 'Mensagem'}
      {caret ? <span style={{display: 'inline-block', width: 3, height: 30, background: p.signal, marginLeft: 3, verticalAlign: -6}} /> : null}
    </div>
    <div style={{width: 74, height: 74, borderRadius: 37, background: send > 0 ? p.signal : p.bubbleIn, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - send * 0.15})`, flexShrink: 0}}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={send > 0 ? p.bg : p.muted} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
      </svg>
    </div>
  </div>
);

const DayChip: React.FC<{p: Pal; fonts: Fonts; label: string; y: number}> = ({p, fonts, label, y}) => (
  <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{fontFamily: fonts.ui, fontWeight: 500, fontSize: 20, color: p.muted, background: p.bubbleIn, borderRadius: 14, padding: '8px 18px'}}>{label}</div>
  </div>
);

export const REPLY = 'Vi os vídeos de vocês. Podemos marcar uma conversa?';

export type ChatAState = {status: string; dayChip: string; ticksBlue: number; ticksPop: number; reply: number};

// Conversa no celular da Solare (quem mandou a proposta).
export const ChatA: React.FC<{p: Pal; fonts: Fonts; s: ChatAState}> = ({p, fonts, s}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <ChatHeader p={p} fonts={fonts} name="Marina · Atlas" avatar={<Avatar who="marina" size={64} />} status={s.status} />
    <DayChip p={p} fonts={fonts} label={s.dayChip} y={330} />
    <div style={{position: 'absolute', right: 22, top: 400}}>
      <PdfBubble p={p} fonts={fonts} ticksBlue={s.ticksBlue} ticksPop={s.ticksPop} />
    </div>
    {s.reply > 0.001 ? (
      <div style={{position: 'absolute', left: 22, top: 640, display: 'flex', gap: 12, alignItems: 'flex-end', transform: `translateY(${(1 - s.reply) * 60}px) scale(${0.85 + 0.15 * s.reply})`, transformOrigin: '0% 100%'}}>
        <Avatar who="marina" size={44} />
        <div style={{width: 400, borderRadius: 30, background: p.bubbleIn, border: `1px solid ${p.hair}`, padding: '22px 26px', boxSizing: 'border-box'}}>
          <div style={{fontFamily: fonts.ui, fontWeight: 500, fontSize: 28, color: p.ink, lineHeight: 1.3}}>{REPLY}</div>
          <div style={{fontFamily: fonts.mono, fontSize: 19, color: p.muted, textAlign: 'right', marginTop: 8}}>09:02</div>
        </div>
      </div>
    ) : null}
    <Composer p={p} fonts={fonts} />
  </div>
);

// Conversa no celular da Marina (ela digita a resposta).
export const ChatB: React.FC<{p: Pal; fonts: Fonts; typed: string; caret: boolean; send: number; sent: number}> = ({p, fonts, typed, caret, send, sent}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <ChatHeader p={p} fonts={fonts} name="Solare Energia" avatar={<CompanyLogo kind="solare" size={64} />} status="online" />
    <DayChip p={p} fonts={fonts} label="Ontem" y={330} />
    <div style={{position: 'absolute', left: 22, top: 400}}>
      <PdfBubble p={p} fonts={fonts} ticksBlue={0} side="in" />
    </div>
    {sent > 0.001 ? (
      <div style={{position: 'absolute', right: 22, top: 640, transform: `translateY(${(1 - sent) * 380}px)`}}>
        <div style={{width: 430, borderRadius: 30, background: p.bubbleOut, padding: '22px 26px', boxSizing: 'border-box'}}>
          <div style={{fontFamily: fonts.ui, fontWeight: 500, fontSize: 28, color: p.ink, lineHeight: 1.3}}>{REPLY}</div>
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center', marginTop: 8}}>
            <div style={{fontFamily: fonts.mono, fontSize: 19, color: p.muted}}>09:02</div>
            <Ticks color={p.signal} size={24} />
          </div>
        </div>
      </div>
    ) : null}
    <Composer p={p} fonts={fonts} text={sent > 0.001 ? '' : typed} caret={caret} send={send} />
  </div>
);

// ---------------------------------------------------------------------------------------------
// Perfil da Solare no Instagram (genérico, sem marca do app), com posts que têm cara de empresa real.
export const GRID = {top: 600, tile: 189, gap: 2};
export const tileRect = (i: number) => ({x: (i % 3) * (GRID.tile + GRID.gap), y: GRID.top + Math.floor(i / 3) * (GRID.tile + GRID.gap), w: GRID.tile, h: GRID.tile});

export const Profile: React.FC<{p: Pal; fonts: Fonts; posts: string; renderTile: (i: number) => React.ReactNode}> = ({p, fonts, posts, renderTile}) => {
  const stat = (n: string, label: string) => (
    <div style={{textAlign: 'center'}}>
      <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 32, color: p.ink}}>{n}</div>
      <div style={{fontFamily: fonts.ui, fontWeight: 400, fontSize: 21, color: p.muted, marginTop: 2}}>{label}</div>
    </div>
  );
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 30, right: 30, top: 84, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 34, color: p.ink}}>solare.energia</div>
        <div style={{display: 'flex', gap: 10}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{width: 7, height: 7, borderRadius: 4, background: p.ink}} />
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 160, display: 'flex', alignItems: 'center', gap: 36}}>
        <div style={{padding: 5, borderRadius: '50%', border: `3px solid ${p.trail}`}}>
          <CompanyLogo kind="solare" size={136} />
        </div>
        <div style={{flex: 1, display: 'flex', justifyContent: 'space-between'}}>
          {stat(posts, 'posts')}
          {stat('212', 'seguidores')}
          {stat('180', 'seguindo')}
        </div>
      </div>
      <div style={{position: 'absolute', left: 30, top: 336, fontFamily: fonts.ui, fontWeight: 600, fontSize: 27, color: p.ink}}>Solare Energia</div>
      <div style={{position: 'absolute', left: 30, top: 372, fontFamily: fonts.ui, fontWeight: 400, fontSize: 22, color: p.muted}}>Energia solar para empresas</div>
      <div style={{position: 'absolute', left: 30, top: 402, fontFamily: fonts.ui, fontWeight: 400, fontSize: 22, color: p.ink}}>Projetos para indústria e comércio ☀</div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 450, display: 'flex', gap: 12}}>
        {['Seguir', 'Mensagem'].map((t, i) => (
          <div key={t} style={{flex: 1, height: 58, borderRadius: 14, background: i === 0 ? '#3B82F6' : p.bubbleIn, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.ui, fontWeight: 600, fontSize: 23, color: p.ink}}>{t}</div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 538, height: 58, display: 'flex', borderBottom: `1px solid ${p.hair}`}}>
        <div style={{flex: 1, borderBottom: `2px solid ${p.ink}`}} />
        <div style={{flex: 1}} />
        <div style={{flex: 1}} />
      </div>
      {Array.from({length: 9}).map((_, i) => {
        const r = tileRect(i);
        return (
          <div key={i} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden'}}>
            {renderTile(i)}
          </div>
        );
      })}
    </div>
  );
};

// Posts antigos da Solare: ilustrações coloridas desenhadas em código (189×189).
export const SolarePost: React.FC<{i: number; fonts: Fonts}> = ({i, fonts}) => {
  const W = 189;
  const roofPanels = (x: number, y: number, cols: number, rows: number, cw: number, ch: number, skew = 10) => (
    <g>
      {Array.from({length: cols * rows}).map((_, k) => {
        const cx = x + (k % cols) * cw + Math.floor(k / cols) * skew;
        const cy = y + Math.floor(k / cols) * ch;
        return <rect key={k} x={cx} y={cy} width={cw - 3} height={ch - 3} fill={SOL.panel} stroke="#6FA8DC" strokeWidth="1" transform={`skewX(${-skew})`} />;
      })}
    </g>
  );
  const label = (t: string, bg: string, color = '#fff') => (
    <g>
      <rect x="0" y={W - 40} width={W} height="40" fill={bg} />
      <text x="12" y={W - 13} fontFamily={fonts.ui} fontWeight={600} fontSize="20" fill={color}>
        {t}
      </text>
    </g>
  );
  let art: React.ReactNode = null;
  if (i === 0)
    art = (
      <>
        <rect width={W} height={W} fill={SOL.skyLight} />
        <rect width={W} height="100" fill={SOL.sky} />
        <circle cx="150" cy="38" r="20" fill={SOL.yellow} />
        <path d="M10 150 L60 92 L180 92 L180 150 Z" fill="#2B2E35" />
        {roofPanels(66, 98, 5, 2, 22, 22, 6)}
        {label('USINA 75 kWp', SOL.orange)}
      </>
    );
  if (i === 1)
    art = (
      <>
        <rect width={W} height={W} fill={SOL.orange} />
        <circle cx="140" cy="50" r="26" fill={SOL.yellow} />
        <text x="14" y="104" fontFamily={fonts.display} fontWeight={600} fontSize="40" fill="#fff">
          DICA
        </text>
        <text x="14" y="136" fontFamily={fonts.ui} fontWeight={600} fontSize="19" fill="#fff">
          Limpe os painéis
        </text>
        <text x="14" y="160" fontFamily={fonts.ui} fontWeight={600} fontSize="19" fill="#fff">
          2x por ano
        </text>
      </>
    );
  if (i === 2)
    art = (
      <>
        <rect width={W} height={W} fill="#8FD3F2" />
        <rect y="120" width={W} height="69" fill={SOL.green} />
        {roofPanels(20, 70, 6, 2, 26, 24, 0)}
        {[50, 120].map((x, k) => (
          <g key={k}>
            <rect x={x - 14} y="128" width="28" height="44" rx="10" fill={k ? SOL.orange : SOL.navy} />
            <circle cx={x} cy="116" r="12" fill={k ? '#8D5A3B' : '#E8B996'} />
            <path d={`M${x - 15} 112 a15 13 0 0 1 30 0 z`} fill={SOL.yellow} />
          </g>
        ))}
      </>
    );
  if (i === 3)
    art = (
      <>
        <rect width={W} height={W} fill={SOL.navy} />
        <g transform="translate(-20 30) rotate(-12)">{roofPanels(10, 20, 6, 5, 36, 30, 0)}</g>
        <path d="M0 0 L189 0 L189 40 L0 120 Z" fill="#fff" opacity="0.12" />
      </>
    );
  if (i === 4)
    art = (
      <>
        <rect width={W} height={W} fill="#EAF4FA" />
        <rect x="18" y="70" width="120" height="66" rx="10" fill="#fff" stroke="#C9D6E0" strokeWidth="2" />
        <path d="M138 84 h22 l18 22 v30 h-40 z" fill="#fff" stroke="#C9D6E0" strokeWidth="2" />
        <rect x="18" y="108" width="160" height="10" fill={SOL.orange} />
        <circle cx="62" cy="88" r="11" fill={SOL.yellow} />
        <circle cx="48" cy="140" r="13" fill="#2B2E35" />
        <circle cx="150" cy="140" r="13" fill="#2B2E35" />
        {label('Equipe a caminho', SOL.navy)}
      </>
    );
  if (i === 5)
    art = (
      <>
        <rect width={W} height={W} fill={SOL.yellow} />
        <rect x="34" y="26" width="90" height="120" rx="8" fill="#fff" />
        {[48, 64, 80, 96].map((y, k) => (
          <rect key={k} x="46" y={y} width={k % 2 ? 50 : 66} height="7" rx="3" fill="#C9C2A8" />
        ))}
        <path d="M150 60 v60 m-16 -16 l16 16 l16 -16" stroke={SOL.green} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {label('Conta menor', SOL.navy)}
      </>
    );
  if (i === 6)
    art = (
      <>
        <rect width={W} height={W} fill="#7B4BA0" />
        <rect width={W} height="110" fill="#F7934C" />
        <circle cx="94" cy="110" r="34" fill={SOL.yellow} />
        <rect y="110" width={W} height="79" fill="#3A2350" />
        {[124, 146, 168].map((y, k) => (
          <rect key={k} x={-10 + k * 6} y={y} width={W + 20} height="12" fill="#1B1230" transform={`skewX(-20)`} />
        ))}
      </>
    );
  if (i === 7)
    art = (
      <>
        <rect width={W} height={W} fill={SOL.navy} />
        <g transform="translate(57 34) scale(0.75)">
          <CompanyLogoInline />
        </g>
        <text x="94" y="160" textAnchor="middle" fontFamily={fonts.display} fontWeight={600} fontSize="26" fill="#fff">
          Solare
        </text>
      </>
    );
  if (i === 8)
    art = (
      <>
        <rect width={W} height={W} fill="#D9E2EA" />
        <path d="M0 150 L50 96 L189 96 L189 150 Z" fill="#8A97A6" />
        {roofPanels(58, 102, 3, 2, 26, 22, 6)}
        <rect x="120" y="40" width="6" height="60" fill={SOL.orange} />
        <rect x="80" y="40" width="80" height="6" fill={SOL.orange} />
        {label('Em obra', SOL.orange)}
      </>
    );
  return (
    <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} style={{display: 'block'}}>
      {art}
    </svg>
  );
};

// Logo da Solare como grupo SVG (para usar dentro de outro <svg>).
const CompanyLogoInline: React.FC = () => (
  <g>
    <circle cx="50" cy="50" r="50" fill={SOL.orange} />
    <circle cx="50" cy="50" r="13" fill="#fff" />
    <g stroke="#fff" strokeWidth="5" strokeLinecap="round">
      {Array.from({length: 8}).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return <line key={i} x1={50 + Math.cos(a) * 20} y1={50 + Math.sin(a) * 20} x2={50 + Math.cos(a) * 29} y2={50 + Math.sin(a) * 29} />;
      })}
    </g>
  </g>
);

// Quadrado em branco: o lugar do conteúdo que ninguém fez.
export const BlankTile: React.FC<{p: Pal}> = ({p}) => <div style={{position: 'absolute', inset: 8, borderRadius: 6, border: `2px dashed ${p.trail}`}} />;

// ---------------------------------------------------------------------------------------------
// Miniaturas das cenas deste vídeo (as peças que a Kyneo fez e que enchem o perfil).
export const MiniTile: React.FC<{p: Pal; fonts: Fonts; i: number}> = ({p, fonts, i}) => {
  const box: React.CSSProperties = {position: 'absolute', inset: 0, background: p.bg, overflow: 'hidden'};
  const word = (t: string, size: number, color = p.ink) => (
    <div style={{...box, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{color, fontFamily: fonts.display, fontWeight: 600, fontSize: size, letterSpacing: -0.5}}>{t}</div>
    </div>
  );
  let content: React.ReactNode = null;
  if (i === 0)
    content = (
      <div style={box}>
        <div style={{position: 'absolute', left: 14, top: 52, transform: 'scale(0.38)', transformOrigin: '0 0'}}>
          <PdfBubble p={p} fonts={fonts} ticksBlue={1} />
        </div>
      </div>
    );
  if (i === 1)
    content = (
      <div style={{...box, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: 92, height: 108, borderRadius: 8, background: p.ink, transform: 'rotate(-8deg)', textAlign: 'center', paddingTop: 30, boxSizing: 'border-box'}}>
          <div style={{fontFamily: fonts.display, fontWeight: 600, fontSize: 24, color: p.bg}}>MAR</div>
        </div>
      </div>
    );
  if (i === 2)
    content = (
      <div style={{...box, background: '#EDEBE6', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{border: `4px solid ${SOL.red}`, color: SOL.red, fontFamily: fonts.display, fontWeight: 600, fontSize: 20, padding: '6px 8px', transform: 'rotate(-12deg)'}}>FECHADO</div>
      </div>
    );
  if (i === 3)
    content = (
      <div style={{...box, padding: 26, boxSizing: 'border-box'}}>
        {[1, 1, 1, 0].map((c, k) => (
          <div key={k} style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14}}>
            <div style={{width: 22, height: 22, borderRadius: 5, border: `2px solid ${c ? p.muted : p.ink}`, background: c ? p.muted : 'transparent'}} />
            <div style={{height: 9, width: 80 - k * 8, borderRadius: 5, background: c ? p.trail : p.ink}} />
          </div>
        ))}
      </div>
    );
  if (i === 4)
    content = (
      <div style={{...box, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={staticFile('kyneo-proposta-visto/simbolo.svg')} style={{width: 120, height: 120}} />
      </div>
    );
  if (i === 5)
    content = (
      <div style={{...box, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Clapper p={p} fonts={fonts} w={150} open={0} cut={1} />
      </div>
    );
  if (i === 6) content = word('PERFIL', 34);
  if (i === 7)
    content = (
      <div style={{...box, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <FilmReel p={p} size={130} angle={20} />
      </div>
    );
  if (i === 8)
    content = (
      <div style={box}>
        <svg width="189" height="189" viewBox="0 0 189 189" fill="none">
          <path d="M30 150 C 70 150, 80 40, 160 40" stroke={p.line} strokeWidth="4" />
          <path d="M30 150 L 70 150 M160 40 L 120 40" stroke={p.trail} strokeWidth="2" />
          <rect x="23" y="143" width="14" height="14" fill={p.ink} transform="rotate(45 30 150)" />
          <rect x="153" y="33" width="14" height="14" fill={p.ink} transform="rotate(45 160 40)" />
          <circle cx="70" cy="150" r="5" fill={p.muted} />
          <circle cx="120" cy="40" r="5" fill={p.muted} />
        </svg>
      </div>
    );
  return (
    <>
      {content}
      <div style={{position: 'absolute', right: 10, top: 10}}>
        <ReelGlyph color={i === 2 ? '#2B2E35' : p.ink} />
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// Cinema: claquete e bobina de filme.
export const Clapper: React.FC<{p: Pal; fonts: Fonts; w: number; open: number; cut: number; split?: number}> = ({p, fonts, w, open, cut, split = 0}) => {
  const k = w / 760;
  const stripes = (
    <svg width="760" height="96" viewBox="0 0 760 96" style={{display: 'block'}}>
      <rect width="760" height="96" rx="10" fill={p.ink} />
      {Array.from({length: 9}).map((_, i) => (
        <path key={i} d={`M${i * 92 - 20} 96 L${i * 92 + 30} 0 L${i * 92 + 76} 0 L${i * 92 + 26} 96 Z`} fill="#141416" />
      ))}
    </svg>
  );
  const price = (clip: string, dx: number, dy: number) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, clipPath: clip, transform: `translate(${dx}px, ${dy}px)`}}>
      <div style={{fontFamily: fonts.mono, fontSize: 124, color: cut > 0.99 && split > 0 ? p.muted : p.ink, letterSpacing: -4, textAlign: 'center', lineHeight: '190px', whiteSpace: 'nowrap'}}>R$ 8.500</div>
    </div>
  );
  return (
    <div style={{position: 'relative', width: w, height: 640 * k}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 760, transform: `scale(${k})`, transformOrigin: '0 0'}}>
      <div style={{transformOrigin: '18px 96px', transform: `rotate(${-open * 24}deg)`}}>{stripes}</div>
      <div style={{marginTop: 8}}>{stripes}</div>
      <div style={{position: 'relative', marginTop: 8, height: 424, borderRadius: 18, background: '#1A1B1D', border: `3px solid ${p.trail}`, padding: '30px 40px', boxSizing: 'border-box'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: fonts.mono, fontSize: 30, color: p.muted}}>
          <span>PRODUTORA</span>
          <span>CENA 1 · TAKE 1</span>
        </div>
        <div style={{height: 2, background: p.trail, marginTop: 20}} />
        <div style={{fontFamily: fonts.mono, fontSize: 30, color: p.muted, marginTop: 22}}>1 VÍDEO INSTITUCIONAL</div>
        <div style={{position: 'relative', height: 190, marginTop: 24}}>
          {split > 0 ? (
            <>
              {price('polygon(0 0, 100% 0, 100% 38%, 0 62%)', -14 * split, -10 * split)}
              {price('polygon(0 62%, 100% 38%, 100% 100%, 0 100%)', 14 * split, 10 * split)}
            </>
          ) : (
            price('none', 0, 0)
          )}
          <svg style={{position: 'absolute', left: -20, top: 0}} width="720" height="190" viewBox="0 0 720 190">
            <line x1="0" y1="118" x2={720 * cut} y2={118 - 46 * cut} stroke={p.ink} strokeWidth="9" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
    </div>
  );
};

export const FilmReel: React.FC<{p: Pal; size: number; angle: number; stroke?: string; opacity?: number}> = ({p, size, angle, stroke, opacity = 1}) => {
  const c = stroke ?? p.line;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={{opacity}}>
      <g transform={`rotate(${angle} 100 100)`} stroke={c} strokeWidth="4">
        <circle cx="100" cy="100" r="94" />
        <circle cx="100" cy="100" r="16" />
        {Array.from({length: 6}).map((_, i) => {
          const a = (i * Math.PI) / 3;
          return <circle key={i} cx={100 + Math.cos(a) * 54} cy={100 + Math.sin(a) * 54} r="24" />;
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------------------------
// Reel aberto em tela cheia: o símbolo com rastro e a curva de animação tocando.
export const ReelView: React.FC<{p: Pal; fonts: Fonts; t: number; progress: number; like: number}> = ({p, fonts, t, progress, like}) => {
  const swing = Math.sin(t * 2.4);
  return (
    <div style={{position: 'absolute', inset: 0, background: p.bg}}>
      <div style={{position: 'absolute', left: 24, right: 24, top: 76, height: 5, borderRadius: 3, background: p.trail}}>
        <div style={{width: `${progress * 100}%`, height: '100%', borderRadius: 3, background: p.ink}} />
      </div>
      <svg style={{position: 'absolute', left: 0, top: 300}} width={SCREEN.w} height="520" viewBox={`0 0 ${SCREEN.w} 520`} fill="none">
        <path d={`M60 420 C ${200 + swing * 40} 420, ${330 - swing * 40} 100, 512 100`} stroke={p.line} strokeWidth="5" strokeDasharray="900" strokeDashoffset={900 * (1 - Math.min(1, t / 0.9))} />
        <path d={`M60 420 L ${200 + swing * 40} 420 M512 100 L ${330 - swing * 40} 100`} stroke={p.trail} strokeWidth="3" />
        <rect x="50" y="410" width="20" height="20" fill={p.ink} transform="rotate(45 60 420)" />
        <rect x="502" y="90" width="20" height="20" fill={p.ink} transform="rotate(45 512 100)" />
        <circle cx={200 + swing * 40} cy="420" r="8" fill={p.muted} />
        <circle cx={330 - swing * 40} cy="100" r="8" fill={p.muted} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center'}}>
        <Img src={staticFile('kyneo-proposta-visto/simbolo.svg')} style={{width: 300, height: 300, transform: `translateX(${swing * 26}px)`}} />
      </div>
      <div style={{position: 'absolute', right: 26, top: 640, display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'center'}}>
        <div style={{transform: `scale(${1 + like * 0.35 * Math.max(0, 1 - like)})`}}>
          <Heart color={like > 0.5 ? SOL.red : p.ink} fill={like > 0.5 ? SOL.red : 'none'} />
        </div>
        <BubbleIcon color={p.ink} />
        <Plane color={p.ink} />
      </div>
      <div style={{position: 'absolute', left: 28, bottom: 120, display: 'flex', alignItems: 'center', gap: 14}}>
        <CompanyLogo kind="solare" size={56} />
        <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 26, color: p.ink}}>solare.energia</div>
      </div>
    </div>
  );
};
