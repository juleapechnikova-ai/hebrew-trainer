/**
 * Собирает прилагательные из lessons.json (pos === "прилагательное"),
 * объединяет с полными 4 формами из adjectives-forms-manual.json (бывший ручной список),
 * генерирует adjective-sentence-prompts.json (ключ — лемма без огласовок).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function stripNiqqud(s) {
  return s.replace(/[\u0591-\u05C7]/g, '')
}

function lemmaKeyFromMs(ms) {
  if (!ms) return ''
  const first = ms.trim().split(/\s+/)[0]
  return stripNiqqud(first)
}

function parseAdjectiveHe(he) {
  if (!he || typeof he !== 'string') return { ms: '', fs: '' }
  const parts = he.split(',').map(p => p.trim()).filter(Boolean)
  const ms = parts[0] || ''
  const fs = parts.length > 1 ? parts[1] : ''
  return { ms, fs }
}

const MS_TEMPLATES = [
  'בית ___ ליד בית הספר.',
  'חדר ___ בכיתה עם חלון גדול.',
  'ספר ___ נמצא על השולחן בבית.',
  'שולחן ___ עומד ליד הלוח.',
  'יום ___ מתחיל בבוקר בבית הספר.',
]

const FS_TEMPLATES = [
  'דירה ___ נמצאת בשכונה ליד הגן.',
  'מכונית ___ חונה ליד בית הספר.',
  'שמלה ___ נמצאת בחנות בקניון.',
  'משפחה ___ גרה ליד הפארק.',
  'שאלה ___ מופיעה על הלוח בכיתה.',
]

const MP_TEMPLATES = [
  'ילדים ___ משחקים בחצר אחרי השיעור.',
  'ספרים ___ עומדים על המדף בבית הספר.',
  'ימים ___ מגיעים בקיץ בחופש.',
  'חוקים ___ כתובים בכניסה לבית הספר.',
]

const FP_TEMPLATES = [
  'בנות ___ לומדות בכיתה ליד החלון.',
  'חנויות ___ נמצאות ליד השוק.',
  'הצעות ___ מופיעות על הלוח בכיתה.',
  'מילים ___ בטקסט בבית הספר.',
]

function pickTemplates(forms) {
  const out = []
  let i = 0
  for (const ag of ['ms', 'fs', 'mp', 'fp']) {
    if (!forms[ag]) continue
    const pool =
      ag === 'ms'
        ? MS_TEMPLATES
        : ag === 'fs'
          ? FS_TEMPLATES
          : ag === 'mp'
            ? MP_TEMPLATES
            : FP_TEMPLATES
    out.push({ sentenceHe: pool[i % pool.length], agreement: ag })
    i += 1
  }
  if (forms.ms && out.length < 2) {
    let j = 1
    while (out.length < 2) {
      out.push({
        sentenceHe: MS_TEMPLATES[j % MS_TEMPLATES.length],
        agreement: 'ms',
      })
      j += 1
    }
  }
  return out
}

const lessonsPath = path.join(root, 'src/data/lessons.json')
const manualPath = path.join(root, 'src/data/adjectives-forms-manual.json')
const outAdj = path.join(root, 'src/data/adjectives.json')
const outPrompts = path.join(root, 'src/data/adjective-sentence-prompts.json')

const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'))

/** @type {Map<string, { lemma: string, ru: string, lessonId: number, forms: Record<string, string> }>} */
const byLemma = new Map()

for (const items of Object.values(lessons)) {
  if (!Array.isArray(items)) continue
  for (const it of items) {
    if (it.pos !== 'прилагательное') continue
    const { ms, fs: fsRaw } = parseAdjectiveHe(it.he)
    if (!ms) continue
    const key = lemmaKeyFromMs(ms)
    if (!key) continue
    if (byLemma.has(key)) continue
    const forms = { ms }
    if (fsRaw && stripNiqqud(ms) !== stripNiqqud(fsRaw)) {
      forms.fs = fsRaw
    }
    byLemma.set(key, {
      lemma: key,
      ru: it.ru || '',
      lessonId: it.lessonId,
      forms,
    })
  }
}

const manual = fs.existsSync(manualPath)
  ? JSON.parse(fs.readFileSync(manualPath, 'utf8'))
  : []

for (const m of manual) {
  const key = m.lemma
  if (!key) continue
  const cur = byLemma.get(key)
  if (cur) {
    cur.forms = { ...cur.forms, ...m.forms }
  } else {
    byLemma.set(key, {
      lemma: key,
      ru: m.ru || '',
      lessonId: m.lessonId || 0,
      forms: { ...m.forms },
    })
  }
}

const adjectives = [...byLemma.values()].sort((a, b) => {
  if (a.lessonId !== b.lessonId) return a.lessonId - b.lessonId
  return a.lemma.localeCompare(b.lemma, 'he')
})

const prompts = {}
for (const a of adjectives) {
  prompts[a.lemma] = pickTemplates(a.forms)
}

fs.writeFileSync(outAdj, JSON.stringify(adjectives, null, 2) + '\n', 'utf8')
fs.writeFileSync(outPrompts, JSON.stringify(prompts, null, 2) + '\n', 'utf8')

console.log('Written', adjectives.length, 'adjectives →', path.relative(root, outAdj))
console.log('Written prompts for', Object.keys(prompts).length, 'lemmas →', path.relative(root, outPrompts))
