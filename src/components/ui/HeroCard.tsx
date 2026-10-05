import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  name: string;
  tagline: string;
  hint: string;
  howTo: readonly string[];
  /** Photos from public/assets/gallery/about/, discovered at build time. */
  images: string[];
}

/** Same glowing-yellow accent used by the planet modals. */
const ACCENT = '#FBBF24';

/**
 * The top-left name bubble. Clicking it opens a modal with how-to-use
 * instructions, an About Me section (markdown from src/content/pages/about.md,
 * server-rendered into the hidden <template id="about-content">), and an
 * optional photo grid.
 */
export default function HeroCard({ name, tagline, hint, howTo, images }: Props) {
  const [open, setOpen] = useState(false);
  const [aboutHtml, setAboutHtml] = useState('');
  // The modal portals into <body> so it escapes <main>'s z-10 stacking
  // context and covers the minimap; portal only exists after mount (no SSR).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const tpl = document.getElementById('about-content') as HTMLTemplateElement | null;
    setAboutHtml(tpl?.innerHTML ?? '');
  }, [open]);

  // Esc closes; page scroll locks while open (same pattern as ContentModal).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group w-fit max-w-xs cursor-pointer rounded-xl border border-amber-300/60 bg-white/5 p-4 text-left backdrop-blur-xl transition hover:border-amber-300 hover:bg-white/10"
      >
        <h1 className="text-xl font-bold tracking-wide text-white/90">{name}</h1>
        <p className="mt-1 text-xs leading-relaxed text-white/60">
          {tagline} {hint}
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-amber-300/70 transition group-hover:text-amber-300">
          Click for more ↗
        </p>
      </button>

      {mounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-30 flex items-center justify-center p-4 transition-opacity duration-300 sm:p-8 ${
              open ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!open}
            onClick={() => setOpen(false)}
          >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <aside
          onClick={(e) => e.stopPropagation()}
          className={`relative flex max-h-[88vh] w-full max-w-3xl transform flex-col overflow-hidden rounded-2xl border border-white/15 bg-black/70 backdrop-blur-xl transition-transform duration-300 ease-out ${
            open ? 'scale-100' : 'scale-95'
          }`}
        >
          <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: ACCENT }}>
                Welcome
              </p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">{name}</h2>
              <p className="mt-1 text-sm text-white/60">{tagline}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <h3 className="text-sm uppercase tracking-widest text-white/40">How to use this site</h3>
            <ul className="mt-3 space-y-2">
              {howTo.map((tip) => (
                <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-white/75">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }}
                  />
                  {tip}
                </li>
              ))}
            </ul>

            <h3 className="mt-8 text-sm uppercase tracking-widest text-white/40">About me</h3>
            <div
              className="prose prose-invert mt-2 max-w-none"
              dangerouslySetInnerHTML={{ __html: aboutHtml }}
            />

            {images.length > 0 && (
              <>
                <h3 className="mt-8 text-sm uppercase tracking-widest text-white/40">Photos</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {images.map((src) => (
                    <div
                      key={src}
                      className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/5"
                    >
                      <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
