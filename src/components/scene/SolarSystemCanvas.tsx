import { Canvas } from '@react-three/fiber';
import type { PlanetData } from '../../types';
import SolarSystem from './SolarSystem';
import { $focusedPlanetId } from '../../stores/solar';

interface Props {
  planets: PlanetData[];
}

/**
 * Root 3D island. Must be mounted with client:only="react" — R3F touches
 * window at import time and breaks Astro's SSR pass otherwise.
 * R3F auto-disposes JSX-declared geometries/materials on unmount; nothing
 * here is created imperatively, so no manual dispose hooks are needed.
 */
export default function SolarSystemCanvas({ planets }: Props) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 55, 95], fov: 55, near: 0.1, far: 600 }}
      dpr={[1, 2]}
      onPointerMissed={() => $focusedPlanetId.set(null)}
      onCreated={(state) => {
        if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__r3f = state;
      }}
    >
      {/* Deep indigo instead of pure black — subtle color even before glows */}
      <color attach="background" args={['#070512']} />
      <SolarSystem planets={planets} />
    </Canvas>
  );
}
