import { useState } from 'react'
import { analyzePhoto } from '../lib/analyzePhoto'
import { fileToBase64 } from '../lib/toBase64'
import { getEmotion } from '../lib/emotions'
import { readGPS } from '../lib/readExif'
import { getNeighborhood } from '../lib/getNeighborhood'

export default function TestAnalyze() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setResult(null)

    const [base64, gps] = await Promise.all([
      fileToBase64(file),
      readGPS(file)
    ])

    const [emotionId, neighborhood] = await Promise.all([
      analyzePhoto({ imageBase64: base64, mimeType: file.type }),
      gps ? getNeighborhood(gps.lat, gps.lng) : Promise.resolve('No GPS — pin required')
    ])

    setResult({ emotionId, emotion: getEmotion(emotionId), gps, neighborhood })
    setLoading(false)
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: 8, margin: '1rem', fontFamily: 'monospace', fontSize: 13 }}>
      <input type="file" accept="image/*" onChange={handleFile} />
      {loading && <p>analyzing...</p>}
      {result && (
        <div style={{ marginTop: '0.5rem', lineHeight: 2 }}>
          <div>emotion: <strong>{result.emotionId}</strong> · {result.emotion.zh} · <span style={{ color: result.emotion.color }}>■</span></div>
          <div>gps: {result.gps ? `${result.gps.lat.toFixed(5)}, ${result.gps.lng.toFixed(5)}` : 'none'}</div>
          <div>neighborhood: <strong>{result.neighborhood}</strong></div>
        </div>
      )}
    </div>
  )
}
