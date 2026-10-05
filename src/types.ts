/** Serializable planet config derived from content frontmatter — safe to pass as island props. */
export interface PlanetData {
  id: string;
  title: string;
  description: string;
  attachment?: string;
  tags: string[];
  category: string;
  color: string;
  orbitRadius: number;
  /** Radians per second, derived from orbitRadius (Kepler-ish falloff). */
  orbitSpeed: number;
  /** Starting angle in radians (golden-angle spaced so planets spread evenly). */
  phase?: number;
  /** Sphere radius in world units, from planetSize frontmatter or derived from orbitRadius. */
  size: number;
  /** Equirectangular surface texture path; falls back to a planetColor glow. */
  texture?: string;
  /** Tint color for a translucent ring (Saturn-style), if any. */
  ringColor?: string;
  /** External links (repos, websites, articles) shown as buttons in the modal. */
  links: { label: string; url: string }[];
  /** Gallery image URLs, auto-discovered from public/assets/gallery/<id>/. */
  gallery: string[];
}
