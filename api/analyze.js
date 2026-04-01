export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { imageBase64, mimeType, userNote } = req.body
  const EMOTIONS = 'happy, peaceful, nostalgic, lonely, excited, warm, tired, free, tender, restless'
  const prompt = `Analyze this photo's emotional atmosphere.${userNote ? ` Photographer wrote: "${userNote}".` : ''} Return ONE word from: ${EMOTIONS}. Only the word, nothing else.`
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
        { type: 'text', text: prompt }
      ]}]
    })
  })
  const data = await response.json()
  const emotion = data.content?.[0]?.text?.trim().toLowerCase() ?? 'peaceful'
  res.json({ emotion })
}
