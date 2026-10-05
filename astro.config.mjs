// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Swap this for your custom domain once you buy one (keep the https://, no
  // trailing slash). Both serve from the root, so no `base` is needed.
  site: 'https://um2009.github.io',

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});