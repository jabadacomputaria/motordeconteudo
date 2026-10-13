// Primitivas de movimento. Todas são funções puras do frame: nada de estado, timers ou transitions.
import {Easing, interpolate, spring} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Progresso 0→1 com mola, começando em `start`.
export const pop = (frame: number, start: number, fps: number, stiffness = 180, damping = 14) =>
  spring({frame: frame - start, fps, config: {stiffness, damping, mass: 0.8}});

// Progresso 0→1 suave (sem overshoot) entre start e start+dur.
export const ease = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1)});

// Progresso 0→1 linear.
export const lin = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], clamp);

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
