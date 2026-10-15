// Registro do vídeo de teste do 3D (usa a marca provisória do teste-motor).
import type {Beats} from '../../lib/beats';
import type {Brand} from '../../lib/brand';
import brand from '../teste-motor/brand.json';
import brief from './brief.json';
import beats from './beats.json';
import {Video} from './Video';

export const entry = {id: brief.id, component: Video, brief, beats: beats as unknown as Beats, brand: brand as Brand};
