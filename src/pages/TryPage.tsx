import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ShaderBackground from "../components/home/ShaderBackground";

// ─────────────────────────────────────────────
//  Neighborhood data
// ─────────────────────────────────────────────
const HOODS = [
  { slug: "financial",         name: "Financial District",     borough: "Manhattan", mood: "Towering & silent",      accent: "#c8a96e", path: "M 182 510 L 230 510 L 238 528 L 226 548 L 200 552 L 180 538 Z",           lx: 207, ly: 532 },
  { slug: "soho",              name: "SoHo / Tribeca",         borough: "Manhattan", mood: "Cast iron & quiet",      accent: "#a0b8d8", path: "M 172 470 L 238 466 L 238 508 L 182 510 L 170 496 Z",                    lx: 205, ly: 491 },
  { slug: "westvillage",       name: "West Village",           borough: "Manhattan", mood: "Hushed & timeless",      accent: "#e8b4a0", path: "M 148 424 L 172 422 L 172 470 L 152 474 L 140 456 Z",                    lx: 158, ly: 449 },
  { slug: "eastvillage",       name: "East Village",           borough: "Manhattan", mood: "Restless & raw",         accent: "#c8a0d0", path: "M 238 422 L 284 420 L 288 462 L 250 468 L 238 466 Z",                    lx: 262, ly: 447 },
  { slug: "greenwich-village", name: "Greenwich Village",      borough: "Manhattan", mood: "Bohemian & alive",       accent: "#d4956e", path: "M 172 422 L 238 422 L 238 466 L 172 470 Z",                              lx: 205, ly: 445 },
  { slug: "chelsea",           name: "Chelsea",                borough: "Manhattan", mood: "Industrial & luminous",  accent: "#90c8a8", path: "M 138 370 L 172 368 L 172 422 L 148 424 L 132 406 Z",                    lx: 152, ly: 396 },
  { slug: "midtown",           name: "Midtown",                borough: "Manhattan", mood: "Relentless & electric",  accent: "#f0a080", path: "M 142 298 L 290 292 L 290 370 L 238 374 L 172 376 L 138 370 Z",          lx: 214, ly: 335 },
  { slug: "upperwest",         name: "Upper West Side",        borough: "Manhattan", mood: "Cultural & unhurried",   accent: "#b8d0e8", path: "M 148 220 L 210 218 L 210 292 L 142 298 L 136 274 Z",                    lx: 168, ly: 258 },
  { slug: "harlem",            name: "Harlem",                 borough: "Manhattan", mood: "Deep & resonant",        accent: "#d4a0a0", path: "M 158 148 L 278 144 L 286 218 L 210 220 L 148 222 L 150 172 Z",          lx: 218, ly: 185 },
  { slug: "gramercy",          name: "Gramercy / Murray Hill", borough: "Manhattan", mood: "Quiet & composed",       accent: "#c8b890", path: "M 172 376 L 238 374 L 290 370 L 288 420 L 238 422 L 172 422 Z",          lx: 231, ly: 399 },
  { slug: "dumbo",             name: "DUMBO",                  borough: "Brooklyn",  mood: "Moody & vast",           accent: "#a8c0d8", path: "M 310 478 L 370 472 L 376 510 L 336 522 L 308 510 Z",                    lx: 341, ly: 498 },
  { slug: "williamsburg",      name: "Williamsburg",           borough: "Brooklyn",  mood: "Loud & searching",       accent: "#d8b8a0", path: "M 308 410 L 380 402 L 384 470 L 312 476 L 306 450 Z",                    lx: 344, ly: 441 },
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

  const manhattanOutline = "M 168 90 L 296 86 L 302 148 L 296 218 L 290 292 L 290 374 L 284 420 L 288 462 L 238 508 L 230 510 L 200 552 L 180 538 L 170 496 L 140 456 L 132 406 L 138 370 L 136 274 L 142 298 L 148 222 L 150 172 L 158 148 Z";
  const brooklynOutline  = "M 298 390 L 396 380 L 404 480 L 388 532 L 340 548 L 298 524 L 296 480 Z";
  const queensOutline    = "M 296 86 L 432 78 L 440 200 L 420 290 L 400 380 L 298 390 L 290 292 Z";
  const njOutline        = "M 55 75 L 136 120 L 138 458 L 126 514 L 55 524 Z";

  return (
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
        <clipPath id="clipMhtn"><path d={manhattanOutline} /></clipPath>
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

      <rect width="480" height="600" fill="url(#waterGrad)" />
      <path d={njOutline} fill="rgba(200,150,70,0.2)" stroke="rgba(180,130,60,0.15)" strokeWidth={0.5} />
      <path d={queensOutline} fill="rgba(210,160,80,0.25)" stroke="rgba(180,130,60,0.2)" strokeWidth={0.5} />
      <path d={brooklynOutline} fill="url(#landGrad)" stroke="rgba(180,130,60,0.3)" strokeWidth={0.6} />
      <path d={brooklynOutline} fill="none" stroke="rgba(200,150,70,0.3)" strokeWidth={3} filter="url(#fShore)" />
      <path d={manhattanOutline} fill="url(#landGrad)" />
      <g clipPath="url(#clipMhtn)">
        <rect x={178} y={226} width={30} height={64}
          fill="rgba(190,150,70,0.25)" stroke="rgba(190,150,70,0.4)" strokeWidth={0.7} strokeDasharray="2 3" />
        {[...Array(12)].map((_, i) => (
          <line key={i} x1={178 + i * 4} y1={226} x2={178 + i * 4} y2={290}
            stroke="rgba(190,150,70,0.15)" strokeWidth={0.4} />
        ))}
      </g>
      <path d={manhattanOutline} fill="none" stroke="rgba(200,150,70,0.2)" strokeWidth={5} filter="url(#fShore)" />
      <path d={manhattanOutline} fill="none" stroke="rgba(180,130,60,0.5)" strokeWidth={0.85} />

      {HOODS.map(h => {
        const isActive = selectedSlug === h.slug;
        const isLit    = litSlugs.includes(h.slug);
        const isHov    = hovered === h.slug;
        const fill   = isLit ? "rgba(208,114,86,0.45)" : isActive || isHov ? "rgba(180,130,60,0.5)" : "rgba(210,160,80,0.2)";
        const stroke = isLit ? "#d07256" : isActive || isHov ? "rgba(210,160,80,0.9)" : "rgba(180,120,40,0.5)";
        const sw     = isActive ? 1.7 : isHov ? 1.1 : isLit ? 1.2 : 0.65;
        const dash   = isActive || isLit ? "none" : isHov ? "3 3" : "2.5 4";
        return (
          <g key={h.slug}>
            <path d={h.path} fill={fill} style={{ transition: "fill 0.25s", pointerEvents: "none" }} />
            {(isLit || isActive || isHov) && (
              <path d={h.path} fill="none"
                stroke={isLit ? "rgba(208,114,86,0.4)" : "rgba(240,200,100,0.6)"}
                strokeWidth={isLit ? 2 : 3} filter="url(#fGlow)" style={{ pointerEvents: "none" }} />
            )}
            {isActive && <path d={h.path} fill={`url(#hatch-${h.slug})`} style={{ pointerEvents: "none" }} />}
            <path d={h.path} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray={dash}
              style={{ cursor: "pointer", transition: "stroke 0.25s, stroke-width 0.25s" }}
              onMouseEnter={() => setHovered(h.slug)}
              onMouseLeave={() => setHovered(null)}
              onClick={e => { e.stopPropagation(); onSelect(h.slug); }} />
            <path d={h.path} fill="transparent" stroke="transparent" strokeWidth={10}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(h.slug)}
              onMouseLeave={() => setHovered(null)}
              onClick={e => { e.stopPropagation(); onSelect(h.slug); }} />
            <text x={h.lx} y={h.ly} textAnchor="middle"
              fill={isActive || isLit ? "rgba(90,55,20,0.85)" : isHov ? "rgba(90,55,20,0.75)" : "rgba(90,55,20,0.45)"}
              fontSize={isActive ? 6.5 : 5.8} fontFamily="'DM Sans', sans-serif" letterSpacing="0.14"
              style={{ pointerEvents: "none", transition: "fill 0.25s" }}>
              {h.name}
            </text>
          </g>
        );
      })}

      {/* Brooklyn Bridge */}
      <g opacity={0.65}>
        <line x1={236} y1={520} x2={310} y2={486} stroke="rgba(160,110,50,0.5)" strokeWidth={1.1} />
        <path d="M 236 517 Q 273 468 310 483" fill="none" stroke="rgba(160,110,50,0.55)" strokeWidth={0.75} />
        <path d="M 236 523 Q 273 474 310 489" fill="none" stroke="rgba(160,110,50,0.35)" strokeWidth={0.55} />
        <line x1={255} y1={510} x2={255} y2={472} stroke="rgba(170,120,55,0.6)" strokeWidth={1.2} />
        <line x1={291} y1={495} x2={291} y2={472} stroke="rgba(170,120,55,0.6)" strokeWidth={1.2} />
      </g>

      {/* Compass */}
      <g transform="translate(390,108)">
        <line x1={0} y1={-11} x2={0} y2={11} stroke="rgba(140,90,40,0.35)" strokeWidth={0.7} />
        <line x1={-11} y1={0} x2={11} y2={0} stroke="rgba(140,90,40,0.35)" strokeWidth={0.7} />
        <circle cx={0} cy={0} r={2} fill="none" stroke="rgba(140,90,40,0.35)" strokeWidth={0.5} />
        <text x={0} y={-14} textAnchor="middle" fill="rgba(140,90,40,0.4)" fontSize={5}
          fontFamily="'DM Sans', sans-serif" letterSpacing="0.1">N</text>
      </g>
    </svg>
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
        background: "rgba(45,27,13,0.85)", backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", zIndex: 100,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            fontFamily: "Georgia, serif", fontStyle: "italic",
            fontSize: "1.1rem", color: "#f5e6c8", textDecoration: "none",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            letterSpacing: "-0.02em",
          }}
        >CityMood</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {mappedCount > 0 && (
            <>
              <span style={{
                fontSize: "0.65rem", color: "rgba(245,230,200,0.5)",
                textTransform: "uppercase", letterSpacing: "0.08em",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {mappedCount} neighborhood{mappedCount !== 1 ? "s" : ""} mapped
              </span>
              <button
                onClick={handleFinish}
                style={{
                  fontSize: "0.65rem", color: "rgba(245,230,200,0.6)",
                  border: "0.5px solid rgba(245,230,200,0.25)", borderRadius: 100,
                  padding: "5px 14px", background: "transparent", cursor: "pointer",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  fontFamily: "'DM Sans', sans-serif", transition: "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(245,230,200,0.9)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,230,200,0.6)")}
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
          textTransform: "uppercase", color: "rgba(45,27,13,0.4)", marginBottom: 8,
          fontFamily: "'DM Sans', sans-serif",
        }}>Build your map</div>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.6rem", color: "#2D1B0D", lineHeight: 1.1, marginBottom: 6,
        }}>Your New York City</div>
        <div style={{
          fontStyle: "italic", fontSize: "0.72rem", color: "rgba(45,27,13,0.5)",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>Select a neighborhood to add your memory</div>
      </div>

      {/* 5. Bottom-left mapped list */}
      {mappedCount > 0 && (
        <div style={{ position: "absolute", bottom: "2rem", left: "2rem", zIndex: 10 }}>
          <div style={{
            fontSize: "0.55rem", letterSpacing: "0.1em",
            textTransform: "uppercase", color: "rgba(45,27,13,0.35)", marginBottom: 8,
            fontFamily: "'DM Sans', sans-serif",
          }}>Mapped so far</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(memories).map(([slug, data]) => (
              <div
                key={slug}
                onClick={() => reopenUpload(slug)}
                style={{
                  background: "rgba(208,114,86,0.18)",
                  border: "0.5px solid rgba(208,114,86,0.35)",
                  borderRadius: 100, padding: "5px 14px", cursor: "pointer",
                  fontSize: "0.75rem", color: "#2D1B0D",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  transition: "background 0.18s", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(208,114,86,0.28)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(208,114,86,0.18)")}
              >
                {getNeighborhoodName(slug)} · {data.photoUrls.length} photo{data.photoUrls.length !== 1 ? "s" : ""}
              </div>
            ))}
          </div>
          <div
            onClick={handleFinish}
            style={{
              fontSize: "0.72rem", color: "#d07256",
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
          background: "rgba(18,12,6,0.88)", backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRight: "0.5px solid rgba(255,255,255,0.06)",
          zIndex: 50, padding: "28px 24px",
          display: "flex", flexDirection: "column", gap: 20,
          transform: showPanel ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s ease",
        }}
      >
        <div style={{ width: 28, height: 2, background: "#d07256", flexShrink: 0 }} />

        <div>
          <div style={{
            fontSize: "0.55rem", letterSpacing: "0.1em",
            textTransform: "uppercase", color: "rgba(245,230,200,0.35)", marginBottom: 4,
            fontFamily: "'DM Sans', sans-serif",
          }}>{getBorough(selectedSlug)}</div>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem", color: "#f5e6c8", lineHeight: 1.1, marginBottom: 4,
          }}>{getNeighborhoodName(selectedSlug)}</div>
          <div style={{
            fontSize: "0.6rem", letterSpacing: "0.08em",
            textTransform: "uppercase", color: "rgba(245,230,200,0.35)",
            fontFamily: "'DM Sans', sans-serif",
          }}>{getMoodTag(selectedSlug)}</div>
        </div>

        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic",
          fontSize: "0.9rem", color: "rgba(245,230,200,0.6)", lineHeight: 1.6,
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
            background: "rgba(208,114,86,0.85)", color: "#f5e6c8",
            border: "none", borderRadius: 100, fontSize: "0.8rem",
            letterSpacing: "0.04em", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(208,114,86,1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(208,114,86,0.85)")}
        >Add a memory →</button>

        <div style={{
          fontSize: "0.55rem", textAlign: "center",
          color: "rgba(245,230,200,0.2)", letterSpacing: "0.08em",
          textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
        }}>ESC to close</div>
      </div>

      {/* 7. Upload overlay — always in DOM, CSS controlled */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(10,6,2,0.82)", backdropFilter: "blur(24px)",
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
                color: "rgba(245,230,200,0.5)", fontSize: "0.75rem",
                fontFamily: "'DM Sans', sans-serif", transition: "color 0.2s",
                letterSpacing: "0.04em",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(245,230,200,0.9)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,230,200,0.5)")}
            >← Back</button>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic",
              fontSize: "1rem", color: "#f5e6c8",
            }}>{getNeighborhoodName(selectedSlug)}</span>
            <span style={{
              fontSize: "0.7rem", color: "rgba(245,230,200,0.4)",
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
              border: `1.5px dashed ${dragOver ? "rgba(208,114,86,0.6)" : "rgba(245,230,200,0.18)"}`,
              borderRadius: 14, minHeight: 160,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 10, cursor: "pointer",
              background: dragOver ? "rgba(208,114,86,0.05)" : "transparent",
              transition: "border-color 0.2s ease, background 0.2s ease",
            }}
          >
            <div style={{ fontSize: "1.8rem", color: "rgba(245,230,200,0.25)", lineHeight: 1 }}>+</div>
            <div style={{ fontSize: "0.78rem", color: "rgba(245,230,200,0.35)", fontFamily: "'DM Sans', sans-serif" }}>
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
                      background: "rgba(255,255,255,0.04)",
                      border: "0.5px solid rgba(255,255,255,0.08)",
                      borderRadius: 6, padding: "6px 8px",
                      color: "rgba(245,230,200,0.75)",
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
            background: "rgba(10,6,2,0.95)",
            borderTop: "0.5px solid rgba(255,255,255,0.06)",
            padding: "16px 0", marginTop: 24,
          }}>
            <button
              onClick={handleSaveAndAddAnother}
              style={{
                width: "100%", height: 52,
                background: "rgba(208,114,86,0.85)", color: "#f5e6c8",
                border: "none", borderRadius: 100,
                fontSize: "0.85rem", letterSpacing: "0.06em", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(208,114,86,1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(208,114,86,0.85)")}
            >Save &amp; add another →</button>
          </div>
        </div>
      </div>

    </div>
  );
}
