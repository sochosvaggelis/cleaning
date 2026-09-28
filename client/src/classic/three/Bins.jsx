import { useMemo } from 'react';
import * as THREE from 'three';
import { dirtMaterial } from './dirtMaterial.js';
import { Box, Shadowed } from './parts.jsx';
import { SEGMENTS } from './stage.js';

const PAD_TOP = 0.04;
const BINS = [
  { x: 1.15, body: '#2f6d50', lid: '#3f9467' },
  { x: 1.75, body: '#2f5d9e', lid: '#3d7bd0' },
  { x: 2.35, body: '#3f4955', lid: '#59677a' },
];

function WheelieBin({ x, body, lid, wheel }) {
  const materials = useMemo(
    () => ({
      body: dirtMaterial({ segment: SEGMENTS.bins, color: body, dirt: '#4a3a28', scale: 3.2, flatShading: true }),
      lid: dirtMaterial({ segment: SEGMENTS.bins, color: lid, dirt: '#4a3a28', scale: 3.2 }),
    }),
    [body, lid],
  );

  return (
    <group position={[x, PAD_TOP, -0.85]}>
      {/* 4-sided tapered cylinder = classic wheelie-bin shape */}
      <mesh position={[0, 0.41, 0]} rotation={[0, Math.PI / 4, 0]} material={materials.body}>
        <cylinderGeometry args={[0.34, 0.29, 0.82, 4, 1]} />
      </mesh>
      <Box args={[0.52, 0.06, 0.54]} position={[0, 0.85, -0.01]} material={materials.lid} />
      <Box args={[0.4, 0.05, 0.06]} position={[0, 0.82, -0.29]} material={materials.lid} />
      {[-0.18, 0.18].map((wx) => (
        <mesh key={wx} position={[wx, 0.08, -0.25]} rotation={[0, 0, Math.PI / 2]} material={wheel}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 14]} />
        </mesh>
      ))}
    </group>
  );
}

export function Bins() {
  const shared = useMemo(
    () => ({
      pad: new THREE.MeshStandardMaterial({ color: '#cbc6bd', roughness: 0.95 }),
      wheel: new THREE.MeshStandardMaterial({ color: '#1f2630', roughness: 0.7 }),
    }),
    [],
  );

  return (
    <Shadowed>
      <Box args={[2.0, PAD_TOP, 1.1]} position={[1.75, PAD_TOP / 2, -0.8]} material={shared.pad} />
      {BINS.map((bin) => (
        <WheelieBin key={bin.x} {...bin} wheel={shared.wheel} />
      ))}
    </Shadowed>
  );
}
