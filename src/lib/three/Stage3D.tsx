// Palco 3D do motor: luz de estúdio, reflexo de ambiente, sombra suave e câmera controlada pelo frame.
// Use para o objeto herói quando ele precisa parecer de verdade (comida, produto, metal, vidro):
// vetor chapado dá "cara de desenho"; luz e material de verdade resolvem.
//
// Regras: tudo continua função pura do frame. Calcule posições/ângulos a partir do frame e passe por props.
// Nunca use useFrame, clock ou animação do three. Texturas e geometrias com semente (ver textures.ts).
import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

export type Vec3 = [number, number, number];
export type Cam = {position: Vec3; lookAt: Vec3; fov?: number};

// Aplica câmera, ambiente e tom de cor a cada render (o render de cada frame é independente).
const Rig: React.FC<{cam: Cam; env: number; exposure: number; shake?: Vec3}> = ({cam, env, exposure, shake}) => {
  const {camera, scene, gl} = useThree();
  const envTex = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return tex;
  }, [gl]);
  scene.environment = envTex;
  scene.environmentIntensity = env;
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = exposure;
  gl.outputColorSpace = THREE.SRGBColorSpace;
  const c = camera as THREE.PerspectiveCamera;
  const s = shake ?? [0, 0, 0];
  c.position.set(cam.position[0] + s[0], cam.position[1] + s[1], cam.position[2] + s[2]);
  c.fov = cam.fov ?? 28;
  c.near = 0.1;
  c.far = 100;
  c.updateProjectionMatrix();
  c.lookAt(cam.lookAt[0], cam.lookAt[1], cam.lookAt[2]);
  return null;
};

// Luz de estúdio: principal quente com sombra, contraluz (borda) e preenchimento.
// lit em [0, 1+] escurece/acende tudo (use para "a luz acende" ou silhuetas antes da revelação).
export const StudioLights: React.FC<{lit?: number; keyColor?: string; rimColor?: string; keyI?: number; rimI?: number; fillI?: number}> = ({
  lit = 1,
  keyColor = '#ffe0b8',
  rimColor = '#ff7a2a',
  keyI = 3.1,
  rimI = 2.6,
  fillI = 0.45,
}) => (
  <>
    <directionalLight
      position={[-4.5, 7, 6]}
      intensity={keyI * lit}
      color={keyColor}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-6}
      shadow-camera-right={6}
      shadow-camera-top={8}
      shadow-camera-bottom={-4}
      shadow-camera-near={1}
      shadow-camera-far={30}
      shadow-bias={-0.0006}
      shadow-normalBias={0.03}
      shadow-radius={5}
    />
    <directionalLight position={[4, 3.5, -5]} intensity={rimI * Math.max(lit, 0.25)} color={rimColor} />
    <hemisphereLight args={['#ffd9b0', '#2a1408', fillI * Math.max(lit, 0.1)]} />
  </>
);

export const Stage3D: React.FC<{
  cam: Cam;
  width?: number;
  height?: number;
  env?: number; // reflexo do ambiente (0.5 a 0.6 é bom para metal e brilho)
  exposure?: number;
  shadows?: boolean;
  shake?: Vec3; // tremida de câmera (ex.: no impacto)
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({cam, width = 1080, height = 1920, env = 0.55, exposure = 1.05, shadows = true, shake, style, children}) => (
  <ThreeCanvas
    width={width}
    height={height}
    shadows={shadows ? 'soft' : false}
    gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}
    camera={{fov: cam.fov ?? 28, position: cam.position, near: 0.1, far: 100}}
    style={{position: 'absolute', left: 0, top: 0, ...style}}
  >
    <Rig cam={cam} env={env} exposure={exposure} shake={shake} />
    {children}
  </ThreeCanvas>
);

// Interpola a câmera entre keyframes {t (frame), cam}. Suave (ease in-out) entre cada par.
export const camAt = (frame: number, keys: {f: number; cam: Cam}[]): Cam => {
  if (frame <= keys[0].f) return keys[0].cam;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (frame <= b.f) {
      const x = Math.min(1, Math.max(0, (frame - a.f) / (b.f - a.f)));
      const k = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const lerp3 = (p: Vec3, q: Vec3): Vec3 => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
      return {position: lerp3(a.cam.position, b.cam.position), lookAt: lerp3(a.cam.lookAt, b.cam.lookAt), fov: (a.cam.fov ?? 28) + ((b.cam.fov ?? 28) - (a.cam.fov ?? 28)) * k};
    }
  }
  return keys[keys.length - 1].cam;
};
