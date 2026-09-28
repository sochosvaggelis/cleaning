import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { rig } from './rig.js';

/**
 * The pressure-washer gun and lance, seen from the operator's point of view: the gun sits
 * just below the bottom edge of the screen, the lance reaches out to the nozzle.
 * Origin = nozzle tip, built along -Z so lookAt(target) aims it.
 */
export function Wand() {
  const group = useRef(null);
  const lance = useRef(null);
  const gun = useRef(null);

  const parts = useMemo(() => {
    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.2, -0.06),
      new THREE.Vector3(0, -0.36, -0.02),
      new THREE.Vector3(0.05, -0.62, 0.12),
      new THREE.Vector3(0.12, -1.1, 0.3),
    ]);
    return {
      hose: new THREE.TubeGeometry(hoseCurve, 24, 0.016, 8, false),
      steel: new THREE.MeshStandardMaterial({ color: '#d7dde3', metalness: 0.9, roughness: 0.22 }),
      black: new THREE.MeshStandardMaterial({ color: '#16191d', roughness: 0.55 }),
      rubber: new THREE.MeshStandardMaterial({ color: '#101214', roughness: 0.85 }),
      brass: new THREE.MeshStandardMaterial({ color: '#c9a24a', metalness: 0.85, roughness: 0.3 }),
      tip: new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.4 }),
      accent: new THREE.MeshStandardMaterial({ color: '#0b63e5', roughness: 0.4 }),
    };
  }, []);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.position.copy(rig.nozzle);
    g.lookAt(rig.target);
    const length = rig.nozzle.distanceTo(rig.hands);
    lance.current.scale.set(1, Math.max(length - 0.05, 0.1), 1);
    lance.current.position.z = -length / 2;
    gun.current.position.z = -length;
  });

  const alongZ = [Math.PI / 2, 0, 0];
  return (
    <group ref={group}>
      {/* quick-connect nozzle tip (white = 40° fan) */}
      <mesh position={[0, 0, -0.02]} rotation={alongZ} material={parts.tip}>
        <cylinderGeometry args={[0.011, 0.013, 0.04, 16]} />
      </mesh>
      <mesh position={[0, 0, -0.052]} rotation={alongZ} material={parts.brass}>
        <cylinderGeometry args={[0.015, 0.015, 0.03, 16]} />
      </mesh>
      <mesh ref={lance} rotation={alongZ} material={parts.steel}>
        <cylinderGeometry args={[0.0085, 0.0085, 1, 12]} />
      </mesh>

      <group ref={gun}>
        <mesh position={[0, 0, 0.03]} rotation={alongZ} material={parts.brass}>
          <cylinderGeometry args={[0.016, 0.016, 0.05, 16]} />
        </mesh>
        <mesh position={[0, 0.005, -0.1]} material={parts.black}>
          <boxGeometry args={[0.05, 0.075, 0.22]} />
        </mesh>
        <mesh position={[0, 0.02, -0.1]} material={parts.accent}>
          <boxGeometry args={[0.052, 0.012, 0.12]} />
        </mesh>
        <mesh position={[0, -0.09, -0.17]} rotation={[-0.32, 0, 0]} material={parts.black}>
          <boxGeometry args={[0.045, 0.17, 0.06]} />
        </mesh>
        <mesh position={[0, -0.055, -0.1]} material={parts.black}>
          <boxGeometry args={[0.02, 0.07, 0.025]} />
        </mesh>
        <mesh geometry={parts.hose} material={parts.rubber} position={[0, 0, -0.17]} />
      </group>
    </group>
  );
}
