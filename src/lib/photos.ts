import { NEIGHBORHOOD_DATA } from "./neighborhoods";

/**
 * Returns the local photo paths for a neighborhood slug.
 * Paths are relative to /public and served at the root by Vite.
 * e.g. ["/photos/financial/01.jpg", "/photos/financial/02.jpg"]
 */
export function getNeighborhoodPhotos(slug: string): string[] {
  return NEIGHBORHOOD_DATA.find(n => n.slug === slug)?.photos ?? [];
}

/**
 * Returns all neighborhood slugs.
 */
export function getAllSlugs(): string[] {
  return NEIGHBORHOOD_DATA.map(n => n.slug);
}
