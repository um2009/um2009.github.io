import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

const planets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/planets' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    attachment: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.enum(['projects', 'extracurriculars', 'interests', 'sports']),
    planetColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'planetColor must be a 6-digit hex color'),
    orbitRadius: z.number().positive(),
    /** Equirectangular surface texture; falls back to a planetColor glow if omitted. */
    texture: z.string().optional(),
    /** Renders a translucent ring (Saturn). Value is the ring tint color. */
    ringColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    /** Sphere radius in world units; derived from orbitRadius if omitted. */
    planetSize: z.number().positive().optional(),
    /** External links (repos, websites, articles) shown as buttons in the modal. */
    links: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
  }),
});

// Free-form pages rendered into modals (currently just the About Me shown
// when clicking the top-left name bubble). Edit src/content/pages/about.md.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().default('About Me'),
  }),
});

export const collections = { planets, pages };
