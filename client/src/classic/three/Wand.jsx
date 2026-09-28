import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { fx } from './fx.js';

/**
 * A pressure-washer gun. Its origin is the nozzle tip and it is built along -Z,
 * so `lookAt(target)` aims the spray straight at the surface.
 */
export function Wand() {
  const ref = useRef(null);

  const materials = useMemo(
    () => ({
      dark: new THREE.MeshStandardMaterial({ color: '#1f2a37', roughness: 0.6 }),
      metal: new THREE.MeshStandardMaterial({ color: '#d5dbe1', roughness: 0.3, metalness: 0.55 }),
      body: new THREE.MeshStandardMaterial({ color: '#ffc83d', roughness: 0.45 }),
      tip: new THREE.MeshStandardMaterial({ color: '#27c46b', roughness: 0.4 }),
    }),
    [],
  );

  useFrame(() => {
    const group = ref.current;
    if (!group) return;
    group.visible = fx.presence > 0.02;
    if (!group.visible) return;
    group.position.copy(fx.nozzle);
    group.lookAt(fx.target);
    group.scale.setScalar(0.35 + 0.65 * fx.presence);
  });

  const alongZ = [Math.PI / 2, 0, 0];
  return (
    <group ref={ref} visible={false}>
      <mesh position={[0, 0, -0.03]} rotation={alongZ} material={materials.tip}>
        <cylinderGeometry args={[0.024, 0.03, 0.06, 12]} />
      </mesh>
      <mesh position={[0, 0, -0.37]} rotation={alongZ} material={materials.metal}>
        <cylinderGeometry args={[0.014, 0.014, 0.62, 10]} />
      </mesh>
      <mesh position={[0, 0, -0.715]} rotation={alongZ} material={materials.dark}>
        <cylinderGeometry args={[0.028, 0.028, 0.07, 12]} />
      </mesh>
      <mesh position={[0, 0.015, -0.9]} material={materials.body}>
        <boxGeometry args={[0.09, 0.12, 0.3]} />
      </mesh>
      <mesh position={[0, -0.14, -0.98]} rotation={[-0.35, 0, 0]} material={materials.dark}>
        <boxGeometry args={[0.07, 0.24, 0.09]} />
      </mesh>
      <mesh position={[0, -0.08, -0.88]} material={materials.dark}>
        <boxGeometry args={[0.025, 0.09, 0.03]} />
      </mesh>
    </group>
  );
}
