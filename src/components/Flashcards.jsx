import { useState, useMemo } from 'react'
import { getLessonOnly, shuffle } from '../data/helpers'

export default function Flashcards({ lessonId, direction, onBack }) {
  const cards = useMemo(() => shuffle(getLessonOnly(lessonId)), [lessonId])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (idx >= cards.length) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Карточки — Урок {lessonId}</h2>
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
  const showRu = direction === 'ru-he' || (direction === 'mixed' && idx % 2 === 0)
  const front = showRu ? item.ru : item.he
  const back = showRu ? item.he : item.ru
  const frontIsHe = !showRu

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Карточки — Урок {lessonId}</h2>
      </div>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${((idx + 1) / cards.length) * 100}%` }} />
      </div>
      <div className="progress-text">{idx + 1} / {cards.length}</div>

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
