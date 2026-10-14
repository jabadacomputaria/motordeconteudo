// Registro deste vídeo. A marca (brand.json) e os arquivos de voz/assinatura ficam fora do GitHub:
// sem eles o motor continua abrindo, usando a marca provisória de teste.
import type {Beats} from '../../lib/beats';
import type {Brand} from '../../lib/brand';
import placeholder from '../teste-motor/brand.json';
import brief from './brief.json';
import beats from './beats.json';
import {Video} from './Video';

declare const require: {context: (dir: string, deep: boolean, re: RegExp) => {keys: () => string[]; (k: string): unknown}};
const found = require.context('.', false, /^\.\/brand\.json$/);
const brand = (found.keys().length ? found(found.keys()[0]) : placeholder) as Brand;

export const entry = {id: brief.id, component: Video, brief, beats: beats as unknown as Beats, brand};
