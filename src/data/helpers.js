import lessonsRaw from './lessons.json'
import verbsRaw from './verbs.json'

export const LESSONS = Object.entries(lessonsRaw)
  .map(([id, items]) => ({ id: Number(id), items }))
  .filter(l => l.id >= 20 && l.id <= 28)
  .sort((a, b) => a.id - b.id)

export const VERBS = verbsRaw

export const BINYANS = [...new Set(VERBS.map(v => v.binyan))].sort()

export function getPool(lessonId) {
  return LESSONS
    .filter(l => l.id <= lessonId)
    .flatMap(l => l.items)
}

export function getLessonOnly(lessonId) {
  const lesson = LESSONS.find(l => l.id === lessonId)
  return lesson ? lesson.items : []
}

export function getVerbsByBinyan(binyan) {
  return binyan === 'all' ? VERBS : VERBS.filter(v => v.binyan === binyan)
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickDistractors(correctItem, pool, count = 3) {
  const others = pool.filter(
    it => it.he !== correctItem.he && it.ru !== correctItem.ru
  )
  return shuffle(others).slice(0, count)
}

export function normalize(str) {
  return str
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const PROGRESS_KEY = 'hebrew-trainer-progress'

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}
  } catch { return {} }
}

export function saveTestResult(lessonId, pct) {
  const p = loadProgress()
  p[lessonId] = { pct, date: new Date().toISOString() }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
}
