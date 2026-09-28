import { useMemo } from 'react';
import { dirtMaterial } from './dirtMaterial.js';
import { Box, BoxInstances, Shadowed } from './parts.jsx';
import { SEGMENTS } from './stage.js';

// Deck on the left of the house: x -7.8 … -5.1, z -4.3 … 0.1, top at y = 0.3.
const CX = -6.45;
const CZ = -2.1;
const TOP = 0.3;

function Chair({ position, facing, materials }) {
  return (
    <group position={position} rotation={[0, facing, 0]}>
      <Box args={[0.42, 0.05, 0.42]} position={[0, 0.42, 0]} material={materials.plastic} />
      <Box args={[0.05, 0.5, 0.42]} position={[-0.19, 0.67, 0]} material={materials.plastic} />
      {[
        [-0.17, -0.17],
        [-0.17, 0.17],
        [0.17, -0.17],
        [0.17, 0.17],
      ].map(([x, z]) => (
        <Box key={`${x}${z}`} args={[0.04, 0.42, 0.04]} position={[x, 0.21, z]} material={materials.plastic} />
      ))}
    </group>
  );
}

export function Deck() {
  const m = useMemo(
    () => ({
      boards: dirtMaterial({
        segment: SEGMENTS.deck,
        color: '#cf955d',
        dirt: '#6e6a58',
        scale: 1.5,
        stretch: [1.6, 1.6, 0.45],
      }),
      frame: dirtMaterial({ segment: SEGMENTS.deck, color: '#9c663e', dirt: '#56533f', scale: 1.8 }),
      plastic: dirtMaterial({ segment: SEGMENTS.deck, color: '#f6f5f1', dirt: '#78745f', scale: 3.2 }),
    }),
    [],
  );

  const planks = useMemo(
    () => Array.from({ length: 11 }, (_, i) => ({ position: [CX + (i - 5) * 0.235, TOP - 0.03, CZ] })),
    [],
  );

  const posts = useMemo(
    () => [
      ...[0.04, -1.4, -2.8, -4.24].map((z) => ({ position: [-7.74, TOP + 0.45, z] })),
      ...[-6.45, -5.2].map((x) => ({ position: [x, TOP + 0.45, -4.24] })),
    ],
    [],
  );

  const balusters = useMemo(() => {
    const list = [];
    for (let z = -4.0; z <= -0.1; z += 0.26) list.push({ position: [-7.74, TOP + 0.42, z] });
    for (let x = -7.5; x <= -5.3; x += 0.26) list.push({ position: [x, TOP + 0.42, -4.24] });
    return list;
  }, []);

  return (
    <Shadowed>
      <Box args={[2.7, 0.24, 4.4]} position={[CX, 0.12, CZ]} material={m.frame} />
      <BoxInstances args={[0.21, 0.06, 4.4]} material={m.boards} items={planks} />
      <Box args={[1.0, 0.15, 0.35]} position={[CX, 0.075, 0.28]} material={m.frame} />

      {/* railing on the two outer sides */}
      <BoxInstances args={[0.1, 0.9, 0.1]} material={m.frame} items={posts} />
      <BoxInstances args={[0.035, 0.8, 0.035]} material={m.frame} items={balusters} />
      <Box args={[0.1, 0.07, 4.4]} position={[-7.74, TOP + 0.88, CZ]} material={m.frame} />
      <Box args={[2.64, 0.07, 0.1]} position={[CX, TOP + 0.88, -4.24]} material={m.frame} />

      {/* patio set */}
      <group position={[-6.55, TOP, -2.3]}>
        <mesh position={[0, 0.7, 0]} material={m.plastic}>
          <cylinderGeometry args={[0.42, 0.42, 0.05, 24]} />
        </mesh>
        <mesh position={[0, 0.35, 0]} material={m.plastic}>
          <cylinderGeometry args={[0.035, 0.035, 0.68, 8]} />
        </mesh>
        <mesh position={[0, 0.02, 0]} material={m.plastic}>
          <cylinderGeometry args={[0.2, 0.22, 0.04, 16]} />
        </mesh>
      </group>
      <Chair position={[-7.25, TOP, -2.3]} facing={0} materials={m} />
      <Chair position={[-5.85, TOP, -2.3]} facing={Math.PI} materials={m} />

      {/* potted plant */}
      <mesh position={[-7.45, TOP + 0.16, -0.2]}>
        <cylinderGeometry args={[0.18, 0.13, 0.32, 10]} />
        <meshStandardMaterial color="#c8683f" roughness={0.8} />
      </mesh>
      <mesh position={[-7.45, TOP + 0.55, -0.2]}>
        <icosahedronGeometry args={[0.27, 1]} />
        <meshStandardMaterial color="#4f9a45" roughness={1} flatShading />
      </mesh>
    </Shadowed>
  );
}
