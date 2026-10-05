import type { PlanetData } from '../../types';
import { $focusedPlanetId } from '../../stores/solar';

interface Props {
  planets: PlanetData[];
}

/** Card grid of every planet; clicking one scrolls back to the hero and focuses it in 3D. */
export default function PlanetGrid({ planets }: Props) {
  const explore = (id: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $focusedPlanetId.set(id);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {planets.map((planet) => (
        <button
          key={planet.id}
          type="button"
          onClick={() => explore(planet.id)}
          className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-xl transition hover:border-white/25 hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full"
              style={{ backgroundColor: planet.color, boxShadow: `0 0 12px ${planet.color}` }}
            />
            <h3 className="font-semibold text-white">{planet.title}</h3>
            <span className="ml-auto text-xs uppercase tracking-wider text-white/40">
              {planet.category}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/60">{planet.description}</p>
          <p className="mt-3 text-xs text-white/40 transition group-hover:text-white/70">
            Visit planet →
          </p>
        </button>
      ))}
    </div>
  );
}
