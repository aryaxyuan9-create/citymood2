import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as exifr from "exifr";
import ShaderBackground from "../components/home/ShaderBackground";
import { supabase } from "../lib/supabase";
import AtlasStyledMap, { type EntryMapMeta, type MapPhotoPoint, type RepresentativePhoto } from "../components/AtlasStyledMap";
import { analyzePhoto } from "../lib/analyzePhoto";
import { fileToBase64 } from "../lib/toBase64";
import { getEmotion } from "../lib/emotions";

// ─────────────────────────────────────────────
//  Neighborhood data
// ─────────────────────────────────────────────
// Paths + label positions generated from NYC NTA GeoJSON (2020) via src/scripts/filter-neighborhoods.cjs
const HOODS = [
  { slug: "financial", name: "Financial District", borough: "Manhattan", mood: "Towering & silent", accent: "#c8a96e", lx: 78.4, ly: 458.9,
    path: `M 118.9 491.2 L 110.4 489.8 L 112.8 487.2 L 120.9 489.3 L 118.9 491.2 Z M 128.1 480.7 L 126.2 483.2 L 117.9 481.2 L 120.0 478.8 L 128.1 480.7 Z M 129.5 478.7 L 121.8 476.8 L 123.9 474.5 L 131.4 476.4 L 129.5 478.7 Z M 136.0 471.4 L 134.5 472.9 L 129.0 471.2 L 136.4 466.0 L 140.4 467.1 L 136.0 471.4 Z M 140.7 466.7 L 139.2 466.3 L 141.7 466.3 L 140.7 466.7 Z M 141.8 464.4 L 140.8 464.8 L 141.8 464.4 Z M 75.0 423.2 L 69.7 437.6 L 90.1 444.0 L 105.6 439.7 L 105.1 441.7 L 125.2 453.3 L 117.4 456.4 L 118.1 457.6 L 116.5 458.3 L 119.6 460.4 L 116.4 461.9 L 112.1 460.1 L 114.4 462.3 L 112.6 462.4 L 109.2 459.8 L 107.3 460.7 L 111.9 463.7 L 106.4 461.1 L 96.8 465.2 L 101.7 468.3 L 101.0 468.6 L 96.1 465.5 L 86.5 470.0 L 88.8 472.2 L 93.0 471.7 L 89.4 472.8 L 90.1 473.5 L 89.1 473.8 L 85.4 470.3 L 79.3 471.4 L 80.7 474.8 L 79.5 472.9 L 77.2 473.2 L 77.6 474.1 L 75.9 473.5 L 76.4 475.3 L 74.7 473.7 L 73.9 475.1 L 72.0 474.0 L 72.2 476.0 L 71.4 474.0 L 69.8 475.0 L 70.3 472.8 L 67.3 472.2 L 69.7 472.4 L 68.7 471.1 L 69.2 468.7 L 67.0 466.7 L 67.5 462.8 L 58.6 462.1 L 53.6 464.4 L 54.0 463.6 L 50.9 463.1 L 55.4 462.5 L 50.0 462.3 L 48.3 458.5 L 49.1 456.1 L 51.3 456.2 L 52.7 453.7 L 50.1 453.1 L 54.3 439.9 L 54.1 441.2 L 58.6 441.8 L 59.8 438.3 L 55.0 437.8 L 54.4 439.2 L 58.3 423.9 L 71.6 424.7 L 72.3 422.5 L 75.0 423.2 Z` },
  { slug: "soho", name: "SoHo / Tribeca", borough: "Manhattan", mood: "Cast iron & quiet", accent: "#a0b8d8", lx: 105.5, ly: 408.8,
    path: `M 111.2 397.0 L 134.2 405.1 L 150.0 408.6 L 141.7 424.3 L 136.9 430.5 L 124.5 426.9 L 80.7 404.1 L 79.1 408.3 L 76.4 408.1 L 77.5 403.8 L 64.0 402.5 L 64.3 401.3 L 78.0 402.3 L 78.6 397.3 L 81.4 397.5 L 81.7 394.9 L 111.2 397.0 Z M 124.5 426.9 L 118.9 433.1 L 120.2 435.7 L 119.0 435.3 L 118.2 436.9 L 115.9 437.5 L 118.3 438.7 L 118.6 443.2 L 119.9 445.0 L 116.5 448.2 L 105.1 441.7 L 105.6 439.7 L 90.1 444.0 L 69.7 437.6 L 75.1 422.7 L 72.3 422.5 L 72.8 420.8 L 70.8 420.0 L 59.6 419.0 L 59.8 418.1 L 72.4 419.2 L 72.8 417.7 L 62.2 416.7 L 62.4 415.8 L 74.2 415.9 L 76.4 408.1 L 79.1 408.3 L 80.7 404.1 L 124.5 426.9 Z` },
  { slug: "westvillage", name: "West Village", borough: "Manhattan", mood: "Hushed & timeless", accent: "#e8b4a0", lx: 86.7, ly: 375,
    path: `M 87.1 357.9 L 133.9 372.1 L 116.5 389.5 L 111.2 397.0 L 81.7 394.9 L 81.4 397.5 L 67.1 396.7 L 68.3 390.6 L 79.4 391.2 L 80.0 386.0 L 80.2 384.1 L 68.6 383.2 L 81.1 382.9 L 80.7 381.4 L 76.1 381.2 L 80.7 380.6 L 82.0 370.1 L 79.5 369.2 L 82.1 369.3 L 82.3 367.1 L 77.8 366.8 L 78.3 363.2 L 73.7 362.7 L 85.2 363.0 L 86.1 361.6 L 85.3 361.0 L 78.5 359.8 L 80.6 357.6 L 87.1 357.9 Z M 86.2 358.8 L 83.5 357.9 L 84.5 358.8 L 83.2 360.2 L 86.3 360.9 L 86.2 358.8 Z` },
  { slug: "eastvillage", name: "East Village", borough: "Manhattan", mood: "Restless & raw", accent: "#c8a0d0", lx: 195.6, ly: 404.8,
    path: `M 229.3 404.0 L 222.5 424.0 L 208.6 422.0 L 150.0 408.6 L 155.3 398.7 L 160.3 380.2 L 228.3 401.1 L 229.9 401.8 L 229.3 404.0 Z` },
  { slug: "greenwich-village", name: "Greenwich Village", borough: "Manhattan", mood: "Bohemian & alive", accent: "#d4956e", lx: 140.4, ly: 392.4,
    path: `M 160.3 380.2 L 155.3 398.7 L 150.0 408.6 L 134.2 405.1 L 111.2 397.0 L 116.5 389.5 L 133.9 372.1 L 160.3 380.2 Z` },
  { slug: "chelsea", name: "Chelsea", borough: "Manhattan", mood: "Industrial & luminous", accent: "#90c8a8", lx: 95.2, ly: 337.7,
    path: `M 115.1 303.2 L 139.1 310.5 L 132.2 317.5 L 153.7 324.1 L 132.9 344.9 L 154.5 351.5 L 133.9 372.1 L 87.1 357.9 L 87.3 356.8 L 85.3 356.6 L 85.5 355.8 L 75.7 355.0 L 76.1 353.9 L 88.0 354.0 L 88.7 351.3 L 84.1 350.1 L 84.3 351.2 L 83.2 351.1 L 83.9 350.1 L 82.0 349.9 L 82.2 351.0 L 80.9 351.0 L 81.8 349.9 L 79.6 349.7 L 79.9 350.8 L 78.5 350.8 L 79.4 349.7 L 77.2 349.5 L 76.8 350.6 L 77.0 349.3 L 77.4 348.3 L 85.9 348.9 L 86.3 347.3 L 77.8 346.5 L 78.2 345.5 L 86.7 346.1 L 87.1 344.4 L 78.5 343.7 L 78.9 342.6 L 87.4 343.3 L 87.8 341.5 L 79.2 340.8 L 79.6 339.8 L 84.0 340.1 L 87.2 336.1 L 81.3 334.3 L 81.7 333.5 L 87.6 335.4 L 89.4 331.9 L 86.3 330.6 L 89.8 331.2 L 83.9 329.0 L 90.1 330.7 L 92.4 325.2 L 103.6 315.6 L 101.8 315.0 L 102.7 314.0 L 95.2 311.6 L 97.2 309.8 L 104.7 312.0 L 107.0 311.2 L 105.5 309.8 L 107.9 310.3 L 106.9 309.5 L 113.0 305.2 L 105.0 302.1 L 113.5 304.7 L 115.1 303.2 Z` },
  { slug: "midtown", name: "Midtown", borough: "Manhattan", mood: "Relentless & electric", accent: "#f0a080", lx: 192.6, ly: 313.6,
    path: `M 224.6 297.7 L 236.8 301.5 L 214.0 324.2 L 211.3 323.4 L 209.5 325.1 L 204.3 330.5 L 206.9 331.3 L 194.8 343.4 L 170.2 335.9 L 168.4 337.7 L 146.8 331.1 L 190.0 288.1 L 192.3 287.7 L 224.6 297.7 Z M 194.8 343.4 L 160.4 377.5 L 160.3 380.2 L 133.9 372.1 L 154.5 351.5 L 132.9 344.9 L 146.8 331.1 L 168.4 337.7 L 170.2 335.9 L 194.8 343.4 Z M 249.1 305.2 L 278.2 314.1 L 279.9 313.5 L 256.2 332.4 L 246.6 329.7 L 240.2 336.8 L 222.7 331.4 L 219.2 335.0 L 204.3 330.5 L 211.3 323.4 L 214.0 324.2 L 236.8 301.5 L 249.1 305.2 Z` },
  { slug: "upperwest", name: "Upper West Side", borough: "Manhattan", mood: "Cultural & unhurried", accent: "#b8d0e8", lx: 198.5, ly: 235,
    path: `M 258.2 220.0 L 217.0 261.0 L 178.7 249.3 L 176.4 253.4 L 167.1 250.3 L 177.2 239.4 L 174.5 237.4 L 170.9 239.8 L 174.7 237.0 L 177.3 239.2 L 178.7 237.8 L 176.1 237.1 L 178.9 237.6 L 180.3 236.2 L 175.4 236.3 L 180.4 236.0 L 211.7 203.7 L 238.3 211.8 L 236.6 213.5 L 258.2 220.0 Z M 217.0 261.0 L 191.6 286.3 L 192.3 287.7 L 189.0 289.1 L 145.6 275.8 L 147.3 274.0 L 136.2 271.4 L 136.8 270.6 L 145.0 273.1 L 151.3 267.7 L 152.1 266.7 L 150.9 266.5 L 156.4 260.9 L 158.4 260.9 L 164.3 255.1 L 154.0 255.4 L 164.2 254.6 L 167.1 250.3 L 176.4 253.4 L 178.7 249.3 L 217.0 261.0 Z M 275.5 195.7 L 281.1 197.3 L 258.2 220.0 L 236.6 213.5 L 238.3 211.8 L 211.7 203.7 L 231.9 182.9 L 275.5 195.7 Z` },
  { slug: "harlem", name: "Harlem", borough: "Manhattan", mood: "Deep & resonant", accent: "#d4a0a0", lx: 362.1, ly: 123.8,
    path: `M 368.7 108.6 L 373.7 144.4 L 371.3 144.5 L 372.8 149.6 L 343.5 179.3 L 304.2 167.3 L 315.2 158.3 L 327.1 140.1 L 330.6 141.2 L 339.1 134.6 L 353.1 120.7 L 355.4 116.7 L 349.7 115.0 L 354.2 109.3 L 370.5 99.2 L 371.4 99.7 L 369.6 101.5 L 368.7 108.6 Z M 343.5 179.3 L 339.8 183.0 L 333.7 181.2 L 326.6 188.1 L 332.7 190.0 L 315.1 207.6 L 275.5 195.7 L 280.8 190.3 L 280.9 183.6 L 293.3 171.1 L 298.6 172.7 L 304.2 167.3 L 343.5 179.3 Z M 327.1 140.1 L 315.2 158.3 L 304.2 167.3 L 296.7 165.0 L 290.5 159.8 L 288.4 161.9 L 276.1 151.9 L 266.4 148.9 L 274.8 142.8 L 277.4 139.3 L 277.6 140.3 L 278.6 139.4 L 277.9 137.0 L 274.5 136.5 L 275.6 135.4 L 278.2 136.1 L 279.7 138.5 L 282.0 136.0 L 275.9 133.6 L 277.4 131.7 L 284.0 134.6 L 309.0 141.3 L 312.5 137.9 L 317.7 139.5 L 319.5 137.8 L 327.1 140.1 Z` },
  { slug: "gramercy", name: "Gramercy / Murray Hill", borough: "Manhattan", mood: "Quiet & composed", accent: "#c8b890", lx: 183, ly: 374.7,
    path: `M 203.6 373.4 L 188.3 388.7 L 160.3 380.2 L 160.4 377.5 L 182.5 355.6 L 194.7 359.3 L 187.9 366.2 L 205.4 371.6 L 203.6 373.4 Z` },
  { slug: "dumbo", name: "DUMBO", borough: "Brooklyn", mood: "Moody & vast", accent: "#a8c0d8", lx: 174.4, ly: 481.2,
    path: `M 201.6 458.9 L 197.0 467.0 L 197.9 469.5 L 194.6 470.2 L 196.5 473.4 L 196.1 482.4 L 197.5 490.0 L 201.2 493.4 L 188.5 493.0 L 188.4 494.8 L 191.3 494.8 L 190.2 499.4 L 192.7 503.2 L 184.6 503.2 L 194.8 506.2 L 205.3 517.1 L 199.5 523.8 L 166.5 514.4 L 163.3 518.0 L 145.0 512.8 L 151.0 503.9 L 158.1 505.4 L 162.9 500.3 L 164.0 497.2 L 156.2 496.0 L 158.3 492.4 L 155.1 484.8 L 154.5 480.1 L 156.6 473.5 L 150.0 469.7 L 140.7 466.7 L 142.2 465.9 L 140.9 465.3 L 141.8 463.6 L 151.9 462.4 L 152.9 464.1 L 156.3 464.2 L 159.1 461.7 L 166.4 462.8 L 166.5 461.4 L 167.7 461.2 L 173.2 461.6 L 173.5 460.6 L 184.9 459.8 L 194.5 460.5 L 194.5 459.0 L 201.6 458.9 Z` },
  { slug: "williamsburg", name: "Williamsburg", borough: "Brooklyn", mood: "Loud & searching", accent: "#d8b8a0", lx: 263.2, ly: 433.7,
    path: `M 281.2 407.9 L 294.0 413.3 L 305.9 410.4 L 309.7 415.4 L 315.7 413.1 L 318.2 424.4 L 322.8 424.1 L 298.9 436.5 L 314.6 436.5 L 317.3 448.5 L 308.9 449.1 L 311.3 460.2 L 282.1 452.1 L 280.0 455.3 L 261.6 454.0 L 242.2 456.5 L 238.8 455.8 L 236.6 453.2 L 236.3 449.7 L 237.6 447.0 L 235.8 446.5 L 238.4 444.9 L 236.4 444.2 L 239.0 444.3 L 240.4 440.6 L 242.0 439.6 L 240.4 438.8 L 246.5 428.4 L 254.6 422.2 L 254.1 419.7 L 257.1 420.0 L 263.6 413.5 L 267.8 406.6 L 266.1 405.9 L 269.7 405.5 L 281.2 407.9 Z M 311.3 460.2 L 342.9 473.4 L 263.3 480.8 L 265.8 474.8 L 246.7 463.6 L 242.2 456.5 L 261.6 454.0 L 280.0 455.3 L 282.1 452.1 L 311.3 460.2 Z` },
  { slug: "washington-heights", name: "Washington Heights", borough: "Manhattan", mood: "Vibrant & uptown", accent: "#c8a090", lx: 355, ly: 82,
    path: `M 311.4 104.1 L 326.9 77.6 L 323.7 59.4 L 379.3 6.1 L 393.2 14.4 L 415.4 36.2 L 383.0 67.8 L 348.9 114.7 L 311.4 104.1 Z` },
  { slug: "upper-east-side", name: "Upper East Side", borough: "Manhattan", mood: "Refined & composed", accent: "#b8c8a8", lx: 335, ly: 235,
    path: `M 373.7 145.4 L 392.0 195.9 L 388.9 212.9 L 355.4 222.3 L 318.6 204.1 L 373.7 145.4 Z M 318.6 204.1 L 346.3 219.5 L 369.1 221.9 L 365.5 243.3 L 336.4 246.9 L 336.5 253.8 L 342.3 265.4 L 321.7 281.5 L 290.2 232.3 L 318.6 204.1 Z` },
  { slug: "central-park", name: "Central Park", borough: "Manhattan", mood: "Open & breathing", accent: "#90c0a0", lx: 253, ly: 248,
    path: `M 315.1 207.6 L 224.6 297.7 L 192.3 287.7 L 281.1 197.3 L 315.1 207.6 Z` },
  { slug: "lower-east-side", name: "Lower East Side", borough: "Manhattan", mood: "Gritty & alive", accent: "#d4a8b0", lx: 248, ly: 420,
    path: `M 229.3 404.0 L 265.3 382.1 L 268.0 403.9 L 266.1 405.9 L 242.2 456.5 L 222.5 424.0 L 229.3 404.0 Z` },
] as const;

type Slug = typeof HOODS[number]["slug"];

const MAP_VIEWBOX = { minX: 0, minY: 0, width: 430, height: 560 };
const NYC_BOUNDS = { minLat: 40.675, maxLat: 40.895, minLng: -74.055, maxLng: -73.845 };

const HOOD_CENTER_COORDS: Record<Slug, { lat: number; lng: number }> = {
  financial: { lat: 40.7075, lng: -74.0113 },
  soho: { lat: 40.7233, lng: -74.0030 },
  westvillage: { lat: 40.7359, lng: -74.0036 },
  eastvillage: { lat: 40.7265, lng: -73.9815 },
  "greenwich-village": { lat: 40.7336, lng: -74.0027 },
  chelsea: { lat: 40.7465, lng: -74.0014 },
  midtown: { lat: 40.7549, lng: -73.9840 },
  upperwest: { lat: 40.7870, lng: -73.9754 },
  harlem: { lat: 40.8116, lng: -73.9465 },
  gramercy: { lat: 40.7376, lng: -73.9857 },
  dumbo: { lat: 40.7033, lng: -73.9881 },
  williamsburg: { lat: 40.7081, lng: -73.9571 },
  "washington-heights": { lat: 40.8460, lng: -73.9360 },
  "upper-east-side": { lat: 40.7736, lng: -73.9566 },
  "central-park": { lat: 40.7829, lng: -73.9654 },
  "lower-east-side": { lat: 40.7150, lng: -73.9843 },
};

function getHood(slug: string | null) {
  return HOODS.find(h => h.slug === slug) ?? null;
}
function getNeighborhoodName(slug: string | null) {
  return getHood(slug)?.name ?? "";
}
function getBorough(slug: string | null) {
  return getHood(slug)?.borough ?? "";
}
function getMoodTag(slug: string | null) {
  return getHood(slug)?.mood ?? "";
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function latLngToMap(lat: number, lng: number): { x: number; y: number } {
  const x =
    MAP_VIEWBOX.minX +
    ((lng - NYC_BOUNDS.minLng) / (NYC_BOUNDS.maxLng - NYC_BOUNDS.minLng)) * MAP_VIEWBOX.width;
  const y =
    MAP_VIEWBOX.minY +
    (1 - (lat - NYC_BOUNDS.minLat) / (NYC_BOUNDS.maxLat - NYC_BOUNDS.minLat)) * MAP_VIEWBOX.height;
  return {
    x: clamp(x, MAP_VIEWBOX.minX, MAP_VIEWBOX.minX + MAP_VIEWBOX.width),
    y: clamp(y, MAP_VIEWBOX.minY, MAP_VIEWBOX.minY + MAP_VIEWBOX.height),
  };
}

function mapToLatLng(x: number, y: number): { lat: number; lng: number } {
  const nx = clamp((x - MAP_VIEWBOX.minX) / MAP_VIEWBOX.width, 0, 1);
  const ny = clamp((y - MAP_VIEWBOX.minY) / MAP_VIEWBOX.height, 0, 1);
  const lng = NYC_BOUNDS.minLng + nx * (NYC_BOUNDS.maxLng - NYC_BOUNDS.minLng);
  const lat = NYC_BOUNDS.minLat + (1 - ny) * (NYC_BOUNDS.maxLat - NYC_BOUNDS.minLat);
  return { lat, lng };
}

// ─────────────────────────────────────────────
//  Storage
// ─────────────────────────────────────────────
const DRAFT_KEY = "citymood-draft";

type PhotoLocationSource = "exif" | "manual" | "none";

type PhotoMemory = {
  url: string;
  note: string;
  capturedAt: string | null;
  lat: number | null;
  lng: number | null;
  assignedSlug: Slug;
  moods: string[];
  color: string;
  source: "manual" | "ai-assisted";
  aiSuggestedMoods?: string[];
  styleHint?: "dreamy" | "cinematic" | "soft" | "vivid" | "muted";
  moodConfidence?: number;
  locationSource: PhotoLocationSource;
  manualOverride: boolean;
  manualPlaceName: string;
};

type NeighborhoodEntry = {
  photos: PhotoMemory[];
  moods: string[];
  color: string;
  isDriftEntry?: boolean;
  driftPrompt?: string;
  capturedMoodFirst?: boolean;
};

type MemoryStore = Record<string, NeighborhoodEntry>;

type AtlasIdentityStats = {
  memoryCount: number;
  topMoods: string[];
  dominantMood: string;
  dominantColor: string;
  topDistrict: string;
};

type AtlasIdentityCopy = {
  title: string;
  narrative: string;
  styleJudgment: string;
  dominantMood: string;
  dominantColor: string;
};

type AtlasMeta = {
  creatorName: string;
  customSubtitle?: string;
  cityName?: string;
  optionalMemory?: string;
  identity?: AtlasIdentityCopy;
};

const DEFAULT_ENTRY_COLOR = "#D8B26D";
const MAX_MOODS = 3;
const MOOD_PRESETS = [
  "Calm",
  "Warm",
  "Nostalgic",
  "Electric",
  "Romantic",
  "Dreamy",
  "Melancholic",
  "Bold",
];

const DRIFT_PROMPTS = [
  "Follow a mood, not a destination.",
  "Notice a place you would normally pass by.",
  "Walk toward somewhere quieter.",
  "Find a place that feels unfamiliar.",
  "Pay attention to what changes your pace.",
  "Let the street decide for a while.",
  "Turn where your attention lingers.",
  "Stay with a block that feels different today.",
];

const MOOD_COLOR_MAP: Record<string, string> = {
  calm: "#7FA8FF",
  warm: "#F2A356",
  nostalgic: "#C9A1D8",
  electric: "#FFD35B",
  romantic: "#F58FA8",
  dreamy: "#98B6FF",
  melancholic: "#6C78A7",
  bold: "#FF8A5B",
};

function routeToFlowStep(pathname: string): "entry" | "upload" | "locate" | "generating" | "customize" {
  if (pathname === "/upload") return "upload";
  if (pathname === "/generate") return "generating";
  if (pathname === "/edit") return "customize";
  return "entry";
}

function suggestColorFromMood(mood: string | undefined): string {
  if (!mood) return DEFAULT_ENTRY_COLOR;
  return MOOD_COLOR_MAP[mood.trim().toLowerCase()] ?? DEFAULT_ENTRY_COLOR;
}

function normalizeMoods(input: string[]): string[] {
  const deduped: string[] = [];
  input.forEach((mood) => {
    const trimmed = mood.trim();
    if (!trimmed) return;
    const canonical = trimmed.slice(0, 1).toUpperCase() + trimmed.slice(1);
    if (!deduped.includes(canonical)) deduped.push(canonical);
  });
  return deduped.slice(0, MAX_MOODS);
}

function mostFrequent(items: string[], fallback: string): string {
  if (items.length === 0) return fallback;
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = item.trim();
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  let top = fallback;
  let topCount = 0;
  counts.forEach((count, key) => {
    if (count > topCount) {
      top = key;
      topCount = count;
    }
  });
  return top;
}

function getTopMoodsForIdentity(memories: MemoryStore, limit = 2): string[] {
  const all = Object.values(memories).flatMap((entry) => entry.moods ?? []);
  const counts = new Map<string, number>();
  all.forEach((raw) => {
    const mood = raw.trim();
    if (!mood) return;
    const key = mood.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key.slice(0, 1).toUpperCase() + key.slice(1));
}

function computeIdentityStats(memories: MemoryStore): AtlasIdentityStats {
  const entries = Object.entries(memories);
  const memoryCount = entries.reduce((sum, [, entry]) => sum + entry.photos.length, 0);
  const topMoods = getTopMoodsForIdentity(memories, 2);
  const dominantMood = topMoods[0] ?? "Calm";
  const colors = entries.map(([, entry]) => entry.color || suggestColorFromMood(entry.moods?.[0]));
  const dominantColor = mostFrequent(colors, "#D8B26D");
  const districts = entries.map(([slug]) => {
    const hood = HOODS.find((h) => h.slug === slug);
    return hood?.name || slug;
  });
  const topDistrict = mostFrequent(districts, "New York");
  return { memoryCount, topMoods, dominantMood, dominantColor, topDistrict };
}

function generateIdentityCopy(
  creatorName: string,
  customSubtitle: string,
  stats: AtlasIdentityStats,
): AtlasIdentityCopy {
  const cleanName = creatorName.trim() || "Your";
  const title = `${cleanName}'s New York`;
  const mood1 = (stats.topMoods[0] ?? "calm").toLowerCase();
  const mood2 = (stats.topMoods[1] ?? "reflective").toLowerCase();
  const descriptorPool = [
    "soft light and slower moments",
    "quiet streets and deliberate pauses",
    "personal corners and late-hour reflections",
    "small rituals and remembered evenings",
  ];
  const descriptor =
    descriptorPool[(cleanName.length + stats.memoryCount + stats.topDistrict.length) % descriptorPool.length];
  const narrative = customSubtitle.trim()
    ? customSubtitle.trim()
    : `A ${mood1}, ${mood2} view of New York shaped by ${descriptor}.`;
  const styleJudgment = `Your NYC leans ${mood1}, ${mood2}, and cinematic.`;
  return {
    title,
    narrative,
    styleJudgment,
    dominantMood: stats.dominantMood,
    dominantColor: stats.dominantColor,
  };
}

function loadDraft(): MemoryStore {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([slug, value]) => {
        if (
          value &&
          typeof value === "object" &&
          Array.isArray((value as { photos?: unknown[] }).photos)
        ) {
          const next = value as {
            photos: PhotoMemory[];
            moods?: string[];
            color?: string;
            isDriftEntry?: boolean;
            driftPrompt?: string;
            capturedMoodFirst?: boolean;
          };
          return [
            slug,
            {
              photos: next.photos.map((photo) => ({
                ...photo,
                assignedSlug: (photo.assignedSlug as Slug | undefined) ?? (slug as Slug),
                moods: normalizeMoods(Array.isArray(photo.moods) ? photo.moods : []),
                color: typeof photo.color === "string" && photo.color ? photo.color : DEFAULT_ENTRY_COLOR,
                source: photo.source === "ai-assisted" ? "ai-assisted" : "manual",
                aiSuggestedMoods: Array.isArray(photo.aiSuggestedMoods) ? normalizeMoods(photo.aiSuggestedMoods) : [],
                styleHint: photo.styleHint ?? "soft",
                moodConfidence: typeof photo.moodConfidence === "number" ? photo.moodConfidence : undefined,
              })),
              moods: normalizeMoods(Array.isArray(next.moods) ? next.moods : []),
              color: typeof next.color === "string" && next.color ? next.color : DEFAULT_ENTRY_COLOR,
              isDriftEntry: Boolean(next.isDriftEntry),
              driftPrompt: typeof next.driftPrompt === "string" ? next.driftPrompt : undefined,
              capturedMoodFirst: Boolean(next.capturedMoodFirst),
            },
          ];
        }
        if (
          value &&
          typeof value === "object" &&
          Array.isArray((value as { photoUrls?: string[] }).photoUrls) &&
          Array.isArray((value as { notes?: string[] }).notes)
        ) {
          const legacy = value as { photoUrls: string[]; notes: string[] };
          const legacyMoods = normalizeMoods(Array.isArray((value as { moods?: string[] }).moods) ? (value as { moods?: string[] }).moods ?? [] : []);
          const legacyColor =
            typeof (value as { color?: string }).color === "string" && (value as { color?: string }).color
              ? (value as { color?: string }).color as string
              : suggestColorFromMood(legacyMoods[0]);
          return [
            slug,
            {
              photos: legacy.photoUrls.map((url, idx) => ({
                url,
                note: legacy.notes[idx] ?? "",
                capturedAt: null,
                lat: null,
                lng: null,
                assignedSlug: slug as Slug,
                moods: [],
                color: DEFAULT_ENTRY_COLOR,
                source: "manual" as const,
                aiSuggestedMoods: [],
                styleHint: "soft" as const,
                moodConfidence: undefined,
                locationSource: "none" as PhotoLocationSource,
                manualOverride: false,
                manualPlaceName: "",
              })),
              moods: legacyMoods,
              color: legacyColor || DEFAULT_ENTRY_COLOR,
              isDriftEntry: false,
              driftPrompt: undefined,
              capturedMoodFirst: false,
            },
          ];
        }
        return [slug, { photos: [], moods: [], color: DEFAULT_ENTRY_COLOR }];
      }),
    );
  } catch {
    return {};
  }
}

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function localInputToIso(input: string): string | null {
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function distance2(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = aLat - bLat;
  const dLng = aLng - bLng;
  return dLat * dLat + dLng * dLng;
}

function nearestSlugFromLatLng(lat: number | null, lng: number | null): Slug | null {
  if (lat === null || lng === null) return null;
  let best: Slug | null = null;
  let bestD = Number.POSITIVE_INFINITY;
  (Object.entries(HOOD_CENTER_COORDS) as Array<[Slug, { lat: number; lng: number }]>).forEach(([slug, center]) => {
    const d = distance2(lat, lng, center.lat, center.lng);
    if (d < bestD) {
      bestD = d;
      best = slug;
    }
  });
  return best;
}

function suggestMoodsHeuristic(input: string): { moods: string[]; confidence: number; styleHint?: PhotoMemory["styleHint"] } {
  const text = input.toLowerCase();
  const moodPool: Array<{ mood: string; keys: string[] }> = [
    { mood: "Calm", keys: ["quiet", "still", "soft", "calm", "park", "river", "morning"] },
    { mood: "Warm", keys: ["sun", "golden", "warm", "amber", "sunset"] },
    { mood: "Nostalgic", keys: ["old", "memory", "nostalgia", "film", "vintage"] },
    { mood: "Electric", keys: ["night", "neon", "busy", "crowd", "city", "times square"] },
    { mood: "Romantic", keys: ["date", "love", "intimate", "kiss", "candle"] },
    { mood: "Dreamy", keys: ["dream", "fog", "mist", "blue", "float"] },
    { mood: "Melancholic", keys: ["rain", "alone", "lonely", "gray", "empty"] },
    { mood: "Bold", keys: ["red", "loud", "strong", "contrast", "dramatic"] },
  ];

  const scored = moodPool
    .map((item) => ({
      mood: item.mood,
      score: item.keys.reduce((sum, key) => sum + (text.includes(key) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score > 0).slice(0, 3).map((s) => s.mood);
  const fallback = ["Calm", "Nostalgic", "Dreamy"];
  const moods = (top.length > 0 ? top : fallback).slice(0, 3);
  const maxScore = scored[0]?.score ?? 0;
  const confidence = Math.max(0.45, Math.min(0.92, 0.46 + maxScore * 0.12));
  const styleHint: PhotoMemory["styleHint"] =
    text.includes("film") || text.includes("cinematic")
      ? "cinematic"
      : text.includes("vivid") || text.includes("neon")
      ? "vivid"
      : text.includes("muted") || text.includes("fog")
      ? "muted"
      : text.includes("soft")
      ? "soft"
      : "dreamy";

  return { moods, confidence, styleHint };
}

function deriveEntryMoodAndColor(photos: PhotoMemory[]): { moods: string[]; color: string } {
  const mergedMoods = normalizeMoods(photos.flatMap((photo) => photo.moods ?? []));
  const colors = photos.map((photo) => photo.color).filter(Boolean);
  const color = mostFrequent(colors, suggestColorFromMood(mergedMoods[0]));
  return {
    moods: mergedMoods.slice(0, MAX_MOODS),
    color,
  };
}

function buildEmotionPhrase(moods: string[]): string {
  const top = normalizeMoods(moods).slice(0, 3);
  if (top.length === 0) return "quiet, cinematic, slightly distant";
  return top.map((m) => m.toLowerCase()).join(", ");
}

// ─────────────────────────────────────────────
//  SVG Map (inline — no Mapbox in this project)
// ─────────────────────────────────────────────
function NycMap({
  selectedSlug,
  litSlugs,
  onSelect,
  onBackgroundClick,
}: {
  selectedSlug: string | null;
  litSlugs: string[];
  onSelect: (slug: string) => void;
  onBackgroundClick: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoverTip, setHoverTip] = useState<{ slug: string; x: number; y: number } | null>(null);
  const atlasLine = "rgba(244,194,109,0.58)";
  const atlasHover = "rgba(254,222,139,0.95)";
  const atlasActive = "rgba(255,242,184,0.98)";

  const manhattanOutline = `M 118.9 491.2 L 110.4 489.8 L 118.9 491.2 Z M 128.1 480.7 L 117.9 481.2 L 128.1 480.7 Z M 129.5 478.7 L 121.8 476.8 L 129.5 478.7 Z M 136.0 471.4 L 129.0 471.2 L 140.4 467.1 L 136.0 471.4 Z M 75.0 423.2 L 69.7 437.6 L 105.6 439.7 L 125.2 453.3 L 90.1 473.5 L 69.8 475.0 L 67.5 462.8 L 48.3 458.5 L 58.3 423.9 L 75.0 423.2 Z M 124.5 426.9 L 116.5 448.2 L 69.7 437.6 L 75.1 422.7 L 59.6 419.0 L 72.4 419.2 L 62.2 416.7 L 74.2 415.9 L 80.7 404.1 L 124.5 426.9 Z M 80.3 518.2 L 90.8 513.6 L 80.3 518.2 Z M 102.8 509.6 L 92.1 510.2 L 102.8 509.6 Z M 107.3 506.0 L 96.1 506.3 L 107.3 506.0 Z M 101.6 500.0 L 110.6 501.8 L 101.6 500.0 Z M -45.1 502.5 L -59.8 503.2 L -45.1 502.5 Z M 114.4 497.9 L 103.6 498.1 L 114.4 497.9 Z M 58.1 493.8 L 76.8 496.1 L 75.0 505.0 L 34.1 522.6 L 21.0 516.5 L 58.1 493.8 Z M 116.0 495.3 L 106.6 494.1 L 116.0 495.3 Z M -30.2 472.9 L -23.6 479.9 L -44.3 480.8 L -30.2 472.9 Z M 59.6 462.0 L 67.6 462.9 L 67.8 475.1 L 53.8 465.6 L 59.6 462.0 Z M 111.2 397.0 L 150.0 408.6 L 136.9 430.5 L 64.0 402.5 L 111.2 397.0 Z M 160.3 380.2 L 150.0 408.6 L 111.2 397.0 L 133.9 372.1 L 160.3 380.2 Z M 87.1 357.9 L 133.9 372.1 L 111.2 397.0 L 67.1 396.7 L 80.0 386.0 L 68.6 383.2 L 81.1 382.9 L 82.3 367.1 L 73.7 362.7 L 87.1 357.9 Z M 180.9 449.1 L 125.2 453.3 L 115.9 437.5 L 141.7 424.3 L 177.7 435.4 L 180.9 449.1 Z M 216.8 423.5 L 210.1 443.8 L 180.9 449.1 L 177.7 435.4 L 141.7 424.3 L 150.0 408.6 L 216.8 423.5 Z M 229.3 404.0 L 222.5 424.0 L 150.0 408.6 L 160.3 380.2 L 229.3 404.0 Z M 115.1 303.2 L 153.7 324.1 L 132.9 344.9 L 154.5 351.5 L 133.9 372.1 L 75.7 355.0 L 88.0 354.0 L 77.0 349.3 L 85.9 348.9 L 77.8 346.5 L 86.7 346.1 L 78.5 343.7 L 87.4 343.3 L 79.2 340.8 L 89.8 331.2 L 83.9 329.0 L 103.6 315.6 L 95.2 311.6 L 115.1 303.2 Z M 136.7 272.8 L 189.0 289.1 L 153.7 324.1 L 138.0 319.3 L 139.1 310.5 L 107.6 299.6 L 123.3 299.7 L 113.2 294.1 L 126.1 296.9 L 115.9 290.2 L 129.2 293.3 L 119.4 286.7 L 132.7 289.8 L 122.9 283.2 L 133.0 285.4 L 125.6 280.6 L 135.9 282.4 L 141.2 277.7 L 133.0 274.8 L 143.0 275.3 L 136.7 272.8 Z M 194.8 343.4 L 160.3 380.2 L 133.9 372.1 L 154.5 351.5 L 132.9 344.9 L 146.8 331.1 L 194.8 343.4 Z M 224.6 297.7 L 236.8 301.5 L 194.8 343.4 L 146.8 331.1 L 190.0 288.1 L 224.6 297.7 Z M 216.8 377.6 L 229.9 401.8 L 188.3 388.7 L 203.6 373.4 L 216.8 377.6 Z M 203.6 373.4 L 188.3 388.7 L 160.3 380.2 L 182.5 355.6 L 203.6 373.4 Z M 266.6 388.1 L 260.0 388.5 L 266.6 388.1 Z M 213.0 333.2 L 244.0 342.8 L 228.9 357.3 L 226.6 376.4 L 219.3 374.7 L 224.9 378.4 L 187.9 366.2 L 194.7 359.3 L 182.5 355.6 L 213.0 333.2 Z M 249.1 305.2 L 279.9 313.5 L 240.2 336.8 L 204.3 330.5 L 236.8 301.5 L 249.1 305.2 Z M 253.9 331.8 L 236.1 340.3 L 253.9 331.8 Z M 217.0 261.0 L 189.0 289.1 L 136.2 271.4 L 145.0 273.1 L 167.1 250.3 L 217.0 261.0 Z M 258.2 220.0 L 217.0 261.0 L 167.1 250.3 L 211.7 203.7 L 258.2 220.0 Z M 275.5 195.7 L 258.2 220.0 L 211.7 203.7 L 231.9 182.9 L 275.5 195.7 Z M 343.4 284.5 L 268.3 337.9 L 350.0 273.8 L 343.4 284.5 Z M 280.4 313.2 L 249.1 305.2 L 284.4 270.0 L 321.7 281.5 L 280.4 313.2 Z M 314.7 239.9 L 249.1 305.2 L 224.6 297.7 L 290.2 232.3 L 314.7 239.9 Z M 357.7 251.9 L 351.8 255.4 L 357.7 251.9 Z M 336.5 253.8 L 342.3 265.4 L 321.7 281.5 L 284.4 270.0 L 314.7 239.9 L 336.5 253.8 Z M 304.2 167.3 L 275.5 195.7 L 231.9 182.9 L 266.4 148.9 L 304.2 167.3 Z M 327.1 140.1 L 304.2 167.3 L 266.4 148.9 L 282.0 136.0 L 277.4 131.7 L 327.1 140.1 Z M 348.9 114.7 L 353.1 120.7 L 330.6 141.2 L 277.4 131.7 L 311.4 104.1 L 348.9 114.7 Z M 343.5 179.3 L 315.1 207.6 L 275.5 195.7 L 304.2 167.3 L 343.5 179.3 Z M 368.7 108.6 L 372.8 149.6 L 343.5 179.3 L 304.2 167.3 L 370.5 99.2 L 368.7 108.6 Z M 346.3 219.5 L 369.1 221.9 L 336.4 246.9 L 290.2 232.3 L 318.6 204.1 L 346.3 219.5 Z M 373.7 145.4 L 371.8 172.5 L 392.0 195.9 L 388.9 212.9 L 355.4 222.3 L 318.6 204.1 L 373.7 145.4 Z M 440.1 205.3 L 450.0 216.0 L 410.7 247.2 L 365.5 243.3 L 385.1 223.8 L 403.1 224.5 L 394.6 218.3 L 405.5 193.5 L 440.1 205.3 Z M 383.0 67.8 L 348.9 114.7 L 311.4 104.1 L 326.9 77.6 L 323.7 59.4 L 383.0 67.8 Z M 393.2 14.4 L 408.3 28.7 L 400.1 39.9 L 408.7 41.7 L 389.2 65.9 L 323.7 59.4 L 343.1 50.0 L 379.3 6.1 L 393.2 14.4 Z M 415.4 36.2 L 417.7 45.1 L 348.9 114.7 L 367.1 83.6 L 399.4 56.7 L 408.7 41.4 L 400.2 36.5 L 408.3 28.7 L 415.4 36.2 Z M 315.1 207.6 L 224.6 297.7 L 192.3 287.7 L 281.1 197.3 L 315.1 207.6 Z`;
  const brooklynOutline  = `M 380.2 397.5 L 318.2 424.4 L 315.7 413.1 L 268.0 403.9 L 265.3 382.1 L 299.9 367.6 L 380.2 397.5 Z M 281.2 407.9 L 315.7 413.1 L 322.8 424.1 L 298.9 436.5 L 314.6 436.5 L 311.3 460.2 L 238.8 455.8 L 236.4 444.2 L 266.1 405.9 L 281.2 407.9 Z M 311.3 460.2 L 342.9 473.4 L 263.3 480.8 L 242.2 456.5 L 311.3 460.2 Z M 410.9 436.4 L 423.5 446.3 L 403.2 459.7 L 342.9 473.4 L 311.3 460.2 L 314.6 436.5 L 298.9 436.5 L 380.2 397.5 L 409.2 421.3 L 375.8 445.0 L 386.9 451.3 L 381.3 440.5 L 395.0 428.1 L 410.7 426.5 L 410.9 436.4 Z M 151.0 503.9 L 115.3 496.4 L 140.7 466.7 L 156.6 473.5 L 156.2 496.0 L 164.0 497.2 L 151.0 503.9 Z M 201.6 458.9 L 201.2 493.4 L 184.6 503.2 L 205.3 517.1 L 199.5 523.8 L 145.0 512.8 L 164.0 497.2 L 141.8 463.6 L 201.6 458.9 Z M 263.3 480.8 L 238.4 486.2 L 241.1 525.1 L 184.6 503.2 L 201.2 493.4 L 195.9 480.2 L 263.3 480.8 Z M 269.0 529.4 L 241.1 525.1 L 238.4 486.2 L 270.1 480.0 L 278.5 522.3 L 269.0 529.4 Z M 227.2 450.3 L 263.3 480.8 L 195.9 480.2 L 202.4 458.6 L 213.4 462.3 L 214.3 476.6 L 233.1 475.4 L 225.3 467.8 L 238.0 473.9 L 218.3 458.6 L 231.9 459.2 L 227.2 450.3 Z M 334.5 535.5 L 269.0 529.4 L 278.5 522.3 L 270.1 480.0 L 333.5 474.2 L 349.0 531.0 L 334.5 535.5 Z M 396.7 495.4 L 433.8 510.7 L 440.4 534.6 L 334.5 535.5 L 349.0 531.0 L 333.5 474.2 L 396.7 495.4 Z M 459.0 471.3 L 396.7 495.4 L 342.9 473.4 L 419.2 449.4 L 459.0 471.3 Z M 497.2 498.6 L 482.2 511.8 L 487.1 532.8 L 396.7 495.4 L 459.0 471.3 L 497.2 498.6 Z M 151.0 503.9 L 145.0 512.8 L 199.5 523.8 L 149.4 570.7 L 127.4 553.0 L 95.7 569.3 L 103.8 556.3 L 78.0 571.9 L 53.8 569.8 L 48.3 553.8 L 59.1 572.3 L 82.5 560.9 L 62.2 555.4 L 72.5 549.1 L 59.8 550.3 L 64.9 545.4 L 50.3 552.1 L 48.5 531.6 L 73.1 520.6 L 72.3 529.5 L 115.7 496.0 L 151.0 503.9 Z M 221.8 522.2 L 212.5 536.0 L 240.7 549.1 L 199.3 582.5 L 153.4 567.3 L 205.3 517.1 L 221.8 522.2 Z M 197.4 582.8 L 219.4 591.0 L 230.8 618.4 L 196.9 621.1 L 191.2 599.1 L 149.4 570.7 L 197.4 582.8 Z M 149.4 570.7 L 170.4 584.9 L 140.3 586.9 L 60.4 642.7 L 41.6 646.0 L 41.5 637.1 L 27.7 646.4 L -2.0 630.7 L 22.7 623.9 L 10.0 616.9 L 29.2 620.8 L 22.7 610.8 L 34.9 610.4 L 25.3 606.1 L 41.0 611.3 L 31.3 605.2 L 53.9 602.4 L 46.5 595.7 L 58.5 598.8 L 49.2 593.2 L 64.6 594.4 L 55.4 587.5 L 62.7 583.9 L 108.6 579.8 L 94.8 572.4 L 118.7 577.6 L 110.8 568.1 L 127.4 553.0 L 149.4 570.7 Z M 271.4 549.7 L 240.1 550.3 L 212.5 536.0 L 221.8 522.2 L 269.0 529.4 L 262.0 543.0 L 271.4 549.7 Z M 334.5 535.5 L 419.5 538.9 L 415.9 566.3 L 269.0 554.6 L 273.8 544.9 L 262.0 543.0 L 269.0 529.4 L 334.5 535.5 Z M 410.2 568.1 L 393.2 573.5 L 394.6 562.0 L 410.2 568.1 Z M 269.0 554.6 L 394.6 562.0 L 385.7 575.9 L 270.5 576.9 L 269.0 554.6 Z M 487.1 532.8 L 502.3 539.2 L 415.9 566.3 L 420.1 533.8 L 440.4 534.6 L 433.8 510.7 L 487.1 532.8 Z M 499.2 571.2 L 507.1 593.1 L 469.9 607.8 L 409.7 568.3 L 489.3 543.1 L 499.2 571.2 Z M 469.9 607.8 L 426.6 628.2 L 422.9 603.6 L 385.7 575.9 L 429.8 574.3 L 469.9 607.8 Z M 251.0 551.2 L 264.3 553.8 L 267.0 600.1 L 230.8 618.4 L 219.4 591.0 L 197.1 583.1 L 234.5 551.0 L 251.0 551.2 Z`;
  const queensOutline    = `M 477.8 226.1 L 518.0 238.6 L 492.7 253.4 L 534.2 248.1 L 549.2 290.4 L 436.8 282.3 L 411.2 269.1 L 454.5 228.3 L 477.8 226.1 Z M 394.9 262.8 L 411.2 269.1 L 386.9 297.1 L 364.8 288.2 L 364.0 262.7 L 394.9 262.8 Z M 457.0 284.6 L 410.5 326.2 L 380.1 315.8 L 411.2 269.1 L 457.0 284.6 Z M 494.8 289.0 L 508.0 325.6 L 404.9 331.2 L 457.0 284.6 L 494.8 289.0 Z M 371.1 278.6 L 364.8 288.2 L 390.5 302.9 L 380.1 315.8 L 404.9 331.2 L 362.2 341.5 L 309.0 322.7 L 371.1 278.6 Z M 463.5 328.9 L 365.1 337.9 L 463.5 328.9 Z M 411.2 269.1 L 394.9 262.8 L 434.1 250.7 L 411.2 269.1 Z M 362.2 341.5 L 334.3 356.8 L 360.7 350.5 L 355.3 369.7 L 344.7 366.9 L 350.2 355.9 L 329.4 369.7 L 264.2 368.1 L 285.4 340.1 L 300.1 343.4 L 288.6 338.0 L 309.0 322.7 L 362.2 341.5 Z M 465.5 337.8 L 430.9 383.6 L 432.6 403.7 L 363.6 393.3 L 327.6 371.6 L 355.3 369.7 L 359.0 350.3 L 465.5 337.8 Z M 465.5 337.8 L 334.3 356.8 L 382.5 334.0 L 465.5 337.8 Z M 546.2 379.9 L 551.7 407.3 L 572.4 409.4 L 524.4 425.8 L 524.3 411.4 L 502.1 410.9 L 512.5 418.8 L 501.2 425.6 L 521.3 440.9 L 411.0 436.6 L 424.2 431.1 L 406.6 413.3 L 425.0 409.9 L 394.1 398.6 L 475.6 399.4 L 503.1 378.8 L 546.2 379.9 Z M 521.3 440.9 L 546.6 441.5 L 543.2 453.5 L 557.5 458.4 L 497.2 498.6 L 411.0 436.6 L 521.3 440.9 Z`;

  return (
    <>
    <svg
      viewBox="18 70 384 480"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
      onClick={onBackgroundClick}
    >
      <defs>
        {HOODS.map(h => (
          <pattern key={h.slug} id={`hatch-${h.slug}`} x="0" y="0" width="9" height="9"
            patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="9" stroke={h.accent} strokeWidth="0.6" opacity="0.28" />
          </pattern>
        ))}
<filter id="fGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="fShore" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="mapElevation" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="12"
            floodColor="rgba(143, 31, 23, 0.2)" floodOpacity="1" result="shadow"/>
          <feDropShadow dx="0" dy="2" stdDeviation="4"
            floodColor="rgba(217, 160, 144, 0.3)" floodOpacity="1"/>
        </filter>
        <filter id="outerGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur"/>
          <feColorMatrix type="matrix"
            values="1 0 0 0 0.56  0 0 0 0 0.12  0 0 0 0 0.09  0 0 0 0 0.6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgb(180,130,60)" stopOpacity={0.15} />
          <stop offset="100%" stopColor="rgb(160,110,50)" stopOpacity={0.2} />
        </linearGradient>
        <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(210,160,80)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="rgb(190,140,65)" stopOpacity={0.35} />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes nycGlow {
          0%, 100% { stroke-opacity: 0.28; filter: blur(3px); }
          50% { stroke-opacity: 0.62; filter: blur(7px); }
        }
        .nyc-outer-glow {
          animation: nycGlow 3s ease-in-out infinite;
          fill: none;
          pointer-events: none;
        }
        .nyc-outer-glow-deep {
          animation: nycGlow 4s ease-in-out infinite reverse;
          fill: none;
          pointer-events: none;
          filter: blur(6px);
        }
        .city-block { animation: none; }
      `}</style>

      <rect width="402" height="550" fill="none" />

      {/* ── NYC outer boundary glow (behind all elements) ── */}
      <path d={manhattanOutline} className="nyc-outer-glow-deep" stroke="rgba(140,110,180,0.34)" strokeWidth={14} />
      <path d={brooklynOutline} className="nyc-outer-glow-deep" stroke="rgba(140,110,180,0.34)" strokeWidth={14} />
      <path d={manhattanOutline} className="nyc-outer-glow" stroke="rgba(240,183,93,0.4)" strokeWidth={6} />
      <path d={brooklynOutline} className="nyc-outer-glow" stroke="rgba(240,183,93,0.4)" strokeWidth={6} />

      <path d={queensOutline} fill="none" stroke="rgba(244,194,109,0.28)" strokeWidth={0.45} />
      <path d={brooklynOutline} fill="none" stroke="rgba(244,194,109,0.34)" strokeWidth={0.55} />
      <path d={brooklynOutline} fill="none" stroke="rgba(240,183,93,0.32)" strokeWidth={3} filter="url(#fShore)" />
      <path d={manhattanOutline} fill="none" />
      <path d={manhattanOutline} fill="none" stroke="rgba(240,183,93,0.3)" strokeWidth={5} filter="url(#fShore)" />
      <path d={manhattanOutline} fill="none" stroke="rgba(244,194,109,0.52)" strokeWidth={0.75} />

      {HOODS.map(h => {
        const isActive = selectedSlug === h.slug;
        const isHov    = hovered === h.slug;
        const stroke = isActive ? atlasActive : isHov ? atlasHover : atlasLine;
        const sw     = isActive ? 2.2 : isHov ? 1.8 : 1.2;
        const filter = (isActive || isHov) ? "url(#fGlow)" : undefined;
        return (
          <g key={h.slug}>
            <path d={h.path} fill="none"
              className={(!isActive && !isHov) ? "city-block" : undefined}
              filter={filter}
              style={{
                stroke,
                strokeWidth: sw,
                animation: (isActive || isHov) ? "none" : undefined,
                cursor: "pointer",
                transition: "stroke 0.25s, stroke-width 0.25s",
              }}
              onMouseEnter={e => { setHovered(h.slug); setHoverTip({ slug: h.slug, x: e.clientX, y: e.clientY }); }}
              onMouseMove={e => setHoverTip({ slug: h.slug, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => { setHovered(null); setHoverTip(null); }}
              onClick={e => { e.stopPropagation(); onSelect(h.slug); }} />
            <path d={h.path} fill="transparent" stroke="transparent" strokeWidth={10}
              style={{ cursor: "pointer" }}
              onMouseEnter={e => { setHovered(h.slug); setHoverTip({ slug: h.slug, x: e.clientX, y: e.clientY }); }}
              onMouseMove={e => setHoverTip({ slug: h.slug, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => { setHovered(null); setHoverTip(null); }}
              onClick={e => { e.stopPropagation(); onSelect(h.slug); }} />
          </g>
        );
      })}


      {/* Compass hidden to match atlas visual language */}
    </svg>
    {/* Hover tooltip hidden to match atlas visual language */}
    </>
  );
}

function ManualPinPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);
  const fallback = latLngToMap(40.758, -73.9855);
  const pin = lat !== null && lng !== null ? latLngToMap(lat, lng) : fallback;

  const setFromClientPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const transformed = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    const x = clamp(transformed.x, MAP_VIEWBOX.minX, MAP_VIEWBOX.minX + MAP_VIEWBOX.width);
    const y = clamp(transformed.y, MAP_VIEWBOX.minY, MAP_VIEWBOX.minY + MAP_VIEWBOX.height);
    const next = mapToLatLng(x, y);
    onChange(next.lat, next.lng);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`${MAP_VIEWBOX.minX} ${MAP_VIEWBOX.minY} ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
      style={{
        width: "100%",
        maxHeight: 220,
        borderRadius: 8,
        border: "0.5px solid rgba(155,48,255,0.25)",
        background: "rgba(7,6,16,0.75)",
        cursor: dragging ? "grabbing" : "crosshair",
        userSelect: "none",
      }}
      onMouseDown={e => {
        setDragging(true);
        setFromClientPoint(e.clientX, e.clientY);
      }}
      onMouseMove={e => {
        if (dragging) setFromClientPoint(e.clientX, e.clientY);
      }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
    >
      <rect
        x={MAP_VIEWBOX.minX}
        y={MAP_VIEWBOX.minY}
        width={MAP_VIEWBOX.width}
        height={MAP_VIEWBOX.height}
        fill="rgba(12, 10, 28, 0.92)"
      />
      {HOODS.map(hood => (
        <path
          key={`picker-${hood.slug}`}
          d={hood.path}
          fill="none"
          stroke="rgba(244,194,109,0.4)"
          strokeWidth={1}
          pointerEvents="none"
        />
      ))}
      <circle cx={pin.x} cy={pin.y} r={8} fill="rgba(255,242,184,0.16)" stroke="rgba(255,242,184,0.98)" strokeWidth={1.5} />
      <circle cx={pin.x} cy={pin.y} r={2.8} fill="rgba(255,242,184,0.98)" />
    </svg>
  );
}

// ─────────────────────────────────────────────
//  TryPage
// ─────────────────────────────────────────────
const NAV_H = 52;

export default function TryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const DEFAULT_UPLOAD_SLUG: Slug = "midtown";
  type FlowStep = "entry" | "upload" | "locate" | "generating" | "customize";

  // ── State (per spec) ──
  const [atlasId]                           = useState<string>(() => crypto.randomUUID());
  const [memories, setMemories]             = useState<MemoryStore>(loadDraft);
  const [selectedSlug, setSelectedSlug]     = useState<string | null>(null);
  const [flowStep, setFlowStep]             = useState<FlowStep>("entry");
  const [showPanel, setShowPanel]           = useState(false);
  const [showUpload, setShowUpload]         = useState(false);

  // Upload session state (reset per open)
  const [currentItems, setCurrentItems]     = useState<PhotoMemory[]>([]);
  const [currentMoods, setCurrentMoods]     = useState<string[]>([]);
  const [currentColor, setCurrentColor]     = useState<string>(DEFAULT_ENTRY_COLOR);
  const [cityName, setCityName]             = useState("New York City");
  const [optionalMemory, setOptionalMemory] = useState("");
  const [moodInput, setMoodInput]           = useState("");
  const [dragOver, setDragOver]             = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [aiSuggestingIndex, setAiSuggestingIndex] = useState<number | null>(null);
  const [finishing, setFinishing]           = useState(false);
  const [uploadError, setUploadError]       = useState<string | null>(null);
  const [pinPickerIndex, setPinPickerIndex] = useState<number | null>(null);
  const [showIdentityStep, setShowIdentityStep] = useState(false);
  const [creatorName, setCreatorName] = useState("");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [driftMode, setDriftMode] = useState(false);
  const [activeDriftPrompt, setActiveDriftPrompt] = useState<string | null>(null);
  const [stylePreset, setStylePreset] = useState<"soft" | "cinematic" | "warm" | "dreamlike" | "cool">("soft");
  const [emotionIntensity, setEmotionIntensity] = useState<"low" | "medium" | "high">("medium");
  const [areaDefaultMoodsBySlug, setAreaDefaultMoodsBySlug] = useState<Record<string, string[]>>({});
  const [selectedLocateItems, setSelectedLocateItems] = useState<number[]>([]);
  const [showPhotoOverrides, setShowPhotoOverrides] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [expandedRegionSlug, setExpandedRegionSlug] = useState<string | null>(null);
  const [regionEdits, setRegionEdits] = useState<Record<string, { phrase: string; tone: string; memory: string }>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist memories on every change (skip photos — too large for sessionStorage)
  useEffect(() => {
    try {
      const slim = Object.fromEntries(
        Object.entries(memories).map(([slug, data]) => [slug, {
          photoUrls: [],
          notes: data.photos.map(photo => photo.note),
          moods: data.moods,
          color: data.color,
          isDriftEntry: data.isDriftEntry,
          driftPrompt: data.driftPrompt,
          capturedMoodFirst: data.capturedMoodFirst,
        }])
      );
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(slim));
    } catch {
      // quota exceeded — ignore, photos live in React state only
    }
  }, [memories]);

  // ESC key handler (per spec)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showUpload) setShowUpload(false);
        else if (showPanel) { setShowPanel(false); setSelectedSlug(null); }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showUpload, showPanel]);

  useEffect(() => {
    const routeStep = routeToFlowStep(location.pathname);
    setFlowStep(routeStep);

    if (routeStep === "upload") {
      setShowUpload(true);
      setShowPanel(false);
      if (!selectedSlug) setSelectedSlug(DEFAULT_UPLOAD_SLUG);
      return;
    }

    if (routeStep === "generating") {
      setShowUpload(false);
      setShowPanel(false);
      // Generation should only run when we have data to process.
      if (Object.keys(memories).length > 0 || currentItems.length > 0) triggerGenerateDraft();
      else navigate("/upload");
      return;
    }

    if (routeStep === "customize") {
      if (Object.keys(memories).length === 0) {
        navigate("/upload");
        return;
      }
      setShowUpload(false);
      setShowPanel(false);
      return;
    }

    setShowUpload(false);
    setShowPanel(false);
    setSelectedSlug(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (flowStep !== "generating") return;
    const id = window.setInterval(() => {
      setGenerationStep((prev) => (prev + 1) % 3);
    }, 700);
    return () => window.clearInterval(id);
  }, [flowStep]);

  useEffect(() => {
    const next = Object.fromEntries(
      Object.entries(memories).map(([slug, data]) => [
        slug,
        {
          phrase: buildEmotionPhrase(data.moods ?? []),
          tone: (data.moods?.[0] ?? "Calm"),
          memory: data.photos[0]?.note ?? "",
        },
      ]),
    ) as Record<string, { phrase: string; tone: string; memory: string }>;
    setRegionEdits((prev) => ({ ...next, ...prev }));
  }, [memories]);

  // ── Helpers ──
  const startMapFlow = () => {
    setFlowStep("upload");
    setShowUpload(true);
    setShowPanel(false);
    setSelectedSlug(DEFAULT_UPLOAD_SLUG);
    if (location.pathname !== "/upload") navigate("/upload");
  };

  const goToGenerateStep = () => {
    setFlowStep("generating");
    if (!showUpload) setShowUpload(true);
    if (!selectedSlug) setSelectedSlug(DEFAULT_UPLOAD_SLUG);
    if (location.pathname !== "/generate") navigate("/generate");
  };

  const mergeCurrentItemsIntoMemories = (base: MemoryStore): MemoryStore => {
    if (currentItems.length === 0) return base;
    const bucketed = new Map<string, PhotoMemory[]>();
    currentItems.forEach((photo) => {
      const target = (photo.assignedSlug || selectedSlug || DEFAULT_UPLOAD_SLUG) as string;
      const arr = bucketed.get(target) ?? [];
      arr.push(photo);
      bucketed.set(target, arr);
    });
    const updated: MemoryStore = { ...base };
    bucketed.forEach((photos, slug) => {
      const existing = updated[slug];
      const mergedPhotos = [...(existing?.photos ?? []), ...photos];
      const aggregate = deriveEntryMoodAndColor(mergedPhotos);
      updated[slug] = {
        photos: mergedPhotos,
        moods: aggregate.moods,
        color: aggregate.color || suggestColorFromMood(aggregate.moods[0]),
        isDriftEntry: driftMode || existing?.isDriftEntry,
        driftPrompt: driftMode ? (activeDriftPrompt || existing?.driftPrompt) : existing?.driftPrompt,
        capturedMoodFirst: driftMode
          ? mergedPhotos.some((photo) => (photo.moods?.length ?? 0) > 0)
          : existing?.capturedMoodFirst,
      };
    });
    return updated;
  };

  const triggerGenerateDraft = async () => {
    const mergedMemories = mergeCurrentItemsIntoMemories(memories);
    const totalPhotos = Object.values(mergedMemories).reduce((sum, entry) => sum + (entry.photos?.length ?? 0), 0);
    if (Object.keys(mergedMemories).length === 0 || totalPhotos === 0) {
      setUploadError("Please upload at least one memory before generating your map.");
      return;
    }
    setMemories(mergedMemories);
    setCurrentItems([]);
    setSelectedLocateItems([]);
    setFlowStep("generating");
    setUploadError(null);
    const withAISuggestions: MemoryStore = {};
    for (const [slug, entry] of Object.entries(mergedMemories)) {
      const processedPhotos: PhotoMemory[] = [];
      for (const photo of entry.photos) {
        if (photo.source === 'manual') {
          processedPhotos.push(photo);
          continue;
        }
        try {
          console.log('photo keys:', Object.keys(photo), 'has file:', !!(photo as unknown as Record<string, unknown>).file, 'url:', photo.url);
          const blob = await fetch(photo.url).then(r => r.blob());
          const base64 = await fileToBase64(blob as File);
          const emotionId = await analyzePhoto({ imageBase64: base64 });
          const emotion = getEmotion(emotionId);
          processedPhotos.push({
            ...photo,
            moods: normalizeMoods([emotionId]),
            aiSuggestedMoods: normalizeMoods([emotionId]),
            color: emotion.color,
            source: "ai-assisted" as const,
          });
        } catch {
          const signal = `${photo.note} ${photo.manualPlaceName}`.trim();
          const result = suggestMoodsHeuristic(signal);
          processedPhotos.push({
            ...photo,
            moods: normalizeMoods(result.moods),
            aiSuggestedMoods: normalizeMoods(result.moods),
            moodConfidence: result.confidence,
            styleHint: photo.styleHint ?? result.styleHint,
            source: "ai-assisted" as const,
            color: suggestColorFromMood(result.moods[0]),
          });
        }
      }
      withAISuggestions[slug] = { ...entry, photos: processedPhotos };
    }
    const draftAreaDefaults: Record<string, string[]> = Object.fromEntries(
      Object.entries(withAISuggestions).map(([slug, entry]) => {
        const moods = normalizeMoods(entry.photos.flatMap((photo) => photo.moods ?? []));
        return [slug, moods.length > 0 ? moods : normalizeMoods(entry.moods ?? [])];
      }),
    );
    setMemories(withAISuggestions);
    setAreaDefaultMoodsBySlug(draftAreaDefaults);
    setFlowStep("customize");
    setShowUpload(false);
    setShowPanel(false);
    setSelectedSlug(null);
    if (location.pathname === "/generate") {
      navigate("/edit");
    }
  };

  const uploadFile = async (file: File, slug: string): Promise<string> => {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${atlasId}/${slug}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from('user-photos')
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from('user-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const parseExifMetadata = async (file: File): Promise<{
    capturedAt: string | null;
    lat: number | null;
    lng: number | null;
    locationSource: PhotoLocationSource;
  }> => {
    try {
      const parsed = await exifr.parse(file, {
        exif: true,
        gps: true,
        tiff: true,
        ifd0: true,
      }) as Record<string, unknown> | null;

      const lat = typeof parsed?.latitude === "number" ? parsed.latitude : null;
      const lng = typeof parsed?.longitude === "number" ? parsed.longitude : null;

      const maybeDate = parsed?.DateTimeOriginal ?? parsed?.CreateDate ?? parsed?.ModifyDate;
      let capturedAt: string | null = null;
      if (maybeDate instanceof Date && !Number.isNaN(maybeDate.getTime())) {
        capturedAt = maybeDate.toISOString();
      } else if (typeof maybeDate === "string" || typeof maybeDate === "number") {
        const parsedDate = new Date(maybeDate);
        if (!Number.isNaN(parsedDate.getTime())) capturedAt = parsedDate.toISOString();
      }

      return {
        capturedAt,
        lat,
        lng,
        locationSource: lat !== null || lng !== null || capturedAt ? "exif" : "none",
      };
    } catch {
      return { capturedAt: null, lat: null, lng: null, locationSource: "none" };
    }
  };

  const uploadFilesForSlug = async (files: File[], slug: string): Promise<PhotoMemory[]> =>
    Promise.all(
      files.map(async (file) => {
        const [url, exifData] = await Promise.all([uploadFile(file, slug), parseExifMetadata(file)]);
        const autoSlug = nearestSlugFromLatLng(exifData.lat, exifData.lng) ?? slug;
        return {
          url,
          note: "",
          capturedAt: exifData.capturedAt,
          lat: exifData.lat,
          lng: exifData.lng,
          assignedSlug: autoSlug,
          moods: [],
          color: DEFAULT_ENTRY_COLOR,
          source: "manual",
          aiSuggestedMoods: [],
          styleHint: "soft",
          moodConfidence: undefined,
          locationSource: exifData.locationSource,
          manualOverride: false,
          manualPlaceName: "",
        };
      }),
    );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded = await uploadFilesForSlug(files, selectedSlug ?? DEFAULT_UPLOAD_SLUG);
      setCurrentItems(prev => [...prev, ...uploaded]);
    } catch {
      setUploadError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded = await uploadFilesForSlug(files, selectedSlug ?? DEFAULT_UPLOAD_SLUG);
      setCurrentItems(prev => [...prev, ...uploaded]);
    } catch {
      setUploadError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (i: number) => {
    setCurrentItems(prev => prev.filter((_, idx) => idx !== i));
    setPinPickerIndex(null);
  };

  const updateItem = (i: number, updater: (photo: PhotoMemory) => PhotoMemory) => {
    setCurrentItems(prev => prev.map((photo, idx) => (idx === i ? updater(photo) : photo)));
  };

  const setPhotoMoods = (i: number, nextMoods: string[], source: PhotoMemory["source"] = "manual") => {
    const normalized = normalizeMoods(nextMoods);
    updateItem(i, (photo) => ({
      ...photo,
      moods: normalized,
      color: photo.color || suggestColorFromMood(normalized[0]),
      source,
    }));
  };

  const setPhotoAssignedSlug = (i: number, slug: Slug) => {
    const center = HOOD_CENTER_COORDS[slug];
    updateItem(i, (photo) => ({
      ...photo,
      assignedSlug: slug,
      lat: center?.lat ?? photo.lat,
      lng: center?.lng ?? photo.lng,
      manualPlaceName: getNeighborhoodName(slug),
      manualOverride: true,
      locationSource: "manual",
    }));
  };

  const updateNote = (i: number, val: string) => {
    updateItem(i, photo => ({ ...photo, note: val }));
  };

  const updateCapturedAt = (i: number, localTime: string) => {
    updateItem(i, photo => ({
      ...photo,
      capturedAt: localInputToIso(localTime),
      manualOverride: true,
      locationSource: "manual",
    }));
  };

  const updateManualPlaceName = (i: number, manualPlaceName: string) => {
    updateItem(i, photo => ({
      ...photo,
      manualPlaceName,
      manualOverride: true,
      locationSource: "manual",
    }));
  };

  const updateCoordinate = (i: number, key: "lat" | "lng", value: string) => {
    const nextValue = value.trim() === "" ? null : Number(value);
    updateItem(i, photo => ({
      ...photo,
      [key]: nextValue !== null && Number.isFinite(nextValue) ? nextValue : null,
      manualOverride: true,
      locationSource: "manual",
    }));
  };

  const suggestPhotoMoodsWithAI = async (i: number) => {
    const photo = currentItems[i];
    if (!photo) return;
    setAiSuggestingIndex(i);
    try {
      const signal = `${photo.note} ${photo.manualPlaceName}`.trim();
      const result = suggestMoodsHeuristic(signal);
      setCurrentItems((prev) =>
        prev.map((item, idx) =>
          idx === i
            ? {
                ...item,
                moods: normalizeMoods(result.moods),
                color: suggestColorFromMood(result.moods[0]),
                source: "ai-assisted",
                aiSuggestedMoods: result.moods,
                styleHint: result.styleHint,
                moodConfidence: result.confidence,
              }
            : item,
        ),
      );
    } finally {
      setAiSuggestingIndex(null);
    }
  };

  const handleSaveAndAddAnother = () => {
    if (flowStep !== "customize") return;
    if (currentItems.length === 0) {
      setUploadError("Please upload at least one photo first.");
      return;
    }
    const updated = mergeCurrentItemsIntoMemories(memories);
    setMemories(updated);
    setCurrentItems([]);
    setSelectedLocateItems([]);
    setCurrentMoods([]);
    setCurrentColor(DEFAULT_ENTRY_COLOR);
    setMoodInput("");
    setFlowStep("upload");
    setShowUpload(true);
    setShowPanel(false);
    setSelectedSlug(DEFAULT_UPLOAD_SLUG);
    setPinPickerIndex(null);
  };

  const handleFinish = async () => {
    if (finishing) return;
    setFinishing(true);
    setUploadError(null);
    try {
      const identityStats = computeIdentityStats(memories);
      const safeCreatorName = creatorName.trim() || "Your";
      const identity = generateIdentityCopy(safeCreatorName, customSubtitle, identityStats);

      // Build neighborhood_data: { [slug]: { notes, photoUrls } }
      const neighborhoodEntries = Object.fromEntries(
        Object.entries(memories).map(([slug, data]) => {
          const edit = regionEdits[slug];
          const editedMoods = normalizeMoods([
            ...(areaDefaultMoodsBySlug[slug] ?? data.photos.flatMap((photo) => photo.moods)),
            ...(edit?.tone ? [edit.tone] : []),
          ]);
          const notes = [
            ...data.photos.map((photo) => photo.note).filter(Boolean),
            ...(edit?.memory ? [edit.memory] : []),
            ...(edit?.phrase ? [edit.phrase] : []),
          ];
          return [slug, {
          notes,
          photoUrls: data.photos.map(photo => photo.url),
          moods: editedMoods,
          color: suggestColorFromMood(editedMoods[0]),
          areaDefaultMoods: normalizeMoods(areaDefaultMoodsBySlug[slug] ?? []),
          memories: data.photos.map((photo) => ({
            url: photo.url,
            note: photo.note,
            capturedAt: photo.capturedAt,
            lat: photo.lat,
            lng: photo.lng,
            assignedSlug: photo.assignedSlug,
            moods: normalizeMoods(photo.moods),
            color: suggestColorFromMood((photo.moods?.[0]) || (areaDefaultMoodsBySlug[slug]?.[0] ?? "")),
            source: photo.source,
            aiSuggestedMoods: normalizeMoods(photo.aiSuggestedMoods ?? []),
            styleHint: photo.styleHint,
            moodConfidence: photo.moodConfidence,
            manualPlaceName: photo.manualPlaceName || "",
            locationSource: photo.locationSource,
          })),
          isDriftEntry: Boolean(data.isDriftEntry),
          driftPrompt: data.driftPrompt,
          capturedMoodFirst: Boolean(data.capturedMoodFirst),
        }];
        })
      );
      const neighborhoodData = {
        ...neighborhoodEntries,
        __meta: {
          creatorName: safeCreatorName,
          customSubtitle: customSubtitle.trim() || undefined,
          cityName: cityName.trim() || undefined,
          optionalMemory: optionalMemory.trim() || undefined,
          identity,
        } as AtlasMeta,
      };

      // Insert the atlas row
      const { error: atlasError } = await supabase
        .from('atlases')
        .insert({ id: atlasId, neighborhood_data: neighborhoodData });
      if (atlasError) throw atlasError;

      // Insert one row per photo into the photos table
      const photoRows = Object.entries(memories).flatMap(([slug, data]) =>
        data.photos.map(photo => ({
          atlas_id: atlasId,
          neighborhood_slug: photo.assignedSlug || slug,
          storage_url: photo.url,
          captured_at: photo.capturedAt,
          lat: photo.lat,
          lng: photo.lng,
          location_source: photo.locationSource,
          manual_override: photo.manualOverride,
          manual_place_name: photo.manualPlaceName || null,
        }))
      );
      if (photoRows.length > 0) {
        const { error: photosError } = await supabase.from('photos').insert(photoRows);
        if (photosError) throw photosError;
      }

      sessionStorage.removeItem(DRAFT_KEY);
      navigate(`/atlas/${atlasId}`);
    } catch {
      setUploadError("Failed to save your atlas. Please try again.");
      setFinishing(false);
    }
  };

  // Open upload overlay for a neighborhood (new or existing)
  const reopenUpload = (slug: string) => {
    setSelectedSlug(slug);
    const existing = memories[slug];
    setCurrentItems(existing?.photos ?? []);
    setCurrentMoods(existing?.moods ?? []);
    setCurrentColor(existing?.color ?? DEFAULT_ENTRY_COLOR);
    setMoodInput("");
    setShowPanel(true);
    setShowUpload(true);
    setPinPickerIndex(null);
  };

  // Map block click
  const handleBlockClick = () => {};

  const handleMapBackgroundClick = () => {
    if (!showUpload) {
      setShowPanel(false);
      setSelectedSlug(null);
    }
  };

  const requestFinish = () => {
    if (flowStep === "upload") {
      navigate("/generate");
      return;
    }
    if (flowStep === "locate") {
      triggerGenerateDraft();
      return;
    }
    if (flowStep === "generating") return;
    setUploadError(null);
    setShowIdentityStep(true);
  };

  const handleUploadBack = () => {
    if (flowStep === "locate") {
      setFlowStep("upload");
      return;
    }
    if (flowStep === "customize") {
      navigate("/upload");
      return;
    }
    if (flowStep === "upload") {
      navigate("/");
      return;
    }
    setShowUpload(false);
    setFlowStep("entry");
    setShowPanel(false);
    setSelectedSlug(null);
  };

  const startDriftMode = () => {
    const prompt = DRIFT_PROMPTS[Math.floor(Math.random() * DRIFT_PROMPTS.length)];
    setDriftMode(true);
    setActiveDriftPrompt(prompt);
  };

  const litSlugs = Object.keys(memories);
  const selectableSlugs = HOODS.map((h) => h.slug);
  const mappedCount = litSlugs.length;
  const effectiveMoodsForPhoto = (slug: string, photo: PhotoMemory): string[] => {
    if ((photo.moods?.length ?? 0) > 0) return photo.moods;
    const areaDefault = areaDefaultMoodsBySlug[slug] ?? [];
    if (areaDefault.length > 0) return areaDefault;
    return [];
  };
  const mapPhotoPoints: MapPhotoPoint[] = Object.entries(memories).flatMap(([slug, data]) =>
    data.photos.map((photo, i) => ({
      id: `try-${slug}-${i}`,
      neighborhoodSlug: photo.assignedSlug || slug,
      url: photo.url,
      lat: photo.lat,
      lng: photo.lng,
      moods: effectiveMoodsForPhoto(slug, photo),
      color: suggestColorFromMood(effectiveMoodsForPhoto(slug, photo)[0]),
      source: photo.source,
      styleHint: photo.styleHint,
      moodConfidence: photo.moodConfidence,
    })),
  );
  const representativePhotos: RepresentativePhoto[] = Object.entries(memories)
    .map(([slug, data]) => {
      const center = HOOD_CENTER_COORDS[slug as Slug];
      const first = data.photos[0];
      if (!center || !first?.url) return null;
      return { hoodId: slug, url: first.url, lat: center.lat, lng: center.lng };
    })
    .filter((x): x is RepresentativePhoto => Boolean(x));
  const entryMetaBySlug: Record<string, EntryMapMeta> = Object.fromEntries(
    Object.entries(memories).map(([slug, data]) => [
      slug,
      {
        moods: normalizeMoods(areaDefaultMoodsBySlug[slug] ?? data.moods ?? []),
        color: suggestColorFromMood((areaDefaultMoodsBySlug[slug] ?? data.moods ?? [])[0]),
        previewUrl: data.photos[0]?.url,
      },
    ]),
  );
  const styleFactors = (() => {
    const base = {
      soft: { radius: 1, opacity: 1 },
      cinematic: { radius: 0.95, opacity: 1.15 },
      warm: { radius: 1.08, opacity: 1.08 },
      dreamlike: { radius: 1.2, opacity: 0.96 },
      cool: { radius: 0.9, opacity: 0.9 },
    }[stylePreset];
    const intensity = emotionIntensity === "low" ? 0.82 : emotionIntensity === "high" ? 1.28 : 1;
    return {
      radiusBoost: base.radius * intensity,
      opacityBoost: base.opacity * intensity,
    };
  })();
  const routeStep = routeToFlowStep(location.pathname);
  const generationMessages = [
    "Reading your memories...",
    "Finding places and emotional patterns...",
    "Building your map...",
  ];
  const mappedRegions = Object.entries(memories);

  if (routeStep === "generating") {
    const litCount = Math.max(1, Math.ceil((mappedRegions.length || 1) * ((generationStep + 1) / 3)));
    const generatingLitIds = mappedRegions.slice(0, litCount).map(([slug]) => slug);
    return (
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
        <ShaderBackground />
        <div style={{ position: "absolute", inset: 0, top: NAV_H, zIndex: 1 }}>
          <AtlasStyledMap
            activeId={null}
            litIds={generatingLitIds}
            selectableIds={generatingLitIds}
            onSelect={() => {}}
            photoPoints={mapPhotoPoints}
            representativePhotos={representativePhotos}
            entryMetaBySlug={entryMetaBySlug}
            interactiveAreas={false}
            lockOverviewMinZoom
            markerStartOffset={0.35}
            detailPinZoom={13.2}
          />
        </div>
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, height: NAV_H,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 2rem", zIndex: 10,
        }}>
          <button onClick={() => navigate("/")} style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: "1.1rem", color: "#ffffff", background: "none", border: "none", cursor: "pointer",
          }}>CityMood</button>
        </nav>
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 4, paddingTop: NAV_H,
        }}>
          <div style={{ width: "min(680px, 90vw)", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              {mappedRegions.slice(0, 8).map(([slug]) => (
                <span key={`pill-${slug}`} style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "0.5px solid rgba(155,48,255,0.28)",
                  background: "rgba(155,48,255,0.11)",
                  color: "rgba(232,220,252,0.9)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.68rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>
                  {getNeighborhoodName(slug)}
                </span>
              ))}
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "2.6rem",
              fontWeight: 300,
              color: "#EDE8F8",
              marginBottom: 10,
            }}>
              Generating your emotional map...
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "rgba(210,188,245,0.75)",
              fontSize: "0.9rem",
              letterSpacing: "0.03em",
            }}>
              {generationMessages[generationStep]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (routeStep === "customize") {
    return (
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
        <ShaderBackground />
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, height: NAV_H,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 2rem", zIndex: 10,
        }}>
          <button onClick={() => navigate("/")} style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: "1.1rem", color: "#ffffff", background: "none", border: "none", cursor: "pointer",
          }}>CityMood</button>
          <button
            onClick={handleFinish}
            disabled={finishing}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#fff",
              background: "transparent",
              border: "1.5px solid rgba(255,255,255,0.7)",
              borderRadius: 100,
              padding: "6px 16px",
              cursor: finishing ? "default" : "pointer",
              opacity: finishing ? 0.6 : 1,
            }}
          >
            {finishing ? "Saving..." : "Publish map →"}
          </button>
        </nav>
        <div style={{ position: "absolute", inset: 0, paddingTop: NAV_H + 18, overflowY: "auto", zIndex: 2 }}>
          <div style={{ width: "min(960px, 92vw)", margin: "0 auto", padding: "12px 0 42px" }}>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "2.5rem",
              fontWeight: 300,
              color: "#EDE8F8",
              marginBottom: 8,
            }}>Review your AI draft</h1>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "1rem",
              color: "rgba(196,174,244,0.62)",
              marginBottom: 20,
            }}>
              Refine meaning, not visuals.
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              {mappedRegions.map(([slug, data]) => {
                const row = regionEdits[slug] ?? { phrase: buildEmotionPhrase(data.moods ?? []), tone: data.moods?.[0] ?? "Calm", memory: data.photos[0]?.note ?? "" };
                const expanded = expandedRegionSlug === slug;
                return (
                  <div key={`edit-${slug}`} style={{
                    border: "0.5px solid rgba(155,48,255,0.22)",
                    background: "rgba(10,8,20,0.72)",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#EDE8F8" }}>{getNeighborhoodName(slug)}</div>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "rgba(210,188,245,0.72)", fontSize: "0.92rem" }}>
                          {row.phrase}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedRegionSlug((prev) => (prev === slug ? null : slug))}
                        style={{
                          border: "0.5px solid rgba(155,48,255,0.28)",
                          background: "rgba(155,48,255,0.08)",
                          borderRadius: 999,
                          color: "rgba(232,220,252,0.9)",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.62rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "6px 10px",
                          cursor: "pointer",
                        }}
                      >
                        {expanded ? "Close" : "Edit"}
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      {data.photos.slice(0, 4).map((photo, idx) => (
                        <img key={`${slug}-${idx}`} src={photo.url} alt="" style={{ width: 58, height: 58, borderRadius: 6, objectFit: "cover", border: "0.5px solid rgba(255,255,255,0.1)" }} />
                      ))}
                    </div>
                    {expanded && (
                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        <input
                          value={row.phrase}
                          onChange={(e) => setRegionEdits((prev) => ({ ...prev, [slug]: { ...row, phrase: e.target.value } }))}
                          placeholder="Emotional phrase"
                          style={{ width: "100%", background: "rgba(155,48,255,0.05)", border: "0.5px solid rgba(155,48,255,0.2)", borderRadius: 8, padding: "8px 10px", color: "rgba(220,205,245,0.9)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.76rem" }}
                        />
                        <input
                          value={row.tone}
                          onChange={(e) => setRegionEdits((prev) => ({ ...prev, [slug]: { ...row, tone: e.target.value } }))}
                          placeholder="Tone name (optional)"
                          style={{ width: "100%", background: "rgba(155,48,255,0.05)", border: "0.5px solid rgba(155,48,255,0.2)", borderRadius: 8, padding: "8px 10px", color: "rgba(220,205,245,0.9)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.76rem" }}
                        />
                        <textarea
                          value={row.memory}
                          onChange={(e) => setRegionEdits((prev) => ({ ...prev, [slug]: { ...row, memory: e.target.value } }))}
                          placeholder="Memory text (optional)"
                          rows={2}
                          style={{ width: "100%", background: "rgba(155,48,255,0.05)", border: "0.5px solid rgba(155,48,255,0.2)", borderRadius: 8, padding: "8px 10px", color: "rgba(220,205,245,0.9)", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.92rem", resize: "vertical" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        body, #root { background: transparent !important; }
        svg { background: transparent !important; }
        .mapboxgl-map, .mapboxgl-canvas, .mapboxgl-canvas-container { background: transparent !important; }
        .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl { margin: 0 14px 14px 0; }
        .mapboxgl-ctrl-group {
          background: rgba(22, 15, 46, 0.42) !important;
          border: 1px solid rgba(232, 212, 164, 0.45) !important;
          box-shadow: 0 8px 20px rgba(12, 6, 28, 0.35) !important;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border-radius: 10px !important;
          overflow: hidden;
        }
        .mapboxgl-ctrl-group button { width: 34px !important; height: 34px !important; background: transparent !important; }
        .mapboxgl-ctrl-group button + button { border-top: 1px solid rgba(232, 212, 164, 0.25) !important; }
        .mapboxgl-ctrl-group .mapboxgl-ctrl-icon {
          filter: invert(95%) sepia(18%) saturate(382%) hue-rotate(355deg) brightness(101%) contrast(92%);
          opacity: 0.95;
        }
        .atlas-pin-popup .mapboxgl-popup-content {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
        .atlas-pin-popup .mapboxgl-popup-tip {
          border-top-color: rgba(139, 110, 196, 0.65) !important;
          border-bottom-color: rgba(139, 110, 196, 0.65) !important;
        }
        @keyframes tipFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* 1. Shader background */}
      <ShaderBackground />

      {/* 2. Shared Mapbox map */}
      <div style={{ position: "absolute", inset: 0, top: NAV_H, zIndex: 1, background: "transparent" }}>
        <AtlasStyledMap
          activeId={showPanel || showUpload ? selectedSlug : null}
          litIds={litSlugs}
          selectableIds={selectableSlugs as string[]}
          onSelect={handleBlockClick}
          onBackgroundClick={handleMapBackgroundClick}
          photoPoints={mapPhotoPoints}
          representativePhotos={representativePhotos}
          entryMetaBySlug={entryMetaBySlug}
          emotionRadiusBoost={0.9 * styleFactors.radiusBoost}
          emotionOpacityBoost={0.8 * styleFactors.opacityBoost}
          interactiveAreas={false}
          lockOverviewMinZoom
          markerStartOffset={0.35}
          detailPinZoom={13.2}
        />
      </div>

      {flowStep === "entry" && (
        <div style={{
          position: "absolute",
          top: NAV_H,
          right: 0,
          bottom: 0,
          width: "36%",
          minWidth: 360,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          pointerEvents: "none",
        }}>
          <div style={{ maxWidth: 430, pointerEvents: "auto" }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "2.9rem",
              fontWeight: 300,
              color: "#EDE8F8",
              lineHeight: 1.08,
              marginBottom: 10,
            }}>Start your map</h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "1.05rem",
              color: "rgba(210,188,245,0.68)",
              marginBottom: 20,
            }}>Turn your memories into a map of emotions.</p>
            <button
              onClick={startMapFlow}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.76rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#ffffff",
                border: "1.5px solid rgba(255,255,255,0.7)",
                borderRadius: 100,
                padding: "10px 22px",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Start your map →
            </button>
          </div>
        </div>
      )}

      {/* 3. Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: NAV_H,
        background: "transparent", backdropFilter: "none",
        WebkitBackdropFilter: "none",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", zIndex: 100,
        border: "none",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: "1.1rem", color: "#ffffff", textDecoration: "none",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            letterSpacing: "-0.01em", fontWeight: 400,
          }}
        >CityMood</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={startDriftMode}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.68rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: driftMode ? "rgba(255,215,122,0.9)" : "rgba(196,174,244,0.55)",
              padding: 0,
            }}
          >
            {driftMode ? "Drift mode on" : "Start a drift"}
          </button>
          {mappedCount > 0 && (
            <>
              <span style={{
                fontSize: "0.65rem", color: "rgba(196,174,244,0.5)",
                textTransform: "uppercase", letterSpacing: "0.08em",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {mappedCount} neighborhood{mappedCount !== 1 ? "s" : ""} mapped
              </span>
              <button
                onClick={requestFinish}
                disabled={finishing}
                style={{
                  fontSize: "0.72rem", color: finishing ? "rgba(255,255,255,0.3)" : "#ffffff",
                  border: "1.5px solid rgba(255,255,255,0.7)", borderRadius: 100,
                  padding: "6px 18px", background: "transparent",
                  cursor: finishing ? "default" : "pointer",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { if (!finishing) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { if (!finishing) e.currentTarget.style.background = "transparent"; }}
              >{finishing ? "Saving…" : (flowStep === "customize" ? "Save your atlas →" : "Generate your map →")}</button>
            </>
          )}
        </div>
      </nav>

      {/* 4. Top-left floating text */}
      <div style={{
        position: "absolute", top: 72, left: "2.5rem",
        zIndex: 10, pointerEvents: "none",
      }}>
        <div style={{
          fontSize: "0.7rem", letterSpacing: "0.15em",
          textTransform: "uppercase", color: "rgba(196,174,244,0.4)", marginBottom: 8,
          fontFamily: "'DM Sans', sans-serif",
        }}>{flowStep === "entry" ? "Your NYC map" : "Build your map"}</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "4rem", fontWeight: 300, color: "#EDE8F8", lineHeight: 1.1, marginBottom: 6,
        }}>{flowStep === "customize" ? "Refine your emotional map" : "Your New York City"}</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
          fontSize: "1.1rem", color: "rgba(196,174,244,0.4)",
        }}>
          {flowStep === "upload" && "Upload your memories"}
          {flowStep === "locate" && "Assign memories to places in NYC"}
          {flowStep === "generating" && "Generating your emotional map..."}
          {flowStep === "customize" && "AI draft first. Refine moods by district."}
          {flowStep === "entry" && "Start from memory, then shape your map."}
        </div>

        {driftMode && activeDriftPrompt && (
          <div style={{
            marginTop: 14,
            maxWidth: 340,
            pointerEvents: "auto",
            background: "rgba(12,9,22,0.82)",
            border: "0.5px solid rgba(155,48,255,0.24)",
            borderRadius: 10,
            padding: "10px 12px",
          }}>
            <div style={{
              fontSize: "0.58rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(196,174,244,0.45)",
              marginBottom: 5,
              fontFamily: "'DM Sans', sans-serif",
            }}>Drift prompt</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "0.95rem",
              color: "rgba(232,220,252,0.82)",
              lineHeight: 1.45,
            }}>{activeDriftPrompt}</div>
          </div>
        )}
      </div>

      {/* 5. Bottom-left mapped list */}
      {mappedCount > 0 && (
        <div style={{ position: "absolute", bottom: "2rem", left: "2rem", zIndex: 10 }}>
          {flowStep === "customize" && (
            <div style={{
              width: 320,
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 10,
              border: "0.5px solid rgba(155,48,255,0.25)",
              background: "rgba(10,8,20,0.82)",
            }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(196,174,244,0.55)", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                Adjust your map
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: "0.56rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(196,174,244,0.48)", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  Area mood defaults
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 134, overflowY: "auto" }}>
                  {Object.entries(memories).map(([slug, data]) => {
                    const areaMoods = normalizeMoods(areaDefaultMoodsBySlug[slug] ?? data.moods ?? []);
                    return (
                      <div key={`area-default-${slug}`} style={{ border: "0.5px solid rgba(155,48,255,0.16)", borderRadius: 7, padding: "5px 6px" }}>
                        <div style={{ fontSize: "0.62rem", color: "rgba(232,220,252,0.9)", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                          {getNeighborhoodName(slug)}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {MOOD_PRESETS.map((mood) => {
                            const selected = areaMoods.includes(mood);
                            return (
                              <button
                                key={`area-${slug}-${mood}`}
                                type="button"
                                onClick={() => {
                                  const next = selected
                                    ? areaMoods.filter((x) => x !== mood)
                                    : normalizeMoods([...areaMoods, mood]);
                                  setAreaDefaultMoodsBySlug((prev) => ({ ...prev, [slug]: next }));
                                }}
                                style={{
                                  border: selected ? "0.5px solid rgba(255,215,122,0.7)" : "0.5px solid rgba(155,48,255,0.25)",
                                  background: selected ? "rgba(255,215,122,0.12)" : "rgba(155,48,255,0.07)",
                                  borderRadius: 999,
                                  padding: "2px 7px",
                                  color: selected ? "rgba(255,235,195,0.98)" : "rgba(225,209,250,0.78)",
                                  fontSize: "0.58rem",
                                  cursor: "pointer",
                                  fontFamily: "'DM Sans', sans-serif",
                                }}
                              >
                                {mood}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {[
                  { id: "soft", label: "Soft watercolor" },
                  { id: "cinematic", label: "Cinematic contrast" },
                  { id: "warm", label: "Warm memory" },
                  { id: "dreamlike", label: "Dreamlike haze" },
                  { id: "cool", label: "Cool minimal" },
                ].map((item) => {
                  const active = stylePreset === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStylePreset(item.id as typeof stylePreset)}
                      style={{
                        border: active ? "0.5px solid rgba(255,215,122,0.7)" : "0.5px solid rgba(155,48,255,0.28)",
                        background: active ? "rgba(255,215,122,0.12)" : "rgba(155,48,255,0.07)",
                        borderRadius: 999,
                        padding: "4px 9px",
                        color: active ? "rgba(255,235,195,0.98)" : "rgba(225,209,250,0.82)",
                        fontSize: "0.6rem",
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.6rem", color: "rgba(196,174,244,0.62)", fontFamily: "'DM Sans', sans-serif" }}>Emotion intensity</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={1}
                  value={emotionIntensity === "low" ? 0 : emotionIntensity === "high" ? 2 : 1}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setEmotionIntensity(v <= 0 ? "low" : v >= 2 ? "high" : "medium");
                  }}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: "0.6rem", color: "rgba(225,209,250,0.82)", width: 44, textAlign: "right", fontFamily: "'DM Sans', sans-serif" }}>
                  {emotionIntensity}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoOverrides((prev) => !prev)}
                style={{
                  marginTop: 8,
                  border: "0.5px solid rgba(155,48,255,0.24)",
                  background: "rgba(155,48,255,0.07)",
                  borderRadius: 7,
                  padding: "5px 8px",
                  color: "rgba(220,205,245,0.84)",
                  fontSize: "0.6rem",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {showPhotoOverrides ? "Hide photo-level overrides" : "Photo-level overrides"}
              </button>
            </div>
          )}
          <div style={{
            fontSize: "0.55rem", letterSpacing: "0.1em",
            textTransform: "uppercase", color: "rgba(196,174,244,0.4)", marginBottom: 8,
            fontFamily: "'DM Sans', sans-serif",
          }}>Mapped so far</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(memories).map(([slug, data]) => (
              <div
                key={slug}
                onClick={() => reopenUpload(slug)}
                style={{
                  background: "rgba(155,48,255,0.12)",
                  border: "0.5px solid rgba(155,48,255,0.25)",
                  borderRadius: 100, padding: "5px 14px", cursor: "pointer",
                  fontSize: "0.75rem", color: "#EDE8F8",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  transition: "background 0.18s", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(155,48,255,0.22)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(155,48,255,0.12)")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: data.color || DEFAULT_ENTRY_COLOR, boxShadow: `0 0 8px ${data.color || DEFAULT_ENTRY_COLOR}` }} />
                  <span>{getNeighborhoodName(slug)} · {data.photos.length} photo{data.photos.length !== 1 ? "s" : ""}</span>
                </div>
                {normalizeMoods(areaDefaultMoodsBySlug[slug] ?? data.moods ?? []).length > 0 && (
                  <div style={{ fontSize: "0.62rem", color: "rgba(235, 220, 255, 0.72)", marginTop: 3, letterSpacing: "0.03em" }}>
                    {normalizeMoods(areaDefaultMoodsBySlug[slug] ?? data.moods ?? []).slice(0, 3).join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>
          {uploadError && (
            <p style={{
              fontSize: "0.6rem", color: "#c0392b", fontFamily: "'DM Sans', sans-serif",
              marginTop: 8, letterSpacing: "0.04em",
            }}>{uploadError}</p>
          )}
          <div
            onClick={finishing ? undefined : requestFinish}
            style={{
              fontSize: "0.72rem", color: finishing ? "rgba(196,174,244,0.3)" : "#FFD700",
              cursor: finishing ? "default" : "pointer", marginTop: 12,
              fontFamily: "'DM Sans', sans-serif",
              transition: "opacity 0.18s",
            }}
            onMouseEnter={e => { if (!finishing) e.currentTarget.style.opacity = "0.65"; }}
            onMouseLeave={e => { if (!finishing) e.currentTarget.style.opacity = "1"; }}
          >
            {finishing ? "Saving your atlas…" : (flowStep === "customize" ? "Save & publish atlas →" : "Generate your map →")}
          </div>
        </div>
      )}

      {/* 6. Left slide-in panel — always in DOM, CSS controlled */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", top: NAV_H, left: 0, bottom: 0, width: 280,
          background: "rgba(10,8,20,0.92)", backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRight: "0.5px solid rgba(155,48,255,0.12)",
          zIndex: 50, padding: "28px 24px",
          display: "flex", flexDirection: "column", gap: 20,
          transform: showPanel ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s ease",
        }}
      >
        <div style={{ width: 28, height: 2, background: "#9B30FF", flexShrink: 0 }} />

        <div>
          <div style={{
            fontSize: "0.55rem", letterSpacing: "0.1em",
            textTransform: "uppercase", color: "rgba(155,48,255,0.4)", marginBottom: 4,
            fontFamily: "'DM Sans', sans-serif",
          }}>{getBorough(selectedSlug)}</div>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem", color: "#EDE8F8", lineHeight: 1.1, marginBottom: 4,
          }}>{getNeighborhoodName(selectedSlug)}</div>
          <div style={{
            fontSize: "0.6rem", letterSpacing: "0.08em",
            textTransform: "uppercase", color: "rgba(196,174,244,0.4)",
            fontFamily: "'DM Sans', sans-serif",
          }}>{getMoodTag(selectedSlug)}</div>
        </div>

        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic",
          fontSize: "0.9rem", color: "rgba(196,174,244,0.5)", lineHeight: 1.6,
        }}>
          "What did {getNeighborhoodName(selectedSlug)} feel like to you?"
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => {
            setCurrentItems(memories[selectedSlug ?? ""]?.photos ?? []);
            setShowUpload(true);
          }}
          style={{
            width: "100%", height: 48,
            background: "rgba(155,48,255,0.85)", color: "#EDE8F8",
            border: "none", borderRadius: 100, fontSize: "0.8rem",
            letterSpacing: "0.04em", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(155,48,255,1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(155,48,255,0.85)")}
        >Add a memory →</button>

        <div style={{
          fontSize: "0.55rem", textAlign: "center",
          color: "rgba(196,174,244,0.3)", letterSpacing: "0.08em",
          textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
        }}>ESC to close</div>
      </div>

      {/* 7. Upload overlay — always in DOM, CSS controlled */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 140,
        background: "rgba(10,8,20,0.93)", backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        opacity: showUpload ? 1 : 0,
        pointerEvents: showUpload ? "all" : "none",
        transition: "opacity 0.3s ease",
        overflowY: "auto",
      }}>
        <div style={{
          maxWidth: 580, margin: "0 auto", padding: "32px 24px",
          minHeight: "100vh", display: "flex", flexDirection: "column",
        }}>

          {/* Top bar */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 28,
          }}>
            <button
              onClick={handleUploadBack}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(196,174,244,0.6)", fontSize: "0.75rem",
                fontFamily: "'DM Sans', sans-serif", transition: "color 0.2s",
                letterSpacing: "0.04em",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(196,174,244,1)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(196,174,244,0.6)")}
            >← Back</button>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic",
              fontSize: "1rem", color: "#EDE8F8",
            }}>
              {flowStep === "upload"
                ? "Upload your memories"
                : flowStep === "locate"
                ? "Location assignment"
                : flowStep === "generating"
                ? "Generating your map..."
                : flowStep === "customize"
                ? "Refine your emotional draft"
                : getNeighborhoodName(selectedSlug)}
            </span>
            <span style={{
              fontSize: "0.7rem", color: "rgba(196,174,244,0.5)",
              fontFamily: "'DM Sans', sans-serif",
            }}>{currentItems.length} photo{currentItems.length !== 1 ? "s" : ""} added</span>
          </div>

          {flowStep === "customize" && (currentItems.length > 0 || driftMode) && (
            <div style={{ marginTop: 16, border: "0.5px solid rgba(155,48,255,0.16)", borderRadius: 10, padding: "12px 12px 10px", background: "rgba(155,48,255,0.04)" }}>
              <div style={{ fontSize: "0.64rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(196,174,244,0.56)", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                How does this place feel?
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {MOOD_PRESETS.map((mood) => {
                  const selected = currentMoods.includes(mood);
                  return (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => {
                        setCurrentMoods((prev) => {
                          if (prev.includes(mood)) return prev.filter((x) => x !== mood);
                          if (prev.length >= MAX_MOODS) return prev;
                          const next = [...prev, mood];
                          if (next.length === 1) setCurrentColor(suggestColorFromMood(next[0]));
                          return next;
                        });
                      }}
                      style={{
                        border: selected ? "0.5px solid rgba(255,215,122,0.7)" : "0.5px solid rgba(155,48,255,0.28)",
                        background: selected ? "rgba(255,215,122,0.12)" : "rgba(155,48,255,0.07)",
                        borderRadius: 999,
                        padding: "4px 10px",
                        color: selected ? "rgba(255,235,195,0.98)" : "rgba(225,209,250,0.8)",
                        fontSize: "0.66rem",
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {mood}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== ",") return;
                    e.preventDefault();
                    const candidate = moodInput.trim();
                    if (!candidate) return;
                    setCurrentMoods((prev) => {
                      const next = normalizeMoods([...prev, candidate]);
                      if (prev.length === 0 && next.length > 0) setCurrentColor(suggestColorFromMood(next[0]));
                      return next;
                    });
                    setMoodInput("");
                  }}
                  placeholder={`Add mood tag (up to ${MAX_MOODS})`}
                  style={{
                    flex: 1,
                    background: "rgba(155,48,255,0.05)",
                    border: "0.5px solid rgba(155,48,255,0.2)",
                    borderRadius: 6,
                    padding: "6px 8px",
                    color: "rgba(196,174,244,0.78)",
                    fontSize: "0.7rem",
                    outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  title="Pick mood color"
                  style={{ width: 30, height: 30, border: "none", background: "transparent", cursor: "pointer" }}
                />
              </div>
            </div>
          )}

          {/* Upload zone */}
          <div
            onClick={() => {
              fileInputRef.current?.click();
            }}
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              handleDrop(e);
            }}
            style={{
              border: `1.5px dashed ${dragOver ? "rgba(155,48,255,0.6)" : "rgba(155,48,255,0.25)"}`,
              borderRadius: 14, minHeight: 160,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 10, cursor: "pointer",
              background: dragOver ? "rgba(155,48,255,0.05)" : "transparent",
              transition: "border-color 0.2s ease, background 0.2s ease",
              opacity: 1,
            }}
          >
            {uploading ? (
              <div style={{ fontSize: "0.72rem", color: "rgba(196,174,244,0.5)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em" }}>
                Uploading…
              </div>
            ) : (
              <>
                <div style={{ fontSize: "1.8rem", color: "rgba(155,48,255,0.4)", lineHeight: 1 }}>+</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(196,174,244,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                  Drop photos here, or click to choose
                </div>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file" accept="image/*" multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {flowStep === "upload" && (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <input
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="City name"
                maxLength={60}
                style={{
                  width: "100%",
                  background: "rgba(155,48,255,0.05)",
                  border: "0.5px solid rgba(155,48,255,0.15)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  color: "rgba(220,205,245,0.9)",
                  fontSize: "0.74rem",
                  outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <textarea
                value={optionalMemory}
                onChange={(e) => setOptionalMemory(e.target.value)}
                placeholder="Optional memory"
                rows={2}
                maxLength={200}
                style={{
                  width: "100%",
                  background: "rgba(155,48,255,0.05)",
                  border: "0.5px solid rgba(155,48,255,0.15)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  color: "rgba(220,205,245,0.9)",
                  fontSize: "0.74rem",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                }}
              />
              <div style={{
                fontSize: "0.64rem",
                color: "rgba(196,174,244,0.56)",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                We’ll help place your photos on the map.
              </div>
            </div>
          )}

          {/* Photo grid */}
          {currentItems.length > 0 && (
            <div style={{ marginTop: 20 }}>
              {flowStep === "locate" && (
                <div style={{
                  marginBottom: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "0.5px solid rgba(155,48,255,0.22)",
                  background: "rgba(155,48,255,0.06)",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 8,
                  alignItems: "center",
                }}>
                  <div style={{ fontSize: "0.64rem", color: "rgba(196,174,244,0.72)", fontFamily: "'DM Sans', sans-serif" }}>
                    {selectedLocateItems.length} selected for batch assignment
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select
                      value=""
                      onChange={(e) => {
                        const slug = e.target.value as Slug;
                        if (!slug || selectedLocateItems.length === 0) return;
                        selectedLocateItems.forEach((idx) => setPhotoAssignedSlug(idx, slug));
                        e.currentTarget.value = "";
                      }}
                      style={{
                        background: "rgba(155,48,255,0.05)",
                        border: "0.5px solid rgba(155,48,255,0.18)",
                        borderRadius: 6,
                        padding: "5px 7px",
                        color: "rgba(220,205,245,0.85)",
                        fontSize: "0.62rem",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <option value="">Assign district…</option>
                      {HOODS.map((hood) => (
                        <option key={`batch-${hood.slug}`} value={hood.slug}>{hood.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setSelectedLocateItems(currentItems.map((_, idx) => idx))}
                      style={{
                        border: "0.5px solid rgba(155,48,255,0.22)",
                        background: "rgba(155,48,255,0.08)",
                        borderRadius: 6,
                        padding: "5px 7px",
                        color: "rgba(220,205,245,0.85)",
                        fontSize: "0.62rem",
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: "pointer",
                      }}
                    >All</button>
                    <button
                      type="button"
                      onClick={() => setSelectedLocateItems([])}
                      style={{
                        border: "0.5px solid rgba(155,48,255,0.22)",
                        background: "rgba(155,48,255,0.08)",
                        borderRadius: 6,
                        padding: "5px 7px",
                        color: "rgba(220,205,245,0.85)",
                        fontSize: "0.62rem",
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: "pointer",
                      }}
                    >Clear</button>
                  </div>
                </div>
              )}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}>
              {currentItems.map((photo, i) => (
                <div key={i} style={{ position: "relative" }}>
                  {flowStep === "locate" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocateItems((prev) =>
                          prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                        );
                      }}
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        border: "0.5px solid rgba(255,255,255,0.45)",
                        background: selectedLocateItems.includes(i) ? "rgba(255,215,122,0.88)" : "rgba(7,6,16,0.56)",
                        cursor: "pointer",
                        zIndex: 2,
                      }}
                      aria-label="Select photo for batch assignment"
                    />
                  )}
                  <img src={photo.url} alt="" style={{
                    width: "100%", aspectRatio: "1", objectFit: "cover",
                    borderRadius: 8, display: "block",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                  }} />
                  <button
                    onClick={() => removePhoto(i)}
                    style={{
                      position: "absolute", top: 6, right: 6,
                      background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.8)",
                      border: "none", borderRadius: "50%",
                      width: 22, height: 22, fontSize: 12, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >×</button>
                  {flowStep !== "upload" && (
                    <textarea
                      value={photo.note}
                      onChange={e => updateNote(i, e.target.value)}
                      placeholder="The story behind this photo..."
                      maxLength={100}
                      rows={2}
                      style={{
                        width: "100%", marginTop: 6,
                        background: "rgba(155,48,255,0.05)",
                        border: "0.5px solid rgba(155,48,255,0.15)",
                        borderRadius: 6, padding: "6px 8px",
                        color: "rgba(196,174,244,0.75)",
                        fontSize: "0.72rem", resize: "none", outline: "none",
                        fontFamily: "Georgia, serif", fontStyle: "italic",
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                  {flowStep === "customize" && showPhotoOverrides && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                    {MOOD_PRESETS.map((mood) => {
                      const selected = photo.moods.includes(mood);
                      return (
                        <button
                          key={`${photo.url}-${mood}`}
                          type="button"
                          onClick={() => {
                            const next = selected
                              ? photo.moods.filter((x) => x !== mood)
                              : normalizeMoods([...photo.moods, mood]);
                            setPhotoMoods(i, next, "manual");
                            if (!selected && next.length === 1) {
                              updateItem(i, (cur) => ({ ...cur, color: suggestColorFromMood(next[0]) }));
                            }
                          }}
                          style={{
                            border: selected ? "0.5px solid rgba(255,215,122,0.7)" : "0.5px solid rgba(155,48,255,0.22)",
                            background: selected ? "rgba(255,215,122,0.12)" : "rgba(155,48,255,0.06)",
                            borderRadius: 999,
                            padding: "2px 8px",
                            color: selected ? "rgba(255,235,195,0.98)" : "rgba(225,209,250,0.78)",
                            fontSize: "0.62rem",
                            cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {mood}
                        </button>
                      );
                    })}
                  </div>
                  )}
                  {flowStep === "customize" && showPhotoOverrides && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => suggestPhotoMoodsWithAI(i)}
                      disabled={aiSuggestingIndex === i}
                      style={{
                        background: "rgba(155,48,255,0.14)",
                        border: "0.5px solid rgba(155,48,255,0.28)",
                        borderRadius: 6,
                        padding: "5px 8px",
                        color: "rgba(232,220,252,0.9)",
                        fontSize: "0.62rem",
                        cursor: aiSuggestingIndex === i ? "default" : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {aiSuggestingIndex === i ? "Suggesting..." : "Suggest moods with AI"}
                    </button>
                    {photo.moodConfidence ? (
                      <span style={{ fontSize: "0.58rem", color: "rgba(196,174,244,0.6)", fontFamily: "'DM Sans', sans-serif" }}>
                        {Math.round(photo.moodConfidence * 100)}%
                      </span>
                    ) : null}
                  </div>
                  )}
                  {flowStep === "locate" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6, marginTop: 6 }}>
                    <select
                      value={photo.assignedSlug ?? ""}
                      onChange={e => {
                        const slug = e.target.value as Slug;
                        if (slug) setPhotoAssignedSlug(i, slug);
                      }}
                      style={{
                        width: "100%",
                        background: "rgba(155,48,255,0.05)",
                        border: "0.5px solid rgba(155,48,255,0.15)",
                        borderRadius: 6, padding: "6px 8px",
                        color: "rgba(196,174,244,0.75)",
                        fontSize: "0.7rem", outline: "none",
                        fontFamily: "'DM Sans', sans-serif",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="">Choose neighborhood…</option>
                      {HOODS.map(hood => (
                        <option key={`preset-${hood.slug}`} value={hood.slug}>
                          {hood.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={isoToLocalInput(photo.capturedAt)}
                      onChange={e => updateCapturedAt(i, e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(155,48,255,0.05)",
                        border: "0.5px solid rgba(155,48,255,0.15)",
                        borderRadius: 6, padding: "6px 8px",
                        color: "rgba(196,174,244,0.75)",
                        fontSize: "0.7rem", outline: "none",
                        fontFamily: "'DM Sans', sans-serif",
                        boxSizing: "border-box",
                      }}
                    />
                    <input
                      type="text"
                      value={photo.manualPlaceName}
                      onChange={e => updateManualPlaceName(i, e.target.value)}
                      placeholder="Place name (optional)"
                      maxLength={80}
                      style={{
                        width: "100%",
                        background: "rgba(155,48,255,0.05)",
                        border: "0.5px solid rgba(155,48,255,0.15)",
                        borderRadius: 6, padding: "6px 8px",
                        color: "rgba(196,174,244,0.75)",
                        fontSize: "0.7rem", outline: "none",
                        fontFamily: "'DM Sans', sans-serif",
                        boxSizing: "border-box",
                      }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <input
                        type="number"
                        step="any"
                        value={photo.lat ?? ""}
                        onChange={e => updateCoordinate(i, "lat", e.target.value)}
                        placeholder="Latitude"
                        style={{
                          width: "100%",
                          background: "rgba(155,48,255,0.05)",
                          border: "0.5px solid rgba(155,48,255,0.15)",
                          borderRadius: 6, padding: "6px 8px",
                          color: "rgba(196,174,244,0.75)",
                          fontSize: "0.7rem", outline: "none",
                          fontFamily: "'DM Sans', sans-serif",
                          boxSizing: "border-box",
                        }}
                      />
                      <input
                        type="number"
                        step="any"
                        value={photo.lng ?? ""}
                        onChange={e => updateCoordinate(i, "lng", e.target.value)}
                        placeholder="Longitude"
                        style={{
                          width: "100%",
                          background: "rgba(155,48,255,0.05)",
                          border: "0.5px solid rgba(155,48,255,0.15)",
                          borderRadius: 6, padding: "6px 8px",
                          color: "rgba(196,174,244,0.75)",
                          fontSize: "0.7rem", outline: "none",
                          fontFamily: "'DM Sans', sans-serif",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPinPickerIndex(prev => (prev === i ? null : i))}
                      style={{
                        width: "100%",
                        background: "rgba(155,48,255,0.15)",
                        border: "0.5px solid rgba(155,48,255,0.3)",
                        borderRadius: 6,
                        padding: "6px 8px",
                        color: "#EDE8F8",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {pinPickerIndex === i ? "Hide draggable pin map" : "Drag pin on map"}
                    </button>
                    {pinPickerIndex === i && (
                      <ManualPinPicker
                        lat={photo.lat}
                        lng={photo.lng}
                        onChange={(nextLat, nextLng) => {
                          updateItem(i, current => ({
                            ...current,
                            lat: nextLat,
                            lng: nextLng,
                            manualOverride: true,
                            locationSource: "manual",
                          }));
                        }}
                      />
                    )}
                    <div style={{
                      fontSize: "0.6rem",
                      color: "rgba(196,174,244,0.45)",
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "0.02em",
                    }}>
                      Area: {getNeighborhoodName(photo.assignedSlug)} · Source: {photo.source === "ai-assisted" ? "AI-assisted" : "Manual"}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {MOOD_PRESETS.map((mood) => {
                        const selected = (photo.moods ?? []).includes(mood);
                        return (
                          <button
                            key={`locate-mood-${photo.url}-${mood}`}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? (photo.moods ?? []).filter((x) => x !== mood)
                                : normalizeMoods([...(photo.moods ?? []), mood]);
                              setPhotoMoods(i, next, "manual");
                              if (!selected && next.length === 1) {
                                updateItem(i, (cur) => ({ ...cur, color: suggestColorFromMood(next[0]) }));
                              }
                            }}
                            style={{
                              border: selected ? "0.5px solid rgba(255,215,122,0.7)" : "0.5px solid rgba(155,48,255,0.22)",
                              background: selected ? "rgba(255,215,122,0.12)" : "rgba(155,48,255,0.06)",
                              borderRadius: 999,
                              padding: "2px 8px",
                              color: selected ? "rgba(255,235,195,0.98)" : "rgba(225,209,250,0.78)",
                              fontSize: "0.62rem",
                              cursor: "pointer",
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {mood}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => suggestPhotoMoodsWithAI(i)}
                      disabled={aiSuggestingIndex === i}
                      style={{
                        alignSelf: "start",
                        background: "rgba(155,48,255,0.14)",
                        border: "0.5px solid rgba(155,48,255,0.28)",
                        borderRadius: 6,
                        padding: "5px 8px",
                        color: "rgba(232,220,252,0.9)",
                        fontSize: "0.62rem",
                        cursor: aiSuggestingIndex === i ? "default" : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {aiSuggestingIndex === i ? "Suggesting..." : "Suggest moods with AI"}
                    </button>
                  </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Bottom button */}
          <div style={{
            position: "sticky", bottom: 0,
            background: "rgba(10,8,20,0.98)",
            borderTop: "0.5px solid rgba(155,48,255,0.1)",
            padding: "16px 0", marginTop: 24,
          }}>
            {flowStep === "upload" ? (
              <button
                onClick={goToGenerateStep}
                style={{
                  width: "100%", height: 52,
                  background: "#9B30FF", color: "#EDE8F8",
                  border: "none", borderRadius: 100,
                  fontSize: "0.85rem", letterSpacing: "0.06em", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s",
                }}
              >Generate your map →</button>
            ) : flowStep === "locate" ? (
              <button
                onClick={triggerGenerateDraft}
                style={{
                  width: "100%", height: 52,
                  background: "#9B30FF", color: "#EDE8F8",
                  border: "none", borderRadius: 100,
                  fontSize: "0.85rem", letterSpacing: "0.06em", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s",
                }}
              >Generate your map →</button>
            ) : flowStep === "generating" ? (
              <button
                disabled
                style={{
                  width: "100%", height: 52,
                  background: "rgba(155,48,255,0.45)", color: "rgba(237,232,248,0.75)",
                  border: "none", borderRadius: 100,
                  fontSize: "0.85rem", letterSpacing: "0.06em", cursor: "default",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >Generating your map...</button>
            ) : (
            <button
              onClick={handleSaveAndAddAnother}
              style={{
                width: "100%", height: 52,
                background: "#9B30FF", color: "#EDE8F8",
                border: "none", borderRadius: 100,
                fontSize: "0.85rem", letterSpacing: "0.06em", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(155,48,255,0.8)")}
              onMouseLeave={e => (e.currentTarget.style.background = "#9B30FF")}
            >Save &amp; add another →</button>
            )}
          </div>
        </div>
      </div>

      {/* 8. Identity step before map generation */}
      <div
        onClick={() => { if (!finishing) setShowIdentityStep(false); }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 90,
          background: "rgba(10,8,20,0.72)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          opacity: (showIdentityStep && flowStep === "customize") ? 1 : 0,
          pointerEvents: (showIdentityStep && flowStep === "customize") ? "all" : "none",
          transition: "opacity 0.22s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 430,
            borderRadius: 14,
            border: "0.5px solid rgba(155,48,255,0.28)",
            background: "rgba(14,10,26,0.95)",
            padding: "18px 18px 16px",
            boxShadow: "0 12px 34px rgba(8, 6, 18, 0.45)",
          }}
        >
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.62rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(196,174,244,0.55)",
            marginBottom: 8,
          }}>
            Whose New York is this?
          </p>
          <input
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            style={{
              width: "100%",
              background: "rgba(155,48,255,0.05)",
              border: "0.5px solid rgba(155,48,255,0.2)",
              borderRadius: 8,
              padding: "10px 12px",
              color: "rgba(237,232,248,0.92)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.82rem",
              marginBottom: 10,
              outline: "none",
            }}
          />
          <input
            value={customSubtitle}
            onChange={(e) => setCustomSubtitle(e.target.value)}
            placeholder="Optional subtitle"
            maxLength={110}
            style={{
              width: "100%",
              background: "rgba(155,48,255,0.05)",
              border: "0.5px solid rgba(155,48,255,0.2)",
              borderRadius: 8,
              padding: "10px 12px",
              color: "rgba(206,186,240,0.85)",
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "0.96rem",
              marginBottom: 12,
              outline: "none",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowIdentityStep(false)}
              style={{
                background: "transparent",
                border: "0.5px solid rgba(155,48,255,0.28)",
                borderRadius: 999,
                padding: "8px 12px",
                color: "rgba(196,174,244,0.66)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.68rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={finishing}
              style={{
                background: "rgba(155,48,255,0.9)",
                border: "none",
                borderRadius: 999,
                padding: "8px 14px",
                color: "#EDE8F8",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.68rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: finishing ? "default" : "pointer",
                opacity: finishing ? 0.6 : 1,
              }}
            >
              {finishing ? "Generating..." : "Generate my map"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
