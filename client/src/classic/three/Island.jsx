import { useMemo } from 'react';
import * as THREE from 'three';

function roundedRect(width, depth, radius) {
  const x = -width / 2;
  const y = -depth / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + depth - radius);
  shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  shape.lineTo(x + radius, y + depth);
  shape.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

/** Slab lying flat on the ground plane, with its top face at y = top. */
function slab(width, depth, radius, thickness, top, bevel = 0) {
  const geometry = new THREE.ExtrudeGeometry(roundedRect(width, depth, radius), {
    depth: thickness,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geometry.rotateX(-Math.PI / 2); // extrude upwards
  geometry.translate(0, top - thickness - bevel, 0);
  return geometry;
}

// Deterministic 0..1 noise so duplicated seam vertices move together (no cracks).
function hash(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

function rockBottom() {
  const geometry = new THREE.CylinderGeometry(7.4, 1.3, 4.4, 11, 3);
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i);
    if (v.y > 2.1) continue; // keep the top ring flush with the soil layer
    const kx = Math.round(v.x * 100);
    const ky = Math.round(v.y * 100);
    const kz = Math.round(v.z * 100);
    pos.setXYZ(
      i,
      v.x + (hash(kx, ky, kz) - 0.5) * 1.1,
      v.y + (hash(kz, kx, ky) - 0.5) * 0.6,
      v.z + (hash(ky, kz, kx) - 0.5) * 1.1,
    );
  }
  geometry.computeVertexNormals();
  geometry.scale(1.05, 1, 0.78);
  geometry.translate(0, -3.85, 0);
  return geometry;
}

/** The floating island the property sits on. Its grass top is at y = 0. */
export function Island() {
  const geometries = useMemo(
    () => ({
      grass: slab(16.2, 12.2, 1.0, 0.3, 0, 0.1),
      soil: slab(16.1, 12.1, 1.0, 1.3, -0.45),
      rock: rockBottom(),
    }),
    [],
  );

  return (
    <group>
      <mesh geometry={geometries.grass} receiveShadow>
        <meshStandardMaterial color="#7cc257" roughness={1} />
      </mesh>
      <mesh geometry={geometries.soil}>
        <meshStandardMaterial color="#9c6b43" roughness={1} />
      </mesh>
      <mesh geometry={geometries.rock}>
        <meshStandardMaterial color="#7f6b59" roughness={1} flatShading />
      </mesh>
    </group>
  );
}
