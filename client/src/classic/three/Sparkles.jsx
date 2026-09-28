import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { fx } from './fx.js';

const COUNT = 110;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSize;
  attribute vec4 aSeed;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.7 + aSeed.w * 6.2831) * 0.1;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float twinkle = pow(0.5 + 0.5 * sin(uTime * (1.3 + aSeed.x * 2.2) + aSeed.w * 6.2831), 5.0);
    vAlpha = twinkle * uIntensity;
    gl_PointSize = uSize * (0.6 + aSeed.y * 0.8) * (0.35 + twinkle) / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float core = smoothstep(0.18, 0.0, length(c));
    float rays = smoothstep(0.05, 0.0, abs(c.x)) * smoothstep(0.5, 0.0, abs(c.y))
               + smoothstep(0.05, 0.0, abs(c.y)) * smoothstep(0.5, 0.0, abs(c.x));
    float a = clamp(core + rays, 0.0, 1.0) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(1.0, 0.97, 0.86, a);
    #include <colorspace_fragment>
  }
`;

/** Twinkling "just cleaned" sparkles that appear over the finished property. */
export function Sparkles() {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = 0.2 + Math.random() * 3.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 11.5;
      for (let k = 0; k < 4; k += 1) seeds[i * 4 + k] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));

    const m = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 }, uSize: { value: 300 } },
    });
    return { geometry: g, material: m };
  }, []);

  useFrame(({ camera, gl }, delta) => {
    material.uniforms.uTime.value += delta;
    material.uniforms.uIntensity.value = fx.sparkle;
    material.uniforms.uSize.value = (0.5 * camera.projectionMatrix.elements[5] * gl.domElement.height) / 2;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
