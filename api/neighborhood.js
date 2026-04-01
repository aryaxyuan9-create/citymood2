export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { lat, lng } = req.body
  if (!lat || !lng) return res.json({ neighborhood: 'Unknown' })

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  const response = await fetch(url)
  const data = await response.json()

  const neighborhood = extractNeighborhood(data.results)
  res.json({ neighborhood })
}

function extractNeighborhood(results) {
  if (!results?.length) return 'Unknown'
  for (const result of results) {
    for (const component of result.address_components) {
      if (component.types.includes('neighborhood')) return component.long_name
      if (component.types.includes('sublocality_level_1')) return component.long_name
    }
  }
  for (const result of results) {
    for (const component of result.address_components) {
      if (component.types.includes('locality')) return component.long_name
    }
  }
  return 'Unknown'
}
