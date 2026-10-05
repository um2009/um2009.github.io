import { useMemo, useEffect } from 'react';
import { Stars } from '@react-three/drei';
import { AdditiveBlending, CanvasTexture } from 'three';

/**
 * Soft procedural nebula glows — no photo, just a shared radial-gradient
 * sprite tinted violet/magenta/blue and scattered far behind the scene.
 * Palette inspired by a Milky Way reference shot.
 */
const NEBULAE: { position: [number, number, number]; scale: number; color: string; opacity: number }[] = [
  { position: [-180, 60, -220], scale: 420, color: '#7c5cff', opacity: 0.14 },
  { position: [230, -40, -160], scale: 360, color: '#c94f9e', opacity: 0.11 },
  { position: [60, 120, 240], scale: 380, color: '#4f6fc9', opacity: 0.12 },
  { position: [-120, -90, 200], scale: 300, color: '#8a4fc9', opacity: 0.09 },
];

function Nebulae() {
  // One shared white radial-gradient texture; each sprite tints it.
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new CanvasTexture(canvas);
  }, []);

  // CanvasTexture is created imperatively, so dispose it ourselves.
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <>
      {NEBULAE.map((n, i) => (
        <sprite key={i} position={n.position} scale={[n.scale, n.scale, 1]}>
          <spriteMaterial
            map={texture}
            color={n.color}
            transparent
            opacity={n.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </>
  );
}

/**
 * Extra hand-rolled THREE.Points shell behind drei's <Stars>: sparse, larger,
 * nebula-tinted particles that give the background parallax depth.
 * Geometry/material are JSX-declared, so R3F disposes them on unmount.
 */
function DeepSpace() {
  const [positions, colors] = useMemo(() => {
    const count = 1200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // random point on a thick spherical shell, radius 140–280
      const r = 140 + Math.random() * 140;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      // tints from the nebula palette: violet, magenta, ice blue
      const t = Math.random();
      if (t < 0.18) {
        col.set([0.75, 0.55, 1], i * 3); // violet
      } else if (t < 0.32) {
        col.set([1, 0.6, 0.85], i * 3); // magenta
      } else if (t < 0.45) {
        col.set([0.55, 0.7, 1], i * 3); // ice blue
      } else {
        col.set([0.9, 0.88, 0.95], i * 3);
      }
    }
    return [pos, col];
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.6}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

export default function Starfield() {
  return (
    <>
      <Nebulae />
      <Stars radius={200} depth={60} count={4000} factor={5} saturation={0} fade speed={0.5} />
      <DeepSpace />
    </>
  );
}
