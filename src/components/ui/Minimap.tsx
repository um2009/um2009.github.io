import { useEffect, useRef } from 'react';
import type { PlanetData } from '../../types';
import { getPlanetAngle } from '../../lib/orbits';
import { $cameraAzimuth, $focusedPlanetId } from '../../stores/solar';

const SIZE = 160;
const CENTER = SIZE / 2;
const MAX_SVG_RADIUS = 66;

interface Props {
  planets: PlanetData[];
}

/**
 * CAD-viewcube-style 2D schematic of the solar system (top-right).
 * - A rAF loop writes planet dot positions from the shared orbit clock and
 *   rotates the disc by -cameraAzimuth via direct attribute writes (no React
 *   state per frame).
 * - Dragging rotates $cameraAzimuth (same store the 3D canvas drag writes);
 *   clicking a dot focuses that planet. One writer per gesture, so the 2D/3D
 *   sync has no feedback loop.
 */
export default function Minimap({ planets }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<SVGGElement>(null);
  const dotRefs = useRef(new Map<string, SVGGElement>());
  const drag = useRef({ active: false, startPointerAngle: 0, startAzimuth: 0, moved: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const maxOrbit = Math.max(...planets.map((p) => p.orbitRadius), 1);
  const svgRadius = (r: number) => (r / maxOrbit) * MAX_SVG_RADIUS;

  // The dial only makes sense while the 3D hero is in view — fade it out
  // once the user scrolls into the portfolio sections.
  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const past = window.scrollY > window.innerHeight * 0.5;
      el.style.opacity = past ? '0' : '1';
      el.style.pointerEvents = past ? 'none' : 'auto';
    };
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    onScroll();
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      // Rotate the whole disc opposite to azimuth so camera-forward is "up".
      const az = $cameraAzimuth.get();
      discRef.current?.setAttribute(
        'transform',
        `rotate(${(-az * 180) / Math.PI + 90} ${CENTER} ${CENTER})`,
      );
      for (const planet of planets) {
        const el = dotRefs.current.get(planet.id);
        if (!el) continue;
        const a = getPlanetAngle(planet);
        const r = svgRadius(planet.orbitRadius);
        el.setAttribute(
          'transform',
          `translate(${CENTER + Math.cos(a) * r} ${CENTER + Math.sin(a) * r})`,
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [planets]);

  const pointerAngle = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return Math.atan2(
      e.clientY - (rect.top + rect.height / 2),
      e.clientX - (rect.left + rect.width / 2),
    );
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = {
      active: true,
      startPointerAngle: pointerAngle(e),
      startAzimuth: $cameraAzimuth.get(),
      moved: 0,
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    drag.current.moved += Math.abs(e.movementX) + Math.abs(e.movementY);
    const delta = pointerAngle(e) - drag.current.startPointerAngle;
    // Disc rotates with -azimuth, so dragging clockwise decreases azimuth.
    $cameraAzimuth.set(drag.current.startAzimuth - delta);
  };

  const onPointerUp = () => {
    drag.current.active = false;
  };

  const onDotClick = (id: string) => {
    // Suppress click at the end of a real drag.
    if (drag.current.moved < 5) $focusedPlanetId.set(id);
  };

  return (
    <div ref={wrapRef} className="fixed right-4 top-4 z-20 select-none transition-opacity duration-500">
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* bezel */}
        <circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.25)" />
        {/* camera-forward indicator (fixed, points up) */}
        <path
          d={`M ${CENTER} 7 l 4 7 h -8 z`}
          fill="rgba(255,255,255,0.7)"
        />
        <g ref={discRef}>
          {planets.map((planet) => (
            <circle
              key={`orbit-${planet.id}`}
              cx={CENTER}
              cy={CENTER}
              r={svgRadius(planet.orbitRadius)}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
            />
          ))}
          {/* sun */}
          <circle cx={CENTER} cy={CENTER} r={5} fill="#ffb347" />
          {planets.map((planet) => (
            <g
              key={planet.id}
              ref={(el) => {
                if (el) dotRefs.current.set(planet.id, el);
                else dotRefs.current.delete(planet.id);
              }}
            >
              {/* generous invisible hit area */}
              <circle
                r={10}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onDotClick(planet.id)}
              />
              <circle r={4} fill={planet.color} pointerEvents="none" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
