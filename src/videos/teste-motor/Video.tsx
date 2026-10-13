// Vídeo-teste do motor: o negócio sem site que some na busca.
// Objeto herói: o painel de resultados de busca, que muda de estado a cada compasso.
import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Headline} from '../../lib/Headline';
import {ease, lin, mix, pop} from '../../lib/anim';
import {barFrames, beatFrames, beatPulse, type Beats} from '../../lib/beats';
import {loadBrandFonts, type Brand} from '../../lib/brand';
import {noise1D} from '../../lib/noise';

// frame e fps podem vir por prop: é o equivalente ao window.seek(t). A contact sheet usa isso para
// pintar qualquer instante do vídeo numa composição still.
export type VideoProps = {id: string; beats: Beats; brand: Brand; seed: number; withAudio?: boolean; fps?: number; frame?: number};

const QUERY_WORDS = ['manicure', 'perto de', 'mim'];
const QUERY = QUERY_WORDS.join(' ');
const RIVALS = [
  {name: 'Studio Lumi', meta: '★ 4,8 · 600 m'},
  {name: 'Bella Unhas', meta: '★ 4,6 · 900 m'},
  {name: 'Esmalteria Rosa', meta: '★ 4,7 · 1,2 km'},
];

const PANEL = {x: 72, y: 700, w: 936, maxH: 910};
const ROW_H = 164;
const ROW_GAP = 18;
const LIST_TOP = 150;
const PAD_BOTTOM = 28;

export const Video: React.FC<VideoProps> = ({id, beats, brand, seed, withAudio = true, fps: fpsProp, frame: frameProp}) => {
  loadBrandFonts(brand);
  const current = useCurrentFrame();
  const frame = frameProp ?? current;
  const config = useVideoConfig();
  const fps = fpsProp ?? config.fps;
  const b = beatFrames(beats, fps);
  const bar = barFrames(beats, fps);
  const c = brand.colors;
  const display = brand.fonts.display.family;
  const ui = brand.fonts.ui.family;
  const kick = beatPulse(frame, b, 5);

  // --- linha do tempo (tudo amarrado ao grid) ------------------------------
  // Digitação palavra por palavra, cada palavra começando num beat (com o tick do brief).
  const typed = QUERY_WORDS.reduce((n, w, i) => {
    const start = i === 0 ? 1 : b[i];
    const before = QUERY_WORDS.slice(0, i).join(' ').length + (i > 0 ? 1 : 0);
    const t = lin(frame, start, 7);
    return t > 0 ? before + Math.round(w.length * t) : n;
  }, 0);
  const rivalIn = [b[5], b[6], b[7]].map((f) => pop(frame, f, fps));
  const mineIn = pop(frame, b[9], fps, 160, 12);
  const booked = pop(frame, b[13], fps, 260, 16);
  const strike = ease(frame, b[13] + 2, 10);
  const tension = lin(frame, b[14], b[16] - b[14]);
  const flip = pop(frame, b[16], fps, 140, 13); // a virada: o seu cartão sobe para o topo
  const expand = ease(frame, b[20], 16);
  const thumbs = [b[21], b[22], b[23]].map((f) => pop(frame, f, fps, 220, 13));
  const press = frame >= b[24] ? Math.exp(-(frame - b[24]) / 4) : 0;
  const done = pop(frame, b[24] + 3, fps, 240, 15);
  const sign = pop(frame, b[26], fps, 170, 16);

  // Posições na lista: antes da virada o seu cartão é o 4º; depois, o 1º.
  const slotY = (slot: number) => LIST_TOP + slot * (ROW_H + ROW_GAP);
  const mineSlot = mix(3, 0, flip);
  const rivalSlot = (i: number) => mix(i, i + 1, flip);
  // Na expansão o seu cartão cresce e empurra os outros para fora do painel.
  const mineH = mix(ROW_H, 730, expand);
  const push = (mineH - ROW_H) * 1.0;
  // O painel cresce conforme os cartões chegam (o objeto muda de estado, nada fica vazio).
  // Na expansão os rivais saem do painel: ele fica só com o seu cartão (nada cortado no rodapé).
  const rows = rivalIn.reduce((a, p) => a + p, 0) * (1 - expand) + mineIn;
  const panelH = Math.min(PANEL.maxH, LIST_TOP - 6 + PAD_BOTTOM + rows * (ROW_H + ROW_GAP) - (rows > 0 ? ROW_GAP : 0) + push);

  const zoom = 1 + tension * 0.035 + kick * 0.006;
  // Compasso 1: a busca é o herói, grande e no meio da área livre. Encolhe para o topo quando os resultados chegam.
  const settle = ease(frame, b[4] - 4, 12);
  const introScale = mix(1.08, 1, settle) + beatPulse(frame, b.slice(0, 4), 5) * 0.025 * (1 - settle);
  const introY = mix(300, 0, settle);
  const wobble = (i: number) => noise1D(seed + i, frame / 40) * 1.2;

  const card = (key: string, y: number, h: number, children: React.ReactNode, opts: {outline?: string; rot?: number; dy?: number} = {}) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        left: 28,
        right: 28,
        top: y,
        height: h,
        borderRadius: 26,
        background: c.surface,
        border: `3px solid ${opts.outline ?? '#E6E2DA'}`,
        transform: `translateY(${opts.dy ?? 0}px) rotate(${opts.rot ?? 0}deg)`,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );

  const row = (name: string, meta: string, thumb: string, extra?: React.ReactNode) => (
    <div style={{display: 'flex', alignItems: 'center', height: ROW_H - 6, padding: '0 26px', gap: 26}}>
      <div style={{width: 104, height: 104, borderRadius: 22, background: thumb, flexShrink: 0}} />
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontFamily: ui, fontWeight: 600, fontSize: 50, color: c.ink, whiteSpace: 'nowrap'}}>{name}</div>
        <div style={{fontFamily: ui, fontWeight: 500, fontSize: 38, color: c.muted, marginTop: 4}}>{meta}</div>
      </div>
      {extra}
    </div>
  );

  // Selo "Agendado ✓" (aparece no rival no compasso 4 e no seu cartão no fim).
  const badge = (p: number, label = 'Agendado ✓') => (
    <div
      style={{
        fontFamily: ui,
        fontWeight: 600,
        fontSize: 32,
        color: c.onAccent,
        background: c.accent,
        padding: '12px 20px',
        borderRadius: 999,
        transform: `scale(${p})`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  );

  const signOut = frame >= b[26];

  return (
    <AbsoluteFill style={{background: c.bg}}>
      {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}

      {/* Títulos: um por compasso, à esquerda, terço de cima */}
      <div style={{position: 'absolute', left: 80, right: 80, top: 210}}>
        <Headline lines={[['Seu', 'cliente'], ['procurou', 'você.']]} accentWords={['você']} enter={0} exit={bar[1] - 4} fps={fps} frame={frame} color={c.ink} accent={c.accent} family={display} size={124} />
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 210}}>
        <Headline lines={[['E', 'achou'], ['3', 'concorrentes.']]} accentWords={['3']} enter={bar[1]} exit={bar[2] - 4} fps={fps} frame={frame} color={c.ink} accent={c.accent} family={display} size={124} />
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 210}}>
        <Headline lines={[['Você', 'tá', 'lá', 'embaixo.'], ['Sem', 'site.']]} accentWords={['Sem', 'site']} enter={bar[2]} exit={bar[3] - 4} fps={fps} frame={frame} color={c.ink} accent={c.accent} family={display} size={124} />
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 210}}>
        <Headline lines={[['Ele', 'agendou'], ['com', 'outro.']]} accentWords={['outro']} enter={bar[3]} exit={bar[4] - 4} fps={fps} frame={frame} color={c.ink} accent={c.accent} family={display} size={124} />
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 210}}>
        <Headline lines={[['Com', 'site,'], ['quem', 'sobe', 'é', 'você.']]} accentWords={['você']} enter={bar[4]} exit={bar[5] - 4} fps={fps} frame={frame} color={c.ink} accent={c.accent} family={display} size={124} />
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 210}}>
        <Headline lines={[['Site', '+', 'carrosséis'], ['prontos', 'pra', 'postar.']]} accentWords={['carrosséis']} enter={bar[5]} exit={b[26] - 4} fps={fps} frame={frame} color={c.ink} accent={c.accent} family={display} size={112} />
      </div>
      {signOut ? (
        <div style={{position: 'absolute', left: 80, right: 80, top: 230}}>
          <div style={{overflow: 'hidden'}}>
            <div style={{fontFamily: display, fontWeight: 800, fontSize: 150, letterSpacing: -6, color: c.ink, lineHeight: 1, transform: `translateY(${(1 - sign) * 110}%)`}}>
              Sua<span style={{color: c.accent}}>Marca</span>
            </div>
          </div>
          <div style={{overflow: 'hidden', marginTop: 22}}>
            <div style={{fontFamily: ui, fontWeight: 500, fontSize: 46, color: c.ink, transform: `translateY(${(1 - pop(frame, b[26] + 4, fps, 170, 16)) * 110}%)`}}>
              Seu negócio aparece. E agenda.
            </div>
          </div>
        </div>
      ) : null}

      {/* Objeto herói: painel de resultados */}
      <div
        style={{
          position: 'absolute',
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: panelH,
          borderRadius: 44,
          background: '#EAE6DE',
          overflow: 'hidden',
          transform: `translateY(${introY}px) scale(${zoom * introScale})`,
          transformOrigin: '50% 30%',
        }}
      >
        {/* Barra de busca */}
        <div style={{position: 'absolute', left: 28, right: 28, top: 28, height: 96, borderRadius: 999, background: c.surface, display: 'flex', alignItems: 'center', padding: '0 34px', gap: 22}}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={c.ink} strokeWidth="2.6" strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 21 21" />
          </svg>
          <div style={{fontFamily: ui, fontWeight: 500, fontSize: 42, color: c.ink, whiteSpace: 'nowrap'}}>
            {QUERY.slice(0, typed)}
            <span style={{display: 'inline-block', width: 4, height: 44, marginLeft: 4, verticalAlign: -8, background: frame < b[4] && Math.floor(frame / 8) % 2 === 0 ? c.ink : 'transparent'}} />
          </div>
        </div>

        {/* Rivais */}
        {RIVALS.map((r, i) => {
          const p = rivalIn[i];
          if (p <= 0.001 || expand > 0.6) return null;
          const y = slotY(rivalSlot(i)) + push;
          return card(
            r.name,
            y,
            ROW_H,
            row(r.name, r.meta, '#D9D4CA', i === 0 && booked > 0.01 ? badge(booked) : undefined),
            {dy: (1 - p) * -90, rot: (1 - p) * (i % 2 ? 4 : -4) + wobble(i) * 0.1},
          );
        })}

        {/* Seu negócio */}
        {mineIn > 0.001
          ? card(
              'mine',
              slotY(mineSlot),
              mineH,
              <div>
                {row(
                  'Seu negócio',
                  flip > 0.5 ? 'site no ar · 300 m' : 'sem site · 300 m',
                  flip > 0.5 ? c.accent : '#CFCAC0',
                  expand < 0.5 ? (flip > 0.5 ? badge(Math.min(1, flip * 1.4), 'Site') : null) : null,
                )}
                {/* Riscado quando perde o cliente */}
                <div style={{position: 'absolute', left: 26, top: ROW_H / 2 - 3, height: 6, width: `${strike * Math.max(0, 1 - flip * 4) * 92}%`, background: c.ink, borderRadius: 3}} />
                {/* Prévia do site + carrosséis (compassos 6 e 7) */}
                <div style={{position: 'absolute', left: 26, right: 26, top: ROW_H, opacity: expand > 0.02 ? 1 : 0}}>
                  <div style={{height: 280, borderRadius: 20, background: c.ink, padding: 30, transform: `translateY(${(1 - expand) * 60}px)`}}>
                    <div style={{fontFamily: display, fontWeight: 800, fontSize: 60, color: c.bg, lineHeight: 1}}>Agende seu horário</div>
                    <div style={{fontFamily: ui, fontWeight: 500, fontSize: 34, color: '#BDB8AE', marginTop: 12}}>seunegocio.com.br</div>
                    <div style={{marginTop: 26, display: 'flex', alignItems: 'center', gap: 18}}>
                      <div style={{fontFamily: ui, fontWeight: 600, fontSize: 34, color: c.onAccent, background: c.accent, padding: '14px 30px', borderRadius: 999, transform: `scale(${1 - press * 0.12})`}}>
                        {done > 0.5 ? 'Agendado ✓' : 'Agendar'}
                      </div>
                    </div>
                  </div>
                  <div style={{fontFamily: ui, fontWeight: 600, fontSize: 32, color: c.muted, marginTop: 26}}>Carrosséis da semana</div>
                  <div style={{display: 'flex', gap: 18, marginTop: 14}}>
                    {thumbs.map((p, i) => (
                      <div key={i} style={{flex: 1, height: 170, borderRadius: 18, background: i === 1 ? c.accent : '#EDE9E1', transform: `translateY(${(1 - p) * 40}px) scale(${0.6 + 0.4 * p})`, opacity: p > 0.01 ? 1 : 0, padding: 16}}>
                        <div style={{height: 14, width: '70%', borderRadius: 7, background: i === 1 ? c.onAccent : c.ink}} />
                        <div style={{height: 10, width: '50%', borderRadius: 5, background: i === 1 ? c.onAccent : c.muted, marginTop: 12, opacity: 0.7}} />
                        <div style={{fontFamily: display, fontWeight: 800, fontSize: 48, color: i === 1 ? c.onAccent : c.ink, marginTop: 36}}>{i + 1}/5</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>,
              {
                outline: flip > 0.5 ? c.accent : '#E6E2DA',
                dy: (1 - mineIn) * 160,
                rot: (1 - flip) * 0 + wobble(9) * 0.1 * (1 - expand),
              },
            )
          : null}
      </div>
    </AbsoluteFill>
  );
};
