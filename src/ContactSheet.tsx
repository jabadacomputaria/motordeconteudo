// Contact sheet: o próprio vídeo congelado em cada beat, numa grade (uma linha por compasso).
// É uma composição still: renderiza tudo numa imagem só, sem ffmpeg. Cada célula mostra o frame
// meio beat depois do hit (offset), quando o movimento já assentou.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {videos, type VideoEntry} from './videos/registry';

export const SHEET = {cols: 4, scale: 0.22, gap: 20, label: 44, offset: 8};

export const sheetSize = (v: VideoEntry) => {
  const {width, height} = v.brief.format;
  const n = v.beats.beats.length;
  const rows = Math.ceil(n / SHEET.cols);
  const cw = Math.round(width * SHEET.scale);
  const ch = Math.round(height * SHEET.scale);
  return {
    width: SHEET.cols * cw + (SHEET.cols + 1) * SHEET.gap,
    height: rows * (ch + SHEET.label) + (rows + 1) * SHEET.gap,
    cw,
    ch,
  };
};

export const ContactSheet: React.FC<{videoId: string}> = ({videoId}) => {
  const entry = videos.find((v) => v.id === videoId);
  if (!entry) throw new Error(`Vídeo não registrado: ${videoId}`);
  const {width, height, fps} = entry.brief.format;
  const {cw, ch} = sheetSize(entry);
  const Comp = entry.component;
  return (
    <AbsoluteFill style={{background: '#1B1B1B'}}>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: SHEET.gap, padding: SHEET.gap}}>
        {entry.beats.beats.map((sec, i) => {
          const f = Math.round(sec * fps) + SHEET.offset;
          return (
            <div key={i} style={{width: cw}}>
              <div style={{width: cw, height: ch, overflow: 'hidden', position: 'relative'}}>
                <div style={{width, height, transform: `scale(${SHEET.scale})`, transformOrigin: '0 0', position: 'absolute'}}>
                  <Comp id={entry.id} beats={entry.beats} brand={entry.brand} seed={entry.brief.music.seed} withAudio={false} fps={fps} frame={f} />
                </div>
              </div>
              <div style={{height: SHEET.label, color: '#EEE', fontFamily: 'monospace', fontSize: 22, lineHeight: `${SHEET.label}px`}}>
                b{i} · {sec.toFixed(2)}s
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
