import { Canvas } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { Bins } from './Bins.jsx';
import { Clouds } from './Clouds.jsx';
import { Deck } from './Deck.jsx';
import { Director } from './Director.jsx';
import { Fence } from './Fence.jsx';
import { House } from './House.jsx';
import { Island } from './Island.jsx';
import { Sparkles } from './Sparkles.jsx';
import { Spray } from './Spray.jsx';
import { KEYFRAMES } from './stage.js';
import { Wand } from './Wand.jsx';
import { Yard } from './Yard.jsx';

function Sun({ mapSize }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const light = ref.current;
    const cam = light.shadow.camera;
    Object.assign(cam, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 });
    cam.updateProjectionMatrix();
    light.shadow.mapSize.set(mapSize, mapSize);
    light.shadow.bias = -0.0003;
    light.shadow.normalBias = 0.03;
  }, [mapSize]);
  return <directionalLight ref={ref} castShadow position={[9, 16, 8]} intensity={2.6} color="#fff3df" />;
}

/** The WebGL canvas. Loaded lazily so the page text shows up before three.js arrives. */
export default function Scene({ paused }) {
  const small = window.innerWidth < 760;
  return (
    <Canvas
      frameloop={paused ? 'never' : 'always'}
      shadows="percentage"
      dpr={[1, small ? 1.5 : 1.75]}
      camera={{ fov: 34, near: 0.5, far: 150, position: KEYFRAMES[0].pos }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping }}
    >
      <hemisphereLight args={['#e3f4ff', '#6f9a4f', 1.5]} />
      <ambientLight intensity={0.25} />
      <Sun mapSize={small ? 1024 : 2048} />

      <Island />
      <Yard />
      <House />
      <Deck />
      <Fence />
      <Bins />
      <Clouds />

      <Wand />
      <Spray />
      <Sparkles />
      <Director />
    </Canvas>
  );
}
