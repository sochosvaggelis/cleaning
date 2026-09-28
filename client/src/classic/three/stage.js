import * as THREE from 'three';
import { stories } from '../content/stories.js';

/*
 * Layout of the little property (1 unit ≈ 2 m), the camera path and the "cleaning zones".
 *
 *            back fence ──────────┐
 *   deck │  house (x -5…0.5)       │ right
 *        │  z -4.5…-0.5            │ fence
 *        │ walkway  driveway  bins │
 *                front (z = +6)
 */

/** How far (world units) the wipe edge starts before / ends after a surface. Shared with the shader. */
export const EDGE_PAD = 0.6;

function segment({ origin, dir, length, sweep, sweepHalf, normal, standoff = 1.0, lead = 0.4 }) {
  const o = new THREE.Vector3(...origin);
  const d = new THREE.Vector3(...dir).normalize();
  return {
    origin: o,
    dir: d,
    length,
    sweep: new THREE.Vector3(...sweep).normalize(),
    sweepHalf,
    normal: new THREE.Vector3(...normal).normalize(),
    standoff,
    lead,
    // Shared by every material on this surface, so one update cleans them all.
    uniforms: {
      uProgress: { value: 0 },
      uOrigin: { value: o.clone() },
      uDir: { value: d.clone() },
      uLength: { value: length },
    },
  };
}

/** A segment is one straight wipe across a surface: from `origin`, `length` units along `dir`. */
export const SEGMENTS = {
  driveway: segment({
    origin: [-0.65, 0.06, 6.2],
    dir: [0, 0, -1],
    length: 6.9,
    sweep: [1, 0, 0],
    sweepHalf: 0.85,
    normal: [0, 1, 0],
  }),
  house: segment({
    origin: [-5.25, 1.2, -0.42],
    dir: [1, 0, 0],
    length: 6.0,
    sweep: [0, 1, 0],
    sweepHalf: 0.8,
    normal: [0, 0, 1],
    standoff: 1.1,
  }),
  deck: segment({
    origin: [-6.45, 0.3, 0.6],
    dir: [0, 0, -1],
    length: 5.1,
    sweep: [1, 0, 0],
    sweepHalf: 1.0,
    normal: [0, 1, 0],
  }),
  fenceSide: segment({
    origin: [6.95, 0.55, 5.95],
    dir: [0, 0, -1],
    length: 11.9,
    sweep: [0, 1, 0],
    sweepHalf: 0.32,
    normal: [1, 0, 0],
    standoff: 0.9,
  }),
  fenceBack: segment({
    origin: [7.1, 0.55, -5.66],
    dir: [-1, 0, 0],
    length: 6.2,
    sweep: [0, 1, 0],
    sweepHalf: 0.32,
    normal: [0, 0, 1],
    standoff: 0.9,
  }),
  bins: segment({
    origin: [1.75, 0.02, -0.6],
    dir: [0, 1, 0],
    length: 1.0,
    sweep: [1, 0, 0],
    sweepHalf: 0.75,
    normal: [0, 0, 1],
    standoff: 0.95,
    lead: -0.3,
  }),
};

/** Which chapter cleans which surfaces. Multi-segment zones are cleaned one segment after another. */
export const ZONES = [
  { chapter: 1, segments: [SEGMENTS.driveway] },
  { chapter: 2, segments: [SEGMENTS.house] },
  { chapter: 3, segments: [SEGMENTS.deck] },
  { chapter: 4, segments: [SEGMENTS.fenceSide, SEGMENTS.fenceBack] },
  { chapter: 5, segments: [SEGMENTS.bins] },
].map((zone) => ({ ...zone, total: zone.segments.reduce((sum, s) => sum + s.length, 0), progress: 0 }));

// Where to push the 3D subject on screen (fractions of the viewport) so it isn't hidden by the text.
const SIDE_OFFSET = { left: [-0.2, 0], right: [0.2, 0] };
const MOBILE_OFFSET = [0, 0.2];
const sideOf = (chapter) => stories.find((s) => s.chapter === chapter)?.side ?? 'left';

/** One camera pose per [data-chapter] section: 0 = hero, 1–5 = stories, 6 = finale. */
export const KEYFRAMES = [
  { pos: [22, 16.5, 24.5], target: [0, -0.8, 0], orbit: 1, offset: { desktop: [-0.2, 0.03], mobile: [0, 0.22] } },
  { pos: [6.4, 6.2, 12.4], target: [-0.9, 0.1, 2.4] },
  { pos: [-1.0, 3.9, 11.2], target: [-2.3, 1.3, -0.6] },
  { pos: [-13, 6, 5.6], target: [-6.3, 0.3, -2.0] },
  { pos: [14.2, 5.2, 9.4], target: [6.0, 0.6, -1.2] },
  { pos: [5.0, 2.7, 5.4], target: [1.8, 0.55, -0.75] },
  { pos: [-18, 14, 19.5], target: [0, -0.4, 0], orbit: 1, offset: { desktop: [0, -0.2], mobile: [0, -0.2] } },
].map((k, index) => ({
  orbit: 0,
  offset: k.offset ?? { desktop: SIDE_OFFSET[sideOf(index)], mobile: MOBILE_OFFSET },
  ...k,
}));
