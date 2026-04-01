import { EMOTION_IDS } from './emotions'
export async function analyzePhoto({ imageBase64, mimeType = 'image/jpeg', userNote = '' }) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType, userNote })
  })
  const data = await res.json()
  return EMOTION_IDS.includes(data.emotion) ? data.emotion : 'peaceful'
}
