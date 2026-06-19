#!/usr/bin/env node
/**
 * Синхронизация verbs.json с книгой: порядок биньянов → группы פעל → страница.
 * Добавляет пропущенные записи из hebrew-trainer-verbs-book.json.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VERBS_PATH = join(ROOT, 'src/data/verbs.json')
const BOOK_PATH = join(ROOT, 'hebrew-trainer-verbs-book.json')

const BINYAN_ORDER = ['פעל', 'פיעל', 'הפעיל', 'התפעל']
const PAAL_GROUPS = ['שלמים', 'עו"י', 'ל"י', 'פ"י']

/** Корень книги → форма настоящего (3 л.) в приложении */
const PRESENT_BY_BOOK_ROOT = {
  היה: 'הָיָה',
}

function stripNikud(s) {
  return s.replace(/[\u0591-\u05C7]/g, '')
}

function bookKey(b) {
  return `${b.page}|${b.binyan}|${b.group || ''}|${stripNikud(b.he)}`
}

function verbKey(v) {
  return `${v.page}|${v.binyan}|${v.group || ''}`
}

const verbs = JSON.parse(readFileSync(VERBS_PATH, 'utf8'))
const book = JSON.parse(readFileSync(BOOK_PATH, 'utf8'))

const verbsBySlot = new Map()
for (const v of verbs) {
  const k = verbKey(v)
  if (!verbsBySlot.has(k)) verbsBySlot.set(k, [])
  verbsBySlot.get(k).push(v)
}

const added = []
for (const b of book) {
  const present = PRESENT_BY_BOOK_ROOT[b.he]
  if (!present) continue
  const k = verbKey({ ...b, group: b.group || '' })
  const existing = verbsBySlot.get(k) || []
  if (existing.some(v => stripNikud(v.he).includes(stripNikud(b.he)))) continue
  const entry = {
    he: present,
    ru: b.ru.includes('быть') ? 'был, быть' : b.ru,
    page: b.page,
    binyan: b.binyan,
    group: b.group || '',
  }
  verbs.push(entry)
  added.push(entry)
}

function sortVerbs(list) {
  return [...list].sort((a, b) => {
    const bi = BINYAN_ORDER.indexOf(a.binyan) - BINYAN_ORDER.indexOf(b.binyan)
    if (bi !== 0) return bi
    if (a.binyan === 'פעל') {
      const gi =
        PAAL_GROUPS.indexOf(a.group || '') - PAAL_GROUPS.indexOf(b.group || '')
      if (gi !== 0) return gi
    }
    if (a.page !== b.page) return a.page - b.page
    return stripNikud(a.he).localeCompare(stripNikud(b.he), 'he')
  })
}

const sorted = sortVerbs(verbs)
writeFileSync(VERBS_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf8')

const counts = {}
for (const v of sorted) {
  const label =
    v.binyan === 'פעל' ? `${v.binyan} / ${v.group || '?'}` : v.binyan
  counts[label] = (counts[label] || 0) + 1
}

console.log('verbs.json:', sorted.length, 'entries')
if (added.length) console.log('added:', added.map(v => v.he).join(', '))
console.log('by binyan:', counts)
