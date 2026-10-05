import type { PlanetData } from '../types';

/**
 * Shared orbital clock. Both the 3D scene (useFrame) and the 2D minimap
 * (requestAnimationFrame) import this module, so they compute identical
 * planet angles independently — no per-frame store traffic needed.
 */
const t0 = typeof performance !== 'undefined' ? performance.now() : 0;

export function getElapsed(): number {
  return (performance.now() - t0) / 1000;
}

/** Deterministic starting phase per planet so they don't launch in a straight line. */
function hashToPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (h % 360) * (Math.PI / 180);
}

export function getPlanetAngle(planet: PlanetData, t: number = getElapsed()): number {
  return (planet.phase ?? hashToPhase(planet.id)) + planet.orbitSpeed * t;
}

/** Planet world position on the ecliptic (y = 0) at time t. */
export function getPlanetPosition(
  planet: PlanetData,
  t: number = getElapsed(),
): [number, number, number] {
  const a = getPlanetAngle(planet, t);
  return [Math.cos(a) * planet.orbitRadius, 0, Math.sin(a) * planet.orbitRadius];
}
