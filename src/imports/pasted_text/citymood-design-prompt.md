CityMood — Design Prompt                                                      
                                                                                
  Concept                                                                       
  A personal photography atlas of New York City. Editorial in tone, intimate in 
  scale — the visual language of a physical zine or a photographer's private    
  archive made digital. Not a utility app. A mood object.                       
                                                                                
  ---                                                       
  Global Background
  Full-viewport fixed mesh gradient, atmospheric and painterly — like a sunset  
  viewed through frosted glass. Six layered radial ellipses composited over a 
  warm base:                                                                    
  - Top-left: soft sky blue (#b8d8f0)                       
  - Top-right: muted violet (#9e9ee6)                                           
  - Upper-center: dusty lavender (#c8b4e8)                                      
  - Mid-center: mauve-rose (#d08ec0)                                            
  - Lower-left: coral peach (#f0a070)                                           
  - Lower-right: warm amber (#f8c878)                                           
  - Base fill: #e4cfc4                                                          
                                                                                
  No hard edges. All stops fade to transparent at 44–55% radius. Static, no     
  animation.                                                                    
                                                                                
  ---                                                                           
  Color System (Light Warm Theme)                           
  --bg:             rgba(253, 246, 238, 0.72)   /* translucent warm cream — lets
   gradient bleed through */                                                    
  --surface:        rgba(255, 255, 255, 0.38)
  --surface-raised: rgba(255, 255, 255, 0.58)                                   
  --border:         rgba(140, 90, 60, 0.14)                                     
  --border-strong:  rgba(120, 70, 40, 0.28)                                     
  --text-primary:   rgba(32, 18, 8, 0.88)       /* near-black warm brown */     
  --text-secondary: rgba(60, 36, 16, 0.60)                                      
  --text-muted:     rgba(60, 36, 16, 0.38)                                      
                                                                                
  Neighborhood mood accent colors are used for dots, rules, and hover states —  
  never as backgrounds.                                                         
  
  ---                                                                           
  Typography                                                
  - Display / headings: Cormorant Garamond — light weight (300), italic for pull
   quotes and poetic copy. Generous tracking on large sizes (-0.01em), tight    
  leading (1.15).                                                               
  - UI / body: DM Sans — regular/medium, very small sizes (8–13px), wide
  letter-spacing (0.18–0.3em), all-caps for labels. Never bold.                 
  - Size vocabulary: hero 2.6rem, section heads 1.1–2.1rem, labels 8–10px, body 
  11–13px. Everything feels deliberately undersized.
                                                                                
  ---                                                       
  Navigation Bar                                                                
  Fixed top, full-width, height 60px. Background: rgba(3,3,15,0.55) with        
  backdrop-filter: blur(12px) — a dark frosted glass strip that contrasts
  sharply against the warm page background. Left: "CityMood" in Cormorant       
  Garamond semibold at 1.45rem, tracking-[0.08em]. Right: a pill-shaped CTA
  button (border border-white/20, rounded-full, text-white/80) that reads "Try  
  yours →" or "Start your map →" depending on auth state.   

  ---
  Home Page Layout
  Two-column split at md breakpoint, full viewport height minus the nav         
  (h-screen pt-[60px]):                                                
                                                                                
  Left — Sidebar (40% width)                                
  Scrollable. border-r border-white/10. Internal rhythm: px-10 horizontal       
  padding, thick my-9 dividers (border-t border-white/10).                      
                                                                                
  - Hero copy block: Cormorant Garamond display title at 2.6rem, followed by    
  2-line descriptor in DM Sans at 12px, leading-[1.9].      
  - Light Tracker widget (below hero copy): A rounded-xl frosted glass card     
  (bg-white/6, backdrop-blur: 12px, colored box-shadow). Inside: a h-48 sky bar 
  that animates a time-of-day gradient (deep night → blue hour → golden hour →
  midday → repeat) using a drifting background-position on a 14s sine cycle. A  
  breathing radial glow pulsates at 8s. Centered text overlay: phase label in
  Cormorant at 30px, italic tagline. Colors shift dramatically by time of day —
  amber/gold for golden hour, near-black for deep night, steel blue for blue
  hour.
  - Neighborhoods list: ul of <li> items separated by border-b border-white/10.
  Each row is a full-width <button> with the neighborhood name (Cormorant,      
  1.1rem) on the left and mood label + photo count (DM Sans, 9px, all-caps) on
  the right. Clicking opens the gallery modal.                                  
  - Mood Index: Labeled section listing all neighborhoods sorted by energy
  descending. Each row: a w-5 h-[2px] colored dash, neighborhood name in        
  text-secondary, mood word in the neighborhood's accent color at 70% opacity.
  - Curator's Note: Italic pull-quote in Cormorant at 1.05rem, followed by a    
  full-width ghost button → /try.                                               
   
  Right — Map (flex-1)                                                          
  Mapbox GL map, light-v11 style, centered on NYC (-73.984, 40.730, zoom 11.4).
  Scroll zoom disabled, drag rotate disabled. Each of six neighborhoods has a   
  custom marker: a 14×14px dot with border-2 in the neighborhood's accent color,
   white fill at rest, accent fill on hover, scaling up 1.45×. An animate-ping  
  pulse ring halos it. Hovering shows an inline tooltip to the right: frosted
  panel with neighborhood name, mood label, and an energy dot-bar (10 × 3px
  dots). Clicking navigates to the neighborhood detail page. Bottom-right:
  compact Mapbox attribution. A coordinate + zoom geo label sits bottom-right
  over the map.

  ---
  Neighborhood Gallery Modal
  Full-screen takeover (fixed inset-0 z-[200]), rgba(0,0,0,0.88) backdrop,
  animates in with opacity: 0 → 1 over 0.28s. Two states:                 
  - Grid: 3-column photo grid, gap-[6px], each cell aspect-ratio: 3/2 with hover
   scale 1.04 and a subtle dark scrim. Photo index badge appears bottom-right on
   hover.                                                                       
  - Lightbox: single full-bleed photo with max-height: calc(100vh - 220px), ← /
  → navigation arrows, n / total counter, italic caption below. Click photo to  
  return to grid. Keyboard: ← → to navigate, Esc to exit lightbox or close      
  modal.                                                                  
                                                                                
  Header: neighborhood name in Cormorant at 2.1rem, subtitle strip (MOOD · 
  BOROUGH · N photos, all-caps 9px). A 1px mood-colored accent rule separates   
  header from content.
                                                                                
  ---                                                       
  Neighborhood Detail Page
  - Hero section: full-viewport-height image with a bg-gradient-to-t from-[--bg]
   via-[--bg]/40 to-transparent scrim. Mood tags, giant Cormorant headline      
  (6xl–8xl), borough in text-secondary tracking-widest uppercase.               
  - Observation block: editorial copy.                           
  - Photo grid: masonry or grid of remaining photos.                            
  - Bottom CTA strip: "How do you photograph [name]?" — Cormorant title +       
  descriptor + ghost button → /try?neighborhood=slug.                           
                                                                                
  ---                                                                           
  Featured Cards Strip (below home viewport)                                    
  Horizontal scroll row of 210px portrait cards. Each card: border              
  border-[--border] with hover border-[--border-strong], 260px tall photo with
  scale(1.03) hover, text strip below with mood-colored w-6 h-[1.5px] accent,   
  neighborhood name in Playfair at 14px, mood in accent color, tagline in
  text-secondary, 10-dot energy bar.                                            
                                                            
  ---
  Interaction Language
  - Hover states are opacity shifts or scale transforms, never color fills or
  box shadows.                                                               
  - Transitions: 200–300ms, linear or ease — nothing bouncy.                    
  - No loading spinners; skeleton states use the existing background.
  - Text buttons use tracking-[0.18–0.22em] uppercase at 9–10px — the "whisper" 
  scale.                                                                        
  - All borders are 1px, hairline. Radii only on the Light Tracker widget and   
  nav pill; everything else is sharp-cornered.         