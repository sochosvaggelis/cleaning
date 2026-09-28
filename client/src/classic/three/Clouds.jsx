import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const CLOUDS = [
  { position: [-14, 7.5, -10], scale: 1.25, speed: 0.11, phase: 0 },
  { position: [14, 9.5, -8], scale: 1.0, speed: 0.08, phase: 2 },
  { position: [-17, 4.5, 6], scale: 0.85, speed: 0.1, phase: 4 },
  { position: [6, 12.5, -16], scale: 1.45, speed: 0.06, phase: 1 },
  { position: [18, 5, 4], scale: 0.75, speed: 0.12, phase: 3 },
];
const PUFFS = [
  [0, 0, 0, 1],
  [0.95, -0.12, 0.1, 0.75],
  [-0.95, -0.18, 0, 0.7],
  [0.35, 0.5, -0.1, 0.72],
  [-0.4, 0.38, 0.22, 0.6],
];

export function Clouds() {
  const refs = useRef([]);
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 1 }),
    [],
  );
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 3), []);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const time = clock.elapsedTime;
    CLOUDS.forEach((cloud, i) => {
      const group = refs.current[i];
      if (group) group.position.x = cloud.position[0] + Math.sin(time * cloud.speed + cloud.phase) * 1.4;
    });
  });

  return CLOUDS.map((cloud, i) => (
    <group
      key={cloud.phase}
      ref={(el) => {
        refs.current[i] = el;
      }}
      position={cloud.position}
      scale={cloud.scale}
    >
      {PUFFS.map(([x, y, z, r]) => (
        <mesh key={`${x}${y}`} geometry={geometry} material={material} position={[x, y, z]} scale={r} />
      ))}
    </group>
  ));
}
