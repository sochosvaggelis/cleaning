import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { NOISE_GLSL } from './cleaningPath.js';
import { rig } from './rig.js';

const DROPS = 1100;
const WATER = new THREE.Color('#eef5ff');

// The fan-shaped sheet of water between the nozzle and the ground, with streaks racing down it.
const sheetVertex = /* glsl */ `
  uniform vec3 uNozzle;
  uniform vec3 uA;
  uniform vec3 uB;
  attribute vec2 aST;
  varying vec2 vST;
  void main() {
    vST = aST;
    vec3 pos = mix(uNozzle, mix(uA, uB, aST.x), aST.y);
    gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
  }
`;

const sheetFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vST;
  ${NOISE_GLSL}
  void main() {
    float s = vST.x;
    float t = vST.y;
    float edges = smoothstep(0.0, 0.14, s) * smoothstep(1.0, 0.86, s);
    float streak = noise2(vec2(s * 60.0, t * 5.0 - uTime * 16.0));
    float fine = noise2(vec2(s * 150.0, t * 11.0 - uTime * 26.0));
    float density = mix(0.9, 0.4, t) * smoothstep(0.0, 0.05, t);   // solid near the tip, breaking up lower down
    float a = density * (0.4 + 0.6 * streak) * (0.6 + 0.4 * fine) * edges * uIntensity;
    gl_FragColor = vec4(uColor, a * 0.85);
    #include <colorspace_fragment>
  }
`;

// Droplets in the jet, splash bouncing off the stone, and a little mist.
const dropsVertex = /* glsl */ `
  uniform vec3 uNozzle;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uNormal;
  uniform vec3 uBack;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSize;
  attribute vec4 aSeed;
  varying float vAlpha;
  varying float vSoft;

  void main() {
    vec3 pos;
    float alpha;
    float size;
    vec3 line = mix(uA, uB, aSeed.x);
    if (aSeed.w < 0.55) {
      float t = fract(uTime * (2.4 + aSeed.z * 1.6) + aSeed.y * 9.1);
      pos = mix(uNozzle, line, t) + uNormal * (aSeed.z - 0.5) * 0.014 * t;
      alpha = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.86, 1.0, t)) * 0.8;
      size = mix(0.45, 1.0, t);
      vSoft = 0.0;
    } else if (aSeed.w < 0.9) {
      float t = fract(uTime * (1.5 + aSeed.z) + aSeed.y * 5.3);
      vec3 across = (uB - uA) * (aSeed.y - 0.5) * 2.5;
      vec3 v = normalize(uBack * 0.9 + vec3(0.0, 0.7 + aSeed.z * 0.8, 0.0) + across) * (0.3 + aSeed.z * 0.45);
      pos = line + v * t + vec3(0.0, -0.9 * t * t, 0.0);
      pos.y = max(pos.y, 0.062);
      alpha = (1.0 - t) * 0.75;
      size = 0.75 + aSeed.z * 0.5;
      vSoft = 0.0;
    } else {
      float t = fract(uTime * (0.3 + aSeed.z * 0.3) + aSeed.y * 3.7);
      pos = line + uBack * t * 0.2 + vec3((aSeed.z - 0.5) * 0.35, 0.08 + t * 0.32, (aSeed.y - 0.5) * 0.3);
      alpha = sin(t * 3.14159) * 0.16;
      size = 4.5 + aSeed.z * 4.0;
      vSoft = 1.0;
    }
    vAlpha = alpha * uIntensity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * size / -mv.z;
  }
`;

const dropsFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vSoft;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = mix(smoothstep(0.5, 0.2, d), smoothstep(0.5, 0.0, d) * 0.6, vSoft) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;

function sheetGeometry(segS = 20, segT = 14) {
  const st = [];
  const index = [];
  for (let j = 0; j <= segT; j += 1) {
    for (let i = 0; i <= segS; i += 1) st.push(i / segS, j / segT);
  }
  for (let j = 0; j < segT; j += 1) {
    for (let i = 0; i < segS; i += 1) {
      const a = j * (segS + 1) + i;
      const b = a + segS + 1;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((st.length / 2) * 3), 3));
  g.setAttribute('aST', new THREE.Float32BufferAttribute(st, 2));
  g.setIndex(index);
  return g;
}

const a = new THREE.Vector3();
const b = new THREE.Vector3();
const along = new THREE.Vector3();

/** The water: a fan-shaped sheet plus GPU droplets, splash and mist, all driven by `rig`. */
export function Spray() {
  const { sheet, sheetMaterial, drops, dropsMaterial } = useMemo(() => {
    const shared = {
      uNozzle: { value: new THREE.Vector3() },
      uA: { value: new THREE.Vector3() },
      uB: { value: new THREE.Vector3() },
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uColor: { value: WATER },
    };
    const seeds = new Float32Array(DROPS * 4);
    for (let i = 0; i < seeds.length; i += 1) seeds[i] = Math.random();
    const dropsGeometry = new THREE.BufferGeometry();
    dropsGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DROPS * 3), 3));
    dropsGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));

    return {
      sheet: sheetGeometry(),
      sheetMaterial: new THREE.ShaderMaterial({
        vertexShader: sheetVertex,
        fragmentShader: sheetFragment,
        uniforms: shared,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      drops: dropsGeometry,
      dropsMaterial: new THREE.ShaderMaterial({
        vertexShader: dropsVertex,
        fragmentShader: dropsFragment,
        uniforms: {
          ...shared,
          uNormal: { value: new THREE.Vector3() },
          uBack: { value: new THREE.Vector3() },
          uSize: { value: 100 },
        },
        transparent: true,
        depthWrite: false,
      }),
    };
  }, []);

  useFrame(({ camera, gl }, delta) => {
    const u = dropsMaterial.uniforms; // shares uNozzle/uA/uB/uTime/uIntensity objects with the sheet
    u.uTime.value += delta;
    u.uIntensity.value = rig.spray;
    u.uNozzle.value.copy(rig.nozzle);
    a.copy(rig.target).addScaledVector(rig.fanAxis, -rig.fanHalfWidth);
    b.copy(rig.target).addScaledVector(rig.fanAxis, rig.fanHalfWidth);
    a.y = b.y = 0.062; // top of the pavers
    u.uA.value.copy(a);
    u.uB.value.copy(b);
    along.subVectors(rig.target, rig.nozzle);
    u.uNormal.value.crossVectors(b.clone().sub(a), along).normalize();
    u.uBack.value.copy(along).negate().normalize();
    // Droplets about 6 mm across, whatever the screen resolution.
    u.uSize.value = (0.006 * camera.projectionMatrix.elements[5] * gl.domElement.height) / 2;
  });

  return (
    <>
      <mesh geometry={sheet} material={sheetMaterial} frustumCulled={false} renderOrder={2} />
      <points geometry={drops} material={dropsMaterial} frustumCulled={false} renderOrder={3} />
    </>
  );
}
