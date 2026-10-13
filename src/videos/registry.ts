// Lista de vídeos do motor. Para criar um vídeo novo: copie a pasta teste-motor, ajuste brief.json e brand.json,
// rode `npm run audio -- <id>` e registre aqui.
import type React from 'react';
import type {Beats} from '../lib/beats';
import type {Brand} from '../lib/brand';
import {Video as TesteMotor} from './teste-motor/Video';
import testeBrief from './teste-motor/brief.json';
import testeBeats from './teste-motor/beats.json';
import testeBrand from './teste-motor/brand.json';

export type VideoEntry = {
  id: string;
  component: React.FC<{id: string; beats: Beats; brand: Brand; seed: number; withAudio?: boolean; fps?: number; frame?: number}>;
  brief: typeof testeBrief;
  beats: Beats;
  brand: Brand;
};

export const videos: VideoEntry[] = [
  {id: testeBrief.id, component: TesteMotor, brief: testeBrief, beats: testeBeats as Beats, brand: testeBrand as Brand},
];
