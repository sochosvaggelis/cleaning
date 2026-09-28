import * as THREE from 'three';

/*
 * The spray works the patio in stripes, like mowing a lawn: each stripe runs along z
 * (toward or away from the viewer) and the next one starts a stripe-width further left.
 * Distances are in metres. The same path is evaluated in JS (to aim the spray) and in
 * GLSL (to decide which pixels are clean), so the clean stripes always line up.
 */
export const PATH = {
  far: -2.1, // z where the first stripe starts
  right: 2.4, // x of the right edge of the first stripe
  rowLength: 2.0, // along z
  rowWidth: 0.3, // along x, the width of the fan where it hits the ground
  rows: 6,
  radius: 0.15, // half the fan width
};

const SEGMENT = PATH.rowLength + PATH.rowWidth; // one stripe + the step to the next
export const MAX_TRAVEL = (PATH.rows - 1) * SEGMENT + PATH.rowLength;

/** "Stripes finished" (can be fractional) → metres travelled along the path. */
export function rowsToTravel(rows) {
  return THREE.MathUtils.clamp(rows * SEGMENT, 0, MAX_TRAVEL);
}

/** Ground point the spray is hitting after `travel` metres, and its direction of travel (x, z). */
export function pointOnPath(travel, position, heading) {
  const row = Math.min(Math.floor(travel / SEGMENT), PATH.rows - 1);
  const within = travel - row * SEGMENT;
  const forward = row % 2 === 0; // even stripes come toward the viewer
  const x = PATH.right - (row + 0.5) * PATH.rowWidth;
  if (within <= PATH.rowLength) {
    position.set(x, 0, forward ? PATH.far + within : PATH.far + PATH.rowLength - within);
    heading.set(0, forward ? 1 : -1);
  } else {
    position.set(x - (within - PATH.rowLength), 0, forward ? PATH.far + PATH.rowLength : PATH.far);
    heading.set(-1, 0);
  }
  return position;
}

/** Shared by every material that shows dirt, so one update cleans them all. */
export const cleaningUniforms = {
  uTravel: { value: 0 },
  // Path in its own frame: u runs along the stripes (= world z), v across them (= world -x).
  uPath: { value: new THREE.Vector4(PATH.far, -PATH.right, PATH.rowLength, PATH.rowWidth) },
  uRows: { value: PATH.rows },
  uRadius: { value: PATH.radius },
  uWetLength: { value: 2.2 }, // how much of the freshly cleaned path still looks wet
  // Where the fan of water hits the ground right now (a short line, world x/z).
  uImpactA: { value: new THREE.Vector2() },
  uImpactB: { value: new THREE.Vector2() },
  uSpray: { value: 1 },
};

export const CLEANING_GLSL = /* glsl */ `
  uniform float uTravel;
  uniform vec4 uPath;
  uniform float uRows;
  uniform float uRadius;
  uniform float uWetLength;
  uniform vec2 uImpactA;
  uniform vec2 uImpactB;
  uniform float uSpray;

  float boxDistance(vec2 p, vec2 center, vec2 halfSize) {
    vec2 d = abs(p - center) - halfSize;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  // x = how clean (0..1), y = how wet (0..1) the ground is at world point p = (x, z).
  // The fan hits the ground as a straight line (uRadius either side of the path), so each pass
  // sweeps out a rectangle: clean = inside the union of those rectangles.
  vec2 cleaningAt(vec2 p, float wobble) {
    vec2 q = vec2(p.y, -p.x);
    float L = uPath.z;
    float W = uPath.w;
    float seg = L + W;
    vec2 fan = vec2(0.02, uRadius * 1.08); // fan footprint half-size; passes overlap a little, like real work
    float best = 1e5;
    float bestS = -1e5;
    for (int i = 0; i < 24; i++) {
      float r = float(i);
      if (r >= uRows) break;
      float s0 = r * seg;
      if (s0 > uTravel) break;
      float vc = uPath.y + (r + 0.5) * W;
      float forward = 1.0 - mod(r, 2.0);
      float dir = forward * 2.0 - 1.0;
      float us = uPath.x + (1.0 - forward) * L;
      float done = min(uTravel - s0, L);
      float d = boxDistance(q, vec2(us + dir * done * 0.5, vc), vec2(done * 0.5 + fan.x, fan.y));
      if (d < best) { best = d; bestS = s0 + clamp((q.x - us) * dir, 0.0, done); }
      float sTurn = s0 + L;
      if (uTravel > sTurn) {
        float ue = us + dir * L;
        float stepDone = min(uTravel - sTurn, W);
        float d2 = boxDistance(q, vec2(ue, vc + stepDone * 0.5), vec2(fan.x, stepDone * 0.5 + fan.y));
        if (d2 < best) { best = d2; bestS = sTurn + clamp(q.y - vc, 0.0, stepDone); }
      }
    }
    best += wobble;
    float clean = 1.0 - smoothstep(-0.008, 0.008, best);
    float wet = clean * (1.0 - smoothstep(0.0, uWetLength, uTravel - bestS));
    return vec2(clean, wet);
  }

  // Distance from p to the line where the water is hitting the ground.
  float impactDistance(vec2 p) {
    vec2 ab = uImpactB - uImpactA;
    float h = clamp(dot(p - uImpactA, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    return length(p - (uImpactA + ab * h));
  }
`;

export const NOISE_GLSL = /* glsl */ `
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
               mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm2(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise2(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      a *= 0.5;
    }
    return v;
  }
`;
