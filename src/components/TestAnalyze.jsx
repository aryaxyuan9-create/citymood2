import { useState } from 'react'
import { analyzePhoto } from '../lib/analyzePhoto'
import { fileToBase64 } from '../lib/toBase64'
import { getEmotion } from '../lib/emotions'

export default function TestAnalyze() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    const base64 = await fileToBase64(file)
    const id = await analyzePhoto({ imageBase64: base64, mimeType: file.type })
    setResult(getEmotion(id))
    setLoading(false)
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: 8, margin: '1rem' }}>
      <input type="file" accept="image/*" onChange={handleFile} />
      {loading && <p>analyzing...</p>}
      {result && <p>emotion: <strong>{result.id}</strong> · {result.zh} · <span style={{ color: result.color }}>■</span></p>}
    </div>
  )
}
