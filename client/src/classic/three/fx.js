import * as THREE from 'three';

/** Per-frame effect state written by the Director and read by the wand, spray and sparkles. */
export const fx = {
  nozzle: new THREE.Vector3(0, 4, 0),
  target: new THREE.Vector3(),
  normal: new THREE.Vector3(0, 1, 0),
  fan: new THREE.Vector3(1, 0, 0),
  presence: 0, // 0..1: is the wand on screen
  intensity: 0, // 0..1: how hard it sprays
  sparkle: 0, // 0..1: finale sparkles
};
