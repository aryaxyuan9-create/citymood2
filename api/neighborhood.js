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

  const priority = [
    'neighborhood',
    'sublocality_level_1',
    'sublocality',
    'premise',
    'natural_feature',
  ]

  for (const type of priority) {
    for (const result of results) {
      for (const component of result.address_components) {
        if (component.types.includes(type)) return component.long_name
      }
    }
  }

  // final fallback: first political subdivision that isn't the city or country
  for (const result of results) {
    for (const component of result.address_components) {
      if (
        component.types.includes('political') &&
        !component.types.includes('locality') &&
        !component.types.includes('administrative_area_level_1') &&
        !component.types.includes('country')
      ) {
        return component.long_name
      }
    }
  }

  return 'Unknown'
}
