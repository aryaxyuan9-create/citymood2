import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ShaderBackground from "../components/home/ShaderBackground";
import AtlasStyledMap, { type RepresentativePhoto } from "../components/AtlasStyledMap";
import { NEIGHBORHOOD_DATA } from "../lib/neighborhoods";
import { getNeighborhoodPhotos } from "../lib/photos";

const HOOD_COORDS: Record<string, { lat: number; lng: number }> = {
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

function shortTone(slug: string): string {
  const found = NEIGHBORHOOD_DATA.find((n) => n.slug === slug);
  if (found?.moodTag) return found.moodTag.toLowerCase();
  const fallback: Record<string, string> = {
    financial: "towering and silent",
    soho: "cast iron and quiet",
    westvillage: "hushed and timeless",
    eastvillage: "restless and raw",
    chelsea: "industrial and luminous",
    midtown: "relentless and electric",
    upperwest: "cultural and unhurried",
    harlem: "deep and resonant",
    gramercy: "quiet and composed",
    dumbo: "moody and vast",
    williamsburg: "loud and searching",
  };
  return fallback[slug] ?? "quiet and cinematic";
}

export default function HomePage() {
  const navigate = useNavigate();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const slugs = useMemo(() => NEIGHBORHOOD_DATA.map((n) => n.slug), []);

  const representativePhotos: RepresentativePhoto[] = useMemo(
    () =>
      slugs
        .map((slug) => {
          const coord = HOOD_COORDS[slug];
          const first = getNeighborhoodPhotos(slug)[0];
          if (!coord || !first) return null;
          return { hoodId: slug, url: first, lat: coord.lat, lng: coord.lng };
        })
        .filter((v): v is RepresentativePhoto => Boolean(v)),
    [slugs],
  );

  const active = activeSlug ? NEIGHBORHOOD_DATA.find((n) => n.slug === activeSlug) : null;
  const thumbs = active ? getNeighborhoodPhotos(active.slug).slice(0, 3) : [];

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <ShaderBackground />
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 58, zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 36px",
      }}>
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.1rem", color: "#fff",
        }}>CityMood</button>
        <button onClick={() => navigate("/upload")} style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", letterSpacing: "0.08em",
          textTransform: "uppercase", color: "#fff", background: "transparent",
          border: "1.5px solid rgba(255,255,255,0.7)", borderRadius: 100, padding: "6px 18px", cursor: "pointer",
        }}>Start your map →</button>
      </nav>

      <div style={{ position: "absolute", inset: 0, top: 58, display: "grid", gridTemplateColumns: "64% 36%", zIndex: 5 }}>
        <div style={{ position: "relative", minWidth: 0 }}>
          <AtlasStyledMap
            litIds={slugs}
            selectableIds={slugs}
            activeId={activeSlug}
            onSelect={(id) => setActiveSlug((prev) => (prev === id ? null : id))}
            onBackgroundClick={() => setActiveSlug(null)}
            photoPoints={[]}
            representativePhotos={representativePhotos}
            showMarkers={false}
            interactiveAreas
            lockOverviewMinZoom
          />
          {active && (
            <div style={{
              position: "absolute",
              left: 24,
              bottom: 24,
              width: 300,
              borderRadius: 14,
              border: "0.5px solid rgba(196,174,244,0.35)",
              background: "rgba(12,10,24,0.68)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              padding: "12px 12px 10px",
              boxShadow: "0 10px 32px rgba(8, 6, 18, 0.35)",
            }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#EDE8F8", marginBottom: 4 }}>
                {active.name}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "rgba(210,188,245,0.75)", fontSize: "0.95rem", marginBottom: 8 }}>
                {shortTone(active.slug)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {thumbs.map((url, i) => (
                  <img key={`${active.slug}-${i}`} src={url} alt="" style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 6, objectFit: "cover", border: "0.5px solid rgba(255,255,255,0.1)" }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", placeItems: "center", padding: "2rem" }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "3.2rem",
              fontWeight: 300,
              color: "#EDE8F8",
              lineHeight: 1.05,
              marginBottom: 12,
            }}>Start your map</h1>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              color: "rgba(210,188,245,0.72)",
              fontSize: "1.05rem",
              marginBottom: 18,
            }}>
              Turn your memories into a map of emotions.
            </p>
            <button onClick={() => navigate("/upload")} style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.76rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#fff",
              border: "1.5px solid rgba(255,255,255,0.7)",
              borderRadius: 100,
              padding: "10px 22px",
              background: "transparent",
              cursor: "pointer",
            }}>
              Start your map →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
