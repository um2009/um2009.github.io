import { atom } from 'nanostores';

/**
 * The entire cross-island contract between the 3D canvas, the 2D minimap,
 * and the content modal. Every island must import THIS module so they share
 * one store instance per page.
 */

/** Camera orbit angle around the sun, in radians. Written by canvas drag and minimap drag. */
export const $cameraAzimuth = atom<number>(0);

/** Content entry id of the currently focused planet, or null when free-orbiting. */
export const $focusedPlanetId = atom<string | null>(null);
