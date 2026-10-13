// Render do motor.
//   node render.mjs <id> --sheet        → out/<id>-sheet.png (um quadro por beat, para revisar)
//   node render.mjs <id> --frame 120    → out/<id>-f120.png (um quadro em tamanho real)
//   node render.mjs <id>                → out/<id>.mp4 (H.264, yuv420p, CRF 16, AAC)
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const root = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const id = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--frame') || 'teste-motor';

if (!fs.existsSync(path.join(root, 'src', 'videos', id, 'beats.json'))) {
  console.error(`Falta o beats.json de "${id}". Rode antes: npm run audio -- ${id}`);
  process.exit(1);
}

// No computador do Juan o Remotion baixa o próprio navegador. Em servidores sem acesso ao download,
// aponte REMOTION_BROWSER para um Chromium/headless_shell já instalado.
const knownShell = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const browserExecutable = process.env.REMOTION_BROWSER || (fs.existsSync(knownShell) ? knownShell : null);

const outDir = path.join(root, 'out');
fs.mkdirSync(outDir, {recursive: true});

console.log('Empacotando o projeto...');
const serveUrl = await bundle({entryPoint: path.join(root, 'src', 'index.ts'), publicDir: path.join(root, 'public')});
const common = {serveUrl, browserExecutable, chromiumOptions: {gl: 'angle'}, logLevel: 'warn'};

if (flag('--sheet')) {
  const composition = await selectComposition({...common, id: `${id}-sheet`});
  const output = path.join(outDir, `${id}-sheet.png`);
  await renderStill({...common, composition, output, imageFormat: 'png'});
  console.log(`Contact sheet: ${path.relative(root, output)} (${composition.width}x${composition.height})`);
} else if (value('--frame') !== undefined) {
  const frame = Number(value('--frame'));
  const composition = await selectComposition({...common, id});
  const output = path.join(outDir, `${id}-f${frame}.png`);
  await renderStill({...common, composition, output, frame, imageFormat: 'png'});
  console.log(`Quadro: ${path.relative(root, output)}`);
} else {
  const composition = await selectComposition({...common, id});
  const output = path.join(outDir, `${id}.mp4`);
  let last = -1;
  await renderMedia({
    ...common,
    composition,
    codec: 'h264',
    crf: 16,
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709', // faixa de cor padrão de vídeo (yuv420p, não yuvj420p)
    audioCodec: 'aac',
    audioBitrate: '320k',
    outputLocation: output,
    onProgress: ({progress}) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) {
        last = pct;
        console.log(`  ${pct}%`);
      }
    },
  });
  console.log(`Vídeo: ${path.relative(root, output)} (${composition.durationInFrames} frames, ${composition.fps} fps)`);
}
