import { useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, useTexture } from '@react-three/drei';
import { CanvasTexture, AdditiveBlending } from 'three';
import type { Mesh } from 'three';

const SUN_RADIUS = 4.5;

/** Photosphere with the real solar surface texture, slowly churning. */
function SunSurface() {
  const mesh = useRef<Mesh>(null);
  const map = useTexture('/assets/textures/sun.jpg');

  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += delta * 0.04;
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
      {/* emissiveMap * intensity > 1 lets bloom pick out the granulation detail */}
      <meshStandardMaterial
        map={map}
        emissiveMap={map}
        emissive="#ffdd99"
        emissiveIntensity={1.7}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Untextured fallback while the surface texture streams in. */
function SunFallback() {
  return (
    <mesh>
      <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
      <meshStandardMaterial color="#ffb347" emissive="#ff9500" emissiveIntensity={4} toneMapped={false} />
    </mesh>
  );
}

/** Soft additive corona halo billboarded around the sun. */
function Corona() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 128, 24, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 200, 110, 0.38)');
    grad.addColorStop(0.35, 'rgba(255, 140, 40, 0.14)');
    grad.addColorStop(1, 'rgba(255, 100, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new CanvasTexture(canvas);
  }, []);

  // CanvasTexture is created imperatively, so dispose it ourselves.
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite scale={[SUN_RADIUS * 5.5, SUN_RADIUS * 5.5, 1]}>
      <spriteMaterial map={texture} blending={AdditiveBlending} depthWrite={false} transparent />
    </sprite>
  );
}

export default function Sun() {
  return (
    <group>
      <Suspense fallback={<SunFallback />}>
        <SunSurface />
      </Suspense>
      <Corona />
      {/* Drifting embers around the photosphere — reads as flare activity */}
      <Sparkles
        count={35}
        scale={SUN_RADIUS * 2.6}
        size={7}
        speed={0.35}
        noise={2}
        color="#ffb347"
        opacity={0.5}
      />
      {/* Gentle falloff (decay 1) so outer textured planets still catch sunlight.
          Casts real shadows: planets shadow their own rings and each other. */}
      <pointLight
        intensity={250}
        distance={0}
        decay={1}
        color="#fff2d9"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-camera-near={SUN_RADIUS}
        shadow-camera-far={120}
      />
    </group>
  );
}
