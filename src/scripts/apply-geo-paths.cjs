// apply-geo-paths.cjs
// Applies geographic paths + gold styles to App.tsx and AtlasPage.tsx
const fs = require('fs')

const GEO = JSON.parse(fs.readFileSync('src/scripts/neighborhoods-output.json', 'utf8'))

// ─── HOODS path/label mapping by id ───
const geoById = {}
for (const h of GEO.hoods) geoById[h.id || h.slug] = h

// ─── Outline strings ───
const manhattanOutline = GEO.outlines.manhattan
const brooklynOutline  = GEO.outlines.brooklyn
const queensOutline    = GEO.outlines.queens

// ─────────────────────────────────────────────────────────────────────
// Helper: replace path/labelX/labelY in a HOODS block
// Finds each id:"xxx" ... path:"..." labelX:N labelY:N entry and updates it
// ─────────────────────────────────────────────────────────────────────
function replaceHoodsPaths(src) {
  return src.replace(
    /path:"M [^"]+",\s*\n?\s*labelX:\d+(?:\.\d+)?,\s*labelY:\d+(?:\.\d+)?,/g,
    (match, offset) => {
      // find which hood this belongs to by looking backward for id:"..."
      const before = src.slice(Math.max(0, offset - 300), offset)
      const idMatch = before.match(/id:"([^"]+)"[^{]*$/)
      if (!idMatch) return match
      const id = idMatch[1]
      const geo = geoById[id]
      if (!geo) { console.warn('No geo for id:', id); return match }
      return `path:\`${geo.path}\`,\n    labelX:${geo.lx}, labelY:${geo.ly},`
    }
  )
}

// ─────────────────────────────────────────────────────────────────────
// Process App.tsx
// ─────────────────────────────────────────────────────────────────────
let app = fs.readFileSync('src/App.tsx', 'utf8')

// 1. Replace HOODS paths and label positions
app = replaceHoodsPaths(app)

// 2. Replace outline variable declarations in NYCMap function
app = app.replace(
  /const manhattanOutline =\s*"M 168 90[^"]*";/,
  `const manhattanOutline = \`${manhattanOutline}\`;`
)
app = app.replace(
  /const brooklynOutline =\s*"M 298 390[^"]*";/,
  `const brooklynOutline  = \`${brooklynOutline}\`;`
)
app = app.replace(
  /const queensOutline =\s*"M 296 86[^"]*";/,
  `const queensOutline    = \`${queensOutline}\`;`
)

// 3. Remove njOutline declaration and its path element
app = app.replace(/\s*const njOutline =\s*"M 55 75[^"]*";/, '')
app = app.replace(/\s*\{\/\* ── NJ \(bg\) ── \*\/\}\s*\n\s*<path d=\{njOutline\}[^/]*\/>/, '')

// 4. Update water rect size
app = app.replace(
  '<rect width="480" height="600" fill="url(#waterGrad)" />',
  '<rect width="402" height="550" fill="url(#waterGrad)" />'
)

// 5. Remove Central Park block (clipManhattan guard + rect + lines + text)
app = app.replace(
  /\s*\{\/\* ── Central Park \(special zone\) ── \*\/\}\s*\n\s*<g clipPath="url\(#clipManhattan\)">[^<]*<rect[^/]*\/>[^<]*\{[^}]*\}\)[^<]*<\/g>/s,
  ''
)
// Also remove the hidden clip groups for Brooklyn/Queens
app = app.replace(/\s*\{\/\* Queens grid — hidden \*\/\}\s*\n\s*<g clipPath="url\(#clipQueens\)"[^/]*\/>/, '')
app = app.replace(/\s*\{\/\* Brooklyn street grid — hidden \*\/\}\s*\n\s*<g clipPath="url\(#clipBrooklyn\)"[^/]*\/>/, '')
app = app.replace(/\s*\{\/\* Manhattan street grid — hidden \*\/\}\s*\n\s*<g clipPath="url\(#clipManhattan\)" opacity=\{0\} \/>/, '')

// 6. Remove clipBrooklyn and clipQueens defs (no longer needed)
app = app.replace(/\s*<clipPath id="clipBrooklyn"><path d=\{brooklynOutline\} \/><\/clipPath>/, '')
app = app.replace(/\s*<clipPath id="clipQueens"><path d=\{queensOutline\} \/><\/clipPath>/, '')

// 7. Remove Brooklyn Bridge and Manhattan Bridge decorations
app = app.replace(
  /\s*\{\/\* ── Brooklyn Bridge — line art ── \*\/\}\s*\n\s*<g opacity=\{0\.65\}>[\s\S]*?<\/g>\s*\n\s*\{\/\* ── Manhattan Bridge \(simplified\) ── \*\/\}\s*\n\s*<g opacity=\{0\.4\}>[\s\S]*?<\/g>/,
  ''
)

// 8. Update neighborhood fill/stroke/label styles to match TryPage gold theme
// Replace the neighborhood fill/glow/border/label logic block
const oldNeighStyle = `        return (
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
              <path d={hood.path} fill={\`url(#hatch-\${hood.id})\`} />
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
        );`

const newNeighStyle = `        const fill   = isActive ? "rgba(240,160,80,0.18)" : isHovered ? "rgba(240,170,70,0.08)" : "rgba(240,190,80,0.04)";
        const stroke = isActive ? "rgba(240,180,80,1.0)" : isHovered ? "rgba(240,190,80,0.5)" : "rgba(240,190,80,0.22)";
        const sw     = isActive ? 2 : isHovered ? 1.2 : 0.8;
        return (
          <g key={hood.id}>
            <path d={hood.path} fill={fill} style={{ transition: "fill 0.25s", pointerEvents: "none" }} />
            {isActive && (
              <path d={hood.path} fill={\`url(#hatch-\${hood.id})\`} style={{ pointerEvents: "none" }} />
            )}
            <path d={hood.path} fill="none" stroke={stroke} strokeWidth={sw}
              style={{ cursor: "pointer", transition: "stroke 0.25s, stroke-width 0.25s" }}
              onMouseEnter={() => setHovered(hood.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(hood.id)} />
            <path d={hood.path} fill="transparent" stroke="transparent" strokeWidth={10}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(hood.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(hood.id)} />
            <text x={hood.labelX} y={hood.labelY} textAnchor="middle"
              fill={isActive || isHovered ? "rgba(240,180,80,0.75)" : "rgba(240,200,100,0.35)"}
              fontSize={9} fontFamily="'DM Sans', sans-serif" letterSpacing="0.15"
              style={{ pointerEvents: "none", transition: "fill 0.25s", textTransform: "uppercase" }}>
              {hood.name}
            </text>
          </g>
        );`

if (app.includes(oldNeighStyle)) {
  app = app.replace(oldNeighStyle, newNeighStyle)
  console.log('App.tsx: replaced neighborhood styles')
} else {
  console.warn('App.tsx: neighborhood style block not found — check manually')
}

fs.writeFileSync('src/App.tsx', app)
console.log('App.tsx written')

// ─────────────────────────────────────────────────────────────────────
// Process AtlasPage.tsx
// ─────────────────────────────────────────────────────────────────────
let atlas = fs.readFileSync('src/pages/AtlasPage.tsx', 'utf8')

// 1. Replace HOODS paths
atlas = replaceHoodsPaths(atlas)

// 2. Replace outline vars
atlas = atlas.replace(
  /const manhattanOutline =\s*\n\s*"M 168 90[^"]*";/,
  `const manhattanOutline = \`${manhattanOutline}\`;`
)
atlas = atlas.replace(
  /const brooklynOutline =\s*\n\s*"M 298 390[^"]*";/,
  `const brooklynOutline = \`${brooklynOutline}\`;`
)
atlas = atlas.replace(
  /const queensOutline =\s*\n\s*"M 296 86[^"]*";/,
  `const queensOutline = \`${queensOutline}\`;`
)
atlas = atlas.replace(
  /const njOutline =\s*\n\s*"M 55 75[^"]*";/,
  ''
)

// 3. Remove njOutline path element
atlas = atlas.replace(/\s*<path d=\{njOutline\} fill="rgba\(200,150,70,0\.2\)"[^/]*\/>/, '')

// 4. Update water rect
atlas = atlas.replace(
  '<rect width="480" height="600" fill="url(#atlas-waterGrad)" />',
  '<rect width="402" height="550" fill="url(#atlas-waterGrad)" />'
)

// 5. Remove Central Park block
atlas = atlas.replace(
  /\s*<g clipPath="url\(#atlas-clipManhattan\)">\s*\n\s*<rect x=\{178\}[\s\S]*?<\/g>/,
  ''
)

// 6. Remove clipPath def for atlas-clipManhattan
atlas = atlas.replace(
  /\s*<clipPath id="atlas-clipManhattan"><path d=\{manhattanOutline\} \/><\/clipPath>/,
  ''
)

// 7. Remove Brooklyn Bridge / Manhattan Bridge in AtlasPage
atlas = atlas.replace(
  /\s*\{\/\* Brooklyn Bridge \*\/\}\s*\n\s*<g opacity=\{0\.65\}>[\s\S]*?<\/g>\s*\n\s*<g opacity=\{0\.4\}>[\s\S]*?<\/g>/,
  ''
)

// 8. Update neighborhood fill/stroke/label styles to gold theme (preserving lit state)
const oldAtlasStyle = `        const fillColor = isActive || isHovered
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
              <path d={hood.path} fill={\`url(#atlas-hatch-\${hood.id})\`} />
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
        );`

const newAtlasStyle = `        const fill   = isActive ? "rgba(240,160,80,0.18)" : isLit ? "rgba(240,160,80,0.15)" : isHovered ? "rgba(240,170,70,0.08)" : "rgba(240,190,80,0.04)";
        const stroke = isActive ? "rgba(240,180,80,1.0)" : isLit ? "rgba(240,180,80,0.85)" : isHovered ? "rgba(240,190,80,0.5)" : "rgba(240,190,80,0.22)";
        const sw     = isActive ? 2 : isLit ? 1.5 : isHovered ? 1.2 : 0.8;
        const isClickable = isLit;

        return (
          <g key={hood.id}>
            <path d={hood.path} fill={fill} style={{ transition: "fill 0.25s", pointerEvents: "none" }} />
            {isLit && (
              <path d={hood.path} fill="none"
                stroke="rgba(240,180,80,0.4)" strokeWidth={4}
                filter="url(#atlas-fGlow)" style={{ pointerEvents: "none" }} />
            )}
            {isActive && (
              <path d={hood.path} fill={\`url(#atlas-hatch-\${hood.id})\`} style={{ pointerEvents: "none" }} />
            )}
            <path d={hood.path} fill="none" stroke={stroke} strokeWidth={sw}
              style={{ cursor: isClickable ? "pointer" : "default", transition: "stroke 0.25s, stroke-width 0.25s" }}
              onMouseEnter={() => { if (isClickable) setHovered(hood.id); }}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { if (isClickable) onSelect(hood.id); }}
            />
            {isClickable && (
              <path d={hood.path} fill="transparent" stroke="transparent" strokeWidth={10}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(hood.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(hood.id)} />
            )}
            <text x={hood.labelX} y={hood.labelY} textAnchor="middle"
              fill={isActive || isLit ? "rgba(240,180,80,0.75)" : "rgba(240,200,100,0.35)"}
              fontSize={9} fontFamily="'DM Sans', sans-serif" letterSpacing="0.15"
              style={{ pointerEvents: "none", transition: "fill 0.25s", textTransform: "uppercase" }}>
              {hood.name}
            </text>
          </g>
        );`

if (atlas.includes(oldAtlasStyle)) {
  atlas = atlas.replace(oldAtlasStyle, newAtlasStyle)
  console.log('AtlasPage.tsx: replaced neighborhood styles')
} else {
  console.warn('AtlasPage.tsx: neighborhood style block not found — check manually')
}

fs.writeFileSync('src/pages/AtlasPage.tsx', atlas)
console.log('AtlasPage.tsx written')
