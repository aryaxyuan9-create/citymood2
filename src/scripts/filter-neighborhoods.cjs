// filter-neighborhoods.cjs
// Filters NYC NTA GeoJSON, projects coordinates to SVG space, generates HOODS + outlines
const fs = require('fs')

const raw = JSON.parse(fs.readFileSync('public/nyc-neighborhoods.geojson', 'utf8'))

// ─────────────────────────────────────────────
// Neighborhood mapping: our slug → NTA name(s) to merge
// ─────────────────────────────────────────────
const HOOD_MAP = [
  { slug: 'financial',         name: 'Financial District',     borough: 'Manhattan', mood: 'Towering & silent',     accent: '#c8a96e', ntaNames: ['Financial District-Battery Park City'] },
  { slug: 'soho',              name: 'SoHo / Tribeca',         borough: 'Manhattan', mood: 'Cast iron & quiet',     accent: '#a0b8d8', ntaNames: ['SoHo-Little Italy-Hudson Square', 'Tribeca-Civic Center'] },
  { slug: 'westvillage',       name: 'West Village',           borough: 'Manhattan', mood: 'Hushed & timeless',     accent: '#e8b4a0', ntaNames: ['West Village'] },
  { slug: 'eastvillage',       name: 'East Village',           borough: 'Manhattan', mood: 'Restless & raw',        accent: '#c8a0d0', ntaNames: ['East Village'] },
  { slug: 'greenwich-village', name: 'Greenwich Village',      borough: 'Manhattan', mood: 'Bohemian & alive',      accent: '#d4956e', ntaNames: ['Greenwich Village'] },
  { slug: 'chelsea',           name: 'Chelsea',                borough: 'Manhattan', mood: 'Industrial & luminous', accent: '#90c8a8', ntaNames: ['Chelsea-Hudson Yards'] },
  { slug: 'midtown',           name: 'Midtown',                borough: 'Manhattan', mood: 'Relentless & electric', accent: '#f0a080', ntaNames: ['Midtown-Times Square', 'Midtown South-Flatiron-Union Square', 'East Midtown-Turtle Bay'] },
  { slug: 'upperwest',         name: 'Upper West Side',        borough: 'Manhattan', mood: 'Cultural & unhurried',  accent: '#b8d0e8', ntaNames: ['Upper West Side (Central)', 'Upper West Side-Lincoln Square', 'Upper West Side-Manhattan Valley'] },
  { slug: 'harlem',            name: 'Harlem',                 borough: 'Manhattan', mood: 'Deep & resonant',       accent: '#d4a0a0', ntaNames: ['Harlem (North)', 'Harlem (South)', 'Manhattanville-West Harlem'] },
  { slug: 'gramercy',          name: 'Gramercy / Murray Hill', borough: 'Manhattan', mood: 'Quiet & composed',      accent: '#c8b890', ntaNames: ['Gramercy'] },
  { slug: 'dumbo',             name: 'DUMBO',                  borough: 'Brooklyn',  mood: 'Moody & vast',          accent: '#a8c0d8', ntaNames: ['Downtown Brooklyn-DUMBO-Boerum Hill'] },
  { slug: 'williamsburg',      name: 'Williamsburg',           borough: 'Brooklyn',  mood: 'Loud & searching',      accent: '#d8b8a0', ntaNames: ['Williamsburg', 'South Williamsburg'] },
]

const featuresByNta = {}
for (const f of raw.features) featuresByNta[f.properties.ntaname] = f

// Verify NTA names
for (const h of HOOD_MAP) {
  for (const n of h.ntaNames) {
    if (!featuresByNta[n]) console.warn(`WARNING: NTA not found: "${n}" (slug "${h.slug}")`)
  }
}

// ─────────────────────────────────────────────
// Compute bounding box from selected neighborhoods
// ─────────────────────────────────────────────
let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity

function walkCoords(geometry, fn) {
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) for (const pt of ring) fn(pt)
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) for (const ring of poly) for (const pt of ring) fn(pt)
  }
}

for (const h of HOOD_MAP) {
  for (const n of h.ntaNames) {
    const f = featuresByNta[n]
    if (!f) continue
    walkCoords(f.geometry, ([lng, lat]) => {
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    })
  }
}

// Add small padding to bounding box
const padLng = (maxLng - minLng) * 0.05
const padLat = (maxLat - minLat) * 0.05
minLng -= padLng; maxLng += padLng
minLat -= padLat; maxLat += padLat

console.error(`Geographic bounds (padded): lng [${minLng.toFixed(4)}, ${maxLng.toFixed(4)}] lat [${minLat.toFixed(4)}, ${maxLat.toFixed(4)}]`)

// ─────────────────────────────────────────────
// Projection: geo → SVG coordinates
// SVG viewBox is "18 70 384 480" (x:18–402, y:70–550)
// ─────────────────────────────────────────────
const SVG_X_MIN = 32
const SVG_X_MAX = 390
const SVG_Y_MIN = 78
const SVG_Y_MAX = 545

const scaleX = (SVG_X_MAX - SVG_X_MIN) / (maxLng - minLng)
const scaleY = (SVG_Y_MAX - SVG_Y_MIN) / (maxLat - minLat)

function project([lng, lat]) {
  const x = SVG_X_MIN + (lng - minLng) * scaleX
  const y = SVG_Y_MAX - (lat - minLat) * scaleY
  return [x, y]
}

// ─────────────────────────────────────────────
// RDP simplification
// ─────────────────────────────────────────────
function perpDist([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay
  const len2 = dx*dx + dy*dy
  if (len2 === 0) return Math.hypot(px-ax, py-ay)
  const t = Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / len2))
  return Math.hypot(px - ax - t*dx, py - ay - t*dy)
}

function rdp(pts, epsilon) {
  if (pts.length <= 2) return pts
  let maxD = 0, idx = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length-1])
    if (d > maxD) { maxD = d; idx = i }
  }
  if (maxD > epsilon) {
    const l = rdp(pts.slice(0, idx + 1), epsilon)
    const r = rdp(pts.slice(idx), epsilon)
    return [...l.slice(0, -1), ...r]
  }
  return [pts[0], pts[pts.length-1]]
}

function ringToPath(ring, epsilon = 0.8) {
  const pts = ring.map(project)
  const simplified = rdp(pts, epsilon)
  if (simplified.length < 3) return ''
  return 'M ' + simplified.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') + ' Z'
}

function geometryToPaths(geometry, epsilon = 0.8) {
  const parts = []
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      const p = ringToPath(ring, epsilon)
      if (p) parts.push(p)
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) for (const ring of poly) {
      const p = ringToPath(ring, epsilon)
      if (p) parts.push(p)
    }
  }
  return parts.join(' ')
}

// ─────────────────────────────────────────────
// Centroid helpers
// ─────────────────────────────────────────────
function ringCentroid(ring) {
  let sx = 0, sy = 0
  for (const pt of ring) { sx += pt[0]; sy += pt[1] }
  return [sx / ring.length, sy / ring.length]
}

function featureCentroid(geometry) {
  if (geometry.type === 'Polygon') {
    const [cx, cy] = ringCentroid(geometry.coordinates[0])
    return project([cx, cy])
  } else if (geometry.type === 'MultiPolygon') {
    let best = null, bestLen = 0
    for (const poly of geometry.coordinates) {
      if (poly[0].length > bestLen) { bestLen = poly[0].length; best = poly[0] }
    }
    const [cx, cy] = ringCentroid(best)
    return project([cx, cy])
  }
  return [200, 300]
}

// ─────────────────────────────────────────────
// Build output HOODS
// ─────────────────────────────────────────────
const output = []
for (const h of HOOD_MAP) {
  const features = h.ntaNames.map(n => featuresByNta[n]).filter(Boolean)
  if (!features.length) { console.warn(`SKIP: ${h.slug}`); continue }

  const pathParts = features.flatMap(f => {
    const parts = []
    const geom = f.geometry
    if (geom.type === 'Polygon') {
      for (const ring of geom.coordinates) { const p = ringToPath(ring); if (p) parts.push(p) }
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) for (const ring of poly) { const p = ringToPath(ring); if (p) parts.push(p) }
    }
    return parts
  })

  const [lx, ly] = featureCentroid(features[0].geometry)
  output.push({ ...h, path: pathParts.join(' '), lx: +lx.toFixed(1), ly: +ly.toFixed(1) })
}

// ─────────────────────────────────────────────
// Generate borough outlines from all NTAs in each borough
// Merge all outer rings → combined filled path (no overlap, so fill-rule works)
// ─────────────────────────────────────────────
function boroughOutlinePath(boroName, epsilon = 1.5) {
  const features = raw.features.filter(f =>
    f.properties.boroname === boroName &&
    // Only include NTAs that overlap with our bounding box
    (() => {
      let inBounds = false
      walkCoords(f.geometry, ([lng, lat]) => {
        if (lng >= minLng - 0.01 && lng <= maxLng + 0.01 &&
            lat >= minLat - 0.01 && lat <= maxLat + 0.01) inBounds = true
      })
      return inBounds
    })()
  )
  return features.map(f => geometryToPaths(f.geometry, epsilon)).filter(Boolean).join(' ')
}

const manhattanOutlinePath = boroughOutlinePath('Manhattan', 6.0)
const brooklynOutlinePath  = boroughOutlinePath('Brooklyn',  7.0)
const queensOutlinePath    = boroughOutlinePath('Queens',    8.0)

// ─────────────────────────────────────────────
// Write output
// ─────────────────────────────────────────────
const result = {
  hoods: output,
  outlines: {
    manhattan: manhattanOutlinePath,
    brooklyn:  brooklynOutlinePath,
    queens:    queensOutlinePath,
  }
}

fs.writeFileSync('public/nyc-neighborhoods-filtered.geojson', JSON.stringify({
  type: 'FeatureCollection',
  features: output.map((h, i) => ({
    type: 'Feature', id: i + 1,
    properties: { slug: h.slug, name: h.name, borough: h.borough },
    geometry: featuresByNta[HOOD_MAP.find(m => m.slug === h.slug).ntaNames[0]]?.geometry ?? null
  }))
}, null, 2))

fs.writeFileSync('src/scripts/neighborhoods-output.json', JSON.stringify(result, null, 2))
console.error(`\nWrote src/scripts/neighborhoods-output.json`)
console.error(`Wrote public/nyc-neighborhoods-filtered.geojson`)

// Print summary
for (const h of output) {
  console.error(`  ${h.slug.padEnd(20)} label (${h.lx}, ${h.ly})  path ${h.path.length} chars`)
}
