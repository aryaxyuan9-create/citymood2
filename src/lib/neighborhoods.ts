// ─────────────────────────────────────────────
//  Neighborhood photo data
//  Photos live in public/photos/[slug]/
//  Name your files 01.jpg, 02.jpg … 20.jpg (up to 20 per neighborhood).
//  The gallery hides any path that returns a 404 — only uploaded files appear.
// ─────────────────────────────────────────────

export type NeighborhoodPhotoData = {
  slug: string;
  name: string;
  /** Actual number of photos present on disk (drives map visual intensity). */
  count: number;
  /** All candidate paths 01–20. Missing files are hidden at runtime via onError. */
  photos: string[];
  borough?: string;
  moodTag?: string;
  coordinates?: { lat: number; lng: number };
};

const photoSlots = (slug: string): string[] =>
  Array.from({ length: 20 }, (_, i) =>
    `/photos/${slug}/${String(i + 1).padStart(2, "0")}.jpg`
  );

export const NEIGHBORHOOD_DATA: NeighborhoodPhotoData[] = [
  { slug: "financial",         name: "Financial District",     count: 5, photos: photoSlots("financial")         },
  { slug: "soho",              name: "SoHo / Tribeca",         count: 3, photos: photoSlots("soho")              },
  { slug: "westvillage",       name: "West Village",           count: 2, photos: photoSlots("westvillage")       },
  { slug: "eastvillage",       name: "East Village",           count: 0, photos: photoSlots("eastvillage")       },
  { slug: "chelsea",           name: "Chelsea",                count: 0, photos: photoSlots("chelsea")           },
  { slug: "midtown",           name: "Midtown",                count: 1, photos: photoSlots("midtown")           },
  { slug: "upperwest",         name: "Upper West Side",        count: 0, photos: photoSlots("upperwest")         },
  { slug: "harlem",            name: "Harlem",                 count: 0, photos: photoSlots("harlem")            },
  { slug: "gramercy",          name: "Gramercy / Murray Hill", count: 0, photos: photoSlots("gramercy")          },
  { slug: "greenwich-village", name: "Greenwich Village",      count: 4, photos: photoSlots("greenwich-village") },
  { slug: "dumbo",             name: "DUMBO",                  count: 8, photos: photoSlots("dumbo")             },
  { slug: "williamsburg",      name: "Williamsburg",           count: 4, photos: photoSlots("williamsburg")      },
  {
    slug: "washington-heights", name: "Washington Heights", borough: "Manhattan", moodTag: "VIBRANT & UPTOWN",
    count: 0, photos: photoSlots("washington-heights"),
    coordinates: { lat: 40.8448, lng: -73.9395 },
  },
  {
    slug: "upper-east-side", name: "Upper East Side", borough: "Manhattan", moodTag: "REFINED & COMPOSED",
    count: 0, photos: photoSlots("upper-east-side"),
    coordinates: { lat: 40.7736, lng: -73.9566 },
  },
  {
    slug: "central-park", name: "Central Park", borough: "Manhattan", moodTag: "OPEN & BREATHING",
    count: 0, photos: photoSlots("central-park"),
    coordinates: { lat: 40.7851, lng: -73.9683 },
  },
  {
    slug: "lower-east-side", name: "Lower East Side", borough: "Manhattan", moodTag: "GRITTY & ALIVE",
    count: 0, photos: photoSlots("lower-east-side"),
    coordinates: { lat: 40.7151, lng: -73.9842 },
  },
];
