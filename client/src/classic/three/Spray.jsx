import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { fx } from './fx.js';

const COUNT = 900;
const DROPLET_SIZE = 0.07; // world units

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uNozzle;
  uniform vec3 uTarget;
  uniform vec3 uNormal;
  uniform vec3 uFan;
  uniform float uIntensity;
  uniform float uSize;
  attribute vec4 aSeed;
  varying float vAlpha;

  void main() {
    vec3 toTarget = uTarget - uNozzle;
    float len = max(length(toTarget), 0.001);
    vec3 fwd = toTarget / len;
    vec3 fan = normalize(uFan - fwd * dot(uFan, fwd) + vec3(1e-4));
    vec3 up = cross(fan, fwd);

    float t = fract(uTime * (1.5 + aSeed.z * 1.2) + aSeed.w * 13.37);
    vec3 pos;
    float alpha;
    float size;

    if (aSeed.w < 0.68) {
      // Jet: a flat fan that widens with distance, like a 25° nozzle tip.
      float spread = t * len * 0.3;
      pos = uNozzle + fwd * (t * len)
          + fan * (aSeed.x - 0.5) * 2.0 * spread
          + up * (aSeed.y - 0.5) * 0.05 * t * len;
      alpha = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.86, 1.0, t)) * 0.6;
      size = mix(0.45, 1.0, t);
    } else {
      // Splash: droplets bouncing off the surface along the fan line.
      vec3 n = normalize(uNormal);
      vec3 t1 = normalize(cross(n, abs(n.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
      vec3 t2 = cross(n, t1);
      float angle = aSeed.x * 6.2831853;
      vec3 base = uTarget + fan * (aSeed.z - 0.5) * len * 0.55;
      float radius = (0.2 + aSeed.y * 0.8) * t;
      pos = base + (t1 * cos(angle) + t2 * sin(angle)) * radius
          + n * sin(t * 3.14159) * (0.2 + aSeed.y * 0.45);
      alpha = (1.0 - t) * 0.55;
      size = 0.8 + aSeed.y * 0.6;
    }

    vAlpha = alpha * uIntensity;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * size / -mvPosition.z;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;

/** GPU water spray: every droplet's path is computed in the vertex shader from time + a random seed. */
export function Spray() {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < seeds.length; i += 1) seeds[i] = Math.random();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));

    const m = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uNozzle: { value: new THREE.Vector3() },
        uTarget: { value: new THREE.Vector3() },
        uNormal: { value: new THREE.Vector3(0, 1, 0) },
        uFan: { value: new THREE.Vector3(1, 0, 0) },
        uIntensity: { value: 0 },
        uSize: { value: 100 },
        uColor: { value: new THREE.Color('#e4f6ff') },
      },
    });
    return { geometry: g, material: m };
  }, []);

  useFrame(({ camera, gl }, delta) => {
    const u = material.uniforms;
    u.uTime.value += delta;
    u.uNozzle.value.copy(fx.nozzle);
    u.uTarget.value.copy(fx.target);
    u.uNormal.value.copy(fx.normal);
    u.uFan.value.copy(fx.fan);
    u.uIntensity.value = fx.intensity;
    // Pixel size of a droplet of DROPLET_SIZE world units at distance 1.
    u.uSize.value = (DROPLET_SIZE * camera.projectionMatrix.elements[5] * gl.domElement.height) / 2;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
