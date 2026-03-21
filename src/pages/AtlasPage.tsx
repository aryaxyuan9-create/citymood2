import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShaderBackground from "../components/home/ShaderBackground";

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
  photoCount: number;
  photoBase64s: string[];
};

type AtlasData = {
  id: string;
  createdAt: number;
  neighborhoods: Record<string, NeighborhoodMemory>;
};

// ─────────────────────────────────────────────
//  Neighborhood data
// ─────────────────────────────────────────────
const HOODS: Hood[] = [
  {
    id:"financial", name:"Financial District", borough:"Manhattan", mood:"Towering & silent", energy:6,
    accent:"#c8a96e", glow:"rgba(200,169,110,0.5)",
    path:"M 182 510 L 230 510 L 238 528 L 226 548 L 200 552 L 180 538 Z",
    labelX:207, labelY:532,
  },
  {
    id:"soho", name:"SoHo / Tribeca", borough:"Manhattan", mood:"Cast iron & quiet", energy:7,
    accent:"#a0b8d8", glow:"rgba(160,184,216,0.5)",
    path:"M 172 470 L 238 466 L 238 508 L 182 510 L 170 496 Z",
    labelX:205, labelY:491,
  },
  {
    id:"westvillage", name:"West Village", borough:"Manhattan", mood:"Hushed & timeless", energy:5,
    accent:"#e8b4a0", glow:"rgba(232,180,160,0.5)",
    path:"M 148 424 L 172 422 L 172 470 L 152 474 L 140 456 Z",
    labelX:158, labelY:449,
  },
  {
    id:"eastvillage", name:"East Village", borough:"Manhattan", mood:"Restless & raw", energy:9,
    accent:"#c8a0d0", glow:"rgba(200,160,208,0.5)",
    path:"M 238 422 L 284 420 L 288 462 L 250 468 L 238 466 Z",
    labelX:262, labelY:447,
  },
  {
    id:"greenwich-village", name:"Greenwich Village", borough:"Manhattan", mood:"Bohemian & alive", energy:8,
    accent:"#d4956e", glow:"rgba(212,149,110,0.5)",
    path:"M 172 422 L 238 422 L 238 466 L 172 470 Z",
    labelX:205, labelY:445,
  },
  {
    id:"chelsea", name:"Chelsea", borough:"Manhattan", mood:"Industrial & luminous", energy:8,
    accent:"#90c8a8", glow:"rgba(144,200,168,0.5)",
    path:"M 138 370 L 172 368 L 172 422 L 148 424 L 132 406 Z",
    labelX:152, labelY:396,
  },
  {
    id:"midtown", name:"Midtown", borough:"Manhattan", mood:"Relentless & electric", energy:10,
    accent:"#f0a080", glow:"rgba(240,160,128,0.5)",
    path:"M 142 298 L 290 292 L 290 370 L 238 374 L 172 376 L 138 370 Z",
    labelX:214, labelY:335,
  },
  {
    id:"upperwest", name:"Upper West Side", borough:"Manhattan", mood:"Cultural & unhurried", energy:6,
    accent:"#b8d0e8", glow:"rgba(184,208,232,0.5)",
    path:"M 148 220 L 210 218 L 210 292 L 142 298 L 136 274 Z",
    labelX:168, labelY:258,
  },
  {
    id:"harlem", name:"Harlem", borough:"Manhattan", mood:"Deep & resonant", energy:8,
    accent:"#d4a0a0", glow:"rgba(212,160,160,0.5)",
    path:"M 158 148 L 278 144 L 286 218 L 210 220 L 148 222 L 150 172 Z",
    labelX:218, labelY:185,
  },
  {
    id:"gramercy", name:"Gramercy / Murray Hill", borough:"Manhattan", mood:"Quiet & composed", energy:5,
    accent:"#c8b890", glow:"rgba(200,184,144,0.5)",
    path:"M 172 376 L 238 374 L 290 370 L 288 420 L 238 422 L 172 422 Z",
    labelX:231, labelY:399,
  },
  {
    id:"dumbo", name:"DUMBO", borough:"Brooklyn", mood:"Moody & vast", energy:7,
    accent:"#a8c0d8", glow:"rgba(168,192,216,0.5)",
    path:"M 310 478 L 370 472 L 376 510 L 336 522 L 308 510 Z",
    labelX:341, labelY:498,
  },
  {
    id:"williamsburg", name:"Williamsburg", borough:"Brooklyn", mood:"Loud & searching", energy:9,
    accent:"#d8b8a0", glow:"rgba(216,184,160,0.5)",
    path:"M 308 410 L 380 402 L 384 470 L 312 476 L 306 450 Z",
    labelX:344, labelY:441,
  },
];

// ─────────────────────────────────────────────
//  Atlas SVG Map — read-only with lit + active
// ─────────────────────────────────────────────
function AtlasMap({
  litIds, activeId, onSelect,
}: {
  litIds: string[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
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
        {HOODS.map(hood => (
          <pattern key={`pat-${hood.id}`} id={`atlas-hatch-${hood.id}`}
            x="0" y="0" width="9" height="9"
            patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="9"
              stroke={hood.accent} strokeWidth="0.6" opacity="0.28" />
          </pattern>
        ))}
        <clipPath id="atlas-clipManhattan"><path d={manhattanOutline} /></clipPath>
        <filter id="atlas-fGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="atlas-fShoreGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="atlas-waterGrad" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(180,130,60,0.15)" />
          <stop offset="100%" stopColor="rgba(160,110,50,0.2)" />
        </linearGradient>
        <linearGradient id="atlas-landGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(210,160,80,0.35)" />
          <stop offset="100%" stopColor="rgba(190,140,65,0.35)" />
        </linearGradient>
      </defs>

      <rect width="480" height="600" fill="url(#atlas-waterGrad)" />
      <path d={njOutline} fill="rgba(200,150,70,0.2)" stroke="rgba(180,130,60,0.15)" strokeWidth={0.5} />
      <path d={queensOutline} fill="rgba(210,160,80,0.25)" stroke="rgba(180,130,60,0.2)" strokeWidth={0.5} />
      <path d={brooklynOutline} fill="url(#atlas-landGrad)" stroke="rgba(180,130,60,0.3)" strokeWidth={0.6} />
      <path d={brooklynOutline} fill="none" stroke="rgba(200,150,70,0.3)" strokeWidth={3} filter="url(#atlas-fShoreGlow)" />
      <path d={manhattanOutline} fill="url(#atlas-landGrad)" />

      <g clipPath="url(#atlas-clipManhattan)">
        <rect x={178} y={226} width={30} height={64}
          fill="rgba(190,150,70,0.25)" stroke="rgba(190,150,70,0.4)" strokeWidth={0.7} strokeDasharray="2 3" />
        {[...Array(12)].map((_, i) => (
          <line key={`cp${i}`} x1={178 + i * 4} y1={226} x2={178 + i * 4} y2={290}
            stroke="rgba(190,150,70,0.15)" strokeWidth={0.4} />
        ))}
      </g>

      <path d={manhattanOutline} fill="none" stroke="rgba(200,150,70,0.2)" strokeWidth={5} filter="url(#atlas-fShoreGlow)" />
      <path d={manhattanOutline} fill="none" stroke="rgba(180,130,60,0.5)" strokeWidth={0.85} />

      {HOODS.map((hood) => {
        const isActive = activeId === hood.id;
        const isHovered = hovered === hood.id;
        const isLit = litIds.includes(hood.id);

        const fillColor = isActive || isHovered
          ? "rgba(180,130,60,0.5)"
          : isLit ? "rgba(208,114,86,0.5)"
          : "rgba(210,160,80,0.15)";

        const borderColor = isActive || isHovered
          ? "rgba(210,160,80,0.9)"
          : isLit ? "#d07256"
          : "rgba(180,120,40,0.3)";

        const isClickable = isLit;

        return (
          <g key={hood.id}>
            <path d={hood.path} fill={fillColor}
              style={{ transition: "fill 0.25s", pointerEvents: "none" }} />
            {(isActive || isHovered) && isLit && (
              <path d={hood.path} fill="none"
                stroke="rgba(240,200,100,0.6)" strokeWidth={3}
                filter="url(#atlas-fGlow)" style={{ pointerEvents: "none" }} />
            )}
            {isLit && !isActive && !isHovered && (
              <path d={hood.path} fill="none"
                stroke="rgba(208,114,86,0.35)" strokeWidth={2}
                filter="url(#atlas-fGlow)" style={{ pointerEvents: "none" }} />
            )}
            {isActive && (
              <path d={hood.path} fill={`url(#atlas-hatch-${hood.id})`} />
            )}
            <path d={hood.path} fill="none"
              stroke={borderColor}
              strokeWidth={isActive ? 1.7 : isHovered && isLit ? 1.3 : isLit ? 1.2 : 0.5}
              strokeDasharray={isActive ? "none" : isLit ? "none" : "2.5 4"}
              style={{
                cursor: isClickable ? "pointer" : "default",
                transition: "stroke 0.25s, stroke-width 0.25s",
              }}
              onMouseEnter={() => { if (isClickable) setHovered(hood.id); }}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { if (isClickable) onSelect(hood.id); }}
            />
            {isClickable && (
              <path d={hood.path} fill="transparent" strokeWidth={10} stroke="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(hood.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(hood.id)} />
            )}
            <text x={hood.labelX} y={hood.labelY} textAnchor="middle"
              fill={isActive ? hood.accent : isHovered && isLit ? "rgba(90,55,20,0.85)" : isLit ? "rgba(90,55,20,0.7)" : "rgba(90,55,20,0.25)"}
              fontSize={isActive ? 6.5 : 5.8}
              fontFamily="'DM Sans', sans-serif" letterSpacing="0.14"
              style={{ pointerEvents: "none", transition: "fill 0.25s" }}>
              {hood.name}
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
        <line x1={252} y1={478} x2={258} y2={478} stroke="rgba(170,120,55,0.5)" strokeWidth={0.7} />
        <line x1={288} y1={478} x2={294} y2={478} stroke="rgba(170,120,55,0.5)" strokeWidth={0.7} />
        {[0.22, 0.4, 0.58, 0.76].map((t, i) => {
          const p0x = 236, p0y = 517, p1x = 273, p1y = 468, p2x = 310, p2y = 483;
          const bx = (1-t)*(1-t)*p0x + 2*(1-t)*t*p1x + t*t*p2x;
          const by = (1-t)*(1-t)*p0y + 2*(1-t)*t*p1y + t*t*p2y;
          const dx = p0x + t * (p2x - p0x);
          const dy = p0y + t * (p2y - p0y);
          return <line key={i} x1={bx} y1={by} x2={dx} y2={dy} stroke="rgba(150,100,45,0.35)" strokeWidth={0.4} />;
        })}
      </g>
      <g opacity={0.4}>
        <line x1={248} y1={504} x2={322} y2={474} stroke="rgba(150,100,45,0.45)" strokeWidth={0.7} />
        <path d="M 248 501 Q 285 462 322 471" fill="none" stroke="rgba(150,100,45,0.45)" strokeWidth={0.5} />
      </g>

      <g transform="translate(450,108)">
        <line x1={0} y1={-11} x2={0} y2={11} stroke="rgba(140,90,40,0.35)" strokeWidth={0.7} />
        <line x1={-11} y1={0} x2={11} y2={0} stroke="rgba(140,90,40,0.35)" strokeWidth={0.7} />
        <circle cx={0} cy={0} r={2} fill="none" stroke="rgba(140,90,40,0.35)" strokeWidth={0.5} />
        <text x={0} y={-14} textAnchor="middle" fill="rgba(140,90,40,0.4)"
          fontSize={5} fontFamily="'DM Sans', sans-serif" letterSpacing="0.1">N</text>
      </g>
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
//  Photo Lightbox
// ─────────────────────────────────────────────
function PhotoLightbox({
  photos, hood, onClose,
}: {
  photos: string[];
  hood: Hood;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setIdx(i => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [photos.length, onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(4,6,18,0.96)", backdropFilter: "blur(10px)",
        display: "flex", flexDirection: "column",
        animation: "atlas-fadeIn 0.22s ease both",
      }}
      onClick={onClose}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 28px", borderBottom: `1px solid ${hood.accent}33`,
        flexShrink: 0,
      }} onClick={e => e.stopPropagation()}>
        <div>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 300,
            color: "rgba(235,225,210,0.97)", letterSpacing: "-0.01em",
          }}>{hood.name}</h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "7px",
            letterSpacing: "0.24em", textTransform: "uppercase",
            color: "rgba(200,185,162,0.4)", marginTop: "3px",
          }}>{idx + 1} / {photos.length}</p>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.45)", cursor: "pointer", borderRadius: "3px",
          padding: "5px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: "7px",
          letterSpacing: "0.2em", textTransform: "uppercase",
        }}>ESC ×</button>
      </div>

      {/* Image */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 64px", position: "relative",
      }} onClick={e => e.stopPropagation()}>
        <img src={photos[idx]} alt=""
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block", borderRadius: "4px" }} />
        {photos.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
              style={{
                position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "rgba(255,255,255,0.4)",
                cursor: "pointer", fontSize: "22px", transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >←</button>
            <button onClick={() => setIdx(i => (i + 1) % photos.length)}
              style={{
                position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "rgba(255,255,255,0.4)",
                cursor: "pointer", fontSize: "22px", transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >→</button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div style={{
          display: "flex", gap: "6px", justifyContent: "center",
          padding: "12px 28px 20px", flexShrink: 0,
        }} onClick={e => e.stopPropagation()}>
          {photos.map((url, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{
              width: "44px", height: "30px", borderRadius: "3px", overflow: "hidden",
              cursor: "pointer", opacity: i === idx ? 1 : 0.4,
              border: i === idx ? `1px solid ${hood.accent}` : "1px solid transparent",
              transition: "opacity 0.2s, border-color 0.2s", flexShrink: 0,
            }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}
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
  const [notFound, setNotFound] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lightboxHoodId, setLightboxHoodId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); return; }
    try {
      const raw = localStorage.getItem(`citymood-map-${id}`);
      if (!raw) { setNotFound(true); return; }
      setData(JSON.parse(raw));
    } catch {
      setNotFound(true);
    }
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

  if (!data) return null; // loading

  const mappedHoods = HOODS.filter(h => data.neighborhoods[h.id]);
  const litIds = mappedHoods.map(h => h.id);
  const totalPhotos = mappedHoods.reduce((sum, h) => sum + (data.neighborhoods[h.id]?.photoCount ?? 0), 0);

  const shareUrl = `${window.location.origin}/atlas/${id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lightboxHood = lightboxHoodId ? HOODS.find(h => h.id === lightboxHoodId) : null;
  const lightboxPhotos = lightboxHoodId ? (data.neighborhoods[lightboxHoodId]?.photoBase64s ?? []) : [];

  const handleHoodSelect = (id: string) => {
    setActiveId(prev => prev === id ? null : id);
    const mem = data.neighborhoods[id];
    if (mem?.photoBase64s?.length) {
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
      `}</style>

      <ShaderBackground />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "54px", zIndex: 100,
        background: "rgba(45,27,13,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
      }}>
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          fontFamily: "Georgia, 'Cormorant Garamond', serif", fontSize: "1.1rem",
          fontStyle: "italic", color: "#f5e6c8", letterSpacing: "-0.02em",
        }}>CityMood</button>
        <button onClick={() => navigate("/try")} style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", letterSpacing: "0.1em",
          textTransform: "uppercase", color: "rgba(245,230,200,0.5)",
          background: "transparent", border: "0.5px solid rgba(245,230,200,0.25)",
          borderRadius: "100px", padding: "6px 16px", cursor: "pointer", transition: "color 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(245,230,200,0.9)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,230,200,0.5)")}
        >
          Start a new map →
        </button>
      </nav>

      {/* Main 3:7 layout */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", height: "100vh", paddingTop: "54px",
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
            fontFamily: "'DM Sans', sans-serif", fontSize: "7px",
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: "rgba(45,27,13,0.5)", marginBottom: "12px",
          }}>Your NYC Map</p>

          {/* Heading */}
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "2.8rem", fontWeight: 300,
            color: "#2D1B0D", letterSpacing: "-0.02em", lineHeight: 1.08,
            marginBottom: "10px",
          }}>Your New<br />York</h1>

          {/* Subtext */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem",
            color: "rgba(45,27,13,0.55)", lineHeight: 1.6, marginBottom: "20px",
          }}>
            {mappedHoods.length} neighborhood{mappedHoods.length !== 1 ? "s" : ""} · {totalPhotos} {totalPhotos === 1 ? "memory" : "memories"}
          </p>

          {/* Divider */}
          <div style={{ height: "0.5px", background: "rgba(45,27,13,0.1)", marginBottom: "20px" }} />

          {/* Neighborhood list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0", marginBottom: "28px" }}>
            {mappedHoods.map((hood, i) => {
              const mem = data.neighborhoods[hood.id];
              const hasPhotos = mem?.photoBase64s?.length > 0;
              const isActive = activeId === hood.id;
              return (
                <div
                  key={hood.id}
                  style={{
                    borderBottom: "0.5px solid rgba(45,27,13,0.08)",
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
                    onMouseEnter={e => { if (hasPhotos) e.currentTarget.style.opacity = "0.75"; }}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "5px", height: "5px", borderRadius: "50%",
                        background: hood.accent, opacity: isActive ? 1 : 0.5,
                        boxShadow: isActive ? `0 0 8px ${hood.accent}` : "none",
                        transition: "all 0.3s", flexShrink: 0,
                      }} />
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontWeight: 300,
                        color: "#2D1B0D", transition: "color 0.2s",
                      }}>{hood.name}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px" }}>
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: "6.5px",
                        letterSpacing: "0.16em", textTransform: "uppercase",
                        color: "rgba(45,27,13,0.4)",
                      }}>
                        {mem?.photoCount ?? 0} photo{(mem?.photoCount ?? 0) !== 1 ? "s" : ""}
                      </span>
                      {hasPhotos && (
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: "6px",
                          letterSpacing: "0.14em", textTransform: "uppercase",
                          color: hood.accent, opacity: 0.7,
                        }}>view →</span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: "0.5px", background: "rgba(45,27,13,0.1)", marginBottom: "20px" }} />

          {/* Share section */}
          <div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "7px",
              letterSpacing: "0.3em", textTransform: "uppercase",
              color: "rgba(45,27,13,0.4)", marginBottom: "10px",
            }}>Share your map</p>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <input
                readOnly
                value={shareUrl}
                style={{
                  flex: 1, background: "rgba(45,27,13,0.06)",
                  border: "0.5px solid rgba(45,27,13,0.12)",
                  borderRadius: "8px", padding: "8px 12px",
                  fontSize: "0.72rem", color: "rgba(45,27,13,0.6)",
                  fontFamily: "'DM Sans', sans-serif",
                  outline: "none", cursor: "text",
                }}
                onFocus={e => e.currentTarget.select()}
              />
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? "rgba(45,27,13,0.14)" : "rgba(45,27,13,0.08)",
                  border: "0.5px solid rgba(45,27,13,0.14)",
                  borderRadius: "6px", padding: "8px 14px",
                  cursor: "pointer", whiteSpace: "nowrap",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem",
                  letterSpacing: "0.06em", color: copied ? "rgba(45,27,13,0.8)" : "rgba(45,27,13,0.55)",
                  transition: "all 0.2s", flexShrink: 0,
                }}
              >
                {copied ? "Copied ✓" : "Copy link"}
              </button>
            </div>

            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem",
              color: "rgba(45,27,13,0.38)", lineHeight: 1.5,
            }}>
              Anyone with this link can view your map.
            </p>
          </div>
        </div>

        {/* ── RIGHT MAP PANEL ── */}
        <div style={{ width: "70%", flexShrink: 0, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <AtlasMap
              litIds={litIds}
              activeId={activeId}
              onSelect={handleHoodSelect}
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
              Click a lit neighborhood to view photos
            </div>
          )}
        </div>
      </div>

      {/* Photo Lightbox */}
      {lightboxHood && lightboxPhotos.length > 0 && (
        <PhotoLightbox
          photos={lightboxPhotos}
          hood={lightboxHood}
          onClose={() => { setLightboxHoodId(null); setActiveId(null); }}
        />
      )}
    </>
  );
}
