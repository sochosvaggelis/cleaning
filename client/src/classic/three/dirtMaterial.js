import * as THREE from 'three';
import { EDGE_PAD } from './stage.js';

const PATTERNS = { none: 0, siding: 1, pavers: 2, joints: 3 };

const NOISE_GLSL = /* glsl */ `
  float dirtHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float dirtNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dirtHash(i), dirtHash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(dirtHash(i + vec3(0.0, 1.0, 0.0)), dirtHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(dirtHash(i + vec3(0.0, 0.0, 1.0)), dirtHash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(dirtHash(i + vec3(0.0, 1.0, 1.0)), dirtHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }
  float dirtFbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * dirtNoise(p);
      p = p * 2.07 + vec3(11.3, 7.1, 3.7);
      a *= 0.5;
    }
    return v;
  }
`;

const FRAGMENT_PARS = /* glsl */ `
  varying vec3 vDirtWorld;
  uniform float uProgress;
  uniform vec3 uOrigin;
  uniform vec3 uDir;
  uniform float uLength;
  uniform vec3 uDirtColor;
  uniform float uGrime;
  uniform vec3 uNoiseScale;
  uniform float uPattern;
  uniform float uPatternScale;
  ${NOISE_GLSL}
`;

const PAD = EDGE_PAD.toFixed(3);

// Runs right after the base colour is known: paint grime on, then wash it off behind the wipe edge.
const FRAGMENT_DIRT = /* glsl */ `
  float dirtWet = 0.0;
  {
    vec3 wp = vDirtWorld;
    float n = dirtFbm(wp * uNoiseScale);
    float fine = dirtNoise(wp * 11.0);

    float along = dot(wp - uOrigin, uDir);
    float edge = uProgress * (uLength + 2.0 * ${PAD}) - ${PAD};
    float dist = edge - (along + (n - 0.45) * 0.7);   // > 0 means already washed
    float cleaned = smoothstep(-0.05, 0.05, dist);

    float pattern = 0.0;
    if (uPattern > 0.5 && uPattern < 1.5) {           // lap siding / garage door panels
      pattern = smoothstep(0.78, 0.97, fract(wp.y * uPatternScale));
    } else if (uPattern > 1.5 && uPattern < 2.5) {    // paver grid
      vec2 g = abs(fract(wp.xz * uPatternScale) - 0.5);
      pattern = smoothstep(0.42, 0.48, max(g.x, g.y));
    } else if (uPattern > 2.5) {                      // concrete expansion joints
      pattern = smoothstep(0.482, 0.495, abs(fract(wp.z * uPatternScale) - 0.5));
    }
    vec3 clean = diffuseColor.rgb * (1.0 - pattern * 0.3);

    float grime = clamp(smoothstep(0.2, 0.6, n) + fine * 0.2, 0.0, 1.0) * uGrime;
    vec3 dirty = mix(clean, uDirtColor * (0.7 + 0.5 * fine), grime);

    float washing = step(0.0005, uProgress) * step(uProgress, 0.9995);
    float foam = (1.0 - smoothstep(0.0, 0.08, abs(dist))) * washing;
    dirtWet = smoothstep(-0.02, 0.12, dist) * (1.0 - smoothstep(0.3, 2.2, dist)) * (1.0 - smoothstep(0.95, 1.0, uProgress));

    diffuseColor.rgb = mix(dirty, clean * 1.05, cleaned);
    diffuseColor.rgb *= 1.0 - dirtWet * 0.2;
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.94, 0.98, 1.0), foam * 0.6);
  }
`;

/**
 * A MeshStandardMaterial that starts out grimy and gets washed clean as its segment's
 * uProgress goes 0 → 1. All the dirt is procedural noise in world space, so no textures load.
 *
 * @param {object} options
 * @param {object} options.segment   a SEGMENTS entry from stage.js (provides the shared uniforms)
 * @param {string} options.color     clean colour
 * @param {string} options.dirt      grime colour
 * @param {number[]} [options.stretch] per-axis noise scale multiplier ([1, 0.3, 1] = vertical streaks)
 */
export function dirtMaterial({
  segment,
  color,
  dirt,
  grime = 0.9,
  scale = 1.5,
  stretch = [1, 1, 1],
  pattern = 'none',
  patternScale = 1,
  roughness = 0.9,
  metalness = 0,
  flatShading = false,
}) {
  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading });
  const own = {
    uDirtColor: { value: new THREE.Color(dirt) },
    uGrime: { value: grime },
    uNoiseScale: { value: new THREE.Vector3(stretch[0] * scale, stretch[1] * scale, stretch[2] * scale) },
    uPattern: { value: PATTERNS[pattern] },
    uPatternScale: { value: patternScale },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, segment.uniforms, own);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDirtWorld;')
      .replace(
        '#include <fog_vertex>',
        `#include <fog_vertex>
        vec4 dirtWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          dirtWorld = instanceMatrix * dirtWorld;
        #endif
        vDirtWorld = (modelMatrix * dirtWorld).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_PARS}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${FRAGMENT_DIRT}`)
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.12, dirtWet);',
      );
  };
  // Every dirt material compiles to the same shader, so let them share one program.
  material.customProgramCacheKey = () => 'dirt-v1';
  return material;
}
