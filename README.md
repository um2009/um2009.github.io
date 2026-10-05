# Solar System Portfolio

An interactive 3D solar system where each planet is an activity or interest. Built with Astro, React Three Fiber, and Tailwind.

```
npm run dev      # start dev server at localhost:4321
npm run check    # validate types and content frontmatter
npm run build    # production build
```

## Editing content — no code required

Every planet is one markdown file in `src/content/planets/`. Edit the file, save, done.

### Frontmatter fields

```yaml
---
title: "VEX Robotics"                    # planet label + modal title
description: "One-line summary."
pubDate: 2026-03-15
attachment: "/assets/case-study.pdf"     # optional: "View attachment" button
tags: ["Robotics", "Engineering"]
category: "projects"                     # projects | extracurriculars | interests | sports
planetColor: "#E02424"                   # minimap dot + modal accent color
orbitRadius: 10                          # distance from the sun
texture: "/assets/textures/mercury.jpg"  # optional: planet surface (else colored glow)
ringColor: "#D8C08A"                     # optional: Saturn-style ring
planetSize: 1.2                          # optional: sphere size
links:                                   # optional: buttons in the modal
  - label: "GitHub Repo"
    url: "https://github.com/you/project"
---
```

### Images, links, and files

- **Files live in `public/assets/`.** Anything there is served from `/assets/...` — drop in photos, PDFs, whatever.
- **Images in the story:** standard markdown anywhere in the body:
  `![Robot at states](/assets/robot-states.jpg)`
- **Inline links:** standard markdown: `[our match video](https://youtube.com/...)`
- **Prominent buttons (repos, websites):** use the `links:` frontmatter list — they render as colored buttons at the top of the modal.
- **One featured document (resume, case study):** use `attachment:` for a dedicated button.

### Per-planet photo gallery (drop-in, zero config)

Create a folder named after the planet's id under `public/assets/gallery/` and drop
image files into it — they automatically appear as a clickable gallery in that
planet's modal, and clicking a thumbnail opens a full-screen viewer with ◄ ► arrows.

```
public/assets/gallery/
  robotics/        ← matches src/content/planets/robotics.md
    01-team.jpg
    02-competition.jpg
    03-award.jpg
```

- The folder name **must match the markdown filename** (`robotics.md` → `robotics/`).
- No frontmatter to edit — the folder is scanned automatically at build time.
- Images show in filename order; prefix with `01-`, `02-`, … to control the sequence.
- Supported: `.jpg .jpeg .png .webp .avif .gif`. A missing folder just means no gallery.
- After adding files, the dev server picks them up on restart; live sites need a rebuild
  (a `git push` if you're auto-deploying).

### Adding a whole new planet

Copy any existing file in `src/content/planets/`, rename it, and change the frontmatter. It appears in the 3D scene and minimap automatically. If a field has a typo, `npm run check` (and the dev server) will tell you exactly what's wrong.

### Top-left name bubble & welcome modal

- **Bubble text** (name, tagline, hint sentence): edit `name`, `tagline`, and `heroHint` in `src/config.ts`.
- **"How to use" bullets** in the modal: the `howTo` list in `src/config.ts`.
- **About Me text**: `src/content/pages/about.md` — plain markdown, same as a planet.
- **Photos**: drop images into `public/assets/gallery/about/` and they appear in the modal automatically.

### Profile sections (about, timeline, awards, contact)

The scrollable sections below the solar system read from `src/config.ts` — one plain object with the name, tagline, about paragraphs, stats, timeline, awards, and contact links. Edit values there; no component code needs to change.

## Updating the live site

This is a static site: content is baked in at build time, so "updating the site" means rebuilding. The standard zero-effort setup:

1. Put this folder in a GitHub repository.
2. Connect the repo to a free host — [Netlify](https://www.netlify.com), [Vercel](https://vercel.com), or [Cloudflare Pages](https://pages.cloudflare.com). Build command `npm run build`, output directory `dist`.
3. From then on, **every `git push` automatically rebuilds and deploys** in about a minute. Updating a planet = edit the markdown file, commit, push. You can even edit files directly on github.com (or the GitHub mobile app) and the site redeploys itself.

If a non-technical person will maintain content later, a git-based CMS like [Keystatic](https://keystatic.com) or [Decap](https://decapcms.org) can add a friendly web editing UI on top of the same markdown files — worth adding only when needed.

Planet textures from [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0).
