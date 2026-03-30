import { useEffect, useState } from "react";
import ShaderBackground from "./home/ShaderBackground";

export interface GalleryProps {
  neighborhoodName: string;
  borough: string;
  moodTag: string;
  photos: { url: string; note?: string }[];
  onBack: () => void;
}

export default function NeighborhoodGallery({
  neighborhoodName, borough, moodTag, photos, onBack,
}: GalleryProps) {
  const [hiddenSet, setHiddenSet] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number>(0);
  const [fading, setFading] = useState(false);

  const hideSlot = (i: number) =>
    setHiddenSet(prev => new Set([...prev, i]));

  const visiblePhotos = photos
    .map((photo, i) => ({ ...photo, i }))
    .filter(({ i }) => !hiddenSet.has(i));

  const total = visiblePhotos.length;

  useEffect(() => {
    if (selected >= total && total > 0) setSelected(total - 1);
  }, [total, selected]);

  const selectPhoto = (gridPos: number) => {
    if (gridPos === selected) return;
    setFading(true);
    setTimeout(() => { setSelected(gridPos); setFading(false); }, 200);
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
      if (e.key === "ArrowRight" && selected < total - 1) {
        setFading(true);
        setTimeout(() => { setSelected(selected + 1); setFading(false); }, 200);
      }
      if (e.key === "ArrowLeft" && selected > 0) {
        setFading(true);
        setTimeout(() => { setSelected(selected - 1); setFading(false); }, 200);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onBack, selected, total]);

  const currentPhoto = visiblePhotos[selected];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      display: "flex", animation: "ng-fadeIn 0.26s ease both",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400&display=swap');
        @keyframes ng-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ng-thumbIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <ShaderBackground />

      {/* ── Left panel ── */}
      <div style={{
        width: "30%", flexShrink: 0,
        background: "transparent",
        padding: "24px 16px",
        overflowY: "auto", height: "100vh",
        display: "flex", flexDirection: "column",
        position: "relative", zIndex: 1,
      }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: "0.7rem", color: "rgba(255,255,255,0.5)",
            fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em",
            textAlign: "left", marginBottom: "20px", transition: "color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >← Back</button>

        {/* Hood name */}
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 300,
          fontStyle: "italic", color: "#FFFFFF", marginBottom: "4px", lineHeight: 1.1,
        }}>{neighborhoodName}</h2>

        {/* Meta */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem", letterSpacing: "0.12em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: "16px",
        }}>
          {total > 0 ? `${selected + 1} / ${total}` : "0 photographs"}
          {moodTag ? ` · ${moodTag}` : ""}
        </p>

        {/* Thumbnail grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
          {visiblePhotos.map(({ url, i }, gridPos) => (
            <img
              key={i}
              src={url}
              alt=""
              onError={() => hideSlot(i)}
              onClick={() => selectPhoto(gridPos)}
              style={{
                aspectRatio: "1",
                objectFit: "cover",
                borderRadius: "6px",
                cursor: "pointer",
                width: "100%",
                display: "block",
                opacity: gridPos === selected ? 1 : 0.7,
                outline: gridPos === selected ? "1.5px solid rgba(255,255,255,0.6)" : "1.5px solid transparent",
                outlineOffset: "-1.5px",
                transition: "opacity 0.15s, transform 0.15s",
                animation: `ng-thumbIn 0.3s ease ${gridPos * 0.05}s both`,
              }}
              onMouseEnter={e => {
                if (gridPos !== selected) {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "scale(1.02)";
                }
              }}
              onMouseLeave={e => {
                if (gridPos !== selected) {
                  e.currentTarget.style.opacity = "0.7";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel — centered single image ── */}
      <div style={{
        flex: 1, background: "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "16px",
        position: "relative", zIndex: 1,
      }}>
        {/* Prev arrow */}
        {selected > 0 && (
          <button
            onClick={() => selectPhoto(selected - 1)}
            style={{
              position: "absolute", left: "24px",
              background: "rgba(235,211,208,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              border: "0.5px solid rgba(107,64,64,0.15)", borderRadius: "50%",
              width: "40px", height: "40px",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#5a3535", fontSize: "1.2rem",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(235,211,208,0.9)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(235,211,208,0.6)")}
          >‹</button>
        )}

        {/* Main image + note */}
        {currentPhoto && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <img
              src={currentPhoto.url}
              alt=""
              onError={() => hideSlot(currentPhoto.i)}
              style={{
                maxWidth: "80%", maxHeight: "80vh",
                objectFit: "contain", borderRadius: "8px", display: "block",
                opacity: fading ? 0 : 1,
                transform: fading ? "translateY(4px)" : "translateY(0)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
              }}
            />
            {currentPhoto.note && (
              <p style={{
                fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                fontSize: "0.95rem", color: "rgba(107,64,64,0.55)",
                textAlign: "center", maxWidth: "400px",
              }}>{currentPhoto.note}</p>
            )}
          </div>
        )}

        {/* Next arrow */}
        {selected < total - 1 && (
          <button
            onClick={() => selectPhoto(selected + 1)}
            style={{
              position: "absolute", right: "24px",
              background: "rgba(235,211,208,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              border: "0.5px solid rgba(107,64,64,0.15)", borderRadius: "50%",
              width: "40px", height: "40px",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#5a3535", fontSize: "1.2rem",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(235,211,208,0.9)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(235,211,208,0.6)")}
          >›</button>
        )}
      </div>
    </div>
  );
}
