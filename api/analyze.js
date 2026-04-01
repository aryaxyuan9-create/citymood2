function buildPrompt(userNote) {
  const list = 'happy, peaceful, nostalgic, lonely, excited, warm, tired, free, tender, restless'

  return `You are reading the emotional truth of a personal photo — not what's happening in it, but how it feels.

Analyze these four dimensions:

1. PERSON (if present): Read the actual expression — not just smile/no smile. Look for: tired eyes, tense jaw, hollow gaze, tears, relaxed shoulders, self-consciousness, genuine ease. A person lying down alone in dim light is tired or lonely, not peaceful. A person laughing mid-motion is excited or happy, not just warm.

2. LIGHT QUALITY: Golden hour warm light = nostalgic or warm. Harsh midday = restless or tired. Blue hour / dusk = lonely or free. Dim indoor lamp = tender or tired. Neon / night city = restless or excited. Flat overcast = peaceful or nostalgic.

3. COLOR + TONE: Warm saturated = happy or excited. Desaturated cool tones = lonely or peaceful. Faded film-like = nostalgic. High contrast = restless or free. Soft pastel = tender or warm.

4. SPACE + COMPOSITION: Person small in large empty space = lonely or free. Extreme close-up filling frame = tender or tired. Blurred / out of focus = nostalgic or tired. Bird's eye self-portrait = tired or lonely.

${userNote ? `The photographer wrote: "${userNote}" — weight this heavily, it reveals intention.` : ''}

Rules:
- Read the FEELING, not the scene. A crowded subway can feel lonely. An empty street can feel free.
- Never default to "peaceful" — it's the most overused and least specific emotion.
- If the photo has a person, their expression overrides everything else.

Choose ONE from: ${list}

Return only the word.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { imageBase64, mimeType, userNote } = req.body
  const prompt = buildPrompt(userNote)
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
