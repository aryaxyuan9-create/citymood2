// ─────────────────────────────────────────────
//  Neighborhood photo data
//  Photos live in public/photos/[slug]/
//  Name your files 01.jpg, 02.jpg … 20.jpg (up to 20 per neighborhood).
//  The gallery hides any path that returns a 404 — only uploaded files appear.
// ─────────────────────────────────────────────

export type NeighborhoodPhotoData = {
  slug: string;
  name: string;
  /** All candidate paths 01–20. Missing files are hidden at runtime via onError. */
  photos: string[];
};

const photoSlots = (slug: string): string[] =>
  Array.from({ length: 20 }, (_, i) =>
    `/photos/${slug}/${String(i + 1).padStart(2, "0")}.jpg`
  );

export const NEIGHBORHOOD_DATA: NeighborhoodPhotoData[] = [
  { slug: "financial",   name: "Financial District",    photos: photoSlots("financial")   },
  { slug: "soho",        name: "SoHo / Tribeca",        photos: photoSlots("soho")        },
  { slug: "westvillage", name: "West Village",          photos: photoSlots("westvillage") },
  { slug: "eastvillage", name: "East Village",          photos: photoSlots("eastvillage") },
  { slug: "chelsea",     name: "Chelsea",               photos: photoSlots("chelsea")     },
  { slug: "midtown",     name: "Midtown",               photos: photoSlots("midtown")     },
  { slug: "upperwest",   name: "Upper West Side",       photos: photoSlots("upperwest")   },
  { slug: "harlem",      name: "Harlem",                photos: photoSlots("harlem")      },
  { slug: "gramercy",    name: "Gramercy / Murray Hill",photos: photoSlots("gramercy")    },
  { slug: "greenwich-village", name: "Greenwich Village", photos: photoSlots("greenwich-village") },
  { slug: "dumbo",       name: "DUMBO",                 photos: photoSlots("dumbo")       },
  { slug: "williamsburg",name: "Williamsburg",          photos: photoSlots("williamsburg")},
];
