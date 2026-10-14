// Peças de interface do vídeo "a proposta ficou no visto": celular, conversas, perfil, reel.
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
  screen: string; // fundo da tela do celular
  bubbleOut: string; // balão enviado
  bubbleIn: string; // balão recebido
  tile: string; // post antigo
  hair: string; // linhas finas
};

export type Fonts = {display: string; ui: string; mono: string};

export const SCREEN = {w: 572, h: 1212};
export const PHONE = {w: 600, h: 1240, bezel: 14, r: 92};

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

const Bubble: React.FC<{color: string; size?: number}> = ({color, size = 46}) => (
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
// O aparelho: moldura grafite com aro prata, ilha no topo e um reflexo de vidro que acompanha o giro.
export const Phone: React.FC<{p: Pal; fonts: Fonts; time: string; ry: number; children: React.ReactNode; tone?: 'dark' | 'silver'}> = ({p, fonts, time, ry, children, tone = 'dark'}) => {
  const rim = tone === 'silver' ? `linear-gradient(135deg, ${p.line}, ${p.trail} 40%, ${p.muted} 70%, ${p.trail})` : `linear-gradient(135deg, ${p.trail}, #26282B 35%, ${p.trail} 65%, #26282B)`;
  const sheen = 0.5 + ry / 40; // posição do reflexo conforme o giro
  return (
    <div style={{width: PHONE.w, height: PHONE.h, borderRadius: PHONE.r, background: rim, padding: 3, boxSizing: 'border-box'}}>
      <div style={{width: '100%', height: '100%', borderRadius: PHONE.r - 3, background: '#060607', padding: PHONE.bezel - 3, boxSizing: 'border-box'}}>
        <div style={{position: 'relative', width: SCREEN.w, height: SCREEN.h, borderRadius: PHONE.r - PHONE.bezel, overflow: 'hidden', background: p.screen}}>
          {children}
          {/* Barra de status */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 46px 0'}}>
            <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 24, color: p.ink, letterSpacing: 0.2}}>{time}</div>
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
          {/* Reflexo do vidro (material, não brilho de interface) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(115deg, transparent ${sheen * 100 - 22}%, rgba(255,255,255,0.055) ${sheen * 100 - 8}%, transparent ${sheen * 100 + 6}%)`,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// Conversa no celular de quem enviou a proposta (o seu).
export type ChatAState = {
  status: string; // linha embaixo do nome
  dayChip: string;
  ticksBlue: number; // 0..1
  ticksPop: number; // escala extra do tique
  reply: number; // 0..1 entrada da resposta
};

export const PdfBubble: React.FC<{p: Pal; fonts: Fonts; ticksBlue: number; ticksPop?: number; time?: string; side?: 'out' | 'in'}> = ({p, fonts, ticksBlue, ticksPop = 0, time = '21:14', side = 'out'}) => (
  <div style={{width: 430, borderRadius: 30, background: side === 'out' ? p.bubbleOut : p.bubbleIn, padding: 16, boxSizing: 'border-box'}}>
    <div style={{display: 'flex', gap: 18, alignItems: 'center', background: 'rgba(0,0,0,0.28)', borderRadius: 20, padding: 16}}>
      <div style={{width: 66, height: 82, borderRadius: 10, background: p.ink, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10, boxSizing: 'border-box', flexShrink: 0}}>
        <div style={{fontFamily: fonts.mono, fontSize: 18, color: p.bg, fontWeight: 400}}>PDF</div>
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

const ChatHeader: React.FC<{p: Pal; fonts: Fonts; name: string; initial: string; status: string}> = ({p, fonts, name, initial, status}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 62, height: 104, display: 'flex', alignItems: 'center', gap: 18, padding: '0 28px', borderBottom: `1px solid ${p.hair}`, background: p.screen}}>
    <Chevron color={p.ink} />
    <div style={{width: 64, height: 64, borderRadius: 32, background: p.trail, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.ui, fontWeight: 600, fontSize: 28, color: p.ink}}>{initial}</div>
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

export const ChatA: React.FC<{p: Pal; fonts: Fonts; s: ChatAState}> = ({p, fonts, s}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <ChatHeader p={p} fonts={fonts} name="Cliente" initial="C" status={s.status} />
    <DayChip p={p} fonts={fonts} label={s.dayChip} y={330} />
    <div style={{position: 'absolute', right: 22, top: 400}}>
      <PdfBubble p={p} fonts={fonts} ticksBlue={s.ticksBlue} ticksPop={s.ticksPop} />
    </div>
    {s.reply > 0.001 ? (
      <div style={{position: 'absolute', left: 22, top: 640, transform: `translateY(${(1 - s.reply) * 60}px) scale(${0.85 + 0.15 * s.reply})`, transformOrigin: '0% 100%'}}>
        <div style={{width: 430, borderRadius: 30, background: p.bubbleIn, border: `1px solid ${p.hair}`, padding: '22px 26px', boxSizing: 'border-box'}}>
          <div style={{fontFamily: fonts.ui, fontWeight: 500, fontSize: 28, color: p.ink, lineHeight: 1.3}}>{REPLY}</div>
          <div style={{fontFamily: fonts.mono, fontSize: 19, color: p.muted, textAlign: 'right', marginTop: 8}}>09:02</div>
        </div>
      </div>
    ) : null}
    <Composer p={p} fonts={fonts} />
  </div>
);

// ---------------------------------------------------------------------------------------------
// Conversa no celular do cliente (ele digita a resposta).
export const ChatB: React.FC<{p: Pal; fonts: Fonts; typed: string; caret: boolean; send: number; sent: number}> = ({p, fonts, typed, caret, send, sent}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <ChatHeader p={p} fonts={fonts} name="Sua empresa" initial="SE" status="online" />
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
// Lista de conversas do cliente: a do concorrente sobe para o topo.
export const ChatList: React.FC<{p: Pal; fonts: Fonts; rival: number; dim: number}> = ({p, fonts, rival, dim}) => {
  const ROW = 128;
  const top = 300;
  const row = (key: string, y: number, name: string, initial: string, msg: React.ReactNode, time: string, opts: {strong?: boolean; alpha?: number} = {}) => (
    <div key={key} style={{position: 'absolute', left: 0, right: 0, top: y, height: ROW, display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px', opacity: opts.alpha ?? 1}}>
      <div style={{width: 84, height: 84, borderRadius: 42, background: opts.strong ? p.line : p.trail, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.ui, fontWeight: 600, fontSize: 30, color: opts.strong ? p.bg : p.ink, flexShrink: 0}}>{initial}</div>
      <div style={{flex: 1, minWidth: 0, borderBottom: `1px solid ${p.hair}`, height: ROW, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 29, color: p.ink}}>{name}</div>
          <div style={{fontFamily: fonts.mono, fontSize: 19, color: p.muted}}>{time}</div>
        </div>
        <div style={{fontFamily: fonts.ui, fontWeight: 400, fontSize: 23, color: p.muted, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 8}}>{msg}</div>
      </div>
    </div>
  );
  const others = [
    ['Contabilidade', 'CO', 'Segue o relatório do mês', 'ontem'],
    ['Fornecedor', 'FO', 'Entrega confirmada', 'seg'],
    ['Equipe', 'EQ', 'Reunião às 10h', 'seg'],
    ['Banco', 'BA', 'Seu extrato está disponível', 'dom'],
  ];
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 30, top: 92, fontFamily: fonts.ui, fontWeight: 600, fontSize: 52, color: p.ink}}>Conversas</div>
      <div style={{position: 'absolute', left: 28, right: 28, top: 180, height: 66, borderRadius: 18, background: p.bubbleIn, display: 'flex', alignItems: 'center', padding: '0 24px', fontFamily: fonts.ui, fontSize: 24, color: p.muted}}>Pesquisar</div>
      {row('rival', top + (rival - 1) * ROW, 'Concorrente', 'CN', <><Ticks color={p.signal} size={20} /> Fechado. Pode mandar o contrato.</>, '08:15', {strong: true})}
      {row('mine', top + rival * ROW, 'Sua empresa', 'SE', <>Proposta_comercial.pdf</>, 'ontem', {alpha: 1 - dim * 0.55})}
      {others.map(([n, i, m, t], k) => row(n, top + (rival + 1 + k) * ROW, n, i, <>{m}</>, t, {alpha: 0.55}))}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// Perfil da empresa no Instagram (genérico, sem marca do app).
export const OLD_POSTS = ['Bom dia!', 'PROMO', 'Aviso', 'Equipe', 'Feriado', 'Horário', 'Obra', 'Natal', 'Bem-vindos'];
export const GRID = {top: 590, tile: 189, gap: 2};

export const tileRect = (i: number) => ({
  x: (i % 3) * (GRID.tile + GRID.gap),
  y: GRID.top + Math.floor(i / 3) * (GRID.tile + GRID.gap),
  w: GRID.tile,
  h: GRID.tile,
});

export const Profile: React.FC<{
  p: Pal;
  fonts: Fonts;
  posts: string;
  scroll: number; // px para cima
  renderTile: (i: number) => React.ReactNode;
  endLabel: number; // 0..1 "fim" aparecendo
}> = ({p, fonts, posts, scroll, renderTile, endLabel}) => {
  const stat = (n: string, label: string) => (
    <div style={{textAlign: 'center'}}>
      <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 32, color: p.ink}}>{n}</div>
      <div style={{fontFamily: fonts.ui, fontWeight: 400, fontSize: 21, color: p.muted, marginTop: 2}}>{label}</div>
    </div>
  );
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-scroll}px)`}}>
        <div style={{position: 'absolute', left: 30, right: 30, top: 84, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 34, color: p.ink}}>suaempresa</div>
          <div style={{display: 'flex', gap: 10}}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{width: 7, height: 7, borderRadius: 4, background: p.ink}} />
            ))}
          </div>
        </div>
        <div style={{position: 'absolute', left: 30, right: 30, top: 160, display: 'flex', alignItems: 'center', gap: 36}}>
          <div style={{width: 148, height: 148, borderRadius: 74, background: p.trail, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.ui, fontWeight: 600, fontSize: 46, color: p.ink, flexShrink: 0}}>SE</div>
          <div style={{flex: 1, display: 'flex', justifyContent: 'space-between'}}>
            {stat(posts, 'posts')}
            {stat('212', 'seguidores')}
            {stat('180', 'seguindo')}
          </div>
        </div>
        <div style={{position: 'absolute', left: 30, top: 330, fontFamily: fonts.ui, fontWeight: 600, fontSize: 26, color: p.ink}}>Sua Empresa</div>
        <div style={{position: 'absolute', left: 30, top: 372, width: 380, height: 14, borderRadius: 7, background: p.hair}} />
        <div style={{position: 'absolute', left: 30, top: 398, width: 260, height: 14, borderRadius: 7, background: p.hair}} />
        <div style={{position: 'absolute', left: 30, right: 30, top: 438, display: 'flex', gap: 12}}>
          {['Seguir', 'Mensagem'].map((t) => (
            <div key={t} style={{flex: 1, height: 58, borderRadius: 14, background: p.bubbleIn, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.ui, fontWeight: 600, fontSize: 23, color: p.ink}}>{t}</div>
          ))}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 528, height: 58, display: 'flex', borderBottom: `1px solid ${p.hair}`}}>
          <div style={{flex: 1, borderBottom: `2px solid ${p.ink}`}} />
          <div style={{flex: 1}} />
          <div style={{flex: 1}} />
        </div>
        {OLD_POSTS.map((_, i) => {
          const r = tileRect(i);
          return (
            <div key={i} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden'}}>
              {renderTile(i)}
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, top: GRID.top + 3 * (GRID.tile + GRID.gap) + 40, textAlign: 'center', fontFamily: fonts.ui, fontSize: 22, color: p.muted, opacity: endLabel}}>
          Você viu todas as publicações
        </div>
      </div>
    </div>
  );
};

export const OldPost: React.FC<{p: Pal; fonts: Fonts; i: number}> = ({p, fonts, i}) => {
  const shapes = [
    <div key="a" style={{position: 'absolute', right: -30, bottom: -30, width: 120, height: 120, borderRadius: 60, background: p.trail, opacity: 0.6}} />,
    <div key="b" style={{position: 'absolute', left: 20, right: 20, bottom: 26, height: 10, borderRadius: 5, background: p.trail}} />,
    <div key="c" style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, background: p.trail, opacity: 0.5}} />,
  ];
  return (
    <div style={{position: 'absolute', inset: 0, background: i % 2 ? '#26282B' : p.tile, filter: 'saturate(0)'}}>
      {shapes[i % 3]}
      <div style={{position: 'absolute', left: 18, top: 18, fontFamily: fonts.ui, fontWeight: 600, fontSize: 24, color: p.muted}}>{OLD_POSTS[i]}</div>
    </div>
  );
};

// Quadrado em branco: o lugar do conteúdo que ninguém fez.
export const BlankTile: React.FC<{p: Pal}> = ({p}) => (
  <div style={{position: 'absolute', inset: 8, borderRadius: 6, border: `2px dashed ${p.trail}`}} />
);

// ---------------------------------------------------------------------------------------------
// Miniaturas das cenas deste vídeo (as peças que a Kyneo fez e que enchem o perfil).
export const MiniTile: React.FC<{p: Pal; fonts: Fonts; i: number}> = ({p, fonts, i}) => {
  const box: React.CSSProperties = {position: 'absolute', inset: 0, background: p.bg, overflow: 'hidden'};
  const inv = (t: string, size: number) => (
    <div style={{...box, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{background: p.ink, color: p.bg, fontFamily: fonts.display, fontWeight: 600, fontSize: size, padding: '8px 10px', letterSpacing: -0.5}}>{t}</div>
    </div>
  );
  let content: React.ReactNode = null;
  if (i === 0)
    content = (
      <div style={{...box}}>
        <div style={{position: 'absolute', left: 14, top: 52, transform: 'scale(0.38)', transformOrigin: '0 0'}}>
          <PdfBubble p={p} fonts={fonts} ticksBlue={1} />
        </div>
      </div>
    );
  if (i === 1) content = inv('NO VISTO', 25);
  if (i === 2)
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
  if (i === 3) content = inv('PERFIL', 30);
  if (i === 4)
    content = (
      <div style={{...box, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={staticFile('kyneo-proposta-visto/simbolo.svg')} style={{width: 120, height: 120}} />
      </div>
    );
  if (i === 5)
    content = (
      <div style={{...box, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: 120, height: 92, borderRadius: 12, background: p.surface, border: `2px solid ${p.trail}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.mono, fontSize: 46, color: p.ink, transform: 'rotate(-8deg)'}}>$</div>
      </div>
    );
  if (i === 6)
    content = (
      <div style={{...box, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22}}>
        {[0, 1].map((k) => (
          <div key={k} style={{width: 50, height: 102, borderRadius: 12, border: `3px solid ${k ? p.line : p.trail}`, background: p.surface}} />
        ))}
      </div>
    );
  if (i === 7) content = inv('ACESSÍVEL', 19);
  if (i === 8)
    content = (
      <div style={{...box}}>
        <svg width="189" height="189" viewBox="0 0 189 189" fill="none">
          <path d="M30 150 C 70 150, 80 40, 160 40" stroke={p.line} strokeWidth="4" />
          <path d="M30 150 L 70 150 M160 40 L 120 40" stroke={p.trail} strokeWidth="2" />
          {[
            [30, 150],
            [160, 40],
          ].map(([x, y], k) => (
            <rect key={k} x={x - 7} y={y - 7} width="14" height="14" fill={p.ink} transform={`rotate(45 ${x} ${y})`} />
          ))}
          {[
            [70, 150],
            [120, 40],
          ].map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r="5" fill={p.muted} />
          ))}
        </svg>
      </div>
    );
  return (
    <>
      {content}
      <div style={{position: 'absolute', right: 10, top: 10}}>
        <ReelGlyph color={p.ink} />
      </div>
    </>
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
          <Heart color={p.ink} fill={like > 0.5 ? p.ink : 'none'} />
        </div>
        <Bubble color={p.ink} />
        <Plane color={p.ink} />
      </div>
      <div style={{position: 'absolute', left: 28, bottom: 120, display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{width: 56, height: 56, borderRadius: 28, background: p.trail, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.ui, fontWeight: 600, fontSize: 22, color: p.ink}}>SE</div>
        <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 26, color: p.ink}}>suaempresa</div>
      </div>
    </div>
  );
};
