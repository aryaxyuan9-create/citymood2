import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import ShaderBackground from "../components/home/ShaderBackground";
import { supabase } from "../lib/supabase";
import NeighborhoodGallery from "../components/NeighborhoodGallery";
import AtlasStyledMap from "../components/AtlasStyledMap";

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────
type Hood = {
  id: string; name: string; borough: string; mood: string; energy: number;
  accent: string; glow: string;
  path: string; labelX: number; labelY: number;
};

type NeighborhoodMemory = {
  notes: string[];
  photoUrls: string[];
  moods?: string[];
  color?: string;
  areaDefaultMoods?: string[];
  memories?: Array<{
    moods?: string[];
    color?: string;
    styleHint?: "dreamy" | "cinematic" | "soft" | "vivid" | "muted";
  }>;
  isDriftEntry?: boolean;
  driftPrompt?: string;
  capturedMoodFirst?: boolean;
};

type AtlasData = {
  id: string;
  createdAt: number;
  neighborhoods: Record<string, NeighborhoodMemory>;
  meta?: {
    creatorName?: string;
    customSubtitle?: string;
    identity?: {
      title?: string;
      narrative?: string;
      styleJudgment?: string;
      dominantMood?: string;
      dominantColor?: string;
    };
  };
};

type PhotoPoint = {
  id: string;
  neighborhoodSlug: string;
  url: string;
  lat: number | null;
  lng: number | null;
};

type EntryMapMeta = {
  moods?: string[];
  color?: string;
  previewUrl?: string;
};

const HOOD_CENTER_COORDS: Record<string, { lat: number; lng: number }> = {
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
const REGION_BOUNDS: [[number, number], [number, number]] = [
  [-74.055, 40.675],
  [-73.845, 40.895],
];

const BROOKLYN_NEAR_MANHATTAN_NTAS = [
  "Brooklyn Heights",
  "Downtown Brooklyn-DUMBO-Boerum Hill",
  "Fort Greene",
  "Clinton Hill",
  "Carroll Gardens-Cobble Hill-Gowanus-Red Hook",
  "Williamsburg",
  "South Williamsburg",
  "East Williamsburg",
  "Greenpoint",
];

const STREET_DETAIL_ZOOM = 12.8;
const TRANSPARENT_STREETS_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sources: {
    streets: { type: "vector", url: "mapbox://mapbox.mapbox-streets-v8" },
  },
  layers: [],
};

function stringSeed(input: string): number {
  let seed = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    seed ^= input.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function seededFloat(input: string): number {
  const seed = stringSeed(input);
  return (seed % 10000) / 10000;
}

function toTitleCaseMood(mood: string): string {
  if (!mood) return mood;
  return mood
    .trim()
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

const SUMMARY_DESCRIPTORS = [
  "soft light and slower moments",
  "quiet corners and remembered evenings",
  "small rituals, late walks, and intimate streets",
  "warm shadows and reflective pauses",
];

const MOOD_COLOR_FALLBACK: Record<string, string> = {
  calm: "#7FA8FF",
  nostalgic: "#C9A1D8",
  energetic: "#FFD35B",
  dreamy: "#98B6FF",
  romantic: "#F58FA8",
  melancholic: "#6C78A7",
  warm: "#F2A356",
  bold: "#FF8A5B",
};

function getDominantMood(moods: string[]): string | null {
  const counts = new Map<string, number>();
  moods.forEach((raw) => {
    const mood = toTitleCaseMood(raw);
    if (!mood) return;
    const key = mood.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  let topKey: string | null = null;
  let topCount = 0;
  counts.forEach((count, key) => {
    if (count > topCount) {
      topCount = count;
      topKey = key;
    }
  });
  if (!topKey) return null;
  return topKey
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDominantColor(colors: string[], dominantMood: string | null): string {
  const counts = new Map<string, number>();
  colors.forEach((color) => {
    const hex = (color || "").trim();
    if (!hex) return;
    counts.set(hex.toLowerCase(), (counts.get(hex.toLowerCase()) ?? 0) + 1);
  });
  let topColor: string | null = null;
  let topCount = 0;
  counts.forEach((count, color) => {
    if (count > topCount) {
      topCount = count;
      topColor = color;
    }
  });
  if (topColor) return topColor;
  if (dominantMood) {
    const fromMood = MOOD_COLOR_FALLBACK[dominantMood.toLowerCase()];
    if (fromMood) return fromMood;
  }
  return "#D8B26D";
}

function normalizeNeighborhoodMemory(raw: NeighborhoodMemory): NeighborhoodMemory {
  const memoryRows = Array.isArray(raw.memories) ? raw.memories : [];
  const inferredMoods = memoryRows.flatMap((row) => row.moods ?? []).filter(Boolean);
  const inferredColor = memoryRows.find((row) => typeof row.color === "string" && row.color.trim())?.color;
  const areaDefaults = Array.isArray(raw.areaDefaultMoods) ? raw.areaDefaultMoods : [];
  return {
    ...raw,
    moods: (areaDefaults.length > 0 ? areaDefaults : (raw.moods && raw.moods.length > 0 ? raw.moods : inferredMoods))
      .map(toTitleCaseMood)
      .filter(Boolean),
    color: (raw.color && raw.color.trim()) || inferredColor || raw.color,
  };
}

function generateSummary(topMoods: string[], seed: string): string {
  const first = topMoods[0] ? topMoods[0].toLowerCase() : "quiet";
  const second = topMoods[1] ? topMoods[1].toLowerCase() : "nostalgic";
  const descriptor = SUMMARY_DESCRIPTORS[stringSeed(seed) % SUMMARY_DESCRIPTORS.length];
  return `A ${first}, ${second} view of New York shaped by ${descriptor}.`;
}

function getTopMoods(moods: string[], limit = 2): string[] {
  const counts = new Map<string, number>();
  moods.forEach((raw) => {
    const mood = toTitleCaseMood(raw);
    if (!mood) return;
    const key = mood.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) =>
      key
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    );
}

function getColorToneLabel(color: string): string {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return "Soft violet";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "Soft violet";
  if (b >= r && b >= g) return "Soft blue";
  if (r >= g && r >= b) return "Warm amber";
  if (g >= r && g >= b) return "Muted green";
  return "Soft violet";
}

// ─────────────────────────────────────────────
//  Neighborhood data
// ─────────────────────────────────────────────
const HOODS: Hood[] = [
  {
    id:"financial", name:"Financial District", borough:"Manhattan", mood:"Towering & silent", energy:6,
    accent:"#c8a96e", glow:"rgba(200,169,110,0.5)",
    path:`M 118.9 491.2 L 110.4 489.8 L 112.8 487.2 L 120.9 489.3 L 118.9 491.2 Z M 128.1 480.7 L 126.2 483.2 L 117.9 481.2 L 120.0 478.8 L 128.1 480.7 Z M 129.5 478.7 L 121.8 476.8 L 123.9 474.5 L 131.4 476.4 L 129.5 478.7 Z M 136.0 471.4 L 134.5 472.9 L 129.0 471.2 L 136.4 466.0 L 140.4 467.1 L 136.0 471.4 Z M 140.7 466.7 L 139.2 466.3 L 141.7 466.3 L 140.7 466.7 Z M 141.8 464.4 L 140.8 464.8 L 141.8 464.4 Z M 75.0 423.2 L 69.7 437.6 L 90.1 444.0 L 105.6 439.7 L 105.1 441.7 L 125.2 453.3 L 117.4 456.4 L 118.1 457.6 L 116.5 458.3 L 119.6 460.4 L 116.4 461.9 L 112.1 460.1 L 114.4 462.3 L 112.6 462.4 L 109.2 459.8 L 107.3 460.7 L 111.9 463.7 L 106.4 461.1 L 96.8 465.2 L 101.7 468.3 L 101.0 468.6 L 96.1 465.5 L 86.5 470.0 L 88.8 472.2 L 93.0 471.7 L 89.4 472.8 L 90.1 473.5 L 89.1 473.8 L 85.4 470.3 L 79.3 471.4 L 80.7 474.8 L 79.5 472.9 L 77.2 473.2 L 77.6 474.1 L 75.9 473.5 L 76.4 475.3 L 74.7 473.7 L 73.9 475.1 L 72.0 474.0 L 72.2 476.0 L 71.4 474.0 L 69.8 475.0 L 70.3 472.8 L 67.3 472.2 L 69.7 472.4 L 68.7 471.1 L 69.2 468.7 L 67.0 466.7 L 67.5 462.8 L 58.6 462.1 L 53.6 464.4 L 54.0 463.6 L 50.9 463.1 L 55.4 462.5 L 50.0 462.3 L 48.3 458.5 L 49.1 456.1 L 51.3 456.2 L 52.7 453.7 L 50.1 453.1 L 54.3 439.9 L 54.1 441.2 L 58.6 441.8 L 59.8 438.3 L 55.0 437.8 L 54.4 439.2 L 58.3 423.9 L 71.6 424.7 L 72.3 422.5 L 75.0 423.2 Z`,
    labelX:78.4, labelY:458.9,
  },
  {
    id:"soho", name:"SoHo / Tribeca", borough:"Manhattan", mood:"Cast iron & quiet", energy:7,
    accent:"#a0b8d8", glow:"rgba(160,184,216,0.5)",
    path:`M 111.2 397.0 L 134.2 405.1 L 150.0 408.6 L 141.7 424.3 L 136.9 430.5 L 124.5 426.9 L 80.7 404.1 L 79.1 408.3 L 76.4 408.1 L 77.5 403.8 L 64.0 402.5 L 64.3 401.3 L 78.0 402.3 L 78.6 397.3 L 81.4 397.5 L 81.7 394.9 L 111.2 397.0 Z M 124.5 426.9 L 118.9 433.1 L 120.2 435.7 L 119.0 435.3 L 118.2 436.9 L 115.9 437.5 L 118.3 438.7 L 118.6 443.2 L 119.9 445.0 L 116.5 448.2 L 105.1 441.7 L 105.6 439.7 L 90.1 444.0 L 69.7 437.6 L 75.1 422.7 L 72.3 422.5 L 72.8 420.8 L 70.8 420.0 L 59.6 419.0 L 59.8 418.1 L 72.4 419.2 L 72.8 417.7 L 62.2 416.7 L 62.4 415.8 L 74.2 415.9 L 76.4 408.1 L 79.1 408.3 L 80.7 404.1 L 124.5 426.9 Z`,
    labelX:105.5, labelY:408.8,
  },
  {
    id:"westvillage", name:"West Village", borough:"Manhattan", mood:"Hushed & timeless", energy:5,
    accent:"#e8b4a0", glow:"rgba(232,180,160,0.5)",
    path:`M 87.1 357.9 L 133.9 372.1 L 116.5 389.5 L 111.2 397.0 L 81.7 394.9 L 81.4 397.5 L 67.1 396.7 L 68.3 390.6 L 79.4 391.2 L 80.0 386.0 L 80.2 384.1 L 68.6 383.2 L 81.1 382.9 L 80.7 381.4 L 76.1 381.2 L 80.7 380.6 L 82.0 370.1 L 79.5 369.2 L 82.1 369.3 L 82.3 367.1 L 77.8 366.8 L 78.3 363.2 L 73.7 362.7 L 85.2 363.0 L 86.1 361.6 L 85.3 361.0 L 78.5 359.8 L 80.6 357.6 L 87.1 357.9 Z M 86.2 358.8 L 83.5 357.9 L 84.5 358.8 L 83.2 360.2 L 86.3 360.9 L 86.2 358.8 Z`,
    labelX:86.7, labelY:375,
  },
  {
    id:"eastvillage", name:"East Village", borough:"Manhattan", mood:"Restless & raw", energy:9,
    accent:"#c8a0d0", glow:"rgba(200,160,208,0.5)",
    path:`M 246.9 424.7 L 249.2 425.6 L 246.9 424.7 Z M 249.6 422.2 L 252.3 423.7 L 249.6 422.2 Z M 255.0 419.0 L 252.5 418.2 L 255.0 419.0 Z M 255.7 417.9 L 257.5 418.8 L 255.7 417.9 Z M 258.8 417.6 L 257.5 417.3 L 258.8 417.6 Z M 258.0 418.4 L 255.3 416.1 L 258.0 418.4 Z M 229.3 404.0 L 222.5 424.0 L 208.6 422.0 L 150.0 408.6 L 155.3 398.7 L 160.3 380.2 L 228.3 401.1 L 229.9 401.8 L 229.3 404.0 Z`,
    labelX:195.6, labelY:404.8,
  },
  {
    id:"greenwich-village", name:"Greenwich Village", borough:"Manhattan", mood:"Bohemian & alive", energy:8,
    accent:"#d4956e", glow:"rgba(212,149,110,0.5)",
    path:`M 160.3 380.2 L 155.3 398.7 L 150.0 408.6 L 134.2 405.1 L 111.2 397.0 L 116.5 389.5 L 133.9 372.1 L 160.3 380.2 Z`,
    labelX:140.4, labelY:392.4,
  },
  {
    id:"chelsea", name:"Chelsea", borough:"Manhattan", mood:"Industrial & luminous", energy:8,
    accent:"#90c8a8", glow:"rgba(144,200,168,0.5)",
    path:`M 115.1 303.2 L 139.1 310.5 L 132.2 317.5 L 153.7 324.1 L 132.9 344.9 L 154.5 351.5 L 133.9 372.1 L 87.1 357.9 L 87.3 356.8 L 85.3 356.6 L 85.5 355.8 L 75.7 355.0 L 76.1 353.9 L 88.0 354.0 L 88.7 351.3 L 84.1 350.1 L 84.3 351.2 L 83.2 351.1 L 83.9 350.1 L 82.0 349.9 L 82.2 351.0 L 80.9 351.0 L 81.8 349.9 L 79.6 349.7 L 79.9 350.8 L 78.5 350.8 L 79.4 349.7 L 77.2 349.5 L 76.8 350.6 L 77.0 349.3 L 77.4 348.3 L 85.9 348.9 L 86.3 347.3 L 77.8 346.5 L 78.2 345.5 L 86.7 346.1 L 87.1 344.4 L 78.5 343.7 L 78.9 342.6 L 87.4 343.3 L 87.8 341.5 L 79.2 340.8 L 79.6 339.8 L 84.0 340.1 L 87.2 336.1 L 81.3 334.3 L 81.7 333.5 L 87.6 335.4 L 89.4 331.9 L 86.3 330.6 L 89.8 331.2 L 83.9 329.0 L 90.1 330.7 L 92.4 325.2 L 103.6 315.6 L 101.8 315.0 L 102.7 314.0 L 95.2 311.6 L 97.2 309.8 L 104.7 312.0 L 107.0 311.2 L 105.5 309.8 L 107.9 310.3 L 106.9 309.5 L 113.0 305.2 L 105.0 302.1 L 113.5 304.7 L 115.1 303.2 Z`,
    labelX:95.2, labelY:337.7,
  },
  {
    id:"midtown", name:"Midtown", borough:"Manhattan", mood:"Relentless & electric", energy:10,
    accent:"#f0a080", glow:"rgba(240,160,128,0.5)",
    path:`M 224.6 297.7 L 236.8 301.5 L 214.0 324.2 L 211.3 323.4 L 209.5 325.1 L 204.3 330.5 L 206.9 331.3 L 194.8 343.4 L 170.2 335.9 L 168.4 337.7 L 146.8 331.1 L 190.0 288.1 L 192.3 287.7 L 224.6 297.7 Z M 194.8 343.4 L 160.4 377.5 L 160.3 380.2 L 133.9 372.1 L 154.5 351.5 L 132.9 344.9 L 146.8 331.1 L 168.4 337.7 L 170.2 335.9 L 194.8 343.4 Z M 249.1 305.2 L 278.2 314.1 L 279.9 313.5 L 256.2 332.4 L 246.6 329.7 L 240.2 336.8 L 222.7 331.4 L 219.2 335.0 L 204.3 330.5 L 211.3 323.4 L 214.0 324.2 L 236.8 301.5 L 249.1 305.2 Z`,
    labelX:192.6, labelY:313.6,
  },
  {
    id:"upperwest", name:"Upper West Side", borough:"Manhattan", mood:"Cultural & unhurried", energy:6,
    accent:"#b8d0e8", glow:"rgba(184,208,232,0.5)",
    path:`M 258.2 220.0 L 217.0 261.0 L 178.7 249.3 L 176.4 253.4 L 167.1 250.3 L 177.2 239.4 L 174.5 237.4 L 170.9 239.8 L 174.7 237.0 L 177.3 239.2 L 178.7 237.8 L 176.1 237.1 L 178.9 237.6 L 180.3 236.2 L 175.4 236.3 L 180.4 236.0 L 211.7 203.7 L 238.3 211.8 L 236.6 213.5 L 258.2 220.0 Z M 217.0 261.0 L 191.6 286.3 L 192.3 287.7 L 189.0 289.1 L 145.6 275.8 L 147.3 274.0 L 136.2 271.4 L 136.8 270.6 L 145.0 273.1 L 151.3 267.7 L 152.1 266.7 L 150.9 266.5 L 156.4 260.9 L 158.4 260.9 L 164.3 255.1 L 154.0 255.4 L 164.2 254.6 L 167.1 250.3 L 176.4 253.4 L 178.7 249.3 L 217.0 261.0 Z M 275.5 195.7 L 281.1 197.3 L 258.2 220.0 L 236.6 213.5 L 238.3 211.8 L 211.7 203.7 L 231.9 182.9 L 275.5 195.7 Z`,
    labelX:198.5, labelY:235,
  },
  {
    id:"harlem", name:"Harlem", borough:"Manhattan", mood:"Deep & resonant", energy:8,
    accent:"#d4a0a0", glow:"rgba(212,160,160,0.5)",
    path:`M 368.7 108.6 L 373.7 144.4 L 371.3 144.5 L 372.8 149.6 L 343.5 179.3 L 304.2 167.3 L 315.2 158.3 L 327.1 140.1 L 330.6 141.2 L 339.1 134.6 L 353.1 120.7 L 355.4 116.7 L 349.7 115.0 L 354.2 109.3 L 370.5 99.2 L 371.4 99.7 L 369.6 101.5 L 368.7 108.6 Z M 343.5 179.3 L 339.8 183.0 L 333.7 181.2 L 326.6 188.1 L 332.7 190.0 L 315.1 207.6 L 275.5 195.7 L 280.8 190.3 L 280.9 183.6 L 293.3 171.1 L 298.6 172.7 L 304.2 167.3 L 343.5 179.3 Z M 327.1 140.1 L 315.2 158.3 L 304.2 167.3 L 296.7 165.0 L 290.5 159.8 L 288.4 161.9 L 276.1 151.9 L 266.4 148.9 L 274.8 142.8 L 277.4 139.3 L 277.6 140.3 L 278.6 139.4 L 277.9 137.0 L 274.5 136.5 L 275.6 135.4 L 278.2 136.1 L 279.7 138.5 L 282.0 136.0 L 275.9 133.6 L 277.4 131.7 L 284.0 134.6 L 309.0 141.3 L 312.5 137.9 L 317.7 139.5 L 319.5 137.8 L 327.1 140.1 Z`,
    labelX:362.1, labelY:123.8,
  },
  {
    id:"gramercy", name:"Gramercy / Murray Hill", borough:"Manhattan", mood:"Quiet & composed", energy:5,
    accent:"#c8b890", glow:"rgba(200,184,144,0.5)",
    path:`M 203.6 373.4 L 188.3 388.7 L 160.3 380.2 L 160.4 377.5 L 182.5 355.6 L 194.7 359.3 L 187.9 366.2 L 205.4 371.6 L 203.6 373.4 Z`,
    labelX:183, labelY:374.7,
  },
  {
    id:"dumbo", name:"DUMBO", borough:"Brooklyn", mood:"Moody & vast", energy:7,
    accent:"#a8c0d8", glow:"rgba(168,192,216,0.5)",
    path:`M 201.6 458.9 L 197.0 467.0 L 197.9 469.5 L 194.6 470.2 L 196.5 473.4 L 196.1 482.4 L 197.5 490.0 L 201.2 493.4 L 188.5 493.0 L 188.4 494.8 L 191.3 494.8 L 190.2 499.4 L 192.7 503.2 L 184.6 503.2 L 194.8 506.2 L 205.3 517.1 L 199.5 523.8 L 166.5 514.4 L 163.3 518.0 L 145.0 512.8 L 151.0 503.9 L 158.1 505.4 L 162.9 500.3 L 164.0 497.2 L 156.2 496.0 L 158.3 492.4 L 155.1 484.8 L 154.5 480.1 L 156.6 473.5 L 150.0 469.7 L 140.7 466.7 L 142.2 465.9 L 140.9 465.3 L 141.8 463.6 L 151.9 462.4 L 152.9 464.1 L 156.3 464.2 L 159.1 461.7 L 166.4 462.8 L 166.5 461.4 L 167.7 461.2 L 173.2 461.6 L 173.5 460.6 L 184.9 459.8 L 194.5 460.5 L 194.5 459.0 L 201.6 458.9 Z`,
    labelX:174.4, labelY:481.2,
  },
  {
    id:"williamsburg", name:"Williamsburg", borough:"Brooklyn", mood:"Loud & searching", energy:9,
    accent:"#d8b8a0", glow:"rgba(216,184,160,0.5)",
    path:`M 281.2 407.9 L 294.0 413.3 L 305.9 410.4 L 309.7 415.4 L 315.7 413.1 L 318.2 424.4 L 322.8 424.1 L 298.9 436.5 L 314.6 436.5 L 317.3 448.5 L 308.9 449.1 L 311.3 460.2 L 282.1 452.1 L 280.0 455.3 L 261.6 454.0 L 242.2 456.5 L 238.8 455.8 L 236.6 453.2 L 236.3 449.7 L 237.6 447.0 L 235.8 446.5 L 238.4 444.9 L 236.4 444.2 L 239.0 444.3 L 240.4 440.6 L 242.0 439.6 L 240.4 438.8 L 246.5 428.4 L 254.6 422.2 L 254.1 419.7 L 257.1 420.0 L 263.6 413.5 L 267.8 406.6 L 266.1 405.9 L 269.7 405.5 L 281.2 407.9 Z M 311.3 460.2 L 342.9 473.4 L 263.3 480.8 L 265.8 474.8 L 246.7 463.6 L 242.2 456.5 L 261.6 454.0 L 280.0 455.3 L 282.1 452.1 L 311.3 460.2 Z`,
    labelX:263.2, labelY:433.7,
  },
  {
    id:"washington-heights", name:"Washington Heights", borough:"Manhattan", mood:"Vibrant & uptown", energy:7,
    accent:"#c8a090", glow:"rgba(200,160,144,0.5)",
    path:`M 311.4 104.1 L 326.9 77.6 L 323.7 59.4 L 379.3 6.1 L 393.2 14.4 L 415.4 36.2 L 383.0 67.8 L 348.9 114.7 L 311.4 104.1 Z`,
    labelX:355, labelY:82,
  },
  {
    id:"upper-east-side", name:"Upper East Side", borough:"Manhattan", mood:"Refined & composed", energy:6,
    accent:"#b8c8a8", glow:"rgba(184,200,168,0.5)",
    path:`M 373.7 145.4 L 392.0 195.9 L 388.9 212.9 L 355.4 222.3 L 318.6 204.1 L 373.7 145.4 Z M 318.6 204.1 L 346.3 219.5 L 369.1 221.9 L 365.5 243.3 L 336.4 246.9 L 336.5 253.8 L 342.3 265.4 L 321.7 281.5 L 290.2 232.3 L 318.6 204.1 Z`,
    labelX:335, labelY:235,
  },
  {
    id:"central-park", name:"Central Park", borough:"Manhattan", mood:"Open & breathing", energy:4,
    accent:"#90c0a0", glow:"rgba(144,192,160,0.5)",
    path:`M 315.1 207.6 L 224.6 297.7 L 192.3 287.7 L 281.1 197.3 L 315.1 207.6 Z`,
    labelX:253, labelY:248,
  },
  {
    id:"lower-east-side", name:"Lower East Side", borough:"Manhattan", mood:"Gritty & alive", energy:8,
    accent:"#d4a8b0", glow:"rgba(212,168,176,0.5)",
    path:`M 229.3 404.0 L 265.3 382.1 L 268.0 403.9 L 266.1 405.9 L 242.2 456.5 L 222.5 424.0 L 229.3 404.0 Z`,
    labelX:248, labelY:420,
  },
];

// ─────────────────────────────────────────────
//  Atlas SVG Map — read-only with lit + active
// ─────────────────────────────────────────────
function AtlasMap({
  litIds, activeId, onSelect, photoPoints, representativePhotos, entryMetaBySlug,
}: {
  litIds: string[];
  activeId: string | null;
  onSelect: (id: string) => void;
  photoPoints: PhotoPoint[];
  representativePhotos: Array<{ hoodId: string; url: string; lat: number; lng: number }>;
  entryMetaBySlug?: Record<string, EntryMapMeta>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const overviewZoomRef = useRef<number>(10.8);
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(11.6);
  const mapToken = (import.meta.env.NEXT_PUBLIC_MAPBOX_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN || "").trim();

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  const buildEntryColorMatch = (fallback: string): mapboxgl.Expression => {
    const expression: (string | mapboxgl.Expression)[] = ["match", ["get", "slug"]];
    Object.entries(entryMetaBySlug ?? {}).forEach(([slug, meta]) => {
      const color = (meta?.color || "").trim();
      if (!color) return;
      expression.push(slug, color);
    });
    expression.push(fallback);
    return expression as mapboxgl.Expression;
  };

  const getColoredSlugs = () => Object.keys(entryMetaBySlug ?? {});

  const createPinPopup = (meta: EntryMapMeta | undefined, fallbackUrl?: string) => {
    const moods = (meta?.moods ?? []).filter(Boolean).slice(0, 3);
    const color = meta?.color || "#FFD700";
    const preview = meta?.previewUrl || fallbackUrl;

    const wrap = document.createElement("div");
    wrap.style.minWidth = "160px";
    wrap.style.maxWidth = "200px";
    wrap.style.padding = "8px 9px";
    wrap.style.borderRadius = "10px";
    wrap.style.background = "rgba(10,8,20,0.94)";
    wrap.style.border = `0.5px solid ${color}`;
    wrap.style.boxShadow = `0 6px 18px rgba(8, 6, 16, 0.35), 0 0 12px ${color}44`;
    wrap.style.color = "rgba(240,232,252,0.95)";
    wrap.style.fontFamily = "'DM Sans', sans-serif";

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "7px";
    row.style.marginBottom = moods.length || preview ? "6px" : "0";

    const dot = document.createElement("span");
    dot.style.width = "8px";
    dot.style.height = "8px";
    dot.style.borderRadius = "999px";
    dot.style.background = color;
    dot.style.boxShadow = `0 0 8px ${color}`;
    dot.style.flexShrink = "0";

    const colorLabel = document.createElement("span");
    colorLabel.style.fontSize = "10px";
    colorLabel.style.letterSpacing = "0.1em";
    colorLabel.style.textTransform = "uppercase";
    colorLabel.style.color = "rgba(210,189,246,0.78)";
    colorLabel.textContent = color;

    row.appendChild(dot);
    row.appendChild(colorLabel);
    wrap.appendChild(row);

    if (moods.length > 0) {
      const moodsEl = document.createElement("div");
      moodsEl.style.fontSize = "11px";
      moodsEl.style.letterSpacing = "0.03em";
      moodsEl.style.color = "rgba(239,223,255,0.92)";
      moodsEl.style.marginBottom = preview ? "6px" : "0";
      moodsEl.textContent = moods.join(" · ");
      wrap.appendChild(moodsEl);
    }

    if (preview) {
      const img = document.createElement("img");
      img.src = preview;
      img.alt = "";
      img.style.width = "100%";
      img.style.height = "72px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "7px";
      img.style.border = "0.5px solid rgba(255,255,255,0.14)";
      wrap.appendChild(img);
    }

    return wrap;
  };

  const buildEmotionFieldGeoJSON = () => ({
    type: "FeatureCollection" as const,
    features: (() => {
      const fromPhotoPoints = photoPoints.map((point) => {
        const fallback = HOOD_CENTER_COORDS[point.neighborhoodSlug];
        const lat = point.lat ?? fallback?.lat ?? null;
        const lng = point.lng ?? fallback?.lng ?? null;
        if (lat === null || lng === null) return null;
        const color = entryMetaBySlug?.[point.neighborhoodSlug]?.color || "#D8B26D";
        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [lng, lat] },
          properties: {
            color,
            weight: 1.2,
            radiusBoost: 1.15,
            blur: 0.84,
          },
        };
      }).filter((feature): feature is NonNullable<typeof feature> => Boolean(feature));

      if (fromPhotoPoints.length > 0) return fromPhotoPoints;

      const fromRepresentative = representativePhotos.map((point) => {
        const color = entryMetaBySlug?.[point.hoodId]?.color || "#D8B26D";
        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [point.lng, point.lat] },
          properties: {
            color,
            weight: 1.1,
            radiusBoost: 1.1,
            blur: 0.86,
          },
        };
      });
      if (fromRepresentative.length > 0) return fromRepresentative;

      // Debug fallback: if data is sparse, still render a visible emotional scaffold.
      return litIds
        .map((slug) => {
          const center = HOOD_CENTER_COORDS[slug];
          if (!center) return null;
          const color = entryMetaBySlug?.[slug]?.color || "#D8B26D";
          return {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [center.lng, center.lat] },
            properties: {
              color,
              weight: 1.05,
              radiusBoost: 1,
              blur: 0.9,
            },
          };
        })
        .filter((feature): feature is NonNullable<typeof feature> => Boolean(feature));
    })(),
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapToken) return;
    mapboxgl.accessToken = mapToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: TRANSPARENT_STREETS_STYLE,
      center: [-73.9855, 40.744],
      zoom: 11.2,
      minZoom: 0,
      maxZoom: 16.2,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });
    mapRef.current = map;
    map.setMaxBounds(REGION_BOUNDS);

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("zoomend", () => setZoom(map.getZoom()));
    const enforceFullViewMinZoom = () => {
      const camera = map.cameraForBounds(REGION_BOUNDS, { padding: 14 });
      if (!camera || typeof camera.zoom !== "number") return;
      overviewZoomRef.current = camera.zoom;
      map.setMinZoom(overviewZoomRef.current);
      if (map.getZoom() < overviewZoomRef.current) {
        map.jumpTo({ zoom: overviewZoomRef.current });
      }
    };
    map.on("resize", enforceFullViewMinZoom);

    map.on("load", () => {
      map.addLayer({
        id: "base-street-lines",
        type: "line",
        source: "streets",
        "source-layer": "road",
        minzoom: STREET_DETAIL_ZOOM,
        paint: {
          "line-color": "rgba(233, 214, 182, 0.85)",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            STREET_DETAIL_ZOOM, 0.35,
            14.2, 0.8,
            16, 1.45,
          ],
          "line-opacity": [
            "interpolate", ["linear"], ["zoom"],
            STREET_DETAIL_ZOOM, 0,
            STREET_DETAIL_ZOOM + 0.45, 0.24,
            16, 0.46,
          ],
        },
      });

      map.addSource("hoods-all", {
        type: "geojson",
        data: "/nyc-neighborhoods.geojson",
      });

      const regionalFilter: mapboxgl.Expression = [
        "any",
        ["==", ["get", "boroname"], "Manhattan"],
        [
          "all",
          ["==", ["get", "boroname"], "Brooklyn"],
          ["in", ["get", "ntaname"], ["literal", BROOKLYN_NEAR_MANHATTAN_NTAS]],
        ],
      ];

      map.addLayer({
        id: "hoods-all-fill",
        type: "fill",
        source: "hoods-all",
        filter: regionalFilter,
        paint: {
          "fill-color": "rgba(140, 98, 255, 0.08)",
          "fill-opacity": 0,
        },
      });

      map.addLayer({
        id: "hoods-all-line-glow",
        type: "line",
        source: "hoods-all",
        filter: regionalFilter,
        paint: {
          "line-color": "rgba(240, 183, 93, 0.35)",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10.6, 1.5,
            13.2, 2.6,
            16, 4.2,
          ],
          "line-blur": 1.2,
          "line-opacity": 0.7,
        },
      });

      map.addLayer({
        id: "hoods-all-line-main",
        type: "line",
        source: "hoods-all",
        filter: regionalFilter,
        paint: {
          "line-color": "rgba(244, 194, 109, 0.55)",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10.6, 0.7,
            13.2, 1.2,
            16, 2,
          ],
          "line-opacity": 0.8,
        },
      });

      map.addLayer({
        id: "hoods-all-label",
        type: "symbol",
        source: "hoods-all",
        filter: [
          "all",
          regionalFilter,
          [
            "in",
            ["get", "ntaname"],
            ["literal", [
              "Washington Heights (North)",
              "Washington Heights (South)",
              "Harlem (North)",
              "Harlem (South)",
              "Upper West Side-Lincoln Square",
              "Upper West Side-Manhattan Valley",
              "Upper East Side-Lenox Hill-Roosevelt Island",
              "Upper East Side-Yorkville",
              "Chelsea-Hudson Yards",
              "Greenwich Village",
              "West Village",
              "East Village",
              "Lower East Side",
              "SoHo-Little Italy-Hudson Square",
              "Tribeca-Civic Center",
              "Financial District-Battery Park City",
              "Brooklyn Heights",
              "Downtown Brooklyn-DUMBO-Boerum Hill",
              "Williamsburg",
              "South Williamsburg",
              "Greenpoint",
            ]],
          ],
        ],
        layout: {
          "text-field": ["upcase", ["get", "ntaname"]],
          "text-size": [
            "interpolate", ["linear"], ["zoom"],
            10.6, 9,
            13.2, 11,
            16, 13,
          ],
          "text-letter-spacing": 0.08,
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "rgba(236, 187, 102, 0.56)",
          "text-halo-color": "rgba(35, 20, 66, 0.85)",
          "text-halo-width": 0.9,
          "text-opacity": 0,
        },
      });

      map.addSource("hoods", {
        type: "geojson",
        data: "/nyc-neighborhoods-filtered.geojson",
      });

      map.addLayer({
        id: "hoods-fill",
        type: "fill",
        source: "hoods",
        paint: {
          "fill-color": buildEntryColorMatch("rgba(125, 77, 255, 0.12)"),
          "fill-opacity": [
            "case",
            ["in", ["get", "slug"], ["literal", getColoredSlugs()]],
            [
              "interpolate", ["linear"], ["zoom"],
              10.6, 0.64,
              13.2, 0.54,
              16, 0.44,
            ],
            0,
          ],
        },
      });

      map.addSource("emotion-points", {
        type: "geojson",
        data: buildEmotionFieldGeoJSON(),
      });

      map.addLayer({
        id: "emotion-field",
        type: "circle",
        source: "emotion-points",
        paint: {
          "circle-color": ["coalesce", ["get", "color"], "#D8B26D"],
          "circle-radius": [
            "*",
            1.65,
            ["coalesce", ["get", "radiusBoost"], 1],
            [
              "interpolate", ["linear"], ["zoom"],
              10.6, 28,
              13.2, 44,
              16, 70,
            ],
          ],
          "circle-blur": ["coalesce", ["get", "blur"], 0.86],
          "circle-opacity": [
            "*",
            1.9,
            ["coalesce", ["get", "weight"], 1],
            [
              "interpolate", ["linear"], ["zoom"],
              10.6, 0.16,
              12.4, 0.24,
              16, 0.34,
            ],
          ],
        },
      });

      map.addLayer({
        id: "hoods-line-glow",
        type: "line",
        source: "hoods",
        paint: {
          "line-color": "rgba(246, 206, 118, 0.45)",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10.6, 2.4,
            13.2, 3.6,
            16, 5.2,
          ],
          "line-blur": 1.5,
          "line-opacity": 0.75,
        },
      });

      map.addLayer({
        id: "hoods-line-main",
        type: "line",
        source: "hoods",
        paint: {
          "line-color": buildEntryColorMatch("rgba(196, 144, 245, 0.58)"),
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10.6, 1.15,
            13.2, 1.9,
            16, 2.8,
          ],
          "line-opacity": [
            "case",
            ["in", ["get", "slug"], ["literal", getColoredSlugs()]],
            0.98,
            0.62,
          ],
        },
      });

      map.addLayer({
        id: "hoods-line-active",
        type: "line",
        source: "hoods",
        filter: ["==", ["get", "slug"], ""],
        paint: {
          "line-color": "rgba(255, 242, 184, 0.98)",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10.6, 1.6,
            13.2, 2.4,
            16, 3.3,
          ],
          "line-opacity": 1,
        },
      });

      map.addLayer({
        id: "hoods-label",
        type: "symbol",
        source: "hoods",
        layout: {
          "text-field": ["upcase", ["get", "name"]],
          "text-size": [
            "interpolate", ["linear"], ["zoom"],
            10.6, 10,
            13.2, 12,
            16, 15,
          ],
          "text-letter-spacing": 0.12,
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "rgba(240, 209, 127, 0.66)",
          "text-halo-color": "rgba(37, 22, 73, 0.85)",
          "text-halo-width": 1.1,
          "text-opacity": 0,
        },
      });

      map.fitBounds(REGION_BOUNDS, { padding: 14, duration: 0 });
      enforceFullViewMinZoom();
      requestAnimationFrame(enforceFullViewMinZoom);
      setZoom(map.getZoom());
      setMapReady(true);
    });

    return () => {
      clearMarkers();
      map.remove();
      mapRef.current = null;
    };
  }, [mapToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const emotionSource = map.getSource("emotion-points") as mapboxgl.GeoJSONSource | undefined;
    if (emotionSource) {
      emotionSource.setData(buildEmotionFieldGeoJSON());
    }
    if (map.getLayer("emotion-field")) {
      map.setPaintProperty("emotion-field", "circle-radius", [
        "*",
        1.65,
        ["coalesce", ["get", "radiusBoost"], 1],
        ["interpolate", ["linear"], ["zoom"], 10.6, 28, 13.2, 44, 16, 70],
      ]);
      map.setPaintProperty("emotion-field", "circle-opacity", [
        "*",
        1.9,
        ["coalesce", ["get", "weight"], 1],
        ["interpolate", ["linear"], ["zoom"], 10.6, 0.16, 12.4, 0.24, 16, 0.34],
      ]);
      map.setPaintProperty("emotion-field", "circle-blur", ["coalesce", ["get", "blur"], 0.86]);
    }
  }, [entryMetaBySlug, litIds, mapReady, photoPoints, representativePhotos]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer("hoods-fill")) {
      map.setPaintProperty("hoods-fill", "fill-color", buildEntryColorMatch("rgba(125, 77, 255, 0.12)"));
      map.setPaintProperty("hoods-fill", "fill-opacity", [
        "case",
        ["in", ["get", "slug"], ["literal", getColoredSlugs()]],
        [
          "interpolate", ["linear"], ["zoom"],
          10.6, 0.64,
          13.2, 0.54,
          16, 0.44,
        ],
        0,
      ]);
    }
    if (map.getLayer("hoods-line-main")) {
      map.setPaintProperty("hoods-line-main", "line-color", buildEntryColorMatch("rgba(196, 144, 245, 0.58)"));
      map.setPaintProperty("hoods-line-main", "line-opacity", [
        "case",
        ["in", ["get", "slug"], ["literal", getColoredSlugs()]],
        0.98,
        0.62,
      ]);
    }
    if (map.getLayer("hoods-line-active")) {
      map.setFilter("hoods-line-active", ["==", ["get", "slug"], activeId ?? ""]);
    }
  }, [activeId, entryMetaBySlug, litIds, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    clearMarkers();
    const MARKER_START_OFFSET = 0.45;
    const markerStartZoom = overviewZoomRef.current + MARKER_START_OFFSET;
    if (zoom < markerStartZoom) return;

    const showDetailedPins = zoom >= 13.2;
    if (!showDetailedPins) {
      representativePhotos.forEach(rep => {
        const meta = entryMetaBySlug?.[rep.hoodId];
        const pinColor = meta?.color || "#FFD700";
        const el = document.createElement("div");
        el.style.width = "30px";
        el.style.height = "30px";
        el.style.borderRadius = "8px";
        el.style.overflow = "hidden";
        el.style.border = activeId === rep.hoodId ? `1.8px solid ${pinColor}` : `1px solid ${pinColor}99`;
        el.style.boxShadow = `0 3px 10px rgba(0,0,0,0.35), 0 0 12px ${pinColor}70`;
        el.style.outline = `1px solid ${pinColor}66`;
        el.style.background = "rgba(9,7,16,0.9)";
        el.style.cursor = "pointer";
        el.innerHTML = `<img src="${rep.url}" alt="" style="width:100%;height:100%;object-fit:cover;" />`;
        el.onclick = () => onSelect(rep.hoodId);

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "atlas-pin-popup",
          offset: 14,
        }).setDOMContent(createPinPopup(meta, rep.url));

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([rep.lng, rep.lat])
          .setPopup(popup)
          .addTo(map);
        el.addEventListener("mouseenter", () => marker.getPopup()?.addTo(map));
        el.addEventListener("mouseleave", () => marker.getPopup()?.remove());
        markersRef.current.push(marker);
      });
      return;
    }

    photoPoints.forEach(point => {
      if (!litIds.includes(point.neighborhoodSlug)) return;
      const fallback = HOOD_CENTER_COORDS[point.neighborhoodSlug];
      if (!fallback && (point.lat === null || point.lng === null)) return;
      const lat = point.lat ?? fallback.lat;
      const lng = point.lng ?? fallback.lng;
      const meta = entryMetaBySlug?.[point.neighborhoodSlug];
      const pinColor = meta?.color || "#FFD700";
      const el = document.createElement("div");
      el.style.width = "15px";
      el.style.height = "15px";
      el.style.borderRadius = "999px";
      el.style.border = `1.5px solid ${pinColor}`;
      el.style.background = `${pinColor}44`;
      el.style.boxShadow = `0 0 0 4px ${pinColor}2F, 0 0 10px ${pinColor}7A`;
      el.style.cursor = "pointer";
      el.onclick = () => onSelect(point.neighborhoodSlug);

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        className: "atlas-pin-popup",
        offset: 12,
      }).setDOMContent(createPinPopup(meta, point.url));

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);
      el.addEventListener("mouseenter", () => marker.getPopup()?.addTo(map));
      el.addEventListener("mouseleave", () => marker.getPopup()?.remove());
      markersRef.current.push(marker);
    });
  }, [activeId, entryMetaBySlug, litIds, mapReady, onSelect, photoPoints, representativePhotos, zoom]);

  if (!mapToken) {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "rgba(8,6,16,0.7)", color: "rgba(225,211,246,0.8)",
        fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", letterSpacing: "0.02em",
      }}>
        Missing Mapbox token. Set `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`.
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      <div style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: [
          "radial-gradient(circle at 18% 18%, rgba(190,170,230,0.12), transparent 42%)",
          "radial-gradient(circle at 78% 72%, rgba(140,110,180,0.12), transparent 45%)",
        ].join(","),
        mixBlendMode: "screen",
      }} />
    </div>
  );
}


// ─────────────────────────────────────────────
//  AtlasPage
// ─────────────────────────────────────────────
export default function AtlasPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AtlasData | null>(null);
  const [photoPoints, setPhotoPoints] = useState<PhotoPoint[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lightboxHoodId, setLightboxHoodId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); return; }
    supabase
      .from('atlases')
      .select('id, created_at, neighborhood_data')
      .eq('id', id)
      .single()
      .then(({ data: row, error }) => {
        if (error || !row) { setNotFound(true); return; }
        const rawNeighborhoodData = (row.neighborhood_data ?? {}) as Record<string, unknown>;
        const meta = (rawNeighborhoodData.__meta ?? undefined) as AtlasData["meta"];
        const neighborhoods = Object.fromEntries(
          Object.entries(rawNeighborhoodData)
            .filter(([key]) => key !== "__meta")
            .map(([key, value]) => [key, normalizeNeighborhoodMemory(value as NeighborhoodMemory)]),
        ) as Record<string, NeighborhoodMemory>;
        setData({
          id: row.id,
          createdAt: new Date(row.created_at).getTime(),
          neighborhoods,
          meta,
        });
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("photos")
      .select("id, neighborhood_slug, storage_url, lat, lng")
      .eq("atlas_id", id)
      .then(({ data: rows, error }) => {
        if (error || !rows) return;
        setPhotoPoints(
          rows.map((row: {
            id: string;
            neighborhood_slug: string;
            storage_url: string;
            lat: number | null;
            lng: number | null;
          }) => ({
            id: row.id,
            neighborhoodSlug: row.neighborhood_slug,
            url: row.storage_url,
            lat: row.lat,
            lng: row.lng,
          })),
        );
      });
  }, [id]);

  if (notFound) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Cormorant Garamond', serif",
        background: "#fdf8f0",
      }}>
        <ShaderBackground />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(45,27,13,0.4)", marginBottom: "12px" }}>
            Map not found
          </p>
          <h2 style={{ fontSize: "2rem", fontWeight: 300, color: "#2D1B0D", marginBottom: "24px" }}>
            This atlas doesn't exist
          </h2>
          <button onClick={() => navigate("/")} style={{
            background: "none", border: "1px solid rgba(45,27,13,0.25)",
            borderRadius: "100px", padding: "8px 20px", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem",
            letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(45,27,13,0.6)",
          }}>← Go home</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Cormorant Garamond', serif",
        background: "#0c0a16",
      }}>
        <ShaderBackground />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <p style={{
            fontSize: "0.7rem", letterSpacing: "0.3em",
            textTransform: "uppercase", color: "rgba(196,174,244,0.45)", marginBottom: "12px",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Loading Atlas
          </p>
          <h2 style={{ fontSize: "2rem", fontWeight: 300, color: "#EDE8F8", marginBottom: "18px" }}>
            Fetching your map…
          </h2>
          <button onClick={() => navigate("/upload")} style={{
            background: "none", border: "1px solid rgba(196,174,244,0.35)",
            borderRadius: "100px", padding: "8px 20px", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem",
            letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(196,174,244,0.7)",
          }}>Back to try →</button>
        </div>
      </div>
    );
  }

  const mappedHoods = HOODS.filter(h => data.neighborhoods[h.id]);
  const litIds = mappedHoods.map(h => h.id);
  const selectableIds = HOODS.map(h => h.id);
  const totalPhotos = mappedHoods.reduce((sum, h) => sum + (data.neighborhoods[h.id]?.photoUrls?.length ?? 0), 0);
  const hasDriftMoments = mappedHoods.some((hood) => Boolean(data.neighborhoods[hood.id]?.isDriftEntry));
  const flattenedMoods = mappedHoods.flatMap((hood) => data.neighborhoods[hood.id]?.moods ?? []);
  const topMoods = getTopMoods(flattenedMoods, 2);
  const dominantMood = getDominantMood(flattenedMoods);
  const colorsFromEntries = mappedHoods.map((hood) => data.neighborhoods[hood.id]?.color || hood.accent);
  const dominantColor = getDominantColor(colorsFromEntries, dominantMood);
  const summaryText = generateSummary(topMoods, data.id);
  const creatorName = data.meta?.creatorName?.trim();
  const identityTitle = data.meta?.identity?.title || (creatorName ? `${creatorName}'s New York` : "Your New York");
  const identityNarrative = data.meta?.identity?.narrative || summaryText;
  const identityStyleJudgment = data.meta?.identity?.styleJudgment
    || `Your NYC leans ${(topMoods[0] ?? "calm").toLowerCase()}, ${(topMoods[1] ?? "nostalgic").toLowerCase()}, and cinematic.`;
  const customSubtitle = data.meta?.customSubtitle?.trim() || "";
  const moodLegend = (() => {
    const seen = new Set<string>();
    const rows: Array<{ mood: string; color: string }> = [];
    mappedHoods.forEach((hood) => {
      const mem = data.neighborhoods[hood.id];
      const moods = (mem?.moods ?? []).map(toTitleCaseMood).filter(Boolean);
      const color = mem?.color || hood.accent;
      moods.forEach((mood) => {
        const key = mood.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        rows.push({ mood, color });
      });
    });
    return rows;
  })();

  const shareUrl = `${window.location.origin}/atlas/${id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lightboxHood = lightboxHoodId ? HOODS.find(h => h.id === lightboxHoodId) : null;
  const lightboxPhotos = lightboxHoodId ? (data.neighborhoods[lightboxHoodId]?.photoUrls ?? []) : [];

  const representativePhotos = mappedHoods
    .map(hood => {
      const urlsFromRows = photoPoints.filter(p => p.neighborhoodSlug === hood.id).map(p => p.url);
      const urls = urlsFromRows.length > 0 ? urlsFromRows : (data.neighborhoods[hood.id]?.photoUrls ?? []);
      if (!urls.length) return null;
      const fallback = HOOD_CENTER_COORDS[hood.id];
      if (!fallback) return null;
      const index = Math.floor(seededFloat(`${data.id}-${hood.id}`) * urls.length) % urls.length;
      return { hoodId: hood.id, url: urls[index], lat: fallback.lat, lng: fallback.lng };
    })
    .filter((x): x is { hoodId: string; url: string; lat: number; lng: number } => Boolean(x));
  const entryMetaBySlug: Record<string, EntryMapMeta> = Object.fromEntries(
    mappedHoods.map((hood) => {
      const mem = data.neighborhoods[hood.id];
      const urlsFromRows = photoPoints.filter(p => p.neighborhoodSlug === hood.id).map(p => p.url);
      const previewUrl = urlsFromRows[0] || mem?.photoUrls?.[0];
      return [
        hood.id,
        {
          moods: mem?.moods ?? [],
          color: mem?.color ?? hood.accent,
          previewUrl,
        },
      ];
    }),
  );

  const emotionRegions = Object.entries(entryMetaBySlug).map(([slug, meta]) => ({
    neighborhood: HOODS.find(h => h.id === slug)?.name ?? slug,
    emotion: { color: meta.color ?? '#D8B26D', dim: (meta.color ?? '#D8B26D') + '59' },
  }));

  const handleHoodSelect = (id: string) => {
    setActiveId(prev => prev === id ? null : id);
    const mem = data.neighborhoods[id];
    if (mem?.photoUrls?.length) {
      setLightboxHoodId(id);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400&display=swap');
        @keyframes atlas-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes atlas-slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
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
        .mapboxgl-ctrl-group button {
          width: 34px !important;
          height: 34px !important;
          background: transparent !important;
        }
        .mapboxgl-ctrl-group button + button {
          border-top: 1px solid rgba(232, 212, 164, 0.25) !important;
        }
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
      `}</style>

      <ShaderBackground />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "58px", zIndex: 100,
        background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none",
        border: "none",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 36px",
      }}>
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem",
          fontStyle: "italic", color: "#ffffff", letterSpacing: "-0.01em", fontWeight: 400,
        }}>CityMood</button>
        <button onClick={() => navigate("/upload")} style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", letterSpacing: "0.08em",
          textTransform: "uppercase", color: "#ffffff",
          background: "transparent", border: "1.5px solid rgba(255,255,255,0.7)",
          borderRadius: "100px", padding: "6px 18px", cursor: "pointer", transition: "all 0.2s ease",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          Start your map →
        </button>
      </nav>

      {/* Main 3:7 layout */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", height: "100vh", paddingTop: "58px",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          width: "30%", flexShrink: 0,
          background: "transparent",
          overflowY: "auto", padding: "36px 28px",
          display: "flex", flexDirection: "column", gap: "0",
        }}>
          {/* Label */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem",
            letterSpacing: "0.15em", textTransform: "uppercase",
            color: "rgba(196,174,244,0.4)", marginBottom: "12px",
          }}>Your NYC Map</p>

          {/* Heading */}
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "4.5rem", fontWeight: 300,
            color: "#EDE8F8", letterSpacing: "-0.02em", lineHeight: 0.92,
            marginBottom: "10px",
          }}>{identityTitle.split(" ").slice(0, 2).join(" ")}<br /><em>{identityTitle.split(" ").slice(2).join(" ") || "In Color"}</em></h1>

          <div style={{ marginBottom: "14px" }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem",
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "rgba(196,174,244,0.45)", marginBottom: "6px",
            }}>
              Your NYC feels like
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "0.98rem",
              color: "rgba(210,188,245,0.62)",
              lineHeight: 1.55,
              marginBottom: "8px",
            }}>
              {identityNarrative}
            </p>
            {customSubtitle ? (
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "0.88rem",
                color: "rgba(196,174,244,0.52)",
                lineHeight: 1.45,
                marginBottom: "8px",
              }}>
                {customSubtitle}
              </p>
            ) : null}
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.68rem",
              color: "rgba(206,186,240,0.58)",
              letterSpacing: "0.04em",
              marginBottom: "4px",
            }}>
              {identityStyleJudgment}
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.68rem",
              color: "rgba(206,186,240,0.58)",
              letterSpacing: "0.04em",
              marginBottom: "4px",
            }}>
              Most common mood: {dominantMood ?? "Quiet"}
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.68rem",
              color: "rgba(206,186,240,0.58)",
              letterSpacing: "0.04em",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: dominantColor, boxShadow: `0 0 7px ${dominantColor}`,
                flexShrink: 0,
              }} />
              Dominant tone: {getColorToneLabel(dominantColor)}
            </p>
          </div>

          {/* Subtext */}
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: "1.1rem", color: "rgba(196,174,244,0.4)", lineHeight: 1.6, marginBottom: "20px",
          }}>
            {mappedHoods.length} neighborhood{mappedHoods.length !== 1 ? "s" : ""} · {totalPhotos} {totalPhotos === 1 ? "memory" : "memories"}
          </p>
          {hasDriftMoments && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.63rem",
              letterSpacing: "0.05em",
              color: "rgba(196,174,244,0.52)",
              marginBottom: "14px",
            }}>
              Some memories on this map were captured in drift mode.
            </p>
          )}

          {/* Divider */}
          <div style={{ height: "0.5px", background: "rgba(155,48,255,0.1)", marginBottom: "20px" }} />

          {/* Neighborhood list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0", marginBottom: "28px" }}>
            {mappedHoods.map((hood, i) => {
              const mem = data.neighborhoods[hood.id];
              const hasPhotos = (mem?.photoUrls?.length ?? 0) > 0;
              const isActive = activeId === hood.id;
              const moodTags = (mem?.moods ?? []).slice(0, 3);
              const moodColor = mem?.color || hood.accent;
              return (
                <div
                  key={hood.id}
                  style={{
                    borderBottom: "0.5px solid rgba(155,48,255,0.08)",
                    animation: `atlas-slideUp 0.3s ease ${i * 0.05}s both`,
                  }}
                >
                  <button
                    onClick={() => {
                      setActiveId(prev => prev === hood.id ? null : hood.id);
                      if (hasPhotos) setLightboxHoodId(hood.id);
                    }}
                    style={{
                      width: "100%", background: "none", border: "none",
                      cursor: hasPhotos ? "pointer" : "default",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "11px 0", transition: "opacity 0.2s", textAlign: "left",
                    }}
                    onMouseEnter={e => {
                      if (hasPhotos) {
                        const nameEl = e.currentTarget.querySelector<HTMLSpanElement>(".hood-name");
                        if (nameEl) nameEl.style.fontStyle = "italic";
                      }
                    }}
                    onMouseLeave={e => {
                      const nameEl = e.currentTarget.querySelector<HTMLSpanElement>(".hood-name");
                      if (nameEl) nameEl.style.fontStyle = "normal";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "5px", height: "5px", borderRadius: "50%",
                        background: moodColor, opacity: isActive ? 1 : 0.5,
                        boxShadow: isActive ? `0 0 8px ${moodColor}` : "none",
                        transition: "all 0.3s", flexShrink: 0,
                      }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span className="hood-name" style={{
                          fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontWeight: 400,
                          color: "rgba(237,232,248,0.8)", transition: "font-style 0.2s",
                        }}>{hood.name}</span>
                        {moodTags.length > 0 && (
                          <span style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.62rem",
                            letterSpacing: "0.04em",
                            color: "rgba(224,205,255,0.64)",
                            textTransform: "uppercase",
                          }}>
                            {moodTags.join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: "0.5px", background: "rgba(155,48,255,0.1)", marginBottom: "20px" }} />

          {/* Mood legend */}
          <div style={{ marginBottom: "22px" }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem",
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: "rgba(196,174,244,0.4)", marginBottom: "10px",
            }}>Mood</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {moodLegend.length > 0 ? moodLegend.map((row) => (
                <div key={row.mood.toLowerCase()} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                    background: row.color, boxShadow: `0 0 8px ${row.color}`,
                  }} />
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1rem",
                    color: "rgba(235,226,248,0.76)",
                    lineHeight: 1.2,
                  }}>{row.mood}</span>
                </div>
              )) : (
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "0.95rem",
                  color: "rgba(196,174,244,0.45)",
                }}>
                  No mood tags yet.
                </p>
              )}
            </div>
          </div>

          {/* Share section */}
          <div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem",
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: "rgba(196,174,244,0.4)", marginBottom: "10px",
            }}>Share your map</p>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <input
                readOnly
                value={shareUrl}
                style={{
                  flex: 1, background: "rgba(155,48,255,0.06)",
                  border: "0.5px solid rgba(155,48,255,0.15)",
                  borderRadius: "8px", padding: "8px 12px",
                  fontSize: "0.72rem", color: "rgba(196,174,244,0.6)",
                  fontFamily: "'DM Sans', sans-serif",
                  outline: "none", cursor: "text",
                }}
                onFocus={e => e.currentTarget.select()}
              />
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? "rgba(155,48,255,0.15)" : "transparent",
                  border: "0.5px solid rgba(155,48,255,0.25)",
                  borderRadius: "6px", padding: "8px 14px",
                  cursor: "pointer", whiteSpace: "nowrap",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem",
                  letterSpacing: "0.06em", color: copied ? "rgba(196,174,244,1)" : "rgba(196,174,244,0.6)",
                  transition: "all 0.2s", flexShrink: 0,
                }}
              >
                {copied ? "Copied ✓" : "Copy link"}
              </button>
            </div>

            <p style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
              fontSize: "0.85rem", color: "rgba(196,174,244,0.35)", lineHeight: 1.5,
            }}>
              Anyone with this link can view your map.
            </p>
          </div>
        </div>

        {/* ── RIGHT MAP PANEL ── */}
        <div style={{ width: "70%", flexShrink: 0, position: "relative", overflow: "hidden", background: "transparent" }}>
          <div style={{ position: "absolute", inset: 0, background: "transparent" }}>
            <AtlasStyledMap
              litIds={selectableIds}
              selectableIds={selectableIds}
              activeId={activeId}
              onSelect={handleHoodSelect}
              onBackgroundClick={() => setActiveId(null)}
              photoPoints={photoPoints}
              representativePhotos={representativePhotos}
              entryMetaBySlug={entryMetaBySlug}
              interactiveAreas
              lockOverviewMinZoom
              markerStartOffset={0.35}
              detailPinZoom={13.2}
              emotionRegions={emotionRegions}
            />
          </div>

          {/* Hint */}
          {litIds.length > 0 && !activeId && (
            <div style={{
              position: "absolute", bottom: "28px", left: "28px",
              fontFamily: "'DM Sans', sans-serif", fontSize: "7px",
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(140,165,210,0.3)",
              pointerEvents: "none",
            }}>
              Zoom in for pins · zoom out for cover photos
            </div>
          )}
        </div>
      </div>

      {/* Neighborhood Gallery */}
      {lightboxHood && lightboxPhotos.length > 0 && (
        <NeighborhoodGallery
          neighborhoodName={lightboxHood.name}
          borough={lightboxHood.borough}
          moodTag={lightboxHood.mood}
          photos={lightboxPhotos.map(url => ({ url }))}
          onBack={() => { setLightboxHoodId(null); setActiveId(null); }}
        />
      )}
    </>
  );
}
