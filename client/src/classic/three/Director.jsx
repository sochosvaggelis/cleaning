import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { fx } from './fx.js';
import { readTimeline } from './scrollTimeline.js';
import { EDGE_PAD, KEYFRAMES, ZONES } from './stage.js';

const { clamp, damp, lerp, smoothstep } = THREE.MathUtils;
const UP = new THREE.Vector3(0, 1, 0);
const LAST = KEYFRAMES.length - 1;

const basePos = new THREE.Vector3();
const baseTarget = new THREE.Vector3();
const offsetVec = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const edgePoint = new THREE.Vector3();
const followPoint = new THREE.Vector3();
const aimTarget = new THREE.Vector3();
const aimNozzle = new THREE.Vector3();
const scratch = new THREE.Vector3();

function damp3(v, to, lambda, dt) {
  v.lerp(to, 1 - Math.exp(-lambda * dt));
}

/**
 * Drives the whole scene from the scroll position: camera path, which surface is being
 * washed, and where the pressure-washer wand points. Runs once per frame, renders nothing.
 */
export function Director() {
  const state = useRef({ t: null, time: 0, follow: 0 }).current;
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useFrame(({ camera, size }, delta) => {
    const dt = Math.min(delta, 1 / 20);
    state.time += dt;

    // Smooth the scroll-driven timeline so fast scrolling still animates nicely.
    const raw = readTimeline();
    state.t = state.t === null ? raw : damp(state.t, raw, 3.4, dt);
    const t = state.t;

    // ---- Which two keyframes are we between? Ease so the camera settles on each surface.
    const i = Math.min(Math.floor(t), LAST - 1);
    const e = smoothstep(clamp(t - i, 0, 1), 0.16, 0.84);
    const k0 = KEYFRAMES[i];
    const k1 = KEYFRAMES[i + 1];
    basePos.fromArray(k0.pos).lerp(scratch.fromArray(k1.pos), e);
    baseTarget.fromArray(k0.target).lerp(scratch.fromArray(k1.target), e);

    // ---- Surface cleaning progress. Chapter n washes while t goes n-0.36 → n+0.30.
    for (const zone of ZONES) {
      zone.progress = clamp((t - (zone.chapter - 0.36)) / 0.66, 0, 1);
      let done = 0;
      for (const segment of zone.segments) {
        segment.uniforms.uProgress.value = clamp((zone.progress * zone.total - done) / segment.length, 0, 1);
        done += segment.length;
      }
    }

    // ---- Wand: follow the wipe edge of the zone that is being washed right now.
    const active = ZONES.find((z) => z.progress > 0.001 && z.progress < 0.999);
    if (active) {
      let segment = active.segments[0];
      let local = 0;
      let done = 0;
      for (const s of active.segments) {
        segment = s;
        local = clamp((active.progress * active.total - done) / s.length, 0, 1);
        done += s.length;
        if (local < 1) break;
      }
      const along = clamp(local * (segment.length + 2 * EDGE_PAD) - EDGE_PAD, 0, segment.length);
      const swing = Math.sin(state.time * 2.4) * segment.sweepHalf;
      edgePoint.copy(segment.origin).addScaledVector(segment.dir, along);
      aimTarget.copy(edgePoint).addScaledVector(segment.sweep, swing).addScaledVector(segment.dir, 0.12);
      aimNozzle
        .copy(edgePoint)
        .addScaledVector(segment.sweep, swing * 0.45)
        .addScaledVector(segment.normal, segment.standoff)
        .addScaledVector(segment.dir, -segment.lead);

      if (fx.presence < 0.05) {
        // Invisible: jump straight to the new surface instead of flying across the scene.
        fx.target.copy(aimTarget);
        fx.nozzle.copy(aimNozzle);
        followPoint.copy(edgePoint);
      } else {
        damp3(fx.target, aimTarget, 12, dt);
        damp3(fx.nozzle, aimNozzle, 12, dt);
        damp3(followPoint, edgePoint, 5, dt);
      }
      fx.normal.copy(segment.normal);
      fx.fan.copy(segment.sweep);
    }
    const wantIntensity = active
      ? smoothstep(active.progress, 0, 0.03) * (1 - smoothstep(active.progress, 0.97, 1))
      : 0;
    fx.presence = damp(fx.presence, active ? 1 : 0, 7, dt);
    fx.intensity = damp(fx.intensity, wantIntensity, 9, dt);
    fx.sparkle = smoothstep(t, LAST - 0.6, LAST - 0.05);

    // ---- Camera: keyframe pose, gentle idle orbit on hero/finale, and a slight pan toward the spray.
    const orbit = reducedMotion ? 0 : lerp(k0.orbit, k1.orbit, e);
    offsetVec.subVectors(basePos, baseTarget).applyAxisAngle(UP, orbit * Math.sin(state.time * 0.15) * 0.3);

    const aspect = size.width / size.height;
    if (aspect < 1.1) offsetVec.multiplyScalar(1 + (1.1 - aspect) * 0.95); // portrait: step back

    state.follow = damp(state.follow, active ? 0.25 : 0, 3, dt);
    lookTarget.copy(baseTarget).lerp(followPoint, state.follow);
    camera.position.copy(lookTarget).add(offsetVec);
    camera.lookAt(lookTarget);

    // Shift the projection so the subject sits beside (desktop) or above (mobile) the text.
    const mobile = size.width < 760;
    const o0 = mobile ? k0.offset.mobile : k0.offset.desktop;
    const o1 = mobile ? k1.offset.mobile : k1.offset.desktop;
    camera.setViewOffset(
      size.width,
      size.height,
      lerp(o0[0], o1[0], e) * size.width,
      lerp(o0[1], o1[1], e) * size.height,
      size.width,
      size.height,
    );
  });

  return null;
}
