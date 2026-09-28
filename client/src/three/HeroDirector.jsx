import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { cleaningUniforms, MAX_TRAVEL, PATH, pointOnPath, rowsToTravel } from './cleaningPath.js';
import { rig } from './rig.js';

const { clamp, damp, lerp } = THREE.MathUtils;

const START_ROWS = 1.2; // already clean when the page opens, so the before/after is obvious
const INTRO_ROWS = 1.65; // a short automatic pass on load draws the eye
const START_TRAVEL = rowsToTravel(START_ROWS);
const AREA_CENTER_X = PATH.right - (PATH.rows * PATH.rowWidth) / 2;
const NOZZLE_TO_GROUND = 0.42; // metres between the nozzle and the stone
const HANDS = new THREE.Vector3(0.3, -0.56, -0.42); // relative to the eyes, just off-screen bottom right

const eye = new THREE.Vector3();
const look = new THREE.Vector3();
const heading = new THREE.Vector2();
const toHands = new THREE.Vector3();

/**
 * Runs every frame: turns the scroll position inside the pinned hero into cleaning progress,
 * places the viewer like someone holding the pressure washer, aims the spray, and updates
 * the progress meter.
 */
export function HeroDirector({ sectionRef, stickyRef, meterRef }) {
  const state = useRef({ travel: null, intro: 0, px: 0, py: 0, time: 0, eyeX: null }).current;
  const pointer = useRef({ x: 0, y: 0 });
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    const onMove = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame(({ camera, size }, delta) => {
    const dt = Math.min(delta, 1 / 20);
    state.time += dt;
    state.intro = reducedMotion ? 1 : Math.min(1, state.intro + dt / 2.8);
    const intro = 1 - (1 - state.intro) ** 3;
    const mobile = size.width < 760;

    // How far through the pinned hero the visitor has scrolled (0..1).
    let progress = 0;
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (section && sticky) {
      const outer = section.getBoundingClientRect();
      const inner = sticky.getBoundingClientRect();
      const range = outer.height - inner.height;
      progress = range > 0 ? clamp((inner.top - outer.top) / range, 0, 1) : 0;
    }

    // Cleaning follows the scroll, smoothed so fast scrolling still looks natural.
    const rows = lerp(START_ROWS, INTRO_ROWS, intro) + progress * (PATH.rows - INTRO_ROWS);
    const goal = rowsToTravel(rows);
    state.travel = state.travel === null ? START_TRAVEL : damp(state.travel, goal, 4, dt);
    cleaningUniforms.uTravel.value = state.travel;

    pointOnPath(state.travel, rig.target, heading);
    rig.target.y = 0.062; // top of the pavers
    if (!reducedMotion) {
      // A human hand is never perfectly steady.
      rig.target.x += Math.sin(state.time * 7.3) * 0.006 + Math.sin(state.time * 13.1) * 0.003;
      rig.target.z += Math.sin(state.time * 5.1) * 0.006;
    }

    // The viewer stands in front of the patio and drifts sideways with the stripe being cleaned.
    const follow = mobile ? 0.8 : 0.45;
    const wantX = lerp(AREA_CENTER_X, rig.target.x, follow) - 0.15;
    state.eyeX = state.eyeX === null ? wantX : damp(state.eyeX, wantX, 1.6, dt);
    const reveal = THREE.MathUtils.smoothstep(progress, 0.72, 1); // step back at the end to admire the result
    eye.set(state.eyeX, lerp(1.62, 2.05, reveal), lerp(1.45, 2.0, reveal));
    look.set(state.eyeX + 0.1, 0, lerp(-1.05, -1.0, reveal));

    // Intro: start a little higher and further back, then settle in.
    eye.y += (1 - intro) * 0.55;
    eye.z += (1 - intro) * 0.6;

    state.px = damp(state.px, reducedMotion ? 0 : pointer.current.x, 2.5, dt);
    state.py = damp(state.py, reducedMotion ? 0 : pointer.current.y, 2.5, dt);
    eye.x += state.px * 0.07;
    eye.y -= state.py * 0.04;

    const aspect = size.width / size.height;
    if (aspect < 1.1) eye.sub(look).multiplyScalar(1 + (1.1 - aspect) * 0.6).add(look); // portrait: step back
    camera.position.copy(eye);
    camera.lookAt(look);
    camera.setViewOffset(
      size.width,
      size.height,
      mobile ? 0 : -0.18 * size.width, // desktop: keep the action right of the headline
      mobile ? 0.14 * size.height : 0, // phone: keep it above the text
      size.width,
      size.height,
    );
    camera.updateMatrixWorld();

    // Hands just below the screen edge; the nozzle 42 cm from the stone, on the line to the hands.
    rig.hands.copy(HANDS);
    camera.localToWorld(rig.hands);
    toHands.subVectors(rig.hands, rig.target).normalize();
    rig.nozzle.copy(rig.target).addScaledVector(toHands, NOZZLE_TO_GROUND);

    cleaningUniforms.uImpactA.value.set(rig.target.x - rig.fanHalfWidth, rig.target.z);
    cleaningUniforms.uImpactB.value.set(rig.target.x + rig.fanHalfWidth, rig.target.z);
    cleaningUniforms.uSpray.value = rig.spray;

    const meter = meterRef.current;
    if (meter) {
      const done = clamp((state.travel - START_TRAVEL) / (MAX_TRAVEL - START_TRAVEL), 0, 1);
      meter.style.setProperty('--progress', done.toFixed(3));
      const label = done > 0.985 ? 'done' : 'cleaning';
      if (meter.dataset.state !== label) meter.dataset.state = label;
    }
  });

  return null;
}
