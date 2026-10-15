// Texturas e geometrias procedurais com semente (nada de arquivo de imagem, nada de Math.random).
// Receitas que funcionaram nos testes:
//   pão/massa   LatheGeometry de um perfil suave + vertexColors (mais escuro embaixo) + bump de ruído + clearcoat 0.3 a 0.55
//   carne       lathe com borda irregular (seno + ruído no raio) + marcas de grelha escuras no topo + bump forte
//   queijo      PlaneGeometry fina subdividida; para derreter, empurre os vértices além da borda para baixo
//   folha       RingGeometry com ondulação na borda (sen de alta frequência × raio²) + DoubleSide
//   metal       MeshPhysicalMaterial metalness 0.95 a 1, roughness 0.1 (cromado) a 0.35 (grafite) + ambiente do Stage3D
//   mordida/corte  discard no shader dentro de esferas (onBeforeCompile) + cor de miolo na face de trás
import * as THREE from 'three';
import {mulberry32} from '../noise';

// Textura de ruído para bumpMap/roughnessMap.
export const noiseTexture = (seed: number, size = 256, contrast = 1, repeat = 4) => {
  const r = mulberry32(seed);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = Math.floor(128 + (r() - 0.5) * 255 * contrast);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return t;
};

// Veio de madeira (tábua, mesa, balcão).
export const woodTexture = (seed: number, base = '#4a2f1c') => {
  const r = mulberry32(seed);
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) {
    const y = r() * 512;
    g.strokeStyle = `rgba(${r() > 0.5 ? '20,10,4' : '120,80,48'},${0.06 + r() * 0.16})`;
    g.lineWidth = 1 + r() * 4;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 64) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 4 + (r() - 0.5) * 3);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

// Sólido de revolução a partir de um perfil [raio, altura] suavizado (pão, copo, garrafa, frasco, botão).
export const latheFromProfile = (profile: [number, number][], segments = 72, smooth = 48) => {
  const pts = new THREE.SplineCurve(profile.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(smooth);
  return new THREE.LatheGeometry(pts, segments);
};

// Cor em gamma (hex) para cor linear usada em vertexColors.
export const hexLinear = (h: number): [number, number, number] => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255].map((v) => Math.pow(v, 2.2)) as [number, number, number];
export const mixColor = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Pinta os vértices por uma função (x, y, z) → [r, g, b] linear. Use com vertexColors: true.
export const colorize = (geo: THREE.BufferGeometry, fn: (x: number, y: number, z: number, i: number) => [number, number, number]) => {
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) col.set(fn(pos.getX(i), pos.getY(i), pos.getZ(i), i), i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
};

// Corte esférico (mordida, buraco): descarta pixels dentro das esferas e pinta o miolo na face de trás.
// spheres é um objeto mutável {centers: Vector3[], radii: number[], on: boolean}; atualize no render do frame.
export type CutSpheres = {uniforms: {uOn: {value: number}; uC: {value: THREE.Vector3[]}; uR: {value: number[]}}};
export const makeCut = (count = 3): CutSpheres => ({
  uniforms: {uOn: {value: 0}, uC: {value: Array.from({length: count}, () => new THREE.Vector3())}, uR: {value: Array.from({length: count}, () => 0)}},
});
export const withCut = <M extends THREE.MeshStandardMaterial>(mat: M, cut: CutSpheres, inner: [number, number, number], instanced = false): M => {
  const n = cut.uniforms.uC.value.length;
  mat.side = THREE.DoubleSide;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, cut.uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvWP = (modelMatrix * ${instanced ? 'instanceMatrix * ' : ''}vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWP;\nuniform float uOn;\nuniform vec3 uC[${n}];\nuniform float uR[${n}];`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\nif (uOn > 0.5) { for (int i = 0; i < ${n}; i++) { if (distance(vWP, uC[i]) < uR[i]) discard; } }`)
      .replace('#include <color_fragment>', `#include <color_fragment>\nif (!gl_FrontFacing && uOn > 0.5) { diffuseColor.rgb = vec3(${inner.join(',')}); }`);
  };
  return mat;
};
