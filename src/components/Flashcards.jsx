import { useState, useMemo } from 'react'
import { getWordPool, lessonLabel, shuffle, getWordFinalTestBreakdown } from '../data/helpers'

export default function Flashcards({ lessonId, direction, onBack }) {
  const cards = useMemo(() => shuffle(getWordPool(lessonId)), [lessonId])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (idx >= cards.length) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Карточки — {lessonLabel(lessonId)}</h2>
        </div>
        <div className="card result-card">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Все карточки просмотрены!</p>
          <div className="gap-12 mt-16">
            <button className="btn btn-primary" onClick={() => { setIdx(0); setFlipped(false) }}>
              Начать заново
            </button>
            <button className="btn btn-secondary" onClick={onBack}>К режимам</button>
          </div>
        </div>
      </div>
    )
  }

  const item = cards[idx]
  const lid = item.lessonId
  const wordBreakdown = getWordFinalTestBreakdown(item)
  const showRu = direction === 'ru-he' || (direction === 'mixed' && idx % 2 === 0)
  const front = showRu ? item.ru : item.he
  const back = showRu ? item.he : item.ru
  const frontIsHe = !showRu

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Карточки — {lessonLabel(lessonId)}</h2>
      </div>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${((idx + 1) / cards.length) * 100}%` }} />
      </div>
      <div className="progress-text">{idx + 1} / {cards.length}</div>

      <p className="text-secondary text-sm mb-8" style={{ marginTop: 8 }}>
        Урок {lid}
        {wordBreakdown ? (
          <span style={{ marginLeft: 6, fontWeight: 600, color: 'var(--primary)' }}>
            · по этому слову в итоговых тестах: {wordBreakdown.pct}% ({wordBreakdown.correct}/{wordBreakdown.total})
          </span>
        ) : (
          <span style={{ marginLeft: 6 }}>· по этому слову в итоговых тестах: нет данных</span>
        )}
      </p>

      <div className="card" style={{ cursor: 'pointer', minHeight: 200 }} onClick={() => setFlipped(!flipped)}>
        <div className={`big-text ${frontIsHe && !flipped ? 'he' : ''} ${!frontIsHe && flipped ? 'he' : ''}`}>
          {flipped ? back : front}
        </div>
        {!flipped && (
          <p className="text-center text-secondary text-sm">Нажмите, чтобы перевернуть</p>
        )}
      </div>

      <div className="gap-12 mt-16">
        {flipped ? (
          <button className="btn btn-primary" onClick={() => { setIdx(idx + 1); setFlipped(false) }}>
            Дальше →
          </button>
        ) : (
          <button className="btn btn-outline" onClick={() => setFlipped(true)}>
            Показать ответ
          </button>
        )}
      </div>
    </div>
  )
}
