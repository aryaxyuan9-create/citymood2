export const EMOTIONS = [
  { id: 'happy',     zh: '开心', color: '#F9CB42', dim: 'rgba(249,203,66,0.35)' },
  { id: 'peaceful',  zh: '平静', color: '#5DCAA5', dim: 'rgba(93,202,165,0.35)' },
  { id: 'nostalgic', zh: '怀念', color: '#C9A84C', dim: 'rgba(201,168,76,0.35)' },
  { id: 'lonely',    zh: '孤独', color: '#9B8FCC', dim: 'rgba(155,143,204,0.35)' },
  { id: 'excited',   zh: '兴奋', color: '#F0997B', dim: 'rgba(240,153,123,0.35)' },
  { id: 'warm',      zh: '温暖', color: '#EF9F27', dim: 'rgba(239,159,39,0.35)' },
  { id: 'tired',     zh: '疲惫', color: '#B4B2A9', dim: 'rgba(180,178,169,0.35)' },
  { id: 'free',      zh: '自由', color: '#85B7EB', dim: 'rgba(133,183,235,0.35)' },
  { id: 'tender',    zh: '温柔', color: '#ED93B1', dim: 'rgba(237,147,177,0.35)' },
  { id: 'restless',  zh: '躁动', color: '#D85A30', dim: 'rgba(216,90,48,0.35)' },
]
export const EMOTION_IDS = EMOTIONS.map(e => e.id)
export const getEmotion = (id) => EMOTIONS.find(e => e.id === id) ?? EMOTIONS[1]
