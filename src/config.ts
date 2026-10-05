/**
 * Site-wide profile data for the scrollable portfolio sections.
 * All mock — edit freely; no component code references specific values.
 */
export const SITE = {
  name: 'Udyat Murugesan',
  tagline: 'ACP Class of 27',
  /** Short hint shown inside the top-left bubble, after the tagline. */
  heroHint: 'Click a planet to explore. Drag the space — or the dial — to look around.',
  /** Bullet list shown in the "How to use" section of the top-left modal. */
  howTo: [
    'Each planet is one of my activities or interests — click any planet (or its label) to read the full story.',
    'Drag anywhere in space, or spin the dial in the top-right corner, to look around the system.',
    'Scroll down for the full list of planets, plus more about me.',
    'Inside a planet, browse photos with the arrows and click one to view it full screen.',
  ],
  about: [
    'Hi! I\'m Udyat Murugesan, a high school senior. I go to ACP, and intend to study aerospace engineering in college',
    'How to use this site: My life is represented as a solar system. Each planet represents a component of me, and you can scroll down for more info!',
  ],
  stats: [
    { value: '2027', label: 'Class of' },
  ],
  contact: {
    github: 'https://github.com/example',
    linkedin: 'https://www.linkedin.com/in/example',
  },
} as const;
