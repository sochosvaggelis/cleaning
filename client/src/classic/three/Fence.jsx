import { useMemo } from 'react';
import { dirtMaterial } from './dirtMaterial.js';
import { Box, BoxInstances, Shadowed } from './parts.jsx';
import { SEGMENTS } from './stage.js';

// An L-shaped picket fence: along the right side (x = 6.9) and the back-right edge (z = -5.7).
const woodOptions = { color: '#dcaa6c', dirt: '#56663f', scale: 1.7, stretch: [1, 0.3, 1] };

export function Fence() {
  const m = useMemo(
    () => ({
      side: dirtMaterial({ segment: SEGMENTS.fenceSide, ...woodOptions }),
      back: dirtMaterial({ segment: SEGMENTS.fenceBack, ...woodOptions }),
    }),
    [],
  );

  const layout = useMemo(() => {
    const sidePickets = [];
    for (let z = -5.55; z <= 5.6; z += 0.2) sidePickets.push({ position: [6.93, 0.56, z] });
    const backPickets = [];
    for (let x = 1.3; x <= 6.75; x += 0.2) backPickets.push({ position: [x, 0.56, -5.73] });
    const sidePosts = [-5.7, -3.8, -1.9, 0, 1.9, 3.8, 5.7].map((z) => ({ position: [6.86, 0.6, z] }));
    const backPosts = [1.2, 3.1, 5.0].map((x) => ({ position: [x, 0.6, -5.66] }));
    return { sidePickets, backPickets, sidePosts, backPosts };
  }, []);

  return (
    <Shadowed>
      <BoxInstances args={[0.05, 1.0, 0.15]} material={m.side} items={layout.sidePickets} />
      <BoxInstances args={[0.13, 1.18, 0.13]} material={m.side} items={layout.sidePosts} />
      <Box args={[0.06, 0.09, 11.4]} position={[6.87, 0.3, 0]} material={m.side} />
      <Box args={[0.06, 0.09, 11.4]} position={[6.87, 0.84, 0]} material={m.side} />

      <BoxInstances args={[0.15, 1.0, 0.05]} material={m.back} items={layout.backPickets} />
      <BoxInstances args={[0.13, 1.18, 0.13]} material={m.back} items={layout.backPosts} />
      <Box args={[5.7, 0.09, 0.06]} position={[4.05, 0.3, -5.67]} material={m.back} />
      <Box args={[5.7, 0.09, 0.06]} position={[4.05, 0.84, -5.67]} material={m.back} />
    </Shadowed>
  );
}
