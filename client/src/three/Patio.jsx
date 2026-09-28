import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CLEANING_GLSL, cleaningUniforms, NOISE_GLSL } from './cleaningPath.js';

// Rectangular concrete pavers (24 × 12 cm, 6 cm thick) laid in a running bond.
const PAVER = { x: 0.235, y: 0.06, z: 0.115 };
const PITCH = { x: 0.241, z: 0.121 };
const AREA = { xMin: -4.6, xMax: 5.0, zMin: -6.0, zMax: 1.9 };
const SAND_LEVEL = 0.047; // joint sand sits about 1 cm below the paver tops
const TONES = ['#b3a898', '#a79b8b', '#9d9282', '#b8ad99', '#978d80', '#aca08e'];

const VERTEX_PARS = /* glsl */ `
  varying vec3 vWorldP;
  varying vec3 vLocalP;
  varying float vSeed;
`;

const VERTEX_MAIN = /* glsl */ `
  vec4 worldP4 = vec4(transformed, 1.0);
  vec4 centerP4 = vec4(0.0, 0.0, 0.0, 1.0);
  #ifdef USE_INSTANCING
    worldP4 = instanceMatrix * worldP4;
    centerP4 = instanceMatrix * centerP4;
  #endif
  vWorldP = (modelMatrix * worldP4).xyz;
  centerP4 = modelMatrix * centerP4;
  vLocalP = position;
  vSeed = fract(sin(dot(centerP4.xz, vec2(12.9898, 78.233))) * 43758.5453);
`;

function injectVertex(shader) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${VERTEX_PARS}`)
    .replace('#include <fog_vertex>', `#include <fog_vertex>\n${VERTEX_MAIN}`);
}

/** Paver material: stone grain + grime that gets washed off along the cleaning path. */
function paverMaterial() {
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.84, metalness: 0 });
  const own = {
    uHalfSize: { value: new THREE.Vector2(PAVER.x / 2, PAVER.z / 2) },
    uBump: { value: 0.0008 },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, cleaningUniforms, own);
    injectVertex(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        ${VERTEX_PARS}
        uniform vec2 uHalfSize;
        uniform float uBump;
        ${NOISE_GLSL}
        ${CLEANING_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float cleanAmt;
        float wetAmt;
        float foamAmt;
        {
          vec2 p = vWorldP.xz;
          vec2 cw = cleaningAt(p, (noise2(p * 11.0) - 0.5) * 0.02);
          cleanAmt = cw.x;
          float dImpact = impactDistance(p);
          foamAmt = (1.0 - smoothstep(0.0, 0.022, dImpact + (noise2(p * 70.0) - 0.5) * 0.012)) * uSpray;
          wetAmt = max(cw.y, (1.0 - smoothstep(0.02, 0.17, dImpact)) * uSpray);

          float grain = noise2(p * 70.0 + vSeed * 31.0);
          float grain2 = noise2(p * 190.0);
          vec3 stone = diffuseColor.rgb * (0.88 + 0.16 * grain + 0.07 * grain2);

          // Grime darkens and greens the stone unevenly; algae hugs the joints; tiny black lichen dots.
          float edgeDist = min(uHalfSize.x - abs(vLocalP.x), uHalfSize.y - abs(vLocalP.z));
          float nearJoint = 1.0 - smoothstep(0.0, 0.02, edgeDist);
          float film = fbm2(p * 1.2 + 3.1);
          float mottle = fbm2(p * 8.0 + vSeed * 13.0);
          float dots = smoothstep(0.86, 0.91, noise2(p * 140.0 + vSeed * 5.0)) * step(0.45, fbm2(p * 3.0));
          float darkness = mix(0.36, 0.58, film) * (0.8 + 0.4 * mottle);
          vec3 tint = mix(vec3(1.0), vec3(0.84, 0.95, 0.72), clamp(0.35 + 0.8 * (mottle - 0.4), 0.0, 1.0));
          vec3 dirty = stone * darkness * tint;
          dirty = mix(dirty, dirty * vec3(0.6, 0.72, 0.5), nearJoint * 0.85);
          dirty = mix(dirty, vec3(0.025, 0.027, 0.024), dots * 0.7);

          vec3 color = mix(dirty, stone, cleanAmt) * (1.0 - wetAmt * 0.34);
          diffuseColor.rgb = mix(color, vec3(0.86, 0.9, 0.93), foamAmt * 0.45);
        }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.97, roughnessFactor, cleanAmt);
        roughnessFactor = mix(roughnessFactor, 0.16, max(wetAmt, foamAmt));`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          // Bump the stone grain (same idea as three's bump maps, from procedural height).
          float h = (noise2(vWorldP.xz * 70.0 + vSeed * 31.0) * 0.65 + noise2(vWorldP.xz * 190.0) * 0.35)
                    * uBump * (1.0 - wetAmt * 0.6);
          vec3 dpdx = dFdx(-vViewPosition);
          vec3 dpdy = dFdy(-vViewPosition);
          vec3 r1 = cross(dpdy, normal);
          vec3 r2 = cross(normal, dpdx);
          float det = dot(dpdx, r1);
          vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
          normal = normalize(abs(det) * normal - grad);
        }`,
      );
  };
  material.customProgramCacheKey = () => 'paver-v2';
  return material;
}

/** The sand in the joints: clean sand once washed, dark moss before. */
function sandMaterial() {
  const material = new THREE.MeshStandardMaterial({ color: '#a8997c', roughness: 1 });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, cleaningUniforms);
    injectVertex(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${VERTEX_PARS}\n${NOISE_GLSL}\n${CLEANING_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          vec2 cw = cleaningAt(vWorldP.xz, 0.0);
          float moss = fbm2(vWorldP.xz * 14.0);
          vec3 dirty = mix(vec3(0.035, 0.04, 0.028), vec3(0.08, 0.095, 0.05), moss);
          float wet = max(cw.y, (1.0 - smoothstep(0.02, 0.24, impactDistance(vWorldP.xz))) * uSpray);
          diffuseColor.rgb = mix(dirty, diffuseColor.rgb, cw.x) * (1.0 - wet * 0.4);
        }`,
      );
  };
  material.customProgramCacheKey = () => 'sand-v2';
  return material;
}

// Small deterministic random generator so the layout is identical on every load.
function random(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function Patio() {
  const ref = useRef(null);

  const { geometry, material, sand, sandGeometry, items } = useMemo(() => {
    const rand = random(42);
    const list = [];
    let row = 0;
    for (let z = AREA.zMin; z <= AREA.zMax; z += PITCH.z, row += 1) {
      const offset = row % 2 ? PITCH.x / 2 : 0;
      for (let x = AREA.xMin + offset; x <= AREA.xMax; x += PITCH.x) {
        list.push({
          x: x + (rand() - 0.5) * 0.004,
          y: PAVER.y / 2 + (rand() - 0.5) * 0.003,
          z: z + (rand() - 0.5) * 0.004,
          rx: (rand() - 0.5) * 0.008,
          ry: (rand() - 0.5) * 0.02,
          rz: (rand() - 0.5) * 0.008,
          tone: TONES[Math.floor(rand() * TONES.length)],
          shade: 0.92 + rand() * 0.14,
        });
      }
    }
    const sandGeo = new THREE.PlaneGeometry(AREA.xMax - AREA.xMin + 1, AREA.zMax - AREA.zMin + 1);
    sandGeo.rotateX(-Math.PI / 2);
    sandGeo.translate((AREA.xMin + AREA.xMax) / 2, SAND_LEVEL, (AREA.zMin + AREA.zMax) / 2);
    return {
      geometry: new RoundedBoxGeometry(PAVER.x, PAVER.y, PAVER.z, 1, 0.009),
      material: paverMaterial(),
      sand: sandMaterial(),
      sandGeometry: sandGeo,
      items: list,
    };
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    items.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(p.tone).multiplyScalar(p.shade));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  return (
    <group>
      <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow receiveShadow />
      <mesh geometry={sandGeometry} material={sand} receiveShadow />
    </group>
  );
}
