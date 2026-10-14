// Registro do vídeo "como eu faria: hamburgueria artesanal delivery". Voz, símbolo e assinatura
// ficam fora do GitHub (public/hamburgueria).
import type {Beats} from '../../lib/beats';
import type {Brand} from '../../lib/brand';
import brand from './brand.json';
import brief from './brief.json';
import beats from './beats.json';
import {Video} from './Video';

export const entry = {id: brief.id, component: Video, brief, beats: beats as unknown as Beats, brand: brand as Brand};
