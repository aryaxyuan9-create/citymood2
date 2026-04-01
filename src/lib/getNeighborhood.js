export async function getNeighborhood(lat, lng) {
  const res = await fetch('/api/neighborhood', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng })
  })
  const data = await res.json()
  return data.neighborhood ?? 'Unknown'
}
