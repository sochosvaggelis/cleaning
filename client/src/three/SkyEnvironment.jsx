import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

const SUN_DIRECTION = new THREE.Vector3(-0.45, 0.62, -0.64).normalize();

/**
 * Builds a soft daylight sky in code and uses it for reflections, so wet stone and the
 * steel machine reflect a real-looking sky without downloading an HDR image.
 */
export function SkyEnvironment({ intensity = 0.9 }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const skyScene = new THREE.Scene();
    const geometry = new THREE.SphereGeometry(10, 48, 24);
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { uSun: { value: SUN_DIRECTION } },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uSun;
        varying vec3 vDir;
        void main() {
          float y = vDir.y;
          vec3 sky = mix(vec3(0.95, 0.96, 0.97), vec3(0.32, 0.52, 0.86), smoothstep(0.0, 0.75, y));
          vec3 ground = mix(vec3(0.5, 0.47, 0.42), vec3(0.28, 0.32, 0.22), smoothstep(0.0, -0.5, y));
          vec3 color = y > 0.0 ? sky : ground;
          float sun = max(dot(normalize(vDir), uSun), 0.0);
          color += vec3(1.0, 0.92, 0.75) * (pow(sun, 400.0) * 60.0 + pow(sun, 12.0) * 0.6);
          gl_FragColor = vec4(color, 1.0);
        }`,
    });
    skyScene.add(new THREE.Mesh(geometry, material));
    const target = pmrem.fromScene(skyScene, 0.01);
    scene.environment = target.texture;
    scene.environmentIntensity = intensity;

    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [gl, scene, intensity]);

  return null;
}

export { SUN_DIRECTION };
