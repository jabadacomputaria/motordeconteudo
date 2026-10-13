// Título cinético: cada palavra sobe por trás de uma máscara (sem fade) e sai subindo quando o próximo entra.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, pop} from './anim';

export type HeadlineProps = {
  lines: string[][]; // linhas → palavras
  accentWords?: string[]; // palavras pintadas com a cor de destaque
  enter: number; // frame de entrada
  exit?: number; // frame de saída (opcional)
  color: string;
  accent: string;
  family: string;
  size: number;
  stagger?: number;
  fps?: number;
  frame?: number;
  weight?: number; // peso do título (vem do brand: fonts.display.titleWeight)
};

export const Headline: React.FC<HeadlineProps> = ({lines, accentWords = [], enter, exit, color, accent, family, size, stagger = 2, fps: fpsProp, frame: frameProp, weight = 800}) => {
  const current = useCurrentFrame();
  const frame = frameProp ?? current;
  const config = useVideoConfig();
  const fps = fpsProp ?? config.fps;
  if (frame < enter - 1) return null;
  if (exit !== undefined && frame > exit + 12) return null;
  const out = exit === undefined ? 0 : ease(frame, exit, 9);
  let k = 0;
  return (
    <div style={{fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1.02, letterSpacing: -size * 0.035, color}}>
      {lines.map((words, li) => (
        <div key={li} style={{display: 'flex', flexWrap: 'wrap', columnGap: size * 0.24}}>
          {words.map((w) => {
            const i = k++;
            const p = pop(frame, enter + i * stagger, fps, 210, 18);
            const y = (1 - p) * 110 - out * 110;
            const clean = w.replace(/[.,!?]/g, '');
            return (
              <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.08, marginBottom: -size * 0.08}}>
                <span style={{display: 'inline-block', transform: `translateY(${y}%)`, color: accentWords.includes(clean) ? accent : color}}>{w}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
