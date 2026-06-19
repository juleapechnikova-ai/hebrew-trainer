import { useState, useMemo, useCallback } from 'react'
import {
  getMyWordsPool,
  markMyWordLearned,
  markMyWordDifficult,
  shuffle,
} from '../data/helpers'

export default function MyWordsFlashcards({ poolMode, direction, onBack, onStatusChange }) {
  const [deckKey, setDeckKey] = useState(0)
  const [statusVersion, setStatusVersion] = useState(0)
  const cards = useMemo(
    () => shuffle(getMyWordsPool(poolMode)),
    [poolMode, deckKey, statusVersion]
  )
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const poolLabel =
    poolMode === 'difficult-only'
      ? 'только сложно'
      : poolMode === 'learned-only'
        ? 'выучено'
        : 'сложно + выучено'

  const restart = useCallback(() => {
    setIdx(0)
    setFlipped(false)
    setDeckKey(k => k + 1)
  }, [])

  if (cards.length === 0) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Мои слова — карточки</h2>
        </div>
        <div className="card result-card">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>✓</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {poolMode === 'difficult-only'
              ? 'Все сложные слова выучены!'
              : poolMode === 'learned-only'
                ? 'Пока нет выученных слов'
                : 'Нет слов для тренировки'}
          </p>
          <button className="btn btn-secondary mt-16" onClick={onBack}>
            Назад
          </button>
        </div>
      </div>
    )
  }

  if (idx >= cards.length) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Мои слова — карточки</h2>
        </div>
        <div className="card result-card">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Прошла весь набор!</p>
          <div className="gap-12 mt-16">
            <button className="btn btn-primary" onClick={restart}>
              Начать заново
            </button>
            <button className="btn btn-secondary" onClick={onBack}>
              К выбору режима
            </button>
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
  const isLearned = item.status === 'learned'

  function goNext() {
    setIdx(i => i + 1)
    setFlipped(false)
  }

  function handleLearned() {
    if (!isLearned) {
      markMyWordLearned(item.id)
      setStatusVersion(v => v + 1)
      onStatusChange?.()
      setFlipped(false)
      return
    }
    goNext()
  }

  function handleDifficultAgain() {
    markMyWordDifficult(item.id)
    setStatusVersion(v => v + 1)
    onStatusChange?.()
    setFlipped(false)
  }

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Мои слова — {poolLabel}</h2>
      </div>

      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${((idx + 1) / cards.length) * 100}%` }}
        />
      </div>
      <div className="progress-text">{idx + 1} / {cards.length}</div>

      <p className="text-secondary text-sm mb-8" style={{ marginTop: 8 }}>
        {item.lesson != null ? `Урок ${item.lesson}` : null}
        {item.lesson != null ? ' · ' : null}
        <span className={`my-words-badge my-words-badge--${item.status}`}>
          {isLearned ? 'выучено' : 'сложно'}
        </span>
      </p>

      <div
        className="card"
        style={{ cursor: 'pointer', minHeight: 200 }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className={`big-text ${frontIsHe && !flipped ? 'he' : ''} ${!frontIsHe && flipped ? 'he' : ''}`}
        >
          {flipped ? back : front}
        </div>
        {!flipped && (
          <p className="text-center text-secondary text-sm">Нажмите, чтобы перевернуть</p>
        )}
      </div>

      <div className="gap-12 mt-16">
        {flipped ? (
          <>
            {!isLearned && (
              <button className="btn btn-primary" onClick={handleLearned}>
                Выучено ✓
              </button>
            )}
            {isLearned && poolMode === 'learned-only' && (
              <button className="btn btn-outline" onClick={handleDifficultAgain}>
                Снова сложно
              </button>
            )}
            <button
              className={isLearned ? 'btn btn-primary' : 'btn btn-outline'}
              onClick={goNext}
            >
              {isLearned ? 'Дальше →' : 'Ещё сложно →'}
            </button>
          </>
        ) : (
          <button className="btn btn-outline" onClick={() => setFlipped(true)}>
            Показать ответ
          </button>
        )}
      </div>
    </div>
  )
}
