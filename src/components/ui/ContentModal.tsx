import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import type { PlanetData } from '../../types';
import { $focusedPlanetId } from '../../stores/solar';

interface Props {
  planets: PlanetData[];
}

/** Shared glowing-yellow accent so every modal matches the label icon color. */
const ACCENT = '#FBBF24';

/**
 * Large floating dialog, detached from the page edges. Markdown bodies are
 * server-rendered by Astro into hidden <template id="planet-content-{id}">
 * elements on the page; this component lifts the matching template's HTML
 * when a planet gains focus. Layout: gallery on top, story in the middle,
 * links pinned to the bottom.
 */
export default function ContentModal({ planets }: Props) {
  const focusedId = useStore($focusedPlanetId);
  const planet = planets.find((p) => p.id === focusedId) ?? null;
  const [bodyHtml, setBodyHtml] = useState('');
  // Index of the image open in the full-screen lightbox, or null when closed.
  const [lightbox, setLightbox] = useState<number | null>(null);
  const gallery = planet?.gallery ?? [];
  // The slideshow strip (scroll-snap carousel driven by the arrow buttons).
  const strip = useRef<HTMLDivElement>(null);

  const slide = (dir: 1 | -1) => {
    const el = strip.current;
    // Direct assignment (not scrollBy smooth): the CSS scroll-smooth class on
    // the strip animates it, and it works even where smooth scrollBy doesn't.
    if (el) el.scrollLeft += dir * el.clientWidth * 0.9;
  };

  useEffect(() => {
    if (!focusedId) return;
    const tpl = document.getElementById(`planet-content-${focusedId}`) as HTMLTemplateElement | null;
    setBodyHtml(tpl?.innerHTML ?? '');
    setLightbox(null); // reset viewer when switching planets
    strip.current?.scrollTo({ left: 0 }); // rewind the slideshow
  }, [focusedId]);

  // Lock page scrolling while the dialog is open (the dialog's own content
  // area still scrolls — the lock only applies to the page behind it).
  useEffect(() => {
    if (!planet) return;
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [planet]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox !== null) {
        // Lightbox intercepts keys first: Esc closes it, arrows navigate.
        if (e.key === 'Escape') setLightbox(null);
        else if (e.key === 'ArrowRight') setLightbox((i) => (i! + 1) % gallery.length);
        else if (e.key === 'ArrowLeft') setLightbox((i) => (i! - 1 + gallery.length) % gallery.length);
      } else if (e.key === 'Escape') {
        $focusedPlanetId.set(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, gallery.length]);

  return (
    <>
      <div
        className={`fixed inset-0 z-30 flex items-center justify-center p-4 transition-opacity duration-300 sm:p-8 ${
          planet ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!planet}
        onClick={() => $focusedPlanetId.set(null)}
      >
        {/* dimmed backdrop keeps the planet faintly visible behind the dialog */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <aside
          onClick={(e) => e.stopPropagation()}
          className={`relative flex max-h-[88vh] w-full max-w-4xl transform flex-col overflow-hidden rounded-2xl border border-white/15 bg-black/70 backdrop-blur-xl transition-transform duration-300 ease-out ${
            planet ? 'scale-100' : 'scale-95'
          }`}
        >
          {planet && (
            <>
              {/* header bar */}
              <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
                <div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: ACCENT }}>
                    {planet.category}
                  </p>
                  <h2 className="text-2xl font-bold text-white sm:text-3xl">{planet.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {planet.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/15 px-3 py-0.5 text-xs text-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => $focusedPlanetId.set(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </header>

              {/* scrollable middle: images on top, story underneath */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {gallery.length > 0 ? (
                  <div className="relative p-6 pb-2">
                    {/* slideshow strip: 2/3/4 thumbnails visible per breakpoint */}
                    <div
                      ref={strip}
                      className="flex snap-x gap-2 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {gallery.map((src, i) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setLightbox(i)}
                          className="group aspect-[4/3] w-[calc((100%-0.5rem)/2)] shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:w-[calc((100%-1rem)/3)] lg:w-[calc((100%-1.5rem)/4)]"
                        >
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>

                    {gallery.length > 2 && (
                      <>
                        <button
                          type="button"
                          onClick={() => slide(-1)}
                          className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-lg text-white/80 shadow-lg backdrop-blur transition hover:bg-black/80 hover:text-white"
                          aria-label="Previous images"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => slide(1)}
                          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-lg text-white/80 shadow-lg backdrop-blur transition hover:bg-black/80 hover:text-white"
                          aria-label="Next images"
                        >
                          ›
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  /* no gallery yet: a soft banner in the accent color */
                  <div
                    className="h-24 w-full opacity-60"
                    style={{
                      background: `linear-gradient(to bottom, ${ACCENT}55, transparent)`,
                    }}
                  />
                )}

                <div
                  className="prose prose-invert max-w-none px-6 py-5"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              </div>

              {/* footer pinned to the bottom: links + attachment */}
              {(planet.links.length > 0 || planet.attachment) && (
                <footer className="flex flex-wrap items-center gap-2 border-t border-white/10 px-6 py-4">
                  {planet.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium text-black transition hover:opacity-85"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {link.label} ↗
                    </a>
                  ))}
                  {planet.attachment && (
                    <a
                      href={planet.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg border border-white/20 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
                    >
                      View attachment ↗
                    </a>
                  )}
                </footer>
              )}
            </>
          )}
        </aside>
      </div>

      {/* Full-screen lightbox, rendered as a sibling of the transformed panel
          so its fixed positioning resolves against the viewport, not the panel. */}
      {planet && lightbox !== null && gallery[lightbox] && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
            aria-label="Close image"
          >
            ✕
          </button>

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i! - 1 + gallery.length) % gallery.length);
                }}
                className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i! + 1) % gallery.length);
                }}
                className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          <figure className="flex max-h-[90vh] max-w-[90vw] flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={gallery[lightbox]}
              alt=""
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
            {gallery.length > 1 && (
              <figcaption className="mt-3 text-xs tracking-widest text-white/50">
                {lightbox + 1} / {gallery.length}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
