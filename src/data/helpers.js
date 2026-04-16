import lessonsRaw from './lessons.json'
import verbsRaw from './verbs.json'

/** Режим тренировки по всему словарю (все ключи из lessons.json). */
export const ALL_LESSONS_ID = 'all'

export const LESSONS = Object.entries(lessonsRaw)
  .map(([id, items]) => ({ id: Number(id), items: Array.isArray(items) ? items : [] }))
  .filter(l => Number.isFinite(l.id) && l.id >= 1 && l.items.length > 0)
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

export function getAllLessonWords() {
  return LESSONS.flatMap(l => l.items)
}

/** Слова из выбранных уроков (для режима «Повторение»). */
export function getWordsForLessons(lessonIds) {
  const set = new Set(lessonIds)
  return LESSONS.filter(l => set.has(l.id)).flatMap(l => l.items)
}

/** Размер одного сета в режиме «Повторение». */
export const REPETITION_SET_SIZE = 30

/** Слова для режима: один урок или весь курс. */
export function getWordPool(lessonId) {
  if (lessonId === ALL_LESSONS_ID) return getAllLessonWords()
  return getLessonOnly(lessonId)
}

export function lessonLabel(lessonId) {
  return lessonId === ALL_LESSONS_ID ? 'Все уроки' : `Урок ${lessonId}`
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

const WORD_STATS_KEY = 'hebrew-trainer-word-stats'

const WORD_ERRORS_KEY = 'hebrew-trainer-word-errors'

/** Стабильный ключ слова для статистики итоговых тестов. */
export function wordStatsKey(item) {
  return `${item.lessonId}|${normalize(item.he)}|${normalize(item.ru)}`
}

export function loadWordStats() {
  try {
    return JSON.parse(localStorage.getItem(WORD_STATS_KEY)) || {}
  } catch {
    return {}
  }
}

function saveWordStats(stats) {
  localStorage.setItem(WORD_STATS_KEY, JSON.stringify(stats))
}

/** Обновить счётчики по словам после завершения итогового теста. */
export function recordFinalTestWordResults(answers) {
  const stats = loadWordStats()
  for (const a of answers) {
    const item = a.question?.item
    if (!item?.lessonId || item.he == null || item.ru == null) continue
    const key = wordStatsKey(item)
    if (!stats[key]) stats[key] = { correct: 0, total: 0 }
    stats[key].total += 1
    if (a.answer === a.question.correct) stats[key].correct += 1
  }
  saveWordStats(stats)
}

/** Доля правильных ответов по этому слову во всех итоговых тестах, где оно встречалось. */
export function getWordFinalTestPct(item) {
  const key = wordStatsKey(item)
  const s = loadWordStats()[key]
  if (!s || !s.total) return null
  return Math.round((s.correct / s.total) * 100)
}

/** correct / total по слову или null. */
export function getWordFinalTestBreakdown(item) {
  const key = wordStatsKey(item)
  const s = loadWordStats()[key]
  if (!s || !s.total) return null
  return {
    pct: Math.round((s.correct / s.total) * 100),
    correct: s.correct,
    total: s.total,
  }
}

export function loadWordErrors() {
  try {
    return JSON.parse(localStorage.getItem(WORD_ERRORS_KEY)) || {}
  } catch {
    return {}
  }
}

function saveWordErrors(obj) {
  localStorage.setItem(WORD_ERRORS_KEY, JSON.stringify(obj))
}

/** Запись при неверном ответе (тест, пары, голос, итоговый тест). */
export function recordWordError(item) {
  if (!item?.lessonId || item.he == null || item.ru == null) return
  const key = wordStatsKey(item)
  const e = loadWordErrors()
  e[key] = (e[key] || 0) + 1
  saveWordErrors(e)
}

/** Уменьшить счётчик при верном ответе в режиме «Только ошибки». */
export function recordWordErrorResolved(item) {
  if (!item?.lessonId || item.he == null) return
  const key = wordStatsKey(item)
  const e = loadWordErrors()
  if (!e[key]) return
  e[key] = Math.max(0, e[key] - 1)
  if (e[key] === 0) delete e[key]
  saveWordErrors(e)
}

export function getWordErrorCount(item) {
  const key = wordStatsKey(item)
  return loadWordErrors()[key] || 0
}

/** Слова из пула, по которым есть хотя бы одна зафиксированная ошибка. */
export function getErrorWordsFromPool(pool) {
  const err = loadWordErrors()
  return pool.filter(item => {
    const k = wordStatsKey(item)
    return (err[k] || 0) > 0
  })
}

const STREAK_KEY = 'hebrew-trainer-streak'

/** Локальная календарная дата YYYY-MM-DD (как в настройках браузера). */
export function getLocalDateString(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getYesterdayLocalDateString() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return getLocalDateString(d)
}

function loadStreak() {
  try {
    const raw = JSON.parse(localStorage.getItem(STREAK_KEY))
    if (!raw || typeof raw !== 'object') return null
    return {
      lastVisitDate: raw.lastVisitDate ?? null,
      currentStreak: Number(raw.currentStreak) || 0,
      maxStreak: Number(raw.maxStreak) || 0,
    }
  } catch {
    return null
  }
}

function saveStreak(state) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(state))
}

/**
 * Один заход в приложение за календарный день: обновляет серию и рекорд, идемпотентно в тот же день.
 * @returns {{ currentStreak: number, maxStreak: number }}
 */
export function applyDailyVisit() {
  const today = getLocalDateString()
  const yesterday = getYesterdayLocalDateString()
  const prev = loadStreak() || {
    lastVisitDate: null,
    currentStreak: 0,
    maxStreak: 0,
  }

  if (prev.lastVisitDate === today) {
    return {
      currentStreak: prev.currentStreak,
      maxStreak: prev.maxStreak,
    }
  }

  let currentStreak
  if (prev.lastVisitDate === yesterday) {
    currentStreak = prev.currentStreak + 1
  } else {
    currentStreak = 1
  }

  const maxStreak = Math.max(prev.maxStreak, currentStreak)
  const next = {
    lastVisitDate: today,
    currentStreak,
    maxStreak,
  }
  saveStreak(next)
  return { currentStreak, maxStreak }
}

