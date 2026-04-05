import { useState, useMemo } from 'react'
import { getLessonOnly, shuffle } from '../data/helpers'

const BATCH_SIZE = 6

export default function Pairs({ lessonId, onBack }) {
  const pool = useMemo(() => shuffle(getLessonOnly(lessonId)), [lessonId])
  const [batchIdx, setBatchIdx] = useState(0)

  const batch = useMemo(
    () => pool.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE),
    [pool, batchIdx]
  )
  const totalBatches = Math.ceil(pool.length / BATCH_SIZE)

  const [leftItems] = useMemo(() => [shuffle(batch.map((it, i) => ({ text: it.ru, idx: i })))], [batch])
  const [rightItems] = useMemo(() => [shuffle(batch.map((it, i) => ({ text: it.he, idx: i })))], [batch])

  const [selectedLeft, setSelectedLeft] = useState(null)
  const [selectedRight, setSelectedRight] = useState(null)
  const [matched, setMatched] = useState(new Set())
  const [wrongFlash, setWrongFlash] = useState(null)

  function handleLeft(idx) {
    if (matched.has(idx)) return
    setSelectedLeft(idx)
    if (selectedRight !== null) tryMatch(idx, selectedRight)
  }

  function handleRight(idx) {
    if (matched.has(idx)) return
    setSelectedRight(idx)
    if (selectedLeft !== null) tryMatch(selectedLeft, idx)
  }

  function tryMatch(l, r) {
    if (l === r) {
      setMatched(prev => new Set([...prev, l]))
      setSelectedLeft(null)
      setSelectedRight(null)
    } else {
      setWrongFlash({ l, r })
      setTimeout(() => {
        setWrongFlash(null)
        setSelectedLeft(null)
        setSelectedRight(null)
      }, 600)
    }
  }

  const allMatched = matched.size === batch.length

  function nextBatch() {
    setBatchIdx(b => b + 1)
    setMatched(new Set())
    setSelectedLeft(null)
    setSelectedRight(null)
  }

  if (batchIdx >= totalBatches) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Пары — Урок {lessonId}</h2>
        </div>
        <div className="card result-card">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Все пары найдены!</p>
          <div className="gap-12 mt-16">
            <button className="btn btn-primary" onClick={() => { setBatchIdx(0); setMatched(new Set()) }}>
              Начать заново
            </button>
            <button className="btn btn-secondary" onClick={onBack}>К режимам</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Пары — Урок {lessonId}</h2>
      </div>

      <div className="progress-text">
        Набор {batchIdx + 1} / {totalBatches} · Найдено {matched.size} / {batch.length}
      </div>

      <div className="pairs-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {leftItems.map(it => {
            let cls = 'pair-item'
            if (matched.has(it.idx)) cls += ' matched'
            else if (selectedLeft === it.idx) cls += ' selected'
            if (wrongFlash?.l === it.idx) cls += ' wrong-flash'
            return (
              <div key={it.idx} className={cls} onClick={() => handleLeft(it.idx)}>
                {it.text}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rightItems.map(it => {
            let cls = 'pair-item he'
            if (matched.has(it.idx)) cls += ' matched'
            else if (selectedRight === it.idx) cls += ' selected'
            if (wrongFlash?.r === it.idx) cls += ' wrong-flash'
            return (
              <div key={it.idx} className={cls} onClick={() => handleRight(it.idx)}>
                {it.text}
              </div>
            )
          })}
        </div>
      </div>

      {allMatched && (
        <div className="mt-16">
          <button className="btn btn-primary" onClick={nextBatch}>
            Следующий набор →
          </button>
        </div>
      )}
    </div>
  )
}
