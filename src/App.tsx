import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import ShaderBackground from "./components/home/ShaderBackground";
import { getNeighborhoodPhotos } from "./lib/photos";

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
    path:"M 182 510 L 230 510 L 238 528 L 226 548 L 200 552 L 180 538 Z",
    labelX:207, labelY:532,
  },
  {
    id:"soho", name:"SoHo / Tribeca", borough:"Manhattan", mood:"Cast iron & quiet", energy:7,
    accent:"#a0b8d8", glow:"rgba(160,184,216,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1624198257029-ee188abe08a6?w=800&q=80", caption:"Cobblestone morning, SoHo." },
      { url:"https://images.unsplash.com/photo-1756294205737-ee8260c65715?w=800&q=80", caption:"Cast iron facade, Greene St." },
    ],
    path:"M 172 470 L 238 466 L 238 508 L 182 510 L 170 496 Z",
    labelX:205, labelY:491,
  },
  {
    id:"westvillage", name:"West Village", borough:"Manhattan", mood:"Hushed & timeless", energy:5,
    accent:"#e8b4a0", glow:"rgba(232,180,160,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1610931002340-fe06e753976e?w=800&q=80", caption:"Evening glow, Bleecker St." },
      { url:"https://images.unsplash.com/photo-1766858771923-e3845a9ad796?w=800&q=80", caption:"Hudson River light." },
    ],
    path:"M 148 424 L 172 422 L 172 470 L 152 474 L 140 456 Z",
    labelX:158, labelY:449,
  },
  {
    id:"eastvillage", name:"East Village", borough:"Manhattan", mood:"Restless & raw", energy:9,
    accent:"#c8a0d0", glow:"rgba(200,160,208,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1710161973220-b71c49465ad6?w=800&q=80", caption:"Mural at dusk, E. 9th." },
      { url:"https://images.unsplash.com/photo-1592693598252-dd5f93c112cc?w=800&q=80", caption:"Williamsburg border, Delancey." },
    ],
    path:"M 238 422 L 284 420 L 288 462 L 250 468 L 238 466 Z",
    labelX:262, labelY:447,
  },
  {
    id:"greenwich-village", name:"Greenwich Village", borough:"Manhattan", mood:"Bohemian & alive", energy:8,
    accent:"#d4956e", glow:"rgba(212,149,110,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80", caption:"Washington Square arch, dusk." },
      { url:"https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80", caption:"MacDougal St. evening." },
    ],
    path:"M 172 422 L 238 422 L 238 466 L 172 470 Z",
    labelX:205, labelY:445,
  },
  {
    id:"chelsea", name:"Chelsea", borough:"Manhattan", mood:"Industrial & luminous", energy:8,
    accent:"#90c8a8", glow:"rgba(144,200,168,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1766858771923-e3845a9ad796?w=800&q=80", caption:"High Line at golden hour." },
      { url:"https://images.unsplash.com/photo-1550837659-aafc79fba9c4?w=800&q=80", caption:"Gallery district, W. 25th." },
    ],
    path:"M 138 370 L 172 368 L 172 422 L 148 424 L 132 406 Z",
    labelX:152, labelY:396,
  },
  {
    id:"midtown", name:"Midtown", borough:"Manhattan", mood:"Relentless & electric", energy:10,
    accent:"#f0a080", glow:"rgba(240,160,128,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1610931002340-fe06e753976e?w=800&q=80", caption:"5th Ave. at blue hour." },
      { url:"https://images.unsplash.com/photo-1553634825-800a3381acb4?w=800&q=80", caption:"Times Square long exposure." },
    ],
    path:"M 142 298 L 290 292 L 290 370 L 238 374 L 172 376 L 138 370 Z",
    labelX:214, labelY:335,
  },
  {
    id:"upperwest", name:"Upper West Side", borough:"Manhattan", mood:"Cultural & unhurried", energy:6,
    accent:"#b8d0e8", glow:"rgba(184,208,232,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1706738715243-fe8a185e9c3d?w=800&q=80", caption:"Central Park West, dawn." },
      { url:"https://images.unsplash.com/photo-1616804634504-428979f23ecd?w=800&q=80", caption:"Riverside Drive, late afternoon." },
    ],
    path:"M 148 220 L 210 218 L 210 292 L 142 298 L 136 274 Z",
    labelX:168, labelY:258,
  },
  {
    id:"harlem", name:"Harlem", borough:"Manhattan", mood:"Deep & resonant", energy:8,
    accent:"#d4a0a0", glow:"rgba(212,160,160,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1550837659-aafc79fba9c4?w=800&q=80", caption:"125th St. afternoon." },
      { url:"https://images.unsplash.com/photo-1715139718826-cee848eac7da?w=800&q=80", caption:"Brownstone facades, St. Nicholas." },
    ],
    path:"M 158 148 L 278 144 L 286 218 L 210 220 L 148 222 L 150 172 Z",
    labelX:218, labelY:185,
  },
  {
    id:"gramercy", name:"Gramercy / Murray Hill", borough:"Manhattan", mood:"Quiet & composed", energy:5,
    accent:"#c8b890", glow:"rgba(200,184,144,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1550837659-aafc79fba9c4?w=800&q=80", caption:"Gramercy Park, dusk." },
      { url:"https://images.unsplash.com/photo-1616804634504-428979f23ecd?w=800&q=80", caption:"Lexington Ave. morning." },
    ],
    path:"M 172 376 L 238 374 L 290 370 L 288 420 L 238 422 L 172 422 Z",
    labelX:231, labelY:399,
  },
  {
    id:"dumbo", name:"DUMBO", borough:"Brooklyn", mood:"Moody & vast", energy:7,
    accent:"#a8c0d8", glow:"rgba(168,192,216,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1597008234839-65e5543fc3cf?w=800&q=80", caption:"Bridge frame, Washington St." },
      { url:"https://images.unsplash.com/photo-1646611192164-8179c67987ea?w=800&q=80", caption:"Waterfront at dusk." },
    ],
    path:"M 310 478 L 370 472 L 376 510 L 336 522 L 308 510 Z",
    labelX:341, labelY:498,
  },
  {
    id:"williamsburg", name:"Williamsburg", borough:"Brooklyn", mood:"Loud & searching", energy:9,
    accent:"#d8b8a0", glow:"rgba(216,184,160,0.5)",
    photos:[
      { url:"https://images.unsplash.com/photo-1616804634504-428979f23ecd?w=800&q=80", caption:"Rooftop view, Bedford Ave." },
      { url:"https://images.unsplash.com/photo-1592693598252-dd5f93c112cc?w=800&q=80", caption:"Street art, N 7th St." },
    ],
    path:"M 308 410 L 380 402 L 384 470 L 312 476 L 306 450 Z",
    labelX:344, labelY:441,
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
//  Abstract NYC Map — line art style
// ─────────────────────────────────────────────
function NYCMap({ activeId, onSelect }: { activeId: string | null; onSelect: (id: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const manhattanOutline =
    "M 168 90 L 296 86 L 302 148 L 296 218 L 290 292 L 290 374 L 284 420 L 288 462 L 238 508 L 230 510 L 200 552 L 180 538 L 170 496 L 140 456 L 132 406 L 138 370 L 136 274 L 142 298 L 148 222 L 150 172 L 158 148 Z";

  const brooklynOutline =
    "M 298 390 L 396 380 L 404 480 L 388 532 L 340 548 L 298 524 L 296 480 Z";

  const queensOutline =
    "M 296 86 L 432 78 L 440 200 L 420 290 L 400 380 L 298 390 L 290 292 Z";

  const njOutline =
    "M 55 75 L 136 120 L 138 458 L 126 514 L 55 524 Z";

  return (
    <svg viewBox="18 70 384 480" style={{ width: "100%", height: "100%", display: "block" }}>
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

        {/* Clip paths */}
        <clipPath id="clipManhattan"><path d={manhattanOutline} /></clipPath>
        <clipPath id="clipBrooklyn"><path d={brooklynOutline} /></clipPath>
        <clipPath id="clipQueens"><path d={queensOutline} /></clipPath>

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

        {/* Water gradient */}
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(180,130,60,0.15)" />
          <stop offset="100%" stopColor="rgba(160,110,50,0.2)" />
        </linearGradient>
        <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(210,160,80,0.35)" />
          <stop offset="100%" stopColor="rgba(190,140,65,0.35)" />
        </linearGradient>
      </defs>

      {/* ── Water background ── */}
      <rect width="480" height="600" fill="url(#waterGrad)" />

      {/* Water scan lines — hidden */}
      {[...Array(20)].map((_, i) => (
        <line key={`wl${i}`} x1={0} y1={i * 31 + 6} x2={480} y2={i * 31 + 6}
          stroke="transparent" strokeWidth={0.6} />
      ))}

      {/* ── NJ (bg) ── */}
      <path d={njOutline} fill="rgba(200,150,70,0.2)"
        stroke="rgba(180,130,60,0.15)" strokeWidth={0.5} />

      {/* ── Queens (bg land) ── */}
      <path d={queensOutline} fill="rgba(210,160,80,0.25)"
        stroke="rgba(180,130,60,0.2)" strokeWidth={0.5} />
      {/* Queens grid — hidden */}
      <g clipPath="url(#clipQueens)" opacity={0} />

      {/* ── Brooklyn land ── */}
      <path d={brooklynOutline} fill="url(#landGrad)"
        stroke="rgba(180,130,60,0.3)" strokeWidth={0.6} />
      {/* Brooklyn street grid — hidden */}
      <g clipPath="url(#clipBrooklyn)" opacity={0} />
      {/* Brooklyn shoreline glow */}
      <path d={brooklynOutline} fill="none"
        stroke="rgba(200,150,70,0.3)" strokeWidth={3}
        filter="url(#fShoreGlow)" />

      {/* ── Manhattan land ── */}
      <path d={manhattanOutline} fill="url(#landGrad)" />
      {/* Manhattan street grid — hidden */}
      <g clipPath="url(#clipManhattan)" opacity={0} />

      {/* ── Central Park (special zone) ── */}
      <g clipPath="url(#clipManhattan)">
        <rect x={178} y={226} width={30} height={64}
          fill="rgba(190,150,70,0.25)" stroke="rgba(190,150,70,0.4)" strokeWidth={0.7} strokeDasharray="2 3" />
        {/* CP internal hatching */}
        {[...Array(12)].map((_, i) => (
          <line key={`cp${i}`}
            x1={178 + i * 4} y1={226} x2={178 + i * 4} y2={290}
            stroke="rgba(190,150,70,0.15)" strokeWidth={0.4} />
        ))}
        <text x={193} y={261} textAnchor="middle"
          fill="rgba(45,27,13,0)" fontSize={4.5}
          fontFamily="'DM Sans', sans-serif" fontStyle="italic" letterSpacing="0.08">
          Central Park
        </text>
      </g>

      {/* ── Manhattan shoreline — double stroke ── */}
      {/* Outer glow */}
      <path d={manhattanOutline} fill="none"
        stroke="rgba(200,150,70,0.2)" strokeWidth={5}
        filter="url(#fShoreGlow)" />
      {/* Precise inner line */}
      <path d={manhattanOutline} fill="none"
        stroke="rgba(180,130,60,0.5)" strokeWidth={0.85} />

      {/* ── Neighborhood zones — line art ── */}
      {HOODS.map((hood) => {
        const isActive = activeId === hood.id;
        const isHovered = hovered === hood.id;

        return (
          <g key={hood.id}>
            {/* Fill layer — always visible, deepens on hover/active */}
            <path d={hood.path}
              fill={isActive || isHovered ? "rgba(180,130,60,0.5)" : "rgba(210,160,80,0.2)"}
              style={{ transition: "fill 0.25s", pointerEvents: "none" }}
            />
            {/* Outer glow line — hover/active only */}
            {(isActive || isHovered) && (
              <path d={hood.path} fill="none"
                stroke="rgba(240,200,100,0.6)"
                strokeWidth={3}
                filter="url(#fGlow)"
                style={{ pointerEvents: "none" }}
              />
            )}
            {/* Hatching fill — active only */}
            {isActive && (
              <path d={hood.path} fill={`url(#hatch-${hood.id})`} />
            )}
            {/* Main border — outline color shifts on hover/active */}
            <path
              d={hood.path}
              fill="none"
              stroke={isActive || isHovered ? "rgba(210,160,80,0.9)" : "rgba(180,120,40,0.5)"}
              strokeWidth={isActive ? 1.7 : isHovered ? 1.1 : 0.65}
              strokeDasharray={isActive ? "none" : isHovered ? "3 3" : "2.5 4"}
              style={{ cursor: "pointer", transition: "stroke 0.25s, stroke-width 0.25s" }}
              onMouseEnter={() => setHovered(hood.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(hood.id)}
            />
            {/* Invisible hit area (easier to click) */}
            <path d={hood.path} fill="transparent" strokeWidth={10} stroke="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(hood.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(hood.id)} />
            {/* Label */}
            <text x={hood.labelX} y={hood.labelY} textAnchor="middle"
              fill={isActive ? hood.accent : isHovered ? "rgba(90,55,20,0.85)" : "rgba(90,55,20,0.45)"}
              fontSize={isActive ? 6.5 : 5.8}
              fontFamily="'DM Sans', sans-serif"
              letterSpacing="0.14"
              style={{ pointerEvents: "none", transition: "fill 0.25s" }}>
              {hood.name}
            </text>
          </g>
        );
      })}

      {/* ── Brooklyn Bridge — line art ── */}
      <g opacity={0.65}>
        {/* Deck */}
        <line x1={236} y1={520} x2={310} y2={486}
          stroke="rgba(160,110,50,0.5)" strokeWidth={1.1} />
        {/* Upper cable (catenary curve) */}
        <path d="M 236 517 Q 273 468 310 483"
          fill="none" stroke="rgba(160,110,50,0.55)" strokeWidth={0.75} />
        {/* Lower parallel cable */}
        <path d="M 236 523 Q 273 474 310 489"
          fill="none" stroke="rgba(160,110,50,0.35)" strokeWidth={0.55} />
        {/* Towers */}
        <line x1={255} y1={510} x2={255} y2={472}
          stroke="rgba(170,120,55,0.6)" strokeWidth={1.2} />
        <line x1={291} y1={495} x2={291} y2={472}
          stroke="rgba(170,120,55,0.6)" strokeWidth={1.2} />
        {/* Tower cross-bars */}
        <line x1={252} y1={478} x2={258} y2={478}
          stroke="rgba(170,120,55,0.5)" strokeWidth={0.7} />
        <line x1={288} y1={478} x2={294} y2={478}
          stroke="rgba(170,120,55,0.5)" strokeWidth={0.7} />
        {/* Suspenders */}
        {[0.22, 0.4, 0.58, 0.76].map((t, i) => {
          const p0x = 236, p0y = 517, p1x = 273, p1y = 468, p2x = 310, p2y = 483;
          const bx = (1-t)*(1-t)*p0x + 2*(1-t)*t*p1x + t*t*p2x;
          const by = (1-t)*(1-t)*p0y + 2*(1-t)*t*p1y + t*t*p2y;
          const dx = p0x + t * (p2x - p0x);
          const dy = p0y + t * (p2y - p0y);
          return <line key={i} x1={bx} y1={by} x2={dx} y2={dy}
            stroke="rgba(150,100,45,0.35)" strokeWidth={0.4} />;
        })}
      </g>

      {/* ── Manhattan Bridge (simplified) ── */}
      <g opacity={0.4}>
        <line x1={248} y1={504} x2={322} y2={474}
          stroke="rgba(150,100,45,0.45)" strokeWidth={0.7} />
        <path d="M 248 501 Q 285 462 322 471"
          fill="none" stroke="rgba(150,100,45,0.45)" strokeWidth={0.5} />
      </g>

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

      {/* ── Compass ── */}
      <g transform="translate(450,108)">
        <line x1={0} y1={-11} x2={0} y2={11} stroke="rgba(140,90,40,0.35)" strokeWidth={0.7} />
        <line x1={-11} y1={0} x2={11} y2={0} stroke="rgba(140,90,40,0.35)" strokeWidth={0.7} />
        <circle cx={0} cy={0} r={2} fill="none" stroke="rgba(140,90,40,0.35)" strokeWidth={0.5} />
        <text x={0} y={-14} textAnchor="middle" fill="rgba(140,90,40,0.4)"
          fontSize={5} fontFamily="'DM Sans', sans-serif" letterSpacing="0.1">N</text>
      </g>

      {/* ── Scale bar ── */}
      <g transform="translate(376,574)">
        <line x1={0} y1={0} x2={48} y2={0} stroke="rgba(140,90,40,0.35)" strokeWidth={0.7} />
        <line x1={0} y1={-3} x2={0} y2={3} stroke="rgba(140,90,40,0.35)" strokeWidth={0.7} />
        <line x1={48} y1={-3} x2={48} y2={3} stroke="rgba(140,90,40,0.35)" strokeWidth={0.7} />
        <text x={24} y={9} textAnchor="middle" fill="rgba(140,90,40,0.4)"
          fontSize={5} fontFamily="'DM Sans', sans-serif" letterSpacing="0.12">1 MI</text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────
//  Light Tracker Widget
// ─────────────────────────────────────────────
function LightTracker({ phase, prog, hour, minute }: { phase: Phase; prog: number; hour: number; minute: number }) {
  return (
    <div style={{
      borderRadius: "10px", overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 6px 28px ${phase.shadowColor}, inset 0 1px 0 rgba(255,255,255,0.07)`,
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
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "65px",
          background: "linear-gradient(to top, rgba(0,0,0,0.52) 0%, transparent 100%)",
        }} />
        {/* Text */}
        <div className="lt-text" style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "4px",
        }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300,
            color: phase.textColor, letterSpacing: "-0.01em", lineHeight: 1.1,
            textShadow: "0 1px 16px rgba(0,0,0,0.65)", transition: "color 2s ease",
          }}>{phase.label}</span>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", fontWeight: 300, fontStyle: "italic",
            color: phase.textColor, opacity: 0.72, letterSpacing: "0.04em",
            textShadow: "0 1px 10px rgba(0,0,0,0.65)", transition: "color 2s ease",
          }}>{phase.tagline}</span>
        </div>
        {/* Time badge */}
        <div style={{
          position: "absolute", top: "10px", right: "12px",
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)",
          borderRadius: "3px", padding: "2px 8px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "8px",
            letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.72)",
          }}>{fmt(hour, minute)}</span>
        </div>
        {/* NYC badge */}
        <div style={{
          position: "absolute", top: "10px", left: "12px",
          background: "rgba(0,0,0,0.28)", backdropFilter: "blur(6px)",
          borderRadius: "3px", padding: "2px 8px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "8px",
            letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)",
          }}>NYC</span>
        </div>
      </div>

      {/* Progress strip */}
      <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.32)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Day Progress</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{Math.round(prog * 100)}%</span>
        </div>
        <div style={{ position: "relative", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.07)", overflow: "visible" }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "2px",
            background: "linear-gradient(90deg,#060614 0%,#1a2a50 16%,#f0a030 28%,#b8dcf8 44%,#b8dcf8 58%,#f08040 70%,#2a3278 82%,#060614 100%)",
            opacity: 0.85,
          }} />
          <div style={{
            position: "absolute", top: "50%", left: `${prog * 100}%`,
            transform: "translate(-50%,-50%)",
            width: "8px", height: "8px", borderRadius: "50%",
            background: "white",
            boxShadow: `0 0 10px ${phase.glowColor}, 0 1px 4px rgba(0,0,0,0.4)`,
            border: `2px solid ${phase.glowColor}`,
            transition: "left 1s ease, box-shadow 2.5s ease",
            zIndex: 2,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          {["midnight","dawn","noon","dusk","night"].map(l => (
            <span key={l} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "6px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Gallery Modal
// ─────────────────────────────────────────────
function GalleryModal({ hood, onClose }: { hood: Hood; onClose: () => void }) {
  const allPaths = getNeighborhoodPhotos(hood.id); // up to 20 candidate paths
  // Track which indices returned 404 — those are hidden from the grid and lightbox.
  const [hiddenSet, setHiddenSet] = useState<Set<number>>(new Set());
  const [lightbox, setLightbox] = useState<number | null>(null);

  const hideSlot = (i: number) =>
    setHiddenSet(prev => new Set([...prev, i]));

  // Visible = all paths that haven't 404'd yet
  const visiblePhotos = allPaths
    .map((src, i) => ({ src, i }))
    .filter(({ i }) => !hiddenSet.has(i));

  const total = visiblePhotos.length;

  // Close lightbox if the currently-open photo just 404'd
  useEffect(() => {
    if (lightbox !== null && lightbox >= total) setLightbox(null);
  }, [total, lightbox]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (lightbox !== null) setLightbox(null); else onClose(); }
      if (e.key === "ArrowRight" && lightbox !== null) setLightbox((lightbox + 1) % Math.max(total, 1));
      if (e.key === "ArrowLeft" && lightbox !== null) setLightbox((lightbox - 1 + Math.max(total, 1)) % Math.max(total, 1));
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [lightbox, onClose, total]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(4,6,18,0.95)", backdropFilter: "blur(8px)",
        display: "flex", flexDirection: "column",
        animation: "fadeIn 0.26s ease both",
      }}
      onClick={lightbox !== null ? () => setLightbox(null) : undefined}
    >
      {/* Header */}
      <div style={{ padding: "28px 36px 20px", borderBottom: `1px solid ${hood.accent}44`, flexShrink: 0 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: "2.1rem", fontWeight: 300,
              color: "rgba(235,228,215,0.96)", letterSpacing: "-0.01em", lineHeight: 1.1, margin: 0,
            }}>{hood.name}</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(200,190,175,0.45)", marginTop: "6px" }}>
              {hood.mood} · {hood.borough} · {total} photos
            </p>
            <div style={{ marginTop: "10px", height: "1px", background: hood.accent, opacity: 0.4 }} />
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "1px solid rgba(255,255,255,0.14)",
            color: "rgba(255,255,255,0.5)", cursor: "pointer", borderRadius: "3px",
            padding: "6px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: "8px",
            letterSpacing: "0.22em", textTransform: "uppercase", transition: "color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
            ESC ×
          </button>
        </div>
      </div>

      {lightbox === null ? (
        <div style={{
          flex: 1, overflowY: "auto", padding: "20px 36px",
          display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "5px", alignContent: "start",
        }} onClick={e => e.stopPropagation()}>
          {visiblePhotos.map(({ src, i }, gridPos) => (
            <div key={i} onClick={() => setLightbox(gridPos)}
              style={{ position: "relative", aspectRatio: "3/2", overflow: "hidden", cursor: "pointer" }}
              onMouseEnter={e => {
                (e.currentTarget.querySelector("img") as HTMLElement).style.transform = "scale(1.04)";
                (e.currentTarget.querySelector(".scrim") as HTMLElement).style.opacity = "1";
                (e.currentTarget.querySelector(".badge") as HTMLElement).style.opacity = "1";
              }}
              onMouseLeave={e => {
                (e.currentTarget.querySelector("img") as HTMLElement).style.transform = "scale(1)";
                (e.currentTarget.querySelector(".scrim") as HTMLElement).style.opacity = "0";
                (e.currentTarget.querySelector(".badge") as HTMLElement).style.opacity = "0";
              }}>
              <img src={src} alt=""
                onError={() => hideSlot(i)}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease", display: "block" }} />
              <div className="scrim" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.42)", opacity: 0, transition: "opacity 0.2s" }} />
              <div className="badge" style={{
                position: "absolute", bottom: "8px", right: "8px",
                background: "rgba(0,0,0,0.65)", borderRadius: "2px", padding: "2px 7px",
                opacity: 0, transition: "opacity 0.2s",
                fontFamily: "'DM Sans', sans-serif", fontSize: "7px",
                letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.8)",
              }}>{gridPos + 1}/{total}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 60px" }}>
          <div style={{ position: "relative", maxWidth: "880px", width: "100%" }}>
            <img src={visiblePhotos[lightbox]?.src} alt=""
              onError={() => hideSlot(visiblePhotos[lightbox]?.i)}
              style={{ width: "100%", maxHeight: "calc(100vh - 240px)", objectFit: "contain", display: "block", cursor: "pointer" }}
              onClick={() => setLightbox(null)} />
            {total > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + total) % total); }}
                  style={{ position: "absolute", left: "-52px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "22px", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>←</button>
                <button onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % total); }}
                  style={{ position: "absolute", right: "-52px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "22px", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>→</button>
              </>
            )}
          </div>
          <p style={{ marginTop: "5px", fontFamily: "'DM Sans', sans-serif", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(180,170,155,0.3)" }}>{lightbox + 1} / {total} — click photo to return</p>
        </div>
      )}
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

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const h = now.getHours(), m = now.getMinutes();
  const phase = getPhase(h, m);
  const prog = pct(h, m);

  const activeHood = HOODS.find(n => n.id === activeId) ?? null;
  const galleryHood = HOODS.find(n => n.id === galleryId) ?? null;

  const handleSelect = (id: string) => setActiveId(prev => prev === id ? null : id);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400&display=swap');

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

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
      `}</style>

      {/* ── WebGL Shader BG (z:0) ── */}
      <ShaderBackground />

      {/* ── Ripple canvas (z:1, pointerEvents:none) ── */}
      <RippleCanvas />

      {/* ── Nav (z:100) ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "54px", zIndex: 100,
        background: "rgba(45,27,13,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontFamily: "Georgia, 'Cormorant Garamond', serif", fontSize: "1.1rem",
            fontStyle: "italic", color: "#f5e6c8", letterSpacing: "-0.02em",
          }}
        >CityMood</button>
        <button
          onClick={() => navigate("/try")}
          style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", letterSpacing: "0.1em",
          textTransform: "uppercase", color: "rgba(245,230,200,0.5)",
          background: "transparent", border: "0.5px solid rgba(245,230,200,0.25)",
          borderRadius: "100px", padding: "6px 16px", cursor: "pointer", transition: "color 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(245,230,200,0.9)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,230,200,0.5)")}>
          Start your map →
        </button>
      </nav>

      {/* ── Main layout (z:2) ── */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", height: "100vh", paddingTop: "54px",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* ── LEFT SIDEBAR ── */}
        <div style={{
          width: "30%", flexShrink: 0,
          background: "transparent",
          overflowY: "auto", padding: "36px 28px",
          display: "flex", flexDirection: "column", gap: "28px",
        }}>
          {/* Hero */}
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "7.5px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(45,27,13,0.55)", marginBottom: "12px" }}>
              · {phase.label} — New York City
            </p>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: "2.6rem", fontWeight: 300,
              color: "#2D1B0D", letterSpacing: "-0.01em", lineHeight: 1.12,
              textShadow: "0 2px 24px rgba(0,0,0,0.1)",
            }}>New York<br />City</h1>
            <p style={{
              marginTop: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: "11px",
              lineHeight: 1.9, letterSpacing: "0.06em", color: "#5C3D1E",
            }}>
              A personal photography atlas.<br />
              Click a district to explore.
            </p>
          </div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          {/* Light Tracker */}
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(45,27,13,0.55)", marginBottom: "12px" }}>Light Tracker</p>
            <LightTracker phase={phase} prog={prog} hour={h} minute={m} />
          </div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          {/* Districts list */}
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(45,27,13,0.55)", marginBottom: "6px" }}>Districts</p>
            <ul style={{ listStyle: "none" }}>
              {HOODS.map(hood => {
                const isActive = activeId === hood.id;
                return (
                  <li key={hood.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <button
                      onClick={() => handleSelect(hood.id)}
                      style={{
                        width: "100%", background: "none", border: "none", cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "9px 0", transition: "opacity 0.2s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "5px", height: "5px", borderRadius: "50%",
                          background: hood.accent, opacity: isActive ? 1 : 0.28,
                          boxShadow: isActive ? `0 0 8px ${hood.accent}` : "none",
                          transition: "all 0.3s",
                        }} />
                        <span style={{
                          fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", fontWeight: 300,
                          color: isActive ? "#2D1B0D" : "#5C3D1E",
                          transition: "color 0.2s",
                        }}>{hood.name}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: "7px", letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: isActive ? hood.accent : "rgba(45,27,13,0.55)",
                          transition: "color 0.2s",
                        }}>{hood.mood}</span>
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: "6.5px", letterSpacing: "0.15em",
                          textTransform: "uppercase", color: "rgba(45,27,13,0.55)",
                        }}>{hood.photos.length} photos</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          {/* Coordinates */}
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(45,27,13,0.55)", marginBottom: "5px" }}>Coordinates</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontWeight: 300, color: "#5C3D1E", letterSpacing: "0.04em" }}>40.7128° N · 74.0060° W</p>
          </div>
        </div>

        {/* ── RIGHT MAP PANEL ── */}
        <div style={{ width: "70%", flexShrink: 0, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <NYCMap activeId={activeId} onSelect={handleSelect} />
          </div>

          {/* Active hood info card */}
          {activeHood && (
            <div key={activeHood.id} style={{
              position: "absolute", bottom: "28px", left: "28px", maxWidth: "248px",
              background: "rgba(4,6,18,0.84)", backdropFilter: "blur(14px)",
              border: `1px solid ${activeHood.accent}44`,
              borderRadius: "8px", padding: "16px 18px",
              animation: "slideUp 0.26s ease both",
              boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03), 0 0 22px ${activeHood.glow}`,
            }}>
              <div style={{ width: "22px", height: "1.5px", background: activeHood.accent, marginBottom: "11px", opacity: 0.8 }} />
              <h3 style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", fontWeight: 300,
                color: "rgba(232,222,208,0.97)", letterSpacing: "-0.01em", lineHeight: 1.15, marginBottom: "3px",
              }}>{activeHood.name}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(200,185,162,0.42)", marginBottom: "10px" }}>
                {activeHood.borough} · {activeHood.mood}
              </p>
              {/* Energy dots */}
              <div style={{ display: "flex", gap: "3px", marginBottom: "14px" }}>
                {[...Array(10)].map((_, i) => (
                  <div key={i} style={{
                    width: "13px", height: "2.5px", borderRadius: "1px",
                    background: i < activeHood.energy ? activeHood.accent : "rgba(255,255,255,0.07)",
                    transition: "background 0.3s",
                  }} />
                ))}
              </div>
              <button
                onClick={() => setGalleryId(activeHood.id)}
                style={{
                  width: "100%", background: "none",
                  border: `1px solid ${activeHood.accent}55`,
                  color: activeHood.accent, padding: "7px 0", borderRadius: "3px",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  fontSize: "7.5px", letterSpacing: "0.24em", textTransform: "uppercase",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = activeHood.accent + "1a")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                View Gallery →
              </button>
            </div>
          )}

          {/* Hint when nothing selected */}
          {!activeId && (
            <div style={{
              position: "absolute", bottom: "28px", left: "28px",
              fontFamily: "'DM Sans', sans-serif", fontSize: "7px",
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(140,165,210,0.3)",
            }}>Click a district to explore</div>
          )}
        </div>
      </div>

      {/* ── Gallery Modal ── */}
      {galleryHood && (
        <GalleryModal hood={galleryHood} onClose={() => setGalleryId(null)} />
      )}
    </>
  );
}
