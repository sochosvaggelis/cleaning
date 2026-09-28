import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/** Group whose meshes all cast and receive shadows. */
export function Shadowed({ children, cast = true, receive = true, ...props }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    ref.current.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = cast;
        object.receiveShadow = receive;
      }
    });
  });
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

export function Box({ args, material, ...props }) {
  return (
    <mesh material={material} {...props}>
      <boxGeometry args={args} />
    </mesh>
  );
}

const dummy = new THREE.Object3D();

/**
 * Many copies of one box in a single draw call.
 * `items` = [{ position: [x, y, z], rotation?: [x, y, z], scale?: [x, y, z] }]
 */
export function BoxInstances({ args, material, items }) {
  const ref = useRef(null);
  const size = args.join(',');
  const geometry = useMemo(() => new THREE.BoxGeometry(...size.split(',').map(Number)), [size]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    items.forEach((item, i) => {
      dummy.position.set(...item.position);
      dummy.rotation.set(...(item.rotation ?? [0, 0, 0]));
      dummy.scale.set(...(item.scale ?? [1, 1, 1]));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow receiveShadow />;
}
