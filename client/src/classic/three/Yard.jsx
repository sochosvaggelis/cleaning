import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { dirtMaterial } from './dirtMaterial.js';
import { Box, Shadowed } from './parts.jsx';
import { SEGMENTS } from './stage.js';

const FLOWER_COLORS = ['#ff7eb6', '#ffd23f', '#b98cff', '#ff8c5a', '#ffffff'];

function Flowers() {
  const ref = useRef(null);
  const flowers = useMemo(() => {
    const beds = [
      { x: -2.45, w: 1.1 },
      { x: -4.62, w: 0.45 },
    ];
    const list = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    beds.forEach((bed) => {
      const count = Math.round(bed.w * 11);
      for (let i = 0; i < count; i += 1) {
        list.push({
          position: [bed.x + (rand() - 0.5) * bed.w, 0.16 + rand() * 0.14, -0.2 + (rand() - 0.5) * 0.34],
          color: FLOWER_COLORS[Math.floor(rand() * FLOWER_COLORS.length)],
        });
      }
    });
    return list;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    flowers.forEach((f, i) => {
      dummy.position.set(...f.position);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(f.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [flowers]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, flowers.length]}>
      <icosahedronGeometry args={[0.06, 0]} />
      <meshStandardMaterial roughness={0.6} />
    </instancedMesh>
  );
}

function RoundTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.15, 0.22, 1.7, 7]} />
        <meshStandardMaterial color="#7a5134" roughness={1} />
      </mesh>
      {[
        [0, 2.3, 0, 1.15, '#5aac4a'],
        [-0.55, 2.85, 0.35, 0.85, '#4f9d41'],
        [0.5, 2.8, -0.4, 0.8, '#66b955'],
      ].map(([x, y, z, r, color]) => (
        <mesh key={`${x}${y}`} position={[x, y, z]}>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={color} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function PineTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.6, 6]} />
        <meshStandardMaterial color="#6e4a2f" roughness={1} />
      </mesh>
      {[
        [0.95, 0.72, 1.1],
        [1.5, 0.56, 0.95],
        [2.0, 0.38, 0.8],
      ].map(([y, r, h]) => (
        <mesh key={y} position={[0, y, 0]}>
          <coneGeometry args={[r, h, 7]} />
          <meshStandardMaterial color="#3f8f4f" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Bush({ position, r }) {
  return (
    <mesh position={position}>
      <icosahedronGeometry args={[r, 1]} />
      <meshStandardMaterial color="#4f9a45" roughness={1} flatShading />
    </mesh>
  );
}

/** Driveway, front walkway, flower beds, trees and the mailbox. */
export function Yard() {
  const m = useMemo(
    () => ({
      concrete: dirtMaterial({
        segment: SEGMENTS.driveway,
        color: '#dcd8d0',
        dirt: '#5d5347',
        scale: 1.2,
        pattern: 'joints',
        patternScale: 0.62,
      }),
      pavers: dirtMaterial({
        segment: SEGMENTS.driveway,
        color: '#d2bea6',
        dirt: '#5f5a47',
        scale: 1.4,
        pattern: 'pavers',
        patternScale: 3.2,
      }),
      soil: new THREE.MeshStandardMaterial({ color: '#6b4a33', roughness: 1 }),
      post: new THREE.MeshStandardMaterial({ color: '#7a5134', roughness: 0.9 }),
      mailbox: new THREE.MeshStandardMaterial({ color: '#2f4f7f', roughness: 0.5 }),
      flag: new THREE.MeshStandardMaterial({ color: '#e5484d', roughness: 0.6 }),
    }),
    [],
  );

  return (
    <Shadowed>
      {/* driveway (garage → front edge) and the walkway to the front door */}
      <Box args={[2.2, 0.06, 6.5]} position={[-0.65, 0.03, 2.75]} material={m.concrete} />
      <Box args={[0.9, 0.05, 6.5]} position={[-3.7, 0.025, 2.75]} material={m.pavers} />
      <Box args={[1.1, 0.1, 0.5]} position={[-3.7, 0.1, -0.2]} material={m.pavers} />

      {/* flower beds along the front wall */}
      <Box args={[1.25, 0.09, 0.5]} position={[-2.45, 0.045, -0.2]} material={m.soil} />
      <Box args={[0.6, 0.09, 0.5]} position={[-4.62, 0.045, -0.2]} material={m.soil} />
      <Bush position={[-2.85, 0.3, -0.24]} r={0.32} />
      <Bush position={[-2.1, 0.26, -0.22]} r={0.26} />
      <Bush position={[-4.62, 0.27, -0.24]} r={0.27} />
      <Flowers />

      {/* mailbox */}
      <Box args={[0.08, 0.85, 0.08]} position={[-4.75, 0.42, 5.6]} material={m.post} />
      <Box args={[0.24, 0.22, 0.42]} position={[-4.75, 0.92, 5.6]} material={m.mailbox} />
      <Box args={[0.02, 0.14, 0.08]} position={[-4.62, 1.02, 5.5]} material={m.flag} />

      {/* trees & shrubs */}
      <RoundTree position={[5.3, 0, -3.3]} />
      <RoundTree position={[-6.7, 0, -5.0]} scale={0.8} />
      <PineTree position={[-7.0, 0, 4.6]} />
      <PineTree position={[-6.2, 0, 5.3]} scale={0.7} />
      <Bush position={[6.1, 0.3, 5.0]} r={0.42} />
      <Bush position={[5.55, 0.24, 5.4]} r={0.3} />
      <Bush position={[3.3, 0.26, -4.9]} r={0.36} />
    </Shadowed>
  );
}
