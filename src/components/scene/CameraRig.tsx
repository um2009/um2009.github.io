import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { easing } from 'maath';
import type { PlanetData } from '../../types';
import { getPlanetPosition } from '../../lib/orbits';
import { $cameraAzimuth, $focusedPlanetId } from '../../stores/solar';

// Higher elevation = more top-down view, which keeps the near side of the
// outermost orbit from dropping below the bottom of the screen.
const ORBIT_ELEVATION = 0.68; // ~39 degrees above the ecliptic

interface Props {
  planets: PlanetData[];
}

/**
 * Drives the camera every frame toward a desired pose:
 * - unfocused: spherical orbit around the sun at the store's azimuth
 * - focused: trailing offset behind the (still-moving) focused planet
 * Stores are read with .get() inside useFrame to avoid per-frame React renders.
 * Also owns canvas drag-to-orbit (writes $cameraAzimuth) — no OrbitControls,
 * so there is a single source of truth and no feedback loop with the minimap.
 */
export default function CameraRig({ planets }: Props) {
  const { camera, gl } = useThree();
  // Far enough back that the outermost orbit fits in frame.
  const orbitRadius = Math.max(...planets.map((p) => p.orbitRadius), 20) * 1.8;
  // Looking slightly below the sun tilts the camera down, which lifts the
  // whole system up the screen so the far orbits aren't cropped.
  const lookY = -orbitRadius * 0.13;
  const lookTarget = useRef(new Vector3(0, 0, 0));
  const desired = useRef(new Vector3());
  const desiredLook = useRef(new Vector3());

  // Canvas drag-to-orbit: deltaX -> azimuth. Disabled while focused.
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || $focusedPlanetId.get() !== null) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      $cameraAzimuth.set($cameraAzimuth.get() - dx * 0.005);
    };
    const onUp = () => {
      dragging = false;
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const focusedId = $focusedPlanetId.get();
    const focused = focusedId ? planets.find((p) => p.id === focusedId) : undefined;

    if (focused) {
      // Follow the live orbiting position: camera sits back along the
      // sun->planet axis, slightly elevated, looking at the planet.
      const [px, py, pz] = getPlanetPosition(focused);
      const back = focused.size * 5;
      const len = Math.hypot(px, pz) || 1;
      desired.current.set(
        px + (px / len) * back,
        py + focused.size * 2.2,
        pz + (pz / len) * back,
      );
      desiredLook.current.set(px, py, pz);
    } else {
      const az = $cameraAzimuth.get();
      desired.current.set(
        Math.cos(az) * orbitRadius * Math.cos(ORBIT_ELEVATION),
        Math.sin(ORBIT_ELEVATION) * orbitRadius,
        Math.sin(az) * orbitRadius * Math.cos(ORBIT_ELEVATION),
      );
      desiredLook.current.set(0, lookY, 0);
    }

    easing.damp3(camera.position, desired.current, 0.4, delta);
    easing.damp3(lookTarget.current, desiredLook.current, 0.4, delta);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
