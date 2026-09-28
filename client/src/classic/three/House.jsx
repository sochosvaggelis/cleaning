import { useMemo } from 'react';
import * as THREE from 'three';
import { dirtMaterial } from './dirtMaterial.js';
import { Box, Shadowed } from './parts.jsx';
import { SEGMENTS } from './stage.js';

// House body: x -5 … 0.5, z -4.5 … -0.5, walls 2.4 high, gable roof with its ridge along x.
const WALL_H = 2.4;
const ROOF_RISE = 1.25;
const HALF_DEPTH = 2;
const PITCH = Math.atan2(ROOF_RISE, HALF_DEPTH);
const SLOPE = Math.hypot(ROOF_RISE, HALF_DEPTH);
const PANEL_LEN = SLOPE + 0.35 + 0.05; // + eave overhang + overlap at the ridge
const PANEL_T = 0.12;

function roofPanel(front) {
  // The panel spans -0.05 … SLOPE + 0.35 measured down the slope from the ridge; place its centre
  // there, then lift it by half its thickness so it sits on the slope.
  const s = (SLOPE + 0.3) / 2;
  const sign = front ? 1 : -1;
  const z = -2.5 + sign * (Math.cos(PITCH) * s + Math.sin(PITCH) * (PANEL_T / 2));
  const y = WALL_H + ROOF_RISE - Math.sin(PITCH) * s + Math.cos(PITCH) * (PANEL_T / 2);
  return { position: [-2.25, y, z], rotation: [sign * PITCH, 0, 0] };
}

export function House() {
  const m = useMemo(
    () => ({
      siding: dirtMaterial({
        segment: SEGMENTS.house,
        color: '#f4f0e8',
        dirt: '#66764a',
        stretch: [1.4, 0.32, 1.4],
        pattern: 'siding',
        patternScale: 5,
      }),
      trim: dirtMaterial({ segment: SEGMENTS.house, color: '#ffffff', dirt: '#6a7050', scale: 2.2 }),
      door: dirtMaterial({ segment: SEGMENTS.house, color: '#2f6fb3', dirt: '#3f3d2e', scale: 2.4, grime: 0.75 }),
      garage: dirtMaterial({
        segment: SEGMENTS.house,
        color: '#eceff2',
        dirt: '#6b6b52',
        stretch: [1.4, 0.4, 1.4],
        pattern: 'siding',
        patternScale: 2.3,
      }),
      roof: new THREE.MeshStandardMaterial({ color: '#b95c45', roughness: 0.78 }),
      ridge: new THREE.MeshStandardMaterial({ color: '#8e4333', roughness: 0.8 }),
      brick: new THREE.MeshStandardMaterial({ color: '#9c4e3b', roughness: 0.9 }),
      glass: new THREE.MeshStandardMaterial({
        color: '#a6dbff',
        roughness: 0.1,
        metalness: 0.2,
        emissive: '#2c77a8',
        emissiveIntensity: 0.18,
      }),
      brass: new THREE.MeshStandardMaterial({ color: '#f2c94c', roughness: 0.3, metalness: 0.7 }),
      lamp: new THREE.MeshStandardMaterial({ color: '#fff4c7', emissive: '#ffd66b', emissiveIntensity: 0.6 }),
    }),
    [],
  );

  const gable = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-HALF_DEPTH, 0);
    shape.lineTo(HALF_DEPTH, 0);
    shape.lineTo(0, ROOF_RISE);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 5.5, bevelEnabled: false });
    geometry.rotateY(Math.PI / 2); // extrusion now runs along +x
    geometry.translate(-2.75, 0, 0);
    return geometry;
  }, []);

  const front = roofPanel(true);
  const back = roofPanel(false);

  return (
    <Shadowed>
      {/* walls + attic */}
      <Box args={[5.5, WALL_H, 4]} position={[-2.25, WALL_H / 2, -2.5]} material={m.siding} />
      <mesh geometry={gable} material={m.siding} position={[-2.25, WALL_H, -2.5]} />

      {/* roof */}
      <Box args={[6.1, PANEL_T, PANEL_LEN]} position={front.position} rotation={front.rotation} material={m.roof} />
      <Box args={[6.1, PANEL_T, PANEL_LEN]} position={back.position} rotation={back.rotation} material={m.roof} />
      <Box args={[6.15, 0.1, 0.3]} position={[-2.25, WALL_H + ROOF_RISE + 0.07, -2.5]} material={m.ridge} />
      <Box args={[0.55, 1.4, 0.55]} position={[-4.1, 3.55, -3.3]} material={m.brick} />
      <Box args={[0.68, 0.1, 0.68]} position={[-4.1, 4.28, -3.3]} material={m.ridge} />

      {/* corner boards */}
      {[
        [-5, -0.5],
        [0.5, -0.5],
        [-5, -4.5],
        [0.5, -4.5],
      ].map(([x, z]) => (
        <Box key={`${x}${z}`} args={[0.14, WALL_H, 0.14]} position={[x, WALL_H / 2, z]} material={m.trim} />
      ))}

      {/* front door */}
      <Box args={[0.98, 1.72, 0.04]} position={[-3.7, 0.86, -0.48]} material={m.trim} />
      <Box args={[0.8, 1.6, 0.06]} position={[-3.7, 0.8, -0.47]} material={m.door} />
      <mesh position={[-3.43, 0.82, -0.42]} material={m.brass}>
        <sphereGeometry args={[0.045, 12, 10]} />
      </mesh>
      <Box args={[0.12, 0.16, 0.1]} position={[-4.25, 1.75, -0.44]} material={m.lamp} />

      {/* front window */}
      <Box args={[1.24, 0.07, 0.16]} position={[-2.35, 0.99, -0.43]} material={m.trim} />
      <Box args={[1.1, 0.95, 0.05]} position={[-2.35, 1.45, -0.475]} material={m.trim} />
      <Box args={[0.94, 0.8, 0.06]} position={[-2.35, 1.45, -0.465]} material={m.glass} />
      <Box args={[0.05, 0.8, 0.07]} position={[-2.35, 1.45, -0.46]} material={m.trim} />
      <Box args={[0.94, 0.05, 0.07]} position={[-2.35, 1.45, -0.46]} material={m.trim} />

      {/* garage door */}
      <Box args={[1.86, 1.86, 0.04]} position={[-0.65, 0.93, -0.48]} material={m.trim} />
      <Box args={[1.7, 1.75, 0.06]} position={[-0.65, 0.875, -0.47]} material={m.garage} />

      {/* side windows: patio door to the deck (left) and a window on the right */}
      <Box args={[0.05, 1.85, 1.35]} position={[-5.02, 1.2, -2.4]} material={m.trim} />
      <Box args={[0.06, 1.7, 1.2]} position={[-5.03, 1.2, -2.4]} material={m.glass} />
      <Box args={[0.07, 1.7, 0.05]} position={[-5.035, 1.2, -2.4]} material={m.trim} />
      <Box args={[0.05, 0.95, 1.1]} position={[0.52, 1.45, -2.5]} material={m.trim} />
      <Box args={[0.06, 0.8, 0.94]} position={[0.53, 1.45, -2.5]} material={m.glass} />
    </Shadowed>
  );
}
