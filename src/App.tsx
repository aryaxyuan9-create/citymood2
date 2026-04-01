import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import ShaderBackground from "./components/home/ShaderBackground";
import { getNeighborhoodPhotos } from "./lib/photos";
import { NEIGHBORHOOD_DATA } from "./lib/neighborhoods";
import NeighborhoodGallery from "./components/NeighborhoodGallery";
import AtlasStyledMap from "./components/AtlasStyledMap";
import TestAnalyze from "./components/TestAnalyze";

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────
type Phase = {
  label: string; tagline: string;
  glowColor: string; textColor: string; shadowColor: string;
};
type Hood = {
  id: string; name: string; borough: string; mood: string; energy: number;
  accent: string; glow: string;
  photos: { url: string; caption: string }[];
  path: string; labelX: number; labelY: number;
};

// ─────────────────────────────────────────────
//  Time helpers
// ─────────────────────────────────────────────
function getPhase(h: number, m: number): Phase {
  const t = h + m / 60;
  if (t < 5)  return { label:"Deep Night",  tagline:"the city holds its breath",     glowColor:"rgba(80,60,180,0.6)",   textColor:"rgba(210,200,255,0.95)", shadowColor:"rgba(60,40,140,0.5)"  };
  if (t < 7)  return { label:"Blue Hour",   tagline:"steel light before the sun",    glowColor:"rgba(60,120,220,0.6)",  textColor:"rgba(170,210,255,0.95)", shadowColor:"rgba(40,100,200,0.5)" };
  if (t < 9)  return { label:"Golden Hour", tagline:"amber spills over the borough", glowColor:"rgba(248,160,40,0.65)", textColor:"rgba(255,245,200,0.98)", shadowColor:"rgba(220,120,30,0.55)"};
  if (t < 15) return { label:"Midday",      tagline:"light without shadow",          glowColor:"rgba(120,190,250,0.55)",textColor:"rgba(15,50,110,0.95)",   shadowColor:"rgba(80,160,230,0.45)"};
  if (t < 19) return { label:"Golden Hour", tagline:"the last warmth before violet", glowColor:"rgba(240,130,50,0.65)", textColor:"rgba(255,238,190,0.98)", shadowColor:"rgba(210,100,30,0.55)"};
  if (t < 21) return { label:"Blue Hour",   tagline:"violet settles on the skyline", glowColor:"rgba(110,80,200,0.6)",  textColor:"rgba(190,180,255,0.95)", shadowColor:"rgba(80,60,170,0.5)"  };
  return       { label:"Deep Night",        tagline:"the city holds its breath",     glowColor:"rgba(70,50,160,0.6)",   textColor:"rgba(210,200,255,0.95)", shadowColor:"rgba(50,35,130,0.5)"  };
}
function fmt(h: number, m: number) { return `${h%12===0?12:h%12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; }
function pct(h: number, m: number) { return (h*60+m)/1440; }

// ─────────────────────────────────────────────
//  Neighborhood data
// ─────────────────────────────────────────────
const HOODS: Hood[] = [
  {
    id:"financial", name:"Financial District", borough:"Manhattan", mood:"Towering & silent", energy:6,
    accent:"#c8a96e", glow:"rgba(200,169,110,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1769983922875-763ad580a50c?w=800&q=80", caption:"Glass canyon, Wall St." },
      { url:"https://images.unsplash.com/photo-1678716192971-488d15fb7687?w=800&q=80", caption:"Night reflection, Broad St." },
    ],
    path:`M 118.9 491.2 L 110.4 489.8 L 112.8 487.2 L 120.9 489.3 L 118.9 491.2 Z M 128.1 480.7 L 126.2 483.2 L 117.9 481.2 L 120.0 478.8 L 128.1 480.7 Z M 129.5 478.7 L 121.8 476.8 L 123.9 474.5 L 131.4 476.4 L 129.5 478.7 Z M 136.0 471.4 L 134.5 472.9 L 129.0 471.2 L 136.4 466.0 L 140.4 467.1 L 136.0 471.4 Z M 140.7 466.7 L 139.2 466.3 L 141.7 466.3 L 140.7 466.7 Z M 141.8 464.4 L 140.8 464.8 L 141.8 464.4 Z M 75.0 423.2 L 69.7 437.6 L 90.1 444.0 L 105.6 439.7 L 105.1 441.7 L 125.2 453.3 L 117.4 456.4 L 118.1 457.6 L 116.5 458.3 L 119.6 460.4 L 116.4 461.9 L 112.1 460.1 L 114.4 462.3 L 112.6 462.4 L 109.2 459.8 L 107.3 460.7 L 111.9 463.7 L 106.4 461.1 L 96.8 465.2 L 101.7 468.3 L 101.0 468.6 L 96.1 465.5 L 86.5 470.0 L 88.8 472.2 L 93.0 471.7 L 89.4 472.8 L 90.1 473.5 L 89.1 473.8 L 85.4 470.3 L 79.3 471.4 L 80.7 474.8 L 79.5 472.9 L 77.2 473.2 L 77.6 474.1 L 75.9 473.5 L 76.4 475.3 L 74.7 473.7 L 73.9 475.1 L 72.0 474.0 L 72.2 476.0 L 71.4 474.0 L 69.8 475.0 L 70.3 472.8 L 67.3 472.2 L 69.7 472.4 L 68.7 471.1 L 69.2 468.7 L 67.0 466.7 L 67.5 462.8 L 58.6 462.1 L 53.6 464.4 L 54.0 463.6 L 50.9 463.1 L 55.4 462.5 L 50.0 462.3 L 48.3 458.5 L 49.1 456.1 L 51.3 456.2 L 52.7 453.7 L 50.1 453.1 L 54.3 439.9 L 54.1 441.2 L 58.6 441.8 L 59.8 438.3 L 55.0 437.8 L 54.4 439.2 L 58.3 423.9 L 71.6 424.7 L 72.3 422.5 L 75.0 423.2 Z`,
    labelX:78.4, labelY:458.9,
  },
  {
    id:"soho", name:"SoHo / Tribeca", borough:"Manhattan", mood:"Cast iron & quiet", energy:7,
    accent:"#a0b8d8", glow:"rgba(160,184,216,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1624198257029-ee188abe08a6?w=800&q=80", caption:"Cobblestone morning, SoHo." },
      { url:"https://images.unsplash.com/photo-1756294205737-ee8260c65715?w=800&q=80", caption:"Cast iron facade, Greene St." },
    ],
    path:`M 111.2 397.0 L 134.2 405.1 L 150.0 408.6 L 141.7 424.3 L 136.9 430.5 L 124.5 426.9 L 80.7 404.1 L 79.1 408.3 L 76.4 408.1 L 77.5 403.8 L 64.0 402.5 L 64.3 401.3 L 78.0 402.3 L 78.6 397.3 L 81.4 397.5 L 81.7 394.9 L 111.2 397.0 Z M 124.5 426.9 L 118.9 433.1 L 120.2 435.7 L 119.0 435.3 L 118.2 436.9 L 115.9 437.5 L 118.3 438.7 L 118.6 443.2 L 119.9 445.0 L 116.5 448.2 L 105.1 441.7 L 105.6 439.7 L 90.1 444.0 L 69.7 437.6 L 75.1 422.7 L 72.3 422.5 L 72.8 420.8 L 70.8 420.0 L 59.6 419.0 L 59.8 418.1 L 72.4 419.2 L 72.8 417.7 L 62.2 416.7 L 62.4 415.8 L 74.2 415.9 L 76.4 408.1 L 79.1 408.3 L 80.7 404.1 L 124.5 426.9 Z`,
    labelX:105.5, labelY:408.8,
  },
  {
    id:"westvillage", name:"West Village", borough:"Manhattan", mood:"Hushed & timeless", energy:5,
    accent:"#e8b4a0", glow:"rgba(232,180,160,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1610931002340-fe06e753976e?w=800&q=80", caption:"Evening glow, Bleecker St." },
      { url:"https://images.unsplash.com/photo-1766858771923-e3845a9ad796?w=800&q=80", caption:"Hudson River light." },
    ],
    path:`M 87.1 357.9 L 133.9 372.1 L 116.5 389.5 L 111.2 397.0 L 81.7 394.9 L 81.4 397.5 L 67.1 396.7 L 68.3 390.6 L 79.4 391.2 L 80.0 386.0 L 80.2 384.1 L 68.6 383.2 L 81.1 382.9 L 80.7 381.4 L 76.1 381.2 L 80.7 380.6 L 82.0 370.1 L 79.5 369.2 L 82.1 369.3 L 82.3 367.1 L 77.8 366.8 L 78.3 363.2 L 73.7 362.7 L 85.2 363.0 L 86.1 361.6 L 85.3 361.0 L 78.5 359.8 L 80.6 357.6 L 87.1 357.9 Z M 86.2 358.8 L 83.5 357.9 L 84.5 358.8 L 83.2 360.2 L 86.3 360.9 L 86.2 358.8 Z`,
    labelX:86.7, labelY:375,
  },
  {
    id:"eastvillage", name:"East Village", borough:"Manhattan", mood:"Restless & raw", energy:9,
    accent:"#c8a0d0", glow:"rgba(200,160,208,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1710161973220-b71c49465ad6?w=800&q=80", caption:"Mural at dusk, E. 9th." },
      { url:"https://images.unsplash.com/photo-1592693598252-dd5f93c112cc?w=800&q=80", caption:"Williamsburg border, Delancey." },
    ],
    path:`M 246.9 424.7 L 249.2 425.6 L 246.9 424.7 Z M 249.6 422.2 L 252.3 423.7 L 249.6 422.2 Z M 255.0 419.0 L 252.5 418.2 L 255.0 419.0 Z M 255.7 417.9 L 257.5 418.8 L 255.7 417.9 Z M 258.8 417.6 L 257.5 417.3 L 258.8 417.6 Z M 258.0 418.4 L 255.3 416.1 L 258.0 418.4 Z M 229.3 404.0 L 222.5 424.0 L 208.6 422.0 L 150.0 408.6 L 155.3 398.7 L 160.3 380.2 L 228.3 401.1 L 229.9 401.8 L 229.3 404.0 Z`,
    labelX:195.6, labelY:404.8,
  },
  {
    id:"greenwich-village", name:"Greenwich Village", borough:"Manhattan", mood:"Bohemian & alive", energy:8,
    accent:"#d4956e", glow:"rgba(212,149,110,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80", caption:"Washington Square arch, dusk." },
      { url:"https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80", caption:"MacDougal St. evening." },
    ],
    path:`M 160.3 380.2 L 155.3 398.7 L 150.0 408.6 L 134.2 405.1 L 111.2 397.0 L 116.5 389.5 L 133.9 372.1 L 160.3 380.2 Z`,
    labelX:140.4, labelY:392.4,
  },
  {
    id:"chelsea", name:"Chelsea", borough:"Manhattan", mood:"Industrial & luminous", energy:8,
    accent:"#90c8a8", glow:"rgba(144,200,168,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1766858771923-e3845a9ad796?w=800&q=80", caption:"High Line at golden hour." },
      { url:"https://images.unsplash.com/photo-1550837659-aafc79fba9c4?w=800&q=80", caption:"Gallery district, W. 25th." },
    ],
    path:`M 115.1 303.2 L 139.1 310.5 L 132.2 317.5 L 153.7 324.1 L 132.9 344.9 L 154.5 351.5 L 133.9 372.1 L 87.1 357.9 L 87.3 356.8 L 85.3 356.6 L 85.5 355.8 L 75.7 355.0 L 76.1 353.9 L 88.0 354.0 L 88.7 351.3 L 84.1 350.1 L 84.3 351.2 L 83.2 351.1 L 83.9 350.1 L 82.0 349.9 L 82.2 351.0 L 80.9 351.0 L 81.8 349.9 L 79.6 349.7 L 79.9 350.8 L 78.5 350.8 L 79.4 349.7 L 77.2 349.5 L 76.8 350.6 L 77.0 349.3 L 77.4 348.3 L 85.9 348.9 L 86.3 347.3 L 77.8 346.5 L 78.2 345.5 L 86.7 346.1 L 87.1 344.4 L 78.5 343.7 L 78.9 342.6 L 87.4 343.3 L 87.8 341.5 L 79.2 340.8 L 79.6 339.8 L 84.0 340.1 L 87.2 336.1 L 81.3 334.3 L 81.7 333.5 L 87.6 335.4 L 89.4 331.9 L 86.3 330.6 L 89.8 331.2 L 83.9 329.0 L 90.1 330.7 L 92.4 325.2 L 103.6 315.6 L 101.8 315.0 L 102.7 314.0 L 95.2 311.6 L 97.2 309.8 L 104.7 312.0 L 107.0 311.2 L 105.5 309.8 L 107.9 310.3 L 106.9 309.5 L 113.0 305.2 L 105.0 302.1 L 113.5 304.7 L 115.1 303.2 Z`,
    labelX:95.2, labelY:337.7,
  },
  {
    id:"midtown", name:"Midtown", borough:"Manhattan", mood:"Relentless & electric", energy:10,
    accent:"#f0a080", glow:"rgba(240,160,128,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1610931002340-fe06e753976e?w=800&q=80", caption:"5th Ave. at blue hour." },
      { url:"https://images.unsplash.com/photo-1553634825-800a3381acb4?w=800&q=80", caption:"Times Square long exposure." },
    ],
    path:`M 224.6 297.7 L 236.8 301.5 L 214.0 324.2 L 211.3 323.4 L 209.5 325.1 L 204.3 330.5 L 206.9 331.3 L 194.8 343.4 L 170.2 335.9 L 168.4 337.7 L 146.8 331.1 L 190.0 288.1 L 192.3 287.7 L 224.6 297.7 Z M 194.8 343.4 L 160.4 377.5 L 160.3 380.2 L 133.9 372.1 L 154.5 351.5 L 132.9 344.9 L 146.8 331.1 L 168.4 337.7 L 170.2 335.9 L 194.8 343.4 Z M 249.1 305.2 L 278.2 314.1 L 279.9 313.5 L 256.2 332.4 L 246.6 329.7 L 240.2 336.8 L 222.7 331.4 L 219.2 335.0 L 204.3 330.5 L 211.3 323.4 L 214.0 324.2 L 236.8 301.5 L 249.1 305.2 Z`,
    labelX:192.6, labelY:313.6,
  },
  {
    id:"upperwest", name:"Upper West Side", borough:"Manhattan", mood:"Cultural & unhurried", energy:6,
    accent:"#b8d0e8", glow:"rgba(184,208,232,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1706738715243-fe8a185e9c3d?w=800&q=80", caption:"Central Park West, dawn." },
      { url:"https://images.unsplash.com/photo-1616804634504-428979f23ecd?w=800&q=80", caption:"Riverside Drive, late afternoon." },
    ],
    path:`M 258.2 220.0 L 217.0 261.0 L 178.7 249.3 L 176.4 253.4 L 167.1 250.3 L 177.2 239.4 L 174.5 237.4 L 170.9 239.8 L 174.7 237.0 L 177.3 239.2 L 178.7 237.8 L 176.1 237.1 L 178.9 237.6 L 180.3 236.2 L 175.4 236.3 L 180.4 236.0 L 211.7 203.7 L 238.3 211.8 L 236.6 213.5 L 258.2 220.0 Z M 217.0 261.0 L 191.6 286.3 L 192.3 287.7 L 189.0 289.1 L 145.6 275.8 L 147.3 274.0 L 136.2 271.4 L 136.8 270.6 L 145.0 273.1 L 151.3 267.7 L 152.1 266.7 L 150.9 266.5 L 156.4 260.9 L 158.4 260.9 L 164.3 255.1 L 154.0 255.4 L 164.2 254.6 L 167.1 250.3 L 176.4 253.4 L 178.7 249.3 L 217.0 261.0 Z M 275.5 195.7 L 281.1 197.3 L 258.2 220.0 L 236.6 213.5 L 238.3 211.8 L 211.7 203.7 L 231.9 182.9 L 275.5 195.7 Z`,
    labelX:198.5, labelY:235,
  },
  {
    id:"harlem", name:"Harlem", borough:"Manhattan", mood:"Deep & resonant", energy:8,
    accent:"#d4a0a0", glow:"rgba(212,160,160,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1550837659-aafc79fba9c4?w=800&q=80", caption:"125th St. afternoon." },
      { url:"https://images.unsplash.com/photo-1715139718826-cee848eac7da?w=800&q=80", caption:"Brownstone facades, St. Nicholas." },
    ],
    path:`M 368.7 108.6 L 373.7 144.4 L 371.3 144.5 L 372.8 149.6 L 343.5 179.3 L 304.2 167.3 L 315.2 158.3 L 327.1 140.1 L 330.6 141.2 L 339.1 134.6 L 353.1 120.7 L 355.4 116.7 L 349.7 115.0 L 354.2 109.3 L 370.5 99.2 L 371.4 99.7 L 369.6 101.5 L 368.7 108.6 Z M 343.5 179.3 L 339.8 183.0 L 333.7 181.2 L 326.6 188.1 L 332.7 190.0 L 315.1 207.6 L 275.5 195.7 L 280.8 190.3 L 280.9 183.6 L 293.3 171.1 L 298.6 172.7 L 304.2 167.3 L 343.5 179.3 Z M 327.1 140.1 L 315.2 158.3 L 304.2 167.3 L 296.7 165.0 L 290.5 159.8 L 288.4 161.9 L 276.1 151.9 L 266.4 148.9 L 274.8 142.8 L 277.4 139.3 L 277.6 140.3 L 278.6 139.4 L 277.9 137.0 L 274.5 136.5 L 275.6 135.4 L 278.2 136.1 L 279.7 138.5 L 282.0 136.0 L 275.9 133.6 L 277.4 131.7 L 284.0 134.6 L 309.0 141.3 L 312.5 137.9 L 317.7 139.5 L 319.5 137.8 L 327.1 140.1 Z`,
    labelX:362.1, labelY:123.8,
  },
  {
    id:"gramercy", name:"Gramercy / Murray Hill", borough:"Manhattan", mood:"Quiet & composed", energy:5,
    accent:"#c8b890", glow:"rgba(200,184,144,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1550837659-aafc79fba9c4?w=800&q=80", caption:"Gramercy Park, dusk." },
      { url:"https://images.unsplash.com/photo-1616804634504-428979f23ecd?w=800&q=80", caption:"Lexington Ave. morning." },
    ],
    path:`M 203.6 373.4 L 188.3 388.7 L 160.3 380.2 L 160.4 377.5 L 182.5 355.6 L 194.7 359.3 L 187.9 366.2 L 205.4 371.6 L 203.6 373.4 Z`,
    labelX:183, labelY:374.7,
  },
  {
    id:"dumbo", name:"DUMBO", borough:"Brooklyn", mood:"Moody & vast", energy:7,
    accent:"#a8c0d8", glow:"rgba(168,192,216,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1597008234839-65e5543fc3cf?w=800&q=80", caption:"Bridge frame, Washington St." },
      { url:"https://images.unsplash.com/photo-1646611192164-8179c67987ea?w=800&q=80", caption:"Waterfront at dusk." },
    ],
    path:`M 201.6 458.9 L 197.0 467.0 L 197.9 469.5 L 194.6 470.2 L 196.5 473.4 L 196.1 482.4 L 197.5 490.0 L 201.2 493.4 L 188.5 493.0 L 188.4 494.8 L 191.3 494.8 L 190.2 499.4 L 192.7 503.2 L 184.6 503.2 L 194.8 506.2 L 205.3 517.1 L 199.5 523.8 L 166.5 514.4 L 163.3 518.0 L 145.0 512.8 L 151.0 503.9 L 158.1 505.4 L 162.9 500.3 L 164.0 497.2 L 156.2 496.0 L 158.3 492.4 L 155.1 484.8 L 154.5 480.1 L 156.6 473.5 L 150.0 469.7 L 140.7 466.7 L 142.2 465.9 L 140.9 465.3 L 141.8 463.6 L 151.9 462.4 L 152.9 464.1 L 156.3 464.2 L 159.1 461.7 L 166.4 462.8 L 166.5 461.4 L 167.7 461.2 L 173.2 461.6 L 173.5 460.6 L 184.9 459.8 L 194.5 460.5 L 194.5 459.0 L 201.6 458.9 Z`,
    labelX:174.4, labelY:481.2,
  },
  {
    id:"williamsburg", name:"Williamsburg", borough:"Brooklyn", mood:"Loud & searching", energy:9,
    accent:"#d8b8a0", glow:"rgba(216,184,160,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1616804634504-428979f23ecd?w=800&q=80", caption:"Rooftop view, Bedford Ave." },
      { url:"https://images.unsplash.com/photo-1592693598252-dd5f93c112cc?w=800&q=80", caption:"Street art, N 7th St." },
    ],
    path:`M 281.2 407.9 L 294.0 413.3 L 305.9 410.4 L 309.7 415.4 L 315.7 413.1 L 318.2 424.4 L 322.8 424.1 L 298.9 436.5 L 314.6 436.5 L 317.3 448.5 L 308.9 449.1 L 311.3 460.2 L 282.1 452.1 L 280.0 455.3 L 261.6 454.0 L 242.2 456.5 L 238.8 455.8 L 236.6 453.2 L 236.3 449.7 L 237.6 447.0 L 235.8 446.5 L 238.4 444.9 L 236.4 444.2 L 239.0 444.3 L 240.4 440.6 L 242.0 439.6 L 240.4 438.8 L 246.5 428.4 L 254.6 422.2 L 254.1 419.7 L 257.1 420.0 L 263.6 413.5 L 267.8 406.6 L 266.1 405.9 L 269.7 405.5 L 281.2 407.9 Z M 311.3 460.2 L 342.9 473.4 L 263.3 480.8 L 265.8 474.8 L 246.7 463.6 L 242.2 456.5 L 261.6 454.0 L 280.0 455.3 L 282.1 452.1 L 311.3 460.2 Z`,
    labelX:263.2, labelY:433.7,
  },
  {
    id:"washington-heights", name:"Washington Heights", borough:"Manhattan", mood:"Vibrant & uptown", energy:7,
    accent:"#c8a090", glow:"rgba(200,160,144,0.5)",
    photos:[],
    path:`M 311.4 104.1 L 326.9 77.6 L 323.7 59.4 L 379.3 6.1 L 393.2 14.4 L 415.4 36.2 L 383.0 67.8 L 348.9 114.7 L 311.4 104.1 Z`,
    labelX:355, labelY:82,
  },
  {
    id:"upper-east-side", name:"Upper East Side", borough:"Manhattan", mood:"Refined & composed", energy:6,
    accent:"#b8c8a8", glow:"rgba(184,200,168,0.5)",
    photos:[],
    path:`M 373.7 145.4 L 392.0 195.9 L 388.9 212.9 L 355.4 222.3 L 318.6 204.1 L 373.7 145.4 Z M 318.6 204.1 L 346.3 219.5 L 369.1 221.9 L 365.5 243.3 L 336.4 246.9 L 336.5 253.8 L 342.3 265.4 L 321.7 281.5 L 290.2 232.3 L 318.6 204.1 Z`,
    labelX:335, labelY:235,
  },
  {
    id:"central-park", name:"Central Park", borough:"Manhattan", mood:"Open & breathing", energy:4,
    accent:"#7aab7a", glow:"rgba(122,171,122,0.5)",
    photos:[],
    path:`M 315.1 207.6 L 224.6 297.7 L 192.3 287.7 L 281.1 197.3 L 315.1 207.6 Z`,
    labelX:253, labelY:248,
  },
  {
    id:"lower-east-side", name:"Lower East Side", borough:"Manhattan", mood:"Gritty & alive", energy:9,
    accent:"#e8a055", glow:"rgba(232,160,85,0.5)",
    photos:[],
    path:`M 229.3 404.0 L 265.3 382.1 L 268.0 403.9 L 266.1 405.9 L 242.2 456.5 L 222.5 424.0 L 229.3 404.0 Z`,
    labelX:248, labelY:420,
  },
];

// ─────────────────────────────────────────────
//  Pre-computed grid for the map
// ─────────────────────────────────────────────
const H_STEP = 13, V_STEP = 17;
const GRID_H: { y: number; major: boolean }[] = [];
for (let y = 58; y < 590; y += H_STEP)
  GRID_H.push({ y, major: Math.round((y - 58) / H_STEP) % 5 === 0 });

const GRID_V: { x: number; major: boolean }[] = [];
for (let x = 88; x < 462; x += V_STEP)
  GRID_V.push({ x, major: Math.round((x - 88) / V_STEP) % 4 === 0 });

const INTERSECTIONS: { x: number; y: number }[] = [];
for (const h of GRID_H.filter(l => l.major))
  for (const v of GRID_V.filter(l => l.major))
    INTERSECTIONS.push({ x: v.x, y: h.y });

// ─────────────────────────────────────────────
//  Ripple Canvas — interactive background
// ─────────────────────────────────────────────
function RippleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener("resize", resize);

    // — Particles —
    type Pt = { x: number; y: number; vx: number; vy: number; alpha: number; r: number };
    const pts: Pt[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      alpha: Math.random() * 0.22 + 0.05,
      r: Math.random() * 1.1 + 0.3,
    }));

    // — Ripples —
    type Rip = { x: number; y: number; radius: number; maxR: number; alpha: number; hue: number; speed: number };
    const rips: Rip[] = [];
    const HUES = [215, 245, 275, 195, 30];
    let lastRip = 0;

    const onMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastRip < 65 || rips.length >= 24) return;
      lastRip = now;
      rips.push({
        x: e.clientX, y: e.clientY, radius: 0,
        maxR: 65 + Math.random() * 55, alpha: 0.3,
        hue: HUES[Math.floor(Math.random() * HUES.length)],
        speed: 1.6 + Math.random() * 1.0,
      });
    };

    const onClick = (e: MouseEvent) => {
      for (let i = 0; i < 4; i++) {
        rips.push({
          x: e.clientX, y: e.clientY, radius: i * 14,
          maxR: 95 + i * 55, alpha: 0.48 - i * 0.07,
          hue: HUES[Math.floor(Math.random() * HUES.length)],
          speed: 2.2 + i * 0.45,
        });
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Particles + constellation lines
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;

        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = q.x - p.x, dy = q.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 95) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(130,165,215,${(1 - d / 95) * 0.1})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(155,185,230,${p.alpha})`;
        ctx.fill();
      }

      // Ripple rings
      for (let i = rips.length - 1; i >= 0; i--) {
        const rp = rips[i];
        rp.radius += rp.speed;
        rp.alpha -= 0.005;
        if (rp.alpha <= 0 || rp.radius >= rp.maxR) { rips.splice(i, 1); continue; }

        const a = rp.alpha * Math.max(0, 1 - rp.radius / rp.maxR);
        // Outer ring
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${rp.hue},65%,72%,${a})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();
        // Inner echo ring
        if (rp.radius > 10) {
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, rp.radius * 0.55, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${rp.hue},65%,72%,${a * 0.3})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}
    />
  );
}

// ─────────────────────────────────────────────
//  Photo density → glow intensity tiers
// ─────────────────────────────────────────────
function getHoodGlow(count: number): { stroke: string; sw: number; filter: string | undefined } {
  if (count <= 2) return { stroke: "#946C18", sw: 0.7, filter: undefined       };
  if (count <= 5) return { stroke: "#D2A941", sw: 1.2, filter: undefined       };
  return          { stroke: "#F0DC92",        sw: 1.8, filter: "url(#glow-md)" };
}

// ─────────────────────────────────────────────
//  Abstract NYC Map — line art style
// ─────────────────────────────────────────────
function NYCMap({ activeId, onSelect, onDeselect, onExplore, svgRef, zoomLevel }: {
  activeId: string | null;
  onSelect: (id: string, x: number, y: number) => void;
  onDeselect: () => void;
  onExplore: (id: string) => void;
  svgRef: React.RefObject<SVGSVGElement>;
  zoomLevel: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const mapScale = zoomLevel;
  const mapTranslateX = 210 * (1 - mapScale);
  const mapTranslateY = 310 * (1 - mapScale);
  const showCoverPhotos = zoomLevel >= 1.08 && zoomLevel < 1.36;
  const showDetailedPins = zoomLevel >= 1.36;
  const atlasLine = "rgba(244,194,109,0.58)";
  const atlasHover = "rgba(254,222,139,0.95)";
  const atlasActive = "rgba(255,242,184,0.98)";

  const manhattanOutline = `M 118.9 491.2 L 110.4 489.8 L 118.9 491.2 Z M 128.1 480.7 L 117.9 481.2 L 128.1 480.7 Z M 129.5 478.7 L 121.8 476.8 L 129.5 478.7 Z M 136.0 471.4 L 129.0 471.2 L 140.4 467.1 L 136.0 471.4 Z M 75.0 423.2 L 69.7 437.6 L 105.6 439.7 L 125.2 453.3 L 90.1 473.5 L 69.8 475.0 L 67.5 462.8 L 48.3 458.5 L 58.3 423.9 L 75.0 423.2 Z M 124.5 426.9 L 116.5 448.2 L 69.7 437.6 L 75.1 422.7 L 59.6 419.0 L 72.4 419.2 L 62.2 416.7 L 74.2 415.9 L 80.7 404.1 L 124.5 426.9 Z M 80.3 518.2 L 90.8 513.6 L 80.3 518.2 Z M 102.8 509.6 L 92.1 510.2 L 102.8 509.6 Z M 107.3 506.0 L 96.1 506.3 L 107.3 506.0 Z M 101.6 500.0 L 110.6 501.8 L 101.6 500.0 Z M -45.1 502.5 L -59.8 503.2 L -45.1 502.5 Z M 114.4 497.9 L 103.6 498.1 L 114.4 497.9 Z M 58.1 493.8 L 76.8 496.1 L 75.0 505.0 L 34.1 522.6 L 21.0 516.5 L 58.1 493.8 Z M 116.0 495.3 L 106.6 494.1 L 116.0 495.3 Z M -30.2 472.9 L -23.6 479.9 L -44.3 480.8 L -30.2 472.9 Z M 59.6 462.0 L 67.6 462.9 L 67.8 475.1 L 53.8 465.6 L 59.6 462.0 Z M 111.2 397.0 L 150.0 408.6 L 136.9 430.5 L 64.0 402.5 L 111.2 397.0 Z M 160.3 380.2 L 150.0 408.6 L 111.2 397.0 L 133.9 372.1 L 160.3 380.2 Z M 87.1 357.9 L 133.9 372.1 L 111.2 397.0 L 67.1 396.7 L 80.0 386.0 L 68.6 383.2 L 81.1 382.9 L 82.3 367.1 L 73.7 362.7 L 87.1 357.9 Z M 180.9 449.1 L 125.2 453.3 L 115.9 437.5 L 141.7 424.3 L 177.7 435.4 L 180.9 449.1 Z M 216.8 423.5 L 210.1 443.8 L 180.9 449.1 L 177.7 435.4 L 141.7 424.3 L 150.0 408.6 L 216.8 423.5 Z M 229.3 404.0 L 222.5 424.0 L 150.0 408.6 L 160.3 380.2 L 229.3 404.0 Z M 115.1 303.2 L 153.7 324.1 L 132.9 344.9 L 154.5 351.5 L 133.9 372.1 L 75.7 355.0 L 88.0 354.0 L 77.0 349.3 L 85.9 348.9 L 77.8 346.5 L 86.7 346.1 L 78.5 343.7 L 87.4 343.3 L 79.2 340.8 L 89.8 331.2 L 83.9 329.0 L 103.6 315.6 L 95.2 311.6 L 115.1 303.2 Z M 136.7 272.8 L 189.0 289.1 L 153.7 324.1 L 138.0 319.3 L 139.1 310.5 L 107.6 299.6 L 123.3 299.7 L 113.2 294.1 L 126.1 296.9 L 115.9 290.2 L 129.2 293.3 L 119.4 286.7 L 132.7 289.8 L 122.9 283.2 L 133.0 285.4 L 125.6 280.6 L 135.9 282.4 L 141.2 277.7 L 133.0 274.8 L 143.0 275.3 L 136.7 272.8 Z M 194.8 343.4 L 160.3 380.2 L 133.9 372.1 L 154.5 351.5 L 132.9 344.9 L 146.8 331.1 L 194.8 343.4 Z M 224.6 297.7 L 236.8 301.5 L 194.8 343.4 L 146.8 331.1 L 190.0 288.1 L 224.6 297.7 Z M 216.8 377.6 L 229.9 401.8 L 188.3 388.7 L 203.6 373.4 L 216.8 377.6 Z M 203.6 373.4 L 188.3 388.7 L 160.3 380.2 L 182.5 355.6 L 203.6 373.4 Z M 266.6 388.1 L 260.0 388.5 L 266.6 388.1 Z M 213.0 333.2 L 244.0 342.8 L 228.9 357.3 L 226.6 376.4 L 219.3 374.7 L 224.9 378.4 L 187.9 366.2 L 194.7 359.3 L 182.5 355.6 L 213.0 333.2 Z M 249.1 305.2 L 279.9 313.5 L 240.2 336.8 L 204.3 330.5 L 236.8 301.5 L 249.1 305.2 Z M 253.9 331.8 L 236.1 340.3 L 253.9 331.8 Z M 217.0 261.0 L 189.0 289.1 L 136.2 271.4 L 145.0 273.1 L 167.1 250.3 L 217.0 261.0 Z M 258.2 220.0 L 217.0 261.0 L 167.1 250.3 L 211.7 203.7 L 258.2 220.0 Z M 275.5 195.7 L 258.2 220.0 L 211.7 203.7 L 231.9 182.9 L 275.5 195.7 Z M 343.4 284.5 L 268.3 337.9 L 350.0 273.8 L 343.4 284.5 Z M 280.4 313.2 L 249.1 305.2 L 284.4 270.0 L 321.7 281.5 L 280.4 313.2 Z M 314.7 239.9 L 249.1 305.2 L 224.6 297.7 L 290.2 232.3 L 314.7 239.9 Z M 357.7 251.9 L 351.8 255.4 L 357.7 251.9 Z M 336.5 253.8 L 342.3 265.4 L 321.7 281.5 L 284.4 270.0 L 314.7 239.9 L 336.5 253.8 Z M 304.2 167.3 L 275.5 195.7 L 231.9 182.9 L 266.4 148.9 L 304.2 167.3 Z M 327.1 140.1 L 304.2 167.3 L 266.4 148.9 L 282.0 136.0 L 277.4 131.7 L 327.1 140.1 Z M 348.9 114.7 L 353.1 120.7 L 330.6 141.2 L 277.4 131.7 L 311.4 104.1 L 348.9 114.7 Z M 343.5 179.3 L 315.1 207.6 L 275.5 195.7 L 304.2 167.3 L 343.5 179.3 Z M 368.7 108.6 L 372.8 149.6 L 343.5 179.3 L 304.2 167.3 L 370.5 99.2 L 368.7 108.6 Z M 346.3 219.5 L 369.1 221.9 L 336.4 246.9 L 290.2 232.3 L 318.6 204.1 L 346.3 219.5 Z M 373.7 145.4 L 371.8 172.5 L 392.0 195.9 L 388.9 212.9 L 355.4 222.3 L 318.6 204.1 L 373.7 145.4 Z M 440.1 205.3 L 450.0 216.0 L 410.7 247.2 L 365.5 243.3 L 385.1 223.8 L 403.1 224.5 L 394.6 218.3 L 405.5 193.5 L 440.1 205.3 Z M 383.0 67.8 L 348.9 114.7 L 311.4 104.1 L 326.9 77.6 L 323.7 59.4 L 383.0 67.8 Z M 393.2 14.4 L 408.3 28.7 L 400.1 39.9 L 408.7 41.7 L 389.2 65.9 L 323.7 59.4 L 343.1 50.0 L 379.3 6.1 L 393.2 14.4 Z M 415.4 36.2 L 417.7 45.1 L 348.9 114.7 L 367.1 83.6 L 399.4 56.7 L 408.7 41.4 L 400.2 36.5 L 408.3 28.7 L 415.4 36.2 Z M 315.1 207.6 L 224.6 297.7 L 192.3 287.7 L 281.1 197.3 L 315.1 207.6 Z`;

  const brooklynOutline  = `M 380.2 397.5 L 318.2 424.4 L 315.7 413.1 L 268.0 403.9 L 265.3 382.1 L 299.9 367.6 L 380.2 397.5 Z M 281.2 407.9 L 315.7 413.1 L 322.8 424.1 L 298.9 436.5 L 314.6 436.5 L 311.3 460.2 L 238.8 455.8 L 236.4 444.2 L 266.1 405.9 L 281.2 407.9 Z M 311.3 460.2 L 342.9 473.4 L 263.3 480.8 L 242.2 456.5 L 311.3 460.2 Z M 410.9 436.4 L 423.5 446.3 L 403.2 459.7 L 342.9 473.4 L 311.3 460.2 L 314.6 436.5 L 298.9 436.5 L 380.2 397.5 L 409.2 421.3 L 375.8 445.0 L 386.9 451.3 L 381.3 440.5 L 395.0 428.1 L 410.7 426.5 L 410.9 436.4 Z M 151.0 503.9 L 115.3 496.4 L 140.7 466.7 L 156.6 473.5 L 156.2 496.0 L 164.0 497.2 L 151.0 503.9 Z M 201.6 458.9 L 201.2 493.4 L 184.6 503.2 L 205.3 517.1 L 199.5 523.8 L 145.0 512.8 L 164.0 497.2 L 141.8 463.6 L 201.6 458.9 Z M 263.3 480.8 L 238.4 486.2 L 241.1 525.1 L 184.6 503.2 L 201.2 493.4 L 195.9 480.2 L 263.3 480.8 Z M 269.0 529.4 L 241.1 525.1 L 238.4 486.2 L 270.1 480.0 L 278.5 522.3 L 269.0 529.4 Z M 227.2 450.3 L 263.3 480.8 L 195.9 480.2 L 202.4 458.6 L 213.4 462.3 L 214.3 476.6 L 233.1 475.4 L 225.3 467.8 L 238.0 473.9 L 218.3 458.6 L 231.9 459.2 L 227.2 450.3 Z M 334.5 535.5 L 269.0 529.4 L 278.5 522.3 L 270.1 480.0 L 333.5 474.2 L 349.0 531.0 L 334.5 535.5 Z M 396.7 495.4 L 433.8 510.7 L 440.4 534.6 L 334.5 535.5 L 349.0 531.0 L 333.5 474.2 L 396.7 495.4 Z M 459.0 471.3 L 396.7 495.4 L 342.9 473.4 L 419.2 449.4 L 459.0 471.3 Z M 497.2 498.6 L 482.2 511.8 L 487.1 532.8 L 396.7 495.4 L 459.0 471.3 L 497.2 498.6 Z M 151.0 503.9 L 145.0 512.8 L 199.5 523.8 L 149.4 570.7 L 127.4 553.0 L 95.7 569.3 L 103.8 556.3 L 78.0 571.9 L 53.8 569.8 L 48.3 553.8 L 59.1 572.3 L 82.5 560.9 L 62.2 555.4 L 72.5 549.1 L 59.8 550.3 L 64.9 545.4 L 50.3 552.1 L 48.5 531.6 L 73.1 520.6 L 72.3 529.5 L 115.7 496.0 L 151.0 503.9 Z M 221.8 522.2 L 212.5 536.0 L 240.7 549.1 L 199.3 582.5 L 153.4 567.3 L 205.3 517.1 L 221.8 522.2 Z M 197.4 582.8 L 219.4 591.0 L 230.8 618.4 L 196.9 621.1 L 191.2 599.1 L 149.4 570.7 L 197.4 582.8 Z M 149.4 570.7 L 170.4 584.9 L 140.3 586.9 L 60.4 642.7 L 41.6 646.0 L 41.5 637.1 L 27.7 646.4 L -2.0 630.7 L 22.7 623.9 L 10.0 616.9 L 29.2 620.8 L 22.7 610.8 L 34.9 610.4 L 25.3 606.1 L 41.0 611.3 L 31.3 605.2 L 53.9 602.4 L 46.5 595.7 L 58.5 598.8 L 49.2 593.2 L 64.6 594.4 L 55.4 587.5 L 62.7 583.9 L 108.6 579.8 L 94.8 572.4 L 118.7 577.6 L 110.8 568.1 L 127.4 553.0 L 149.4 570.7 Z M 271.4 549.7 L 240.1 550.3 L 212.5 536.0 L 221.8 522.2 L 269.0 529.4 L 262.0 543.0 L 271.4 549.7 Z M 334.5 535.5 L 419.5 538.9 L 415.9 566.3 L 269.0 554.6 L 273.8 544.9 L 262.0 543.0 L 269.0 529.4 L 334.5 535.5 Z M 410.2 568.1 L 393.2 573.5 L 394.6 562.0 L 410.2 568.1 Z M 269.0 554.6 L 394.6 562.0 L 385.7 575.9 L 270.5 576.9 L 269.0 554.6 Z M 487.1 532.8 L 502.3 539.2 L 415.9 566.3 L 420.1 533.8 L 440.4 534.6 L 433.8 510.7 L 487.1 532.8 Z M 499.2 571.2 L 507.1 593.1 L 469.9 607.8 L 409.7 568.3 L 489.3 543.1 L 499.2 571.2 Z M 469.9 607.8 L 426.6 628.2 L 422.9 603.6 L 385.7 575.9 L 429.8 574.3 L 469.9 607.8 Z M 251.0 551.2 L 264.3 553.8 L 267.0 600.1 L 230.8 618.4 L 219.4 591.0 L 197.1 583.1 L 234.5 551.0 L 251.0 551.2 Z`;

  const queensOutline    = `M 477.8 226.1 L 518.0 238.6 L 492.7 253.4 L 534.2 248.1 L 549.2 290.4 L 436.8 282.3 L 411.2 269.1 L 454.5 228.3 L 477.8 226.1 Z M 394.9 262.8 L 411.2 269.1 L 386.9 297.1 L 364.8 288.2 L 364.0 262.7 L 394.9 262.8 Z M 457.0 284.6 L 410.5 326.2 L 380.1 315.8 L 411.2 269.1 L 457.0 284.6 Z M 494.8 289.0 L 508.0 325.6 L 404.9 331.2 L 457.0 284.6 L 494.8 289.0 Z M 371.1 278.6 L 364.8 288.2 L 390.5 302.9 L 380.1 315.8 L 404.9 331.2 L 362.2 341.5 L 309.0 322.7 L 371.1 278.6 Z M 463.5 328.9 L 365.1 337.9 L 463.5 328.9 Z M 411.2 269.1 L 394.9 262.8 L 434.1 250.7 L 411.2 269.1 Z M 362.2 341.5 L 334.3 356.8 L 360.7 350.5 L 355.3 369.7 L 344.7 366.9 L 350.2 355.9 L 329.4 369.7 L 264.2 368.1 L 285.4 340.1 L 300.1 343.4 L 288.6 338.0 L 309.0 322.7 L 362.2 341.5 Z M 465.5 337.8 L 430.9 383.6 L 432.6 403.7 L 363.6 393.3 L 327.6 371.6 L 355.3 369.7 L 359.0 350.3 L 465.5 337.8 Z M 465.5 337.8 L 334.3 356.8 L 382.5 334.0 L 465.5 337.8 Z M 546.2 379.9 L 551.7 407.3 L 572.4 409.4 L 524.4 425.8 L 524.3 411.4 L 502.1 410.9 L 512.5 418.8 L 501.2 425.6 L 521.3 440.9 L 411.0 436.6 L 424.2 431.1 L 406.6 413.3 L 425.0 409.9 L 394.1 398.6 L 475.6 399.4 L 503.1 378.8 L 546.2 379.9 Z M 521.3 440.9 L 546.6 441.5 L 543.2 453.5 L 557.5 458.4 L 497.2 498.6 L 411.0 436.6 L 521.3 440.9 Z`;

  return (
    <>
    <svg ref={svgRef} viewBox="18 70 384 480" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block" }} onClick={onDeselect}>
      <defs>
        {/* Hatching patterns per neighborhood */}
        {HOODS.map(hood => (
          <pattern key={`pat-${hood.id}`} id={`hatch-${hood.id}`}
            x="0" y="0" width="9" height="9"
            patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="9"
              stroke={hood.accent} strokeWidth="0.6" opacity="0.28" />
          </pattern>
        ))}

        {/* Filters */}
        <filter id="fGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="fOuterGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="fShoreGlow" x="-20%" y="-20%" width="140%" height="140%">
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
        <filter id="glow1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow3" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="20"/>
        </filter>
        <filter id="fPhotoGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Neighborhood glow tiers */}
        <filter id="glow-sm" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-md" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-lg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-xl" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10"/>
        </filter>
        <filter id="glow-hover" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Water gradient */}
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgb(160,115,55)" stopOpacity={0.22} />
          <stop offset="100%" stopColor="rgb(140,95,42)" stopOpacity={0.32} />
        </linearGradient>
        <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(210,160,80)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="rgb(190,140,65)" stopOpacity={0.35} />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.7; }
        }
        @keyframes shimmerSlow {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.4; }
        }
        @keyframes shimmerFast {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }
        .glow-inner {
          animation: shimmerFast 2.5s ease-in-out infinite;
          fill: none;
          stroke: rgba(155,48,255,0.9);
          stroke-width: 1.5;
          pointer-events: none;
          filter: url(#glow1);
        }
        .glow-mid {
          animation: shimmer 3.5s ease-in-out infinite;
          fill: none;
          stroke: rgba(155,48,255,0.55);
          stroke-width: 3;
          pointer-events: none;
          filter: url(#glow2);
        }
        .glow-outer {
          animation: shimmerSlow 5s ease-in-out infinite reverse;
          fill: none;
          stroke: rgba(155,48,255,0.35);
          stroke-width: 8;
          pointer-events: none;
          filter: url(#glow3);
        }
        @keyframes hoodPulse {
          0%, 100% { stroke-opacity: 0.6; }
          50%      { stroke-opacity: 1; }
        }
        .hood-selected { animation: hoodPulse 1.5s ease-in-out infinite; }

        .city-block { animation: none; }
      `}</style>

      <g transform={`translate(${mapTranslateX} ${mapTranslateY}) scale(${mapScale})`}>
      {/* ── Water background ── */}
      <rect width="402" height="550" fill="none" />

      {/* ── NYC outer boundary glow (behind all elements) ── */}
      <path d={manhattanOutline} className="glow-outer" />
      <path d={brooklynOutline} className="glow-outer" />
      <path d={manhattanOutline} className="glow-mid" style={{ animationDelay: "0.8s" }} />
      <path d={brooklynOutline} className="glow-mid" style={{ animationDelay: "0.8s" }} />
      <path d={manhattanOutline} className="glow-inner" style={{ animationDelay: "1.6s" }} />
      <path d={brooklynOutline} className="glow-inner" style={{ animationDelay: "1.6s" }} />

      {/* Water scan lines — hidden */}
      {[...Array(20)].map((_, i) => (
        <line key={`wl${i}`} x1={0} y1={i * 31 + 6} x2={480} y2={i * 31 + 6}
          stroke="transparent" strokeWidth={0.6} />
      ))}

      {/* ── Queens (bg land) ── */}
      <path d={queensOutline} fill="none"
        stroke="rgba(244,194,109,0.28)" strokeWidth={0.45} />

      {/* ── Brooklyn land ── */}
      <path d={brooklynOutline} fill="none"
        stroke="rgba(244,194,109,0.34)" strokeWidth={0.55} />
      {/* Brooklyn shoreline glow */}
      <path d={brooklynOutline} fill="none"
        stroke="rgba(240,183,93,0.32)" strokeWidth={3}
        filter="url(#fShoreGlow)" />

      {/* ── Manhattan land ── */}
      <path d={manhattanOutline} fill="none" />

      {/* ── Manhattan shoreline — double stroke ── */}
      {/* Outer glow */}
      <path d={manhattanOutline} fill="none"
        stroke="rgba(240,183,93,0.3)" strokeWidth={5}
        filter="url(#fShoreGlow)" />
      {/* Precise inner line */}
      <path d={manhattanOutline} fill="none"
        stroke="rgba(244,194,109,0.52)" strokeWidth={0.75} />

      {/* ── Neighborhood zones — city glow ── */}
      {HOODS.map((hood) => {
        const isActive  = activeId  === hood.id;
        const isHovered = hovered   === hood.id;

        // Central Park: non-clickable dashed outline, no label
        if (hood.id === 'central-park') {
          return (
            <path key={hood.id}
              d={hood.path} fill="none"
              stroke="rgba(155,48,255,0.4)" strokeWidth={0.6}
              strokeDasharray="4,3" pointerEvents="none" />
          );
        }

        return (
          <g key={hood.id}>
            {/* Primary stroke — cityGlow pulse when default, static pale cream when hover/active */}
            <path d={hood.path} fill="none"
              className={(!isActive && !isHovered) ? "city-block" : undefined}
              filter={isActive ? "url(#glow-lg)" : isHovered ? "url(#glow-md)" : undefined}
              style={{
                stroke: isActive ? atlasActive : isHovered ? atlasHover : atlasLine,
                strokeWidth: isActive ? 2.2 : isHovered ? 1.8 : 1.2,
                animation: (isActive || isHovered) ? "none" : undefined,
                cursor: "pointer",
                transition: "stroke 0.25s, stroke-width 0.25s",
              }}
              onMouseEnter={() => setHovered(hood.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={e => { e.stopPropagation(); onSelect(hood.id, e.clientX, e.clientY); }} />
            {/* Fat invisible hit target */}
            <path d={hood.path} fill="transparent" stroke="transparent" strokeWidth={10}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(hood.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={e => { e.stopPropagation(); onSelect(hood.id, e.clientX, e.clientY); }} />
            {/* Labels hidden to match atlas visual language */}
          </g>
        );
      })}

      {showCoverPhotos && HOODS.map((hood) => {
        const photos = getNeighborhoodPhotos(hood.id);
        if (!photos.length || hood.id === "central-park") return null;
        const url = photos[0];
        return (
          <g key={`cover-${hood.id}`} pointerEvents="none">
            <rect
              x={hood.labelX - 6.5}
              y={hood.labelY - 6.5}
              width={13}
              height={13}
              rx={3}
              fill="rgba(10,8,20,0.85)"
              stroke="rgba(255,230,180,0.85)"
              strokeWidth={0.9}
            />
            <image
              href={url}
              x={hood.labelX - 5.8}
              y={hood.labelY - 5.8}
              width={11.6}
              height={11.6}
              preserveAspectRatio="xMidYMid slice"
              style={{ filter: "url(#fPhotoGlow)" }}
            />
          </g>
        );
      })}

      {showDetailedPins && HOODS.map((hood) => {
        const photos = getNeighborhoodPhotos(hood.id);
        if (!photos.length || hood.id === "central-park") return null;
        const pinCount = Math.min(photos.length, 6);
        return (
          <g key={`pins-${hood.id}`} pointerEvents="none">
            {Array.from({ length: pinCount }).map((_, idx) => {
              const angle = (idx / Math.max(pinCount, 1)) * Math.PI * 2;
              const radius = 6 + (idx % 2) * 4;
              const px = hood.labelX + Math.cos(angle) * radius;
              const py = hood.labelY + Math.sin(angle) * radius;
              return (
                <g key={`${hood.id}-pin-${idx}`}>
                  <circle cx={px} cy={py} r={3.8} fill="rgba(12,8,24,0.82)" />
                  <circle cx={px} cy={py} r={2.7} fill="rgba(255,215,120,0.9)" />
                  <circle cx={px} cy={py} r={1.3} fill="#fff5da" />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* ── Water labels — hidden ── */}
      <text x={60} y={330} fill="transparent" fontSize={6.5}
        fontFamily="'DM Sans', sans-serif" letterSpacing="0.2"
        transform="rotate(-90,60,330)">HUDSON RIVER</text>
      <text x={428} y={260} fill="transparent" fontSize={6.5}
        fontFamily="'DM Sans', sans-serif" letterSpacing="0.2"
        transform="rotate(90,428,260)">EAST RIVER</text>
      <text x={270} y={570} fill="transparent" fontSize={6}
        fontFamily="'DM Sans', sans-serif" letterSpacing="0.2" textAnchor="middle">
        UPPER NEW YORK BAY
      </text>
      </g>

      {/* Compass + scale hidden to match atlas visual language */}
    </svg>
    </>
  );
}

// ─────────────────────────────────────────────
//  Light Tracker Widget
// ─────────────────────────────────────────────
function LightTracker({ phase, prog, hour, minute }: { phase: Phase; prog: number; hour: number; minute: number }) {
  return (
    <div style={{
      borderRadius: "10px", overflow: "hidden",
      border: "0.5px solid rgba(180,140,130,0.2)",
      background: "rgba(235,211,208,0.55)", backdropFilter: "blur(12px)",
      boxShadow: `0 0 0 1px rgba(180,140,130,0.08), 0 6px 28px rgba(107,64,64,0.08)`,
      transition: "box-shadow 2.5s ease",
    }}>
      {/* Sky bar */}
      <div style={{ position: "relative", height: "136px", overflow: "hidden" }}>
        <div className="lt-sky" style={{ position: "absolute", inset: 0 }} />
        <div className="lt-glow" style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 70% 70% at 50% 60%, ${phase.glowColor} 0%, transparent 70%)`,
          transition: "background 3s ease",
        }} />
        <div className="lt-horizon" style={{
          position: "absolute", bottom: "30px", left: "10%", right: "10%", height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6) 25%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 75%, transparent)",
        }} />
        {/* Text */}
        <div className="lt-text" style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "4px",
        }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300,
            color: phase.textColor, letterSpacing: "-0.01em", lineHeight: 1.1,
            transition: "color 2s ease",
          }}>{phase.label}</span>
          <span style={{
            fontFamily: "'DM Serif Text', serif", fontSize: "0.625rem", fontWeight: 400, fontStyle: "italic",
            color: phase.textColor, opacity: 0.72, letterSpacing: "0.04em",
            transition: "color 2s ease",
          }}>{phase.tagline}</span>
        </div>
        {/* Time badge */}
        <div style={{
          position: "absolute", top: "10px", right: "12px",
          background: "rgba(235,211,208,0.65)", backdropFilter: "blur(6px)",
          borderRadius: "3px", padding: "2px 8px",
          border: "0.5px solid rgba(180,140,130,0.2)",
        }}>
          <span style={{
            fontFamily: "'DM Serif Text', serif", fontSize: "0.625rem",
            letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(107,64,64,0.7)",
            fontWeight: 400,
          }}>{fmt(hour, minute)}</span>
        </div>
        {/* NYC badge */}
        <div style={{
          position: "absolute", top: "10px", left: "12px",
          background: "rgba(235,211,208,0.65)", backdropFilter: "blur(6px)",
          borderRadius: "3px", padding: "2px 8px",
          border: "0.5px solid rgba(180,140,130,0.2)",
        }}>
          <span style={{
            fontFamily: "'DM Serif Text', serif", fontSize: "0.625rem",
            letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(107,64,64,0.55)",
            fontWeight: 400,
          }}>NYC</span>
        </div>
      </div>

      {/* Progress strip */}
      <div style={{ padding: "12px 16px", background: "rgba(235,211,208,0.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <span style={{ fontFamily: "'DM Serif Text', serif", fontSize: "0.625rem", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(107,64,64,0.4)", fontWeight: 400 }}>Day Progress</span>
          <span style={{ fontFamily: "'DM Serif Text', serif", fontSize: "0.625rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(107,64,64,0.4)", fontWeight: 400 }}>{Math.round(prog * 100)}%</span>
        </div>
        <div style={{ position: "relative", height: "3px", borderRadius: "2px", background: "rgba(180,140,130,0.2)", overflow: "visible" }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "2px",
            background: "linear-gradient(to right,#BCB2D7,#D7BCCE,#DD9389,#E3C0A0,#EBD3D0)",
            opacity: 0.85,
          }} />
          <div style={{
            position: "absolute", top: "50%", left: `${prog * 100}%`,
            transform: "translate(-50%,-50%)",
            width: "8px", height: "8px", borderRadius: "50%",
            background: "#DD9389",
            boxShadow: "0 0 6px rgba(221,147,137,0.5), 0 1px 4px rgba(107,64,64,0.2)",
            border: "2px solid rgba(221,147,137,0.7)",
            transition: "left 1s ease",
            zIndex: 2,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          {["midnight","dawn","noon","dusk","night"].map(l => (
            <span key={l} style={{ fontFamily: "'DM Serif Text', serif", fontSize: "0.625rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(107,64,64,0.3)", fontWeight: 400 }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
//  App
// ─────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [galleryId, setGalleryId] = useState<string | null>(null);
  const [floatingCard, setFloatingCard] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setActiveId(null); setFloatingCard(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const h = now.getHours(), m = now.getMinutes();
  const phase = getPhase(h, m);
  const prog = pct(h, m);

  const galleryHood = HOODS.find(n => n.id === galleryId) ?? null;
  const photoCountByHood = Object.fromEntries(HOODS.map(h => [h.id, getNeighborhoodPhotos(h.id).length]));
  const selectableIds = HOODS.map(h => h.id);
  const maxPhotoCount = Math.max(1, ...Object.values(photoCountByHood));

  const handleSelect = (id: string) => {
    if (activeId === id) { setActiveId(null); setFloatingCard(null); return; }
    setActiveId(id);
    setFloatingCard({ id });
  };

  const handleDeselect = () => { setActiveId(null); setFloatingCard(null); };

  const handlePanelSelect = (id: string) => {
    if (activeId === id) { setActiveId(null); setFloatingCard(null); return; }
    setActiveId(id);
    setFloatingCard({ id });
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}><TestAnalyze /></div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cormorant+SC:wght@300;400&family=DM+Sans:wght@300;400&family=DM+Serif+Text:ital@0;1&family=Playfair+Display:ital,wght@0,400;1,400&display=swap');

        @keyframes skyDrift {
          0%   { background-position: 0% 60%; }
          100% { background-position: 100% 40%; }
        }
        @keyframes breathe {
          0%,100% { opacity: 0.3; transform: scale(0.83); }
          50%      { opacity: 0.75; transform: scale(1.14); }
        }
        @keyframes floatText {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes horizonPulse {
          0%,100% { opacity: 0.25; }
          50%      { opacity: 0.68; }
        }
        @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .lt-sky {
          background: linear-gradient(110deg,
            #060614 0%,#0d0d28 6%,#14103e 10%,#1a2a50 14%,
            #1e3a7a 20%,#d06018 27%,#f0a030 32%,#f8c860 37%,
            #fad870 40%,#8ecfee 44%,#b8dcf8 50%,#74b8e8 55%,
            #fac860 59%,#f08840 63%,#e06030 67%,#2a3278 74%,
            #241e60 82%,#0d0d28 88%,#060614 100%);
          background-size: 420% 260%;
          animation: skyDrift 14s ease-in-out infinite alternate;
        }
        .lt-glow    { animation: breathe 8s ease-in-out infinite; }
        .lt-text    { animation: floatText 7s ease-in-out infinite; }
        .lt-horizon { animation: horizonPulse 6s ease-in-out infinite; }

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

        .district-btn {
          transition: background 0.4s cubic-bezier(0.25,0.46,0.45,0.94),
                      border-left-color 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .district-btn .hood-name {
          transition: font-style 0.35s ease, color 0.35s ease;
        }

        /* Sidebar polish */
        .sidebar-panel {
          scrollbar-width: thin;
          scrollbar-color: rgba(180,140,130,0.18) transparent;
        }
        .sidebar-panel::-webkit-scrollbar { width: 2px; }
        .sidebar-panel::-webkit-scrollbar-track { background: transparent; }
        .sidebar-panel::-webkit-scrollbar-thumb { background: rgba(180,140,130,0.22); border-radius: 2px; }

        @keyframes sidebarReveal {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sidebar-section { animation: sidebarReveal 0.55s ease both; }
        .sidebar-section:nth-child(1) { animation-delay: 0.04s; }
        .sidebar-section:nth-child(2) { animation-delay: 0.14s; }
        .sidebar-section:nth-child(3) { animation-delay: 0.24s; }
        .sidebar-section:nth-child(4) { animation-delay: 0.34s; }

        .district-mood {
          max-height: 0; overflow: hidden;
          transition: max-height 0.28s ease, opacity 0.28s ease;
          opacity: 0;
        }
        .district-btn:hover .district-mood,
        .district-btn.is-active .district-mood {
          max-height: 20px; opacity: 1;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
      `}</style>

      {/* ── WebGL Shader BG (z:0) ── */}
      <ShaderBackground />

      {/* ── Ripple canvas (z:1, pointerEvents:none) ── */}
      <RippleCanvas />

      {/* ── Nav (z:100) ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "58px", zIndex: 100,
        background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none",
        border: "none",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 36px",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem",
            fontStyle: "italic", color: "#ffffff", letterSpacing: "-0.01em",
            fontWeight: 400,
          }}
        >CityMood</button>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", letterSpacing: "0.08em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
            background: "none", border: "none",
          }}>Atlas</span>
          <button
            onClick={() => navigate("/try")}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#ffffff",
              background: "transparent", border: "1.5px solid rgba(255,255,255,0.7)",
              borderRadius: "100px",
              cursor: "pointer", transition: "all 0.2s ease", padding: "6px 18px",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            Start your map →
          </button>
        </div>
      </nav>

      {/* ── Main layout (z:2) ── */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", height: "100vh", paddingTop: "58px",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* ── LEFT SIDEBAR ── */}
        <div className="sidebar-panel" style={{
          width: "30%", flexShrink: 0,
          background: "transparent",
          overflowY: "auto", padding: "36px 28px 40px",
          display: "flex", flexDirection: "column", gap: "0",
          position: "relative",
          borderRight: "0.5px solid rgba(155,48,255,0.12)",
        }}>
          {/* Hero */}
          <div className="sidebar-section" style={{ paddingBottom: "28px", borderBottom: "0.5px solid rgba(155,48,255,0.1)", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "20px" }}>
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%", flexShrink: 0,
                background: phase.glowColor,
                boxShadow: `0 0 7px ${phase.glowColor}, 0 0 14px ${phase.glowColor}`,
                display: "inline-block",
              }} />
              <p style={{
                fontFamily: "'DM Serif Text', serif", fontSize: "0.5625rem", letterSpacing: "0.34em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
                fontWeight: 400,
              }}>
                {phase.label} — New York City
              </p>
            </div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: "4.5rem", fontWeight: 300,
              fontStyle: "italic", color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 0.9,
              marginBottom: "20px",
            }}>New York <em style={{color:"#FFFFFF", fontStyle:"italic"}}>City</em></h1>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
              fontSize: "1.05rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.68,
            }}>
              A personal photography atlas.<br />
              Click a district to explore.
            </p>
          </div>

          {/* Light Tracker */}
          <div className="sidebar-section" style={{ paddingBottom: "28px", borderBottom: "0.5px solid rgba(155,48,255,0.1)", marginBottom: "28px" }}>
            <p style={{ fontFamily: "'DM Serif Text', serif", fontSize: "0.5625rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "14px", fontWeight: 400, display: "flex", alignItems: "center", gap: "12px" }}>
              Light Tracker
              <span style={{ flex: 1, height: "0.5px", background: "rgba(155,48,255,0.12)", display: "inline-block" }} />
            </p>
            <LightTracker phase={phase} prog={prog} hour={h} minute={m} />
          </div>

          {/* Districts list */}
          <div className="sidebar-section" style={{ paddingBottom: "28px", borderBottom: "0.5px solid rgba(155,48,255,0.1)", marginBottom: "28px" }}>
            <p style={{ fontFamily: "'DM Serif Text', serif", fontSize: "0.5625rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "6px", fontWeight: 700, display: "flex", alignItems: "center", gap: "12px" }}>
              Districts
              <span style={{ flex: 1, height: "0.5px", background: "rgba(155,48,255,0.12)", display: "inline-block" }} />
            </p>
            <ul style={{ listStyle: "none" }}>
              {HOODS.map((hood, idx) => {
                const isActive = activeId === hood.id;
                const photoCount = photoCountByHood[hood.id] ?? 0;
                return (
                  <li key={hood.id}>
                    <button
                      className={`district-btn${isActive ? " is-active" : ""}`}
                      onClick={() => handlePanelSelect(hood.id)}
                      style={{
                        width: "100%",
                        background: isActive ? "rgba(155,48,255,0.08)" : "transparent",
                        border: "none",
                        borderLeft: isActive ? `1.5px solid ${hood.accent}` : "1.5px solid transparent",
                        borderBottom: "0.5px solid rgba(155,48,255,0.08)",
                        borderRadius: 0,
                        cursor: "pointer",
                        display: "flex", alignItems: "center",
                        padding: "12px 4px 12px 12px",
                        textAlign: "left",
                        gap: "10px",
                        opacity: 1,
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.background = "rgba(155,48,255,0.06)";
                        if (!isActive) e.currentTarget.style.borderLeftColor = "rgba(155,48,255,0.25)";
                        const n = e.currentTarget.querySelector(".hood-name") as HTMLElement;
                        if (n) { n.style.fontStyle = "italic"; n.style.color = "#EDE8F8"; }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = "transparent"; }
                        const n = e.currentTarget.querySelector(".hood-name") as HTMLElement;
                        if (n) { n.style.fontStyle = "normal"; n.style.color = "rgba(255,255,255,0.8)"; }
                      }}>
                      <span style={{
                        fontFamily: "'DM Serif Text', serif", fontSize: "0.5rem",
                        color: "rgba(155,48,255,0.2)", letterSpacing: "0.05em", fontWeight: 400,
                        minWidth: "16px", flexShrink: 0, paddingTop: "2px",
                      }}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0" }}>
                        <span className="hood-name" style={{
                          fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontWeight: 300,
                          color: "rgba(255,255,255,0.8)",
                          display: "block",
                        }}>{hood.name} {`· ${photoCount}`}</span>
                        <span className="district-mood" style={{
                          fontFamily: "'DM Serif Text', serif", fontStyle: "italic",
                          fontSize: "0.5625rem", color: "rgba(196,174,244,0.35)", letterSpacing: "0.02em",
                          display: "block",
                        }}>{hood.mood}</span>
                      </span>
                      {isActive && (
                        <span style={{
                          width: "4px", height: "4px", borderRadius: "50%", flexShrink: 0, marginRight: "2px",
                          background: hood.accent,
                          boxShadow: `0 0 5px ${hood.glow}`,
                          display: "inline-block",
                        }} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Coordinates */}
          <div className="sidebar-section">
            <p style={{ fontFamily: "'DM Serif Text', serif", fontSize: "0.5625rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "12px" }}>
              Coordinates
              <span style={{ flex: 1, height: "0.5px", background: "rgba(155,48,255,0.12)", display: "inline-block" }} />
            </p>
            <p style={{ fontFamily: "'DM Serif Text', serif", fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>40.7128° N · 74.0060° W</p>
            <p style={{ fontFamily: "'DM Serif Text', serif", fontSize: "0.5rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "5px" }}>New York, USA</p>
          </div>
        </div>

        {/* ── RIGHT MAP PANEL ── */}
        <div style={{ width: "70%", flexShrink: 0, position: "relative", overflow: "hidden", background: "transparent" }}>
          <div style={{ position: "absolute", inset: 0, background: "transparent" }}>
            <AtlasStyledMap
              litIds={selectableIds}
              selectableIds={selectableIds}
              glowWeightsBySlug={Object.fromEntries(
                selectableIds.map((id) => {
                  const count = photoCountByHood[id] ?? 0;
                  const normalized = Math.log2(count + 1) / Math.log2(maxPhotoCount + 1);
                  return [id, 0.9 + normalized * 2.3];
                }),
              )}
              activeId={activeId}
              onSelect={handleSelect}
              onBackgroundClick={handleDeselect}
              photoPoints={[]}
              representativePhotos={[]}
              showMarkers={false}
              lockOverviewMinZoom
              markerStartOffset={0.35}
              detailPinZoom={13.2}
            />
          </div>

          {/* Floating card near clicked block */}
          {floatingCard && (() => {
            const fh = HOODS.find(n => n.id === floatingCard.id);
            if (!fh) return null;
            return (
              <div key={fh.id} style={{
                position: "fixed",
                top: "12vh",
                left: "max(420px, 55%)",
                transform: "translateX(-50%)",
                zIndex: 50,
                background: "rgba(10,8,20,0.92)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderRadius: "10px",
                border: "0.5px solid rgba(155,48,255,0.25)",
                padding: "24px 28px",
                minWidth: "240px",
                maxWidth: "260px",
                pointerEvents: "auto",
                animation: "fadeIn 0.2s ease",
                boxShadow: "0 2px 24px rgba(155,48,255,0.1)",
              }}>
                <div style={{ fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(155,48,255,0.4)", marginBottom: "6px", fontFamily: "'DM Sans', sans-serif" }}>{fh.borough}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", color: "#EDE8F8", marginBottom: "6px", lineHeight: 1 }}>{fh.name}</div>
                <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(196,174,244,0.4)", marginBottom: "16px", fontFamily: "'DM Sans', sans-serif" }}>{fh.mood}</div>
                <div style={{ borderTop: "0.5px solid rgba(155,48,255,0.15)", paddingTop: "14px" }}>
                  <button
                    onClick={() => setGalleryId(fh.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      background: "transparent", border: "none", cursor: "pointer", padding: 0,
                    }}>
                    <span style={{ width: "24px", height: "1px", background: "#FFD700", display: "inline-block", flexShrink: 0 }} />
                    <span style={{ color: "#FFD700", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>View Gallery</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Gallery Modal ── */}
      {galleryHood && (
        <NeighborhoodGallery
          neighborhoodName={galleryHood.name}
          borough={galleryHood.borough}
          moodTag={galleryHood.mood}
          photos={getNeighborhoodPhotos(galleryHood.id).map((url, i) => ({
            url,
            note: galleryHood.photos[i]?.caption,
          }))}
          onBack={() => setGalleryId(null)}
        />
      )}
    </>
  );
}
