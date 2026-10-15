// Vídeo de teste do 3D: um cadeado de metal (grafite + arco cromado) cai, abre e a luz acende.
// Serve de exemplo de como usar o Stage3D: tudo calculado a partir do frame e passado por props.
import React, {useMemo} from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {Headline} from '../../lib/Headline';
import {beatFrames, type Beats} from '../../lib/beats';
import {loadBrandFonts, type Brand} from '../../lib/brand';
import {Stage3D, StudioLights, camAt} from '../../lib/three/Stage3D';

export type VideoProps = {id: string; beats: Beats; brand: Brand; seed: number; withAudio?: boolean; fps?: number; frame?: number};

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const eo3 = (x: number) => 1 - Math.pow(1 - x, 3);
const eob = (x: number, c = 1.1) => 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);

// Cadeado: corpo grafite, placa, buraco da chave com anel na cor de destaque, arco cromado.
const Lock: React.FC<{y: number; yaw: number; squash: number; lift: number; swing: number; glow: number; accent: string}> = ({y, yaw, squash, lift, swing, glow, accent}) => {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector3(-0.62, 0.35 + (0.8 * i) / 10, 0));
    for (let i = 1; i <= 40; i++) {
      const a = Math.PI - (i / 40) * Math.PI;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.62, 1.15 + Math.sin(a) * 0.62, 0));
    }
    for (let i = 1; i <= 8; i++) pts.push(new THREE.Vector3(0.62, 1.15 - (0.47 * i) / 8, 0));
    return {
      body: new RoundedBoxGeometry(2.0, 1.55, 0.78, 8, 0.2),
      plate: new RoundedBoxGeometry(1.66, 1.2, 0.08, 6, 0.04),
      slot: new RoundedBoxGeometry(0.1, 0.34, 0.05, 2, 0.02),
      shackle: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 200, 0.115, 24, false),
    };
  }, []);
  return (
    <group position={[0.2, y, 0]} rotation={[0.1, yaw, 0]} scale={[1 + (1 - squash) * 0.5, squash, 1]}>
      <mesh geometry={geo.body} castShadow>
        <meshPhysicalMaterial color="#1c1d20" metalness={0.95} roughness={0.34} clearcoat={0.35} clearcoatRoughness={0.3} />
      </mesh>
      <mesh geometry={geo.plate} position={[0, 0, 0.39]}>
        <meshPhysicalMaterial color="#34363b" metalness={1} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.08, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.05, 32]} />
        <meshStandardMaterial color="#050505" roughness={0.9} />
      </mesh>
      <mesh geometry={geo.slot} position={[0, -0.14, 0.45]}>
        <meshStandardMaterial color="#050505" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.08, 0.435]}>
        <torusGeometry args={[0.23, 0.014, 12, 48]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8 + glow * 2.5} roughness={0.4} />
      </mesh>
      {[[-0.66, 0.45], [0.66, 0.45], [-0.66, -0.45], [0.66, -0.45]].map(([x, yy], i) => (
        <mesh key={i} position={[x, yy, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
          <meshPhysicalMaterial color="#dfe3e8" metalness={1} roughness={0.1} />
        </mesh>
      ))}
      {/* pivô na perna longa: o arco sobe e gira para abrir */}
      <group position={[-0.62, 0.78 + lift, 0]} rotation={[0, swing, 0]}>
        <mesh geometry={geo.shackle} position={[0.62, -0.78, 0]} castShadow>
          <meshPhysicalMaterial color="#dfe3e8" metalness={1} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
};

export const Video: React.FC<VideoProps> = ({id, beats, brand, withAudio = true, fps: fpsProp, frame: frameProp}) => {
  loadBrandFonts(brand);
  const current = useCurrentFrame();
  const frame = frameProp ?? current;
  const config = useVideoConfig();
  const fps = fpsProp ?? config.fps;
  const b = beatFrames(beats, fps);
  const c = brand.colors;
  const at = (i: number) => b[Math.min(i, b.length - 1)] ?? 0;

  // queda com quique no beat 1
  const land = at(1);
  const fall = clamp((frame - (land - 10)) / 10);
  const dt = (frame - land) / fps;
  let y = -0.95 + 6.5 * (1 - fall * fall);
  if (dt > 0) y += 0.24 * Math.exp(-dt * 8.5) * Math.abs(Math.sin(dt * 12));
  const squash = dt > 0 ? 1 - 0.09 * Math.exp(-dt * 13) : 1;
  // abre no beat 3
  const open = at(3);
  const lift = 0.36 * eo3(clamp((frame - open + 1) / 6));
  const swing = -2.1 * eob(clamp((frame - open - 3) / 16));
  // luz acende no beat 6
  const lightF = at(6);
  const ld = (frame - lightF) / fps;
  const lit = ld < 0 ? 0.75 : ld < 0.06 ? 0.2 : ld < 0.12 ? 1.6 : ld < 0.2 ? 0.4 : 1 + 0.3 * Math.exp(-ld * 4);
  const glow = ld > 0 ? Math.exp(-ld * 3) : 0;
  const yaw = -0.42 + 0.6 * clamp(frame / (at(7) || 150));
  const cam = camAt(frame, [
    {f: 0, cam: {position: [0.2, 0.3, 12.6], lookAt: [0, 0.1, 0]}},
    {f: lightF, cam: {position: [-0.2, 0.5, 10.8], lookAt: [0, 0.15, 0]}},
    {f: lightF + 30, cam: {position: [-0.3, 0.45, 9.8], lookAt: [0, 0.1, 0]}},
  ]);
  const shake = dt > 0 && dt < 0.5 ? 0.08 * Math.exp(-dt * 12) * Math.sin(dt * 70) : 0;

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 50% at 50% 45%, #1f1d1b, ${c.ink} 70%)`}}>
      {withAudio ? <Html5Audio src={staticFile(`${id}/score.wav`)} /> : null}
      <Stage3D cam={cam} shake={[shake, shake * 0.5, 0]} env={0.55}>
        <StudioLights lit={lit} />
        <Lock y={y} yaw={yaw} squash={squash} lift={lift} swing={swing} glow={glow} accent={c.accent} />
      </Stage3D>
      <div style={{position: 'absolute', left: 80, top: 150}}>
        <Headline lines={[['Abriu.']]} accentWords={['Abriu']} enter={open + 2} color={c.bg} accent={c.accent} family={brand.fonts.display.family} size={210} fps={fps} frame={frame} />
      </div>
    </AbsoluteFill>
  );
};
