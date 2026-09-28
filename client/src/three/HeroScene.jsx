import { Canvas } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { HeroDirector } from './HeroDirector.jsx';
import { Patio } from './Patio.jsx';
import { SkyEnvironment, SUN_DIRECTION } from './SkyEnvironment.jsx';
import { Spray } from './Spray.jsx';
import { Wand } from './Wand.jsx';

const HAZE = '#b9b4ab';
const FOCUS = new THREE.Vector3(1.0, 0, -1.1);

function Sun({ mapSize }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const light = ref.current;
    light.position.copy(FOCUS).addScaledVector(SUN_DIRECTION, 9);
    light.target.position.copy(FOCUS);
    light.target.updateMatrixWorld();
    const cam = light.shadow.camera;
    Object.assign(cam, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 20 });
    cam.updateProjectionMatrix();
    light.shadow.mapSize.set(mapSize, mapSize);
    light.shadow.bias = -0.0002;
    light.shadow.normalBias = 0.01;
    light.shadow.radius = 2.5;
  }, [mapSize]);
  return <directionalLight ref={ref} castShadow intensity={2.5} color="#fff1de" />;
}

/** The hero's WebGL canvas: a first-person view of pressure-washing a grimy patio as you scroll. */
export default function HeroScene({ sectionRef, stickyRef, meterRef, paused }) {
  const small = window.innerWidth < 760;
  return (
    <Canvas
      frameloop={paused ? 'never' : 'always'}
      shadows="percentage"
      dpr={[1, small ? 1.5 : 1.75]}
      camera={{ fov: 32, near: 0.05, far: 40, position: [1, 2.2, 2.1] }}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color(HAZE);
        scene.fog = new THREE.Fog(HAZE, 4.5, 11);
      }}
    >
      <SkyEnvironment intensity={0.75} />
      <hemisphereLight args={['#eaf2ff', '#8a7f6c', 0.3]} />
      <Sun mapSize={small ? 1024 : 2048} />
      <Patio />
      <Wand />
      <Spray />
      <HeroDirector sectionRef={sectionRef} stickyRef={stickyRef} meterRef={meterRef} />
    </Canvas>
  );
}
