import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Html, useTexture } from '@react-three/drei';
import { Vector3, AdditiveBlending, BackSide } from 'three';
import type { Group, Mesh } from 'three';
import type { PlanetData } from '../../types';
import { getPlanetPosition } from '../../lib/orbits';
import { $focusedPlanetId } from '../../stores/solar';

const SUN_OCCLUSION_RADIUS = 7; // sun body + corona margin, world units

interface Props {
  planet: PlanetData;
}

/** Realistic surface: sun-lit texture with a faint self-glow so the night side stays readable. */
function TexturedMaterial({ url, hovered }: { url: string; hovered: boolean }) {
  const map = useTexture(url);
  return (
    // Reusing the color map as a bump map gives cheap surface relief that
    // catches the sunlight; lower emissive keeps texture contrast visible.
    <meshStandardMaterial
      map={map}
      bumpMap={map}
      bumpScale={0.06}
      emissiveMap={map}
      emissive="#ffffff"
      emissiveIntensity={hovered ? 0.6 : 0.22}
      roughness={0.85}
    />
  );
}

/** Fallback for entries without a texture: the original emissive glow look. */
function GlowMaterial({ color, hovered }: { color: string; hovered: boolean }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={hovered ? 2.0 : 1.3}
      toneMapped={false}
    />
  );
}

/** Deterministic per-planet variation derived from the id, no extra config. */
function planetTraits(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return {
    spinSpeed: 0.08 + (h % 100) / 400, // 0.08–0.33 rad/s
    axialTilt: ((h >> 4) % 100) / 250, // 0–0.4 rad
  };
}

export default function Planet({ planet }: Props) {
  const group = useRef<Group>(null);
  const surface = useRef<Mesh>(null);
  const labelDiv = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const worldPos = useRef(new Vector3());
  const toPlanet = useRef(new Vector3());
  const toSun = useRef(new Vector3());

  // Orbit position is driven by the shared clock, not React state.
  // The label fades out whenever the planet passes behind the sun's disc
  // so text never overlaps the glow.
  const traits = useMemo(() => planetTraits(planet.id), [planet.id]);

  useFrame(({ camera }, delta) => {
    if (!group.current) return;
    const [x, y, z] = getPlanetPosition(planet);
    group.current.position.set(x, y, z);
    if (surface.current) surface.current.rotation.y += delta * traits.spinSpeed;

    if (labelDiv.current) {
      worldPos.current.set(x, y, z);
      const distPlanet = camera.position.distanceTo(worldPos.current);
      const distSun = camera.position.length(); // sun sits at the origin
      toPlanet.current.copy(worldPos.current).sub(camera.position).normalize();
      toSun.current.copy(camera.position).negate().normalize();
      const angleBetween = Math.acos(Math.min(1, Math.max(-1, toPlanet.current.dot(toSun.current))));
      const sunAngularRadius = Math.asin(Math.min(1, SUN_OCCLUSION_RADIUS / distSun));
      const behindSun = distPlanet > distSun && angleBetween < sunAngularRadius;
      labelDiv.current.style.opacity = behindSun ? '0' : '';
      // an invisible label must not swallow clicks
      labelDiv.current.style.pointerEvents = behindSun ? 'none' : '';
    }
  });

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  const orbitPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push([Math.cos(a) * planet.orbitRadius, 0, Math.sin(a) * planet.orbitRadius]);
    }
    return pts;
  }, [planet.orbitRadius]);

  return (
    <>
      {/* Clean white orbit guide with a faint glow (toneMapped off) */}
      <Line
        points={orbitPoints}
        color="#ffffff"
        transparent
        opacity={0.1}
        lineWidth={1}
        toneMapped={false}
      />
      <group ref={group}>
        <mesh ref={surface} castShadow receiveShadow rotation={[0, 0, traits.axialTilt]}>
          <sphereGeometry args={[planet.size, 64, 64]} />
          <Suspense fallback={<GlowMaterial color={planet.color} hovered={hovered} />}>
            {planet.texture ? (
              <TexturedMaterial url={planet.texture} hovered={hovered} />
            ) : (
              <GlowMaterial color={planet.color} hovered={hovered} />
            )}
          </Suspense>
        </mesh>

        {/* Thin additive rim tinted with the planet color — reads as atmosphere */}
        {planet.texture && (
          <mesh scale={1.07}>
            <sphereGeometry args={[planet.size, 32, 32]} />
            <meshBasicMaterial
              color={planet.color}
              transparent
              opacity={0.16}
              side={BackSide}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Oversized invisible hit sphere so small planets are easy to click.
            Event handlers live HERE (not on the group): R3F only raycasts
            objects with geometry, so handlers on a bare group never fire. */}
        <mesh
          visible={false}
          onClick={(e) => {
            e.stopPropagation();
            $focusedPlanetId.set(planet.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[Math.max(planet.size * 1.8, 3.2), 12, 12]} />
          <meshBasicMaterial />
        </mesh>

        {planet.ringColor && (
          // Two bands with a Cassini-style gap read far more like a real ring
          <group rotation={[-Math.PI / 2 + 0.25, 0, 0]}>
            <mesh receiveShadow>
              <ringGeometry args={[planet.size * 1.35, planet.size * 1.75, 96]} />
              <meshStandardMaterial
                color={planet.ringColor}
                transparent
                opacity={0.5}
                side={2 /* DoubleSide */}
                roughness={1}
              />
            </mesh>
            <mesh receiveShadow>
              <ringGeometry args={[planet.size * 1.85, planet.size * 2.25, 96]} />
              <meshStandardMaterial
                color={planet.ringColor}
                transparent
                opacity={0.3}
                side={2 /* DoubleSide */}
                roughness={1}
              />
            </mesh>
          </group>
        )}

        <Html position={[0, planet.size + 0.9, 0]} center zIndexRange={[10, 0]}>
          {/* The label doubles as a big, consistent click target — every
              planet gets the same easy button no matter how small it is. */}
          <button
            ref={labelDiv}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              $focusedPlanetId.set(planet.id);
            }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            className={`flex cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium tracking-wide backdrop-blur-md transition-all duration-200 ${
              hovered
                ? 'scale-110 border-white/50 bg-black/80 text-white'
                : 'border-white/15 bg-black/60 text-white/85'
            }`}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
            aria-label={`Open ${planet.title}`}
          >
            {/* uniform sun-yellow glow dot on every label */}
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: '#FBBF24', boxShadow: '0 0 6px #FBBF24' }}
            />
            {planet.title}
          </button>
        </Html>
      </group>
    </>
  );
}
