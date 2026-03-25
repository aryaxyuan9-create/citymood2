import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ShaderBackground from "../components/home/ShaderBackground";

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
] as const;

type Slug = typeof HOODS[number]["slug"];

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

// ─────────────────────────────────────────────
//  Storage
// ─────────────────────────────────────────────
const DRAFT_KEY = "citymood-draft";

type MemoryStore = Record<string, { photoUrls: string[]; notes: string[] }>;

function loadDraft(): MemoryStore {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
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

  const manhattanOutline = `M 118.9 491.2 L 110.4 489.8 L 118.9 491.2 Z M 128.1 480.7 L 117.9 481.2 L 128.1 480.7 Z M 129.5 478.7 L 121.8 476.8 L 129.5 478.7 Z M 136.0 471.4 L 129.0 471.2 L 140.4 467.1 L 136.0 471.4 Z M 75.0 423.2 L 69.7 437.6 L 105.6 439.7 L 125.2 453.3 L 90.1 473.5 L 69.8 475.0 L 67.5 462.8 L 48.3 458.5 L 58.3 423.9 L 75.0 423.2 Z M 124.5 426.9 L 116.5 448.2 L 69.7 437.6 L 75.1 422.7 L 59.6 419.0 L 72.4 419.2 L 62.2 416.7 L 74.2 415.9 L 80.7 404.1 L 124.5 426.9 Z M 80.3 518.2 L 90.8 513.6 L 80.3 518.2 Z M 102.8 509.6 L 92.1 510.2 L 102.8 509.6 Z M 107.3 506.0 L 96.1 506.3 L 107.3 506.0 Z M 101.6 500.0 L 110.6 501.8 L 101.6 500.0 Z M -45.1 502.5 L -59.8 503.2 L -45.1 502.5 Z M 114.4 497.9 L 103.6 498.1 L 114.4 497.9 Z M 58.1 493.8 L 76.8 496.1 L 75.0 505.0 L 34.1 522.6 L 21.0 516.5 L 58.1 493.8 Z M 116.0 495.3 L 106.6 494.1 L 116.0 495.3 Z M -30.2 472.9 L -23.6 479.9 L -44.3 480.8 L -30.2 472.9 Z M 59.6 462.0 L 67.6 462.9 L 67.8 475.1 L 53.8 465.6 L 59.6 462.0 Z M 111.2 397.0 L 150.0 408.6 L 136.9 430.5 L 64.0 402.5 L 111.2 397.0 Z M 160.3 380.2 L 150.0 408.6 L 111.2 397.0 L 133.9 372.1 L 160.3 380.2 Z M 87.1 357.9 L 133.9 372.1 L 111.2 397.0 L 67.1 396.7 L 80.0 386.0 L 68.6 383.2 L 81.1 382.9 L 82.3 367.1 L 73.7 362.7 L 87.1 357.9 Z M 180.9 449.1 L 125.2 453.3 L 115.9 437.5 L 141.7 424.3 L 177.7 435.4 L 180.9 449.1 Z M 216.8 423.5 L 210.1 443.8 L 180.9 449.1 L 177.7 435.4 L 141.7 424.3 L 150.0 408.6 L 216.8 423.5 Z M 229.3 404.0 L 222.5 424.0 L 150.0 408.6 L 160.3 380.2 L 229.3 404.0 Z M 115.1 303.2 L 153.7 324.1 L 132.9 344.9 L 154.5 351.5 L 133.9 372.1 L 75.7 355.0 L 88.0 354.0 L 77.0 349.3 L 85.9 348.9 L 77.8 346.5 L 86.7 346.1 L 78.5 343.7 L 87.4 343.3 L 79.2 340.8 L 89.8 331.2 L 83.9 329.0 L 103.6 315.6 L 95.2 311.6 L 115.1 303.2 Z M 136.7 272.8 L 189.0 289.1 L 153.7 324.1 L 138.0 319.3 L 139.1 310.5 L 107.6 299.6 L 123.3 299.7 L 113.2 294.1 L 126.1 296.9 L 115.9 290.2 L 129.2 293.3 L 119.4 286.7 L 132.7 289.8 L 122.9 283.2 L 133.0 285.4 L 125.6 280.6 L 135.9 282.4 L 141.2 277.7 L 133.0 274.8 L 143.0 275.3 L 136.7 272.8 Z M 194.8 343.4 L 160.3 380.2 L 133.9 372.1 L 154.5 351.5 L 132.9 344.9 L 146.8 331.1 L 194.8 343.4 Z M 224.6 297.7 L 236.8 301.5 L 194.8 343.4 L 146.8 331.1 L 190.0 288.1 L 224.6 297.7 Z M 216.8 377.6 L 229.9 401.8 L 188.3 388.7 L 203.6 373.4 L 216.8 377.6 Z M 203.6 373.4 L 188.3 388.7 L 160.3 380.2 L 182.5 355.6 L 203.6 373.4 Z M 266.6 388.1 L 260.0 388.5 L 266.6 388.1 Z M 213.0 333.2 L 244.0 342.8 L 228.9 357.3 L 226.6 376.4 L 219.3 374.7 L 224.9 378.4 L 187.9 366.2 L 194.7 359.3 L 182.5 355.6 L 213.0 333.2 Z M 249.1 305.2 L 279.9 313.5 L 240.2 336.8 L 204.3 330.5 L 236.8 301.5 L 249.1 305.2 Z M 253.9 331.8 L 236.1 340.3 L 253.9 331.8 Z M 217.0 261.0 L 189.0 289.1 L 136.2 271.4 L 145.0 273.1 L 167.1 250.3 L 217.0 261.0 Z M 258.2 220.0 L 217.0 261.0 L 167.1 250.3 L 211.7 203.7 L 258.2 220.0 Z M 275.5 195.7 L 258.2 220.0 L 211.7 203.7 L 231.9 182.9 L 275.5 195.7 Z M 343.4 284.5 L 268.3 337.9 L 350.0 273.8 L 343.4 284.5 Z M 280.4 313.2 L 249.1 305.2 L 284.4 270.0 L 321.7 281.5 L 280.4 313.2 Z M 314.7 239.9 L 249.1 305.2 L 224.6 297.7 L 290.2 232.3 L 314.7 239.9 Z M 357.7 251.9 L 351.8 255.4 L 357.7 251.9 Z M 336.5 253.8 L 342.3 265.4 L 321.7 281.5 L 284.4 270.0 L 314.7 239.9 L 336.5 253.8 Z M 304.2 167.3 L 275.5 195.7 L 231.9 182.9 L 266.4 148.9 L 304.2 167.3 Z M 327.1 140.1 L 304.2 167.3 L 266.4 148.9 L 282.0 136.0 L 277.4 131.7 L 327.1 140.1 Z M 348.9 114.7 L 353.1 120.7 L 330.6 141.2 L 277.4 131.7 L 311.4 104.1 L 348.9 114.7 Z M 343.5 179.3 L 315.1 207.6 L 275.5 195.7 L 304.2 167.3 L 343.5 179.3 Z M 368.7 108.6 L 372.8 149.6 L 343.5 179.3 L 304.2 167.3 L 370.5 99.2 L 368.7 108.6 Z M 346.3 219.5 L 369.1 221.9 L 336.4 246.9 L 290.2 232.3 L 318.6 204.1 L 346.3 219.5 Z M 373.7 145.4 L 371.8 172.5 L 392.0 195.9 L 388.9 212.9 L 355.4 222.3 L 318.6 204.1 L 373.7 145.4 Z M 440.1 205.3 L 450.0 216.0 L 410.7 247.2 L 365.5 243.3 L 385.1 223.8 L 403.1 224.5 L 394.6 218.3 L 405.5 193.5 L 440.1 205.3 Z M 383.0 67.8 L 348.9 114.7 L 311.4 104.1 L 326.9 77.6 L 323.7 59.4 L 383.0 67.8 Z M 393.2 14.4 L 408.3 28.7 L 400.1 39.9 L 408.7 41.7 L 389.2 65.9 L 323.7 59.4 L 343.1 50.0 L 379.3 6.1 L 393.2 14.4 Z M 415.4 36.2 L 417.7 45.1 L 348.9 114.7 L 367.1 83.6 L 399.4 56.7 L 408.7 41.4 L 400.2 36.5 L 408.3 28.7 L 415.4 36.2 Z M 315.1 207.6 L 224.6 297.7 L 192.3 287.7 L 281.1 197.3 L 315.1 207.6 Z`;
  const brooklynOutline  = `M 380.2 397.5 L 318.2 424.4 L 315.7 413.1 L 268.0 403.9 L 265.3 382.1 L 299.9 367.6 L 380.2 397.5 Z M 281.2 407.9 L 315.7 413.1 L 322.8 424.1 L 298.9 436.5 L 314.6 436.5 L 311.3 460.2 L 238.8 455.8 L 236.4 444.2 L 266.1 405.9 L 281.2 407.9 Z M 311.3 460.2 L 342.9 473.4 L 263.3 480.8 L 242.2 456.5 L 311.3 460.2 Z M 410.9 436.4 L 423.5 446.3 L 403.2 459.7 L 342.9 473.4 L 311.3 460.2 L 314.6 436.5 L 298.9 436.5 L 380.2 397.5 L 409.2 421.3 L 375.8 445.0 L 386.9 451.3 L 381.3 440.5 L 395.0 428.1 L 410.7 426.5 L 410.9 436.4 Z M 151.0 503.9 L 115.3 496.4 L 140.7 466.7 L 156.6 473.5 L 156.2 496.0 L 164.0 497.2 L 151.0 503.9 Z M 201.6 458.9 L 201.2 493.4 L 184.6 503.2 L 205.3 517.1 L 199.5 523.8 L 145.0 512.8 L 164.0 497.2 L 141.8 463.6 L 201.6 458.9 Z M 263.3 480.8 L 238.4 486.2 L 241.1 525.1 L 184.6 503.2 L 201.2 493.4 L 195.9 480.2 L 263.3 480.8 Z M 269.0 529.4 L 241.1 525.1 L 238.4 486.2 L 270.1 480.0 L 278.5 522.3 L 269.0 529.4 Z M 227.2 450.3 L 263.3 480.8 L 195.9 480.2 L 202.4 458.6 L 213.4 462.3 L 214.3 476.6 L 233.1 475.4 L 225.3 467.8 L 238.0 473.9 L 218.3 458.6 L 231.9 459.2 L 227.2 450.3 Z M 334.5 535.5 L 269.0 529.4 L 278.5 522.3 L 270.1 480.0 L 333.5 474.2 L 349.0 531.0 L 334.5 535.5 Z M 396.7 495.4 L 433.8 510.7 L 440.4 534.6 L 334.5 535.5 L 349.0 531.0 L 333.5 474.2 L 396.7 495.4 Z M 459.0 471.3 L 396.7 495.4 L 342.9 473.4 L 419.2 449.4 L 459.0 471.3 Z M 497.2 498.6 L 482.2 511.8 L 487.1 532.8 L 396.7 495.4 L 459.0 471.3 L 497.2 498.6 Z M 151.0 503.9 L 145.0 512.8 L 199.5 523.8 L 149.4 570.7 L 127.4 553.0 L 95.7 569.3 L 103.8 556.3 L 78.0 571.9 L 53.8 569.8 L 48.3 553.8 L 59.1 572.3 L 82.5 560.9 L 62.2 555.4 L 72.5 549.1 L 59.8 550.3 L 64.9 545.4 L 50.3 552.1 L 48.5 531.6 L 73.1 520.6 L 72.3 529.5 L 115.7 496.0 L 151.0 503.9 Z M 221.8 522.2 L 212.5 536.0 L 240.7 549.1 L 199.3 582.5 L 153.4 567.3 L 205.3 517.1 L 221.8 522.2 Z M 197.4 582.8 L 219.4 591.0 L 230.8 618.4 L 196.9 621.1 L 191.2 599.1 L 149.4 570.7 L 197.4 582.8 Z M 149.4 570.7 L 170.4 584.9 L 140.3 586.9 L 60.4 642.7 L 41.6 646.0 L 41.5 637.1 L 27.7 646.4 L -2.0 630.7 L 22.7 623.9 L 10.0 616.9 L 29.2 620.8 L 22.7 610.8 L 34.9 610.4 L 25.3 606.1 L 41.0 611.3 L 31.3 605.2 L 53.9 602.4 L 46.5 595.7 L 58.5 598.8 L 49.2 593.2 L 64.6 594.4 L 55.4 587.5 L 62.7 583.9 L 108.6 579.8 L 94.8 572.4 L 118.7 577.6 L 110.8 568.1 L 127.4 553.0 L 149.4 570.7 Z M 271.4 549.7 L 240.1 550.3 L 212.5 536.0 L 221.8 522.2 L 269.0 529.4 L 262.0 543.0 L 271.4 549.7 Z M 334.5 535.5 L 419.5 538.9 L 415.9 566.3 L 269.0 554.6 L 273.8 544.9 L 262.0 543.0 L 269.0 529.4 L 334.5 535.5 Z M 410.2 568.1 L 393.2 573.5 L 394.6 562.0 L 410.2 568.1 Z M 269.0 554.6 L 394.6 562.0 L 385.7 575.9 L 270.5 576.9 L 269.0 554.6 Z M 487.1 532.8 L 502.3 539.2 L 415.9 566.3 L 420.1 533.8 L 440.4 534.6 L 433.8 510.7 L 487.1 532.8 Z M 499.2 571.2 L 507.1 593.1 L 469.9 607.8 L 409.7 568.3 L 489.3 543.1 L 499.2 571.2 Z M 469.9 607.8 L 426.6 628.2 L 422.9 603.6 L 385.7 575.9 L 429.8 574.3 L 469.9 607.8 Z M 251.0 551.2 L 264.3 553.8 L 267.0 600.1 L 230.8 618.4 L 219.4 591.0 L 197.1 583.1 L 234.5 551.0 L 251.0 551.2 Z`;
  const queensOutline    = `M 477.8 226.1 L 518.0 238.6 L 492.7 253.4 L 534.2 248.1 L 549.2 290.4 L 436.8 282.3 L 411.2 269.1 L 454.5 228.3 L 477.8 226.1 Z M 394.9 262.8 L 411.2 269.1 L 386.9 297.1 L 364.8 288.2 L 364.0 262.7 L 394.9 262.8 Z M 457.0 284.6 L 410.5 326.2 L 380.1 315.8 L 411.2 269.1 L 457.0 284.6 Z M 494.8 289.0 L 508.0 325.6 L 404.9 331.2 L 457.0 284.6 L 494.8 289.0 Z M 371.1 278.6 L 364.8 288.2 L 390.5 302.9 L 380.1 315.8 L 404.9 331.2 L 362.2 341.5 L 309.0 322.7 L 371.1 278.6 Z M 463.5 328.9 L 365.1 337.9 L 463.5 328.9 Z M 411.2 269.1 L 394.9 262.8 L 434.1 250.7 L 411.2 269.1 Z M 362.2 341.5 L 334.3 356.8 L 360.7 350.5 L 355.3 369.7 L 344.7 366.9 L 350.2 355.9 L 329.4 369.7 L 264.2 368.1 L 285.4 340.1 L 300.1 343.4 L 288.6 338.0 L 309.0 322.7 L 362.2 341.5 Z M 465.5 337.8 L 430.9 383.6 L 432.6 403.7 L 363.6 393.3 L 327.6 371.6 L 355.3 369.7 L 359.0 350.3 L 465.5 337.8 Z M 465.5 337.8 L 334.3 356.8 L 382.5 334.0 L 465.5 337.8 Z M 546.2 379.9 L 551.7 407.3 L 572.4 409.4 L 524.4 425.8 L 524.3 411.4 L 502.1 410.9 L 512.5 418.8 L 501.2 425.6 L 521.3 440.9 L 411.0 436.6 L 424.2 431.1 L 406.6 413.3 L 425.0 409.9 L 394.1 398.6 L 475.6 399.4 L 503.1 378.8 L 546.2 379.9 Z M 521.3 440.9 L 546.6 441.5 L 543.2 453.5 L 557.5 458.4 L 497.2 498.6 L 411.0 436.6 L 521.3 440.9 Z`;

  return (
    <>
    <svg
      viewBox="18 70 384 480"
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
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(180,130,60,0.15)" />
          <stop offset="100%" stopColor="rgba(160,110,50,0.2)" />
        </linearGradient>
        <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(210,160,80,0.35)" />
          <stop offset="100%" stopColor="rgba(190,140,65,0.35)" />
        </linearGradient>
      </defs>

      <rect width="402" height="550" fill="url(#waterGrad)" />
      <path d={queensOutline} fill="rgba(210,160,80,0.25)" stroke="rgba(180,130,60,0.2)" strokeWidth={0.5} />
      <path d={brooklynOutline} fill="url(#landGrad)" stroke="rgba(180,130,60,0.3)" strokeWidth={0.6} />
      <path d={brooklynOutline} fill="none" stroke="rgba(200,150,70,0.3)" strokeWidth={3} filter="url(#fShore)" />
      <path d={manhattanOutline} fill="url(#landGrad)" />
      <path d={manhattanOutline} fill="none" stroke="rgba(200,150,70,0.2)" strokeWidth={5} filter="url(#fShore)" />
      <path d={manhattanOutline} fill="none" stroke="rgba(180,130,60,0.5)" strokeWidth={0.85} />

      {HOODS.map(h => {
        const isActive = selectedSlug === h.slug;
        const isLit    = litSlugs.includes(h.slug);
        const isHov    = hovered === h.slug;
        const fill   = isActive ? "rgba(221,147,137,0.4)" : isLit ? "rgba(221,147,137,0.35)" : isHov ? "rgba(188,178,215,0.22)" : "rgba(188,178,215,0.12)";
        const stroke = isActive ? "rgba(200,120,115,0.85)" : isLit ? "#DD9389" : isHov ? "rgba(160,148,190,0.55)" : "rgba(160,148,190,0.3)";
        const sw     = isActive ? 1.8 : isLit ? 1.5 : isHov ? 1.2 : 0.8;
        return (
          <g key={h.slug}>
            <path d={h.path} fill={fill} style={{ transition: "fill 0.25s", pointerEvents: "none" }} />
            {isLit && (
              <path d={h.path} fill="none"
                stroke="rgba(240,180,80,0.4)"
                strokeWidth={4} filter="url(#fGlow)" style={{ pointerEvents: "none" }} />
            )}
            {isActive && <path d={h.path} fill={`url(#hatch-${h.slug})`} style={{ pointerEvents: "none" }} />}
            <path d={h.path} fill="none" stroke={stroke} strokeWidth={sw}
              style={{ cursor: "pointer", transition: "stroke 0.25s, stroke-width 0.25s" }}
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


      {/* Compass */}
      <g transform="translate(390,108)">
        <line x1={0} y1={-11} x2={0} y2={11} stroke="rgba(140,90,40,0.35)" strokeWidth={0.7} />
        <line x1={-11} y1={0} x2={11} y2={0} stroke="rgba(140,90,40,0.35)" strokeWidth={0.7} />
        <circle cx={0} cy={0} r={2} fill="none" stroke="rgba(140,90,40,0.35)" strokeWidth={0.5} />
        <text x={0} y={-14} textAnchor="middle" fill="rgba(140,90,40,0.4)" fontSize={5}
          fontFamily="'DM Sans', sans-serif" letterSpacing="0.1">N</text>
      </g>
    </svg>
    {hoverTip && (() => {
      const th = HOODS.find(n => n.slug === hoverTip.slug);
      if (!th) return null;
      const showLeft = hoverTip.x > window.innerWidth * 0.7;
      const showAbove = hoverTip.y > window.innerHeight * 0.75;
      return (
        <div key={th.slug} style={{
          position: "fixed",
          left: hoverTip.x + (showLeft ? -12 : 12),
          top: hoverTip.y + (showAbove ? -10 : 10),
          transform: `translate(${showLeft ? "-100%" : "0"}, ${showAbove ? "-100%" : "0"})`,
          background: "rgba(235,211,208,0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "0.5px solid rgba(180,140,130,0.2)",
          borderRadius: "10px",
          padding: "12px 16px",
          minWidth: "150px",
          pointerEvents: "none",
          zIndex: 20,
          animation: "tipFadeIn 0.2s ease",
        }}>
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(107,64,64,0.4)", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{th.borough}</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", color: "#5a3535", marginBottom: 3 }}>{th.name}</div>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(107,64,64,0.4)", fontFamily: "'DM Sans', sans-serif" }}>{th.mood}</div>
        </div>
      );
    })()}
    </>
  );
}

// ─────────────────────────────────────────────
//  TryPage
// ─────────────────────────────────────────────
const NAV_H = 52;

export default function TryPage() {
  const navigate = useNavigate();

  // ── State (per spec) ──
  const [memories, setMemories]             = useState<MemoryStore>(loadDraft);
  const [selectedSlug, setSelectedSlug]     = useState<string | null>(null);
  const [showPanel, setShowPanel]           = useState(false);
  const [showUpload, setShowUpload]         = useState(false);

  // Upload session state (reset per open)
  const [currentPhotos, setCurrentPhotos]   = useState<string[]>([]);
  const [currentNotes, setCurrentNotes]     = useState<string[]>([]);
  const [dragOver, setDragOver]             = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist memories on every change (skip photos — too large for sessionStorage)
  useEffect(() => {
    try {
      const slim = Object.fromEntries(
        Object.entries(memories).map(([slug, data]) => [slug, { photoUrls: [], notes: data.notes }])
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

  // ── Helpers ──
  const toBase64 = (file: File): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const base64s = await Promise.all(files.map(toBase64));
    setCurrentPhotos(prev => [...prev, ...base64s]);
    setCurrentNotes(prev => [...prev, ...files.map(() => "")]);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    const base64s = await Promise.all(files.map(toBase64));
    setCurrentPhotos(prev => [...prev, ...base64s]);
    setCurrentNotes(prev => [...prev, ...files.map(() => "")]);
  };

  const removePhoto = (i: number) => {
    setCurrentPhotos(prev => prev.filter((_, idx) => idx !== i));
    setCurrentNotes(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateNote = (i: number, val: string) => {
    setCurrentNotes(prev => { const n = [...prev]; n[i] = val; return n; });
  };

  const handleSaveAndAddAnother = () => {
    if (!selectedSlug) return;
    const updated: MemoryStore = {
      ...memories,
      [selectedSlug]: {
        photoUrls: [...(memories[selectedSlug]?.photoUrls ?? []), ...currentPhotos],
        notes:     [...(memories[selectedSlug]?.notes     ?? []), ...currentNotes],
      },
    };
    setMemories(updated);
    setCurrentPhotos([]);
    setCurrentNotes([]);
    setShowUpload(false);
    setShowPanel(false);
    setSelectedSlug(null);
  };

  const handleFinish = () => {
    const id = crypto.randomUUID();
    // Store in format AtlasPage expects
    const neighborhoods = Object.fromEntries(
      Object.entries(memories).map(([slug, data]) => [slug, {
        notes: data.notes,
        photoBase64s: data.photoUrls,
      }])
    );
    const payload = { id, createdAt: Date.now(), neighborhoods };
    try {
      localStorage.setItem(`citymood-map-${id}`, JSON.stringify(payload));
    } catch {
      const slim = {
        ...payload,
        neighborhoods: Object.fromEntries(
          Object.entries(neighborhoods).map(([k, v]) => [k, { ...v, photoBase64s: [] }])
        ),
      };
      localStorage.setItem(`citymood-map-${id}`, JSON.stringify(slim));
    }
    sessionStorage.removeItem(DRAFT_KEY);
    navigate(`/atlas/${id}`);
  };

  // Open upload overlay for a neighborhood (new or existing)
  const reopenUpload = (slug: string) => {
    setSelectedSlug(slug);
    setCurrentPhotos(memories[slug]?.photoUrls ?? []);
    setCurrentNotes(memories[slug]?.notes ?? []);
    setShowPanel(true);
    setShowUpload(true);
  };

  // Map block click
  const handleBlockClick = (slug: string) => {
    if (memories[slug]) {
      // Lit block → open upload directly
      reopenUpload(slug);
    } else {
      // Unlit block → show panel first
      setSelectedSlug(slug);
      setCurrentPhotos([]);
      setCurrentNotes([]);
      setShowPanel(true);
      setShowUpload(false);
    }
  };

  const handleMapBackgroundClick = () => {
    if (!showUpload) {
      setShowPanel(false);
      setSelectedSlug(null);
    }
  };

  const litSlugs = Object.keys(memories);
  const mappedCount = litSlugs.length;

  // ── Render ──
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        @keyframes tipFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* 1. Shader background */}
      <ShaderBackground />

      {/* 2. SVG map — always rendered, never unmounts */}
      <div style={{ position: "absolute", inset: 0, top: NAV_H, zIndex: 1 }}>
        <NycMap
          selectedSlug={showPanel || showUpload ? selectedSlug : null}
          litSlugs={litSlugs}
          onSelect={handleBlockClick}
          onBackgroundClick={handleMapBackgroundClick}
        />
      </div>

      {/* 3. Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: NAV_H,
        background: "rgba(235,211,208,0.75)", backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", zIndex: 100,
        borderBottom: "0.5px solid rgba(180,140,130,0.15)",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic",
            fontSize: "1.1rem", color: "#6b4040", textDecoration: "none",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            letterSpacing: "-0.02em",
          }}
        >CityMood</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {mappedCount > 0 && (
            <>
              <span style={{
                fontSize: "0.65rem", color: "rgba(107,64,64,0.6)",
                textTransform: "uppercase", letterSpacing: "0.08em",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {mappedCount} neighborhood{mappedCount !== 1 ? "s" : ""} mapped
              </span>
              <button
                onClick={handleFinish}
                style={{
                  fontSize: "0.65rem", color: "rgba(107,64,64,0.6)",
                  border: "0.5px solid rgba(107,64,64,0.2)", borderRadius: 100,
                  padding: "5px 14px", background: "transparent", cursor: "pointer",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  fontFamily: "'DM Sans', sans-serif", transition: "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(107,64,64,1)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(107,64,64,0.6)")}
              >View my atlas →</button>
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
          fontSize: "0.55rem", letterSpacing: "0.12em",
          textTransform: "uppercase", color: "rgba(107,64,64,0.4)", marginBottom: 8,
          fontFamily: "'DM Sans', sans-serif",
        }}>Build your map</div>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.6rem", color: "#5a3535", lineHeight: 1.1, marginBottom: 6,
        }}>Your New York City</div>
        <div style={{
          fontStyle: "italic", fontSize: "0.72rem", color: "rgba(107,64,64,0.5)",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>Select a neighborhood to add your memory</div>
      </div>

      {/* 5. Bottom-left mapped list */}
      {mappedCount > 0 && (
        <div style={{ position: "absolute", bottom: "2rem", left: "2rem", zIndex: 10 }}>
          <div style={{
            fontSize: "0.55rem", letterSpacing: "0.1em",
            textTransform: "uppercase", color: "rgba(107,64,64,0.4)", marginBottom: 8,
            fontFamily: "'DM Sans', sans-serif",
          }}>Mapped so far</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(memories).map(([slug, data]) => (
              <div
                key={slug}
                onClick={() => reopenUpload(slug)}
                style={{
                  background: "rgba(221,147,137,0.18)",
                  border: "0.5px solid rgba(221,147,137,0.35)",
                  borderRadius: 100, padding: "5px 14px", cursor: "pointer",
                  fontSize: "0.75rem", color: "#5a3535",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  transition: "background 0.18s", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(221,147,137,0.28)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(221,147,137,0.18)")}
              >
                {getNeighborhoodName(slug)} · {data.photoUrls.length} photo{data.photoUrls.length !== 1 ? "s" : ""}
              </div>
            ))}
          </div>
          <div
            onClick={handleFinish}
            style={{
              fontSize: "0.72rem", color: "#DD9389",
              cursor: "pointer", marginTop: 12,
              fontFamily: "'DM Sans', sans-serif",
              transition: "opacity 0.18s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.65")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Finish &amp; generate your map →
          </div>
        </div>
      )}

      {/* 6. Left slide-in panel — always in DOM, CSS controlled */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", top: NAV_H, left: 0, bottom: 0, width: 280,
          background: "rgba(235,211,208,0.88)", backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRight: "0.5px solid rgba(180,140,130,0.15)",
          zIndex: 50, padding: "28px 24px",
          display: "flex", flexDirection: "column", gap: 20,
          transform: showPanel ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s ease",
        }}
      >
        <div style={{ width: 28, height: 2, background: "#DD9389", flexShrink: 0 }} />

        <div>
          <div style={{
            fontSize: "0.55rem", letterSpacing: "0.1em",
            textTransform: "uppercase", color: "rgba(107,64,64,0.4)", marginBottom: 4,
            fontFamily: "'DM Sans', sans-serif",
          }}>{getBorough(selectedSlug)}</div>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem", color: "#5a3535", lineHeight: 1.1, marginBottom: 4,
          }}>{getNeighborhoodName(selectedSlug)}</div>
          <div style={{
            fontSize: "0.6rem", letterSpacing: "0.08em",
            textTransform: "uppercase", color: "rgba(107,64,64,0.4)",
            fontFamily: "'DM Sans', sans-serif",
          }}>{getMoodTag(selectedSlug)}</div>
        </div>

        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic",
          fontSize: "0.9rem", color: "rgba(107,64,64,0.6)", lineHeight: 1.6,
        }}>
          "What did {getNeighborhoodName(selectedSlug)} feel like to you?"
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => {
            setCurrentPhotos(memories[selectedSlug ?? ""]?.photoUrls ?? []);
            setCurrentNotes(memories[selectedSlug ?? ""]?.notes ?? []);
            setShowUpload(true);
          }}
          style={{
            width: "100%", height: 48,
            background: "rgba(221,147,137,0.85)", color: "#fff8f5",
            border: "none", borderRadius: 100, fontSize: "0.8rem",
            letterSpacing: "0.04em", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(221,147,137,1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(221,147,137,0.85)")}
        >Add a memory →</button>

        <div style={{
          fontSize: "0.55rem", textAlign: "center",
          color: "rgba(107,64,64,0.3)", letterSpacing: "0.08em",
          textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
        }}>ESC to close</div>
      </div>

      {/* 7. Upload overlay — always in DOM, CSS controlled */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(245,237,232,0.92)", backdropFilter: "blur(24px)",
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
              onClick={() => setShowUpload(false)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(107,64,64,0.6)", fontSize: "0.75rem",
                fontFamily: "'DM Sans', sans-serif", transition: "color 0.2s",
                letterSpacing: "0.04em",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(107,64,64,1)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(107,64,64,0.6)")}
            >← Back</button>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic",
              fontSize: "1rem", color: "#5a3535",
            }}>{getNeighborhoodName(selectedSlug)}</span>
            <span style={{
              fontSize: "0.7rem", color: "rgba(107,64,64,0.5)",
              fontFamily: "'DM Sans', sans-serif",
            }}>{currentPhotos.length} photo{currentPhotos.length !== 1 ? "s" : ""} added</span>
          </div>

          {/* Upload zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `1.5px dashed ${dragOver ? "rgba(221,147,137,0.6)" : "rgba(180,140,130,0.3)"}`,
              borderRadius: 14, minHeight: 160,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 10, cursor: "pointer",
              background: dragOver ? "rgba(221,147,137,0.05)" : "transparent",
              transition: "border-color 0.2s ease, background 0.2s ease",
            }}
          >
            <div style={{ fontSize: "1.8rem", color: "rgba(107,64,64,0.25)", lineHeight: 1 }}>+</div>
            <div style={{ fontSize: "0.78rem", color: "rgba(107,64,64,0.35)", fontFamily: "'DM Sans', sans-serif" }}>
              Drop photos here, or click to choose
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file" accept="image/*" multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {/* Photo grid */}
          {currentPhotos.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12, marginTop: 20,
            }}>
              {currentPhotos.map((url, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={url} alt="" style={{
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
                  <textarea
                    value={currentNotes[i] ?? ""}
                    onChange={e => updateNote(i, e.target.value)}
                    placeholder="The story behind this photo..."
                    maxLength={100}
                    rows={2}
                    style={{
                      width: "100%", marginTop: 6,
                      background: "rgba(107,64,64,0.04)",
                      border: "0.5px solid rgba(107,64,64,0.1)",
                      borderRadius: 6, padding: "6px 8px",
                      color: "rgba(107,64,64,0.75)",
                      fontSize: "0.72rem", resize: "none", outline: "none",
                      fontFamily: "Georgia, serif", fontStyle: "italic",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Bottom button */}
          <div style={{
            position: "sticky", bottom: 0,
            background: "rgba(245,237,232,0.98)",
            borderTop: "0.5px solid rgba(180,140,130,0.15)",
            padding: "16px 0", marginTop: 24,
          }}>
            <button
              onClick={handleSaveAndAddAnother}
              style={{
                width: "100%", height: 52,
                background: "#DD9389", color: "#fff8f5",
                border: "none", borderRadius: 100,
                fontSize: "0.85rem", letterSpacing: "0.06em", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(221,147,137,0.85)")}
              onMouseLeave={e => (e.currentTarget.style.background = "#DD9389")}
            >Save &amp; add another →</button>
          </div>
        </div>
      </div>

    </div>
  );
}
