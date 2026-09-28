import * as THREE from 'three';

/** Where the spray is right now. Written by HeroDirector every frame, read by the wand and the water. */
export const rig = {
  target: new THREE.Vector3(), // centre of the line where the water hits the ground
  nozzle: new THREE.Vector3(),
  hands: new THREE.Vector3(), // where the gun is held, just below the bottom edge of the screen
  fanAxis: new THREE.Vector3(1, 0, 0), // the fan of water spreads along this axis
  fanHalfWidth: 0.15,
  spray: 1,
};
