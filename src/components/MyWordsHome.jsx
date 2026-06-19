import { useState } from 'react'
import { countMyWordsByStatus, getMyWordsPool } from '../data/helpers'
import MyWordsFlashcards from './MyWordsFlashcards'

export default function MyWordsHome({ onBack }) {
  const [counts, setCounts] = useState(() => countMyWordsByStatus())
  const [direction, setDirection] = useState('mixed')
  /** @type {null | 'difficult-only' | 'learned-only' | 'learned-list'} */
  const [screen, setScreen] = useState(null)

  function refreshCounts() {
    setCounts(countMyWordsByStatus())
  }

  if (screen === 'difficult-only' || screen === 'learned-only') {
    return (
      <MyWordsFlashcards
        poolMode={screen}
        direction={direction}
        onBack={() => {
          refreshCounts()
          setScreen(screen === 'learned-only' ? 'learned-list' : null)
        }}
        onStatusChange={refreshCounts}
      />
    )
  }

  if (screen === 'learned-list') {
    const learned = getMyWordsPool('learned-only')

    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={() => { refreshCounts(); setScreen(null) }}>←</button>
          <h2>Мои слова — выучено</h2>
        </div>

        <p className="text-secondary text-sm mb-8">
          Слова, которые ты отметила «Выучено ✓» на карточках
        </p>

        <div className="my-words-stats">
          <span className="my-words-stat my-words-stat--learned">
            В архиве: <strong>{learned.length}</strong>
          </span>
        </div>

        {learned.length === 0 ? (
          <div className="card" style={{ marginTop: 16 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Пока пусто</p>
            <p className="text-secondary text-sm">
              Учи карточки в «Сложно» и нажимай «Выучено ✓» — слова появятся здесь.
            </p>
          </div>
        ) : (
          <>
            <div className="direction-toggle">
              {[
                { v: 'ru-he', l: 'RU → HE' },
                { v: 'he-ru', l: 'HE → RU' },
                { v: 'mixed', l: 'Микс' },
              ].map(d => (
                <button
                  key={d.v}
                  className={direction === d.v ? 'active' : ''}
                  onClick={() => setDirection(d.v)}
                >
                  {d.l}
                </button>
              ))}
            </div>

            <div className="mode-grid" style={{ marginTop: 16 }}>
              <div className="mode-tile" onClick={() => setScreen('learned-only')}>
                <div className="icon">🃏</div>
                <div className="label">Карточки</div>
                <div className="text-secondary text-sm">{learned.length} шт.</div>
              </div>
            </div>

            <div className="my-words-list" style={{ marginTop: 20 }}>
              <h3 className="my-words-list__title">Список</h3>
              {learned.map(w => (
                <div key={w.id} className="my-words-list__item">
                  <span className="my-words-list__he he">{w.he}</span>
                  <span className="my-words-list__ru">{w.ru}</span>
                  {w.lesson != null && (
                    <span className="my-words-list__lesson">ур. {w.lesson}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Мои слова</h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        Слова с фото урока · «Сложно» → учишь · «Выучено ✓» → в архив
      </p>

      <div className="my-words-stats">
        <span className="my-words-stat my-words-stat--difficult">
          Сложно: <strong>{counts.difficult}</strong>
        </span>
        <span className="my-words-stat my-words-stat--learned">
          Выучено: <strong>{counts.learned}</strong>
        </span>
      </div>

      {counts.total === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Пока пусто</p>
          <p className="text-secondary text-sm">
            Сфотографируй слова урока и отправь Ханне — она добавит сюда с пометкой «сложно».
          </p>
        </div>
      ) : (
        <>
          <div className="direction-toggle">
            {[
              { v: 'ru-he', l: 'RU → HE' },
              { v: 'he-ru', l: 'HE → RU' },
              { v: 'mixed', l: 'Микс' },
            ].map(d => (
              <button
                key={d.v}
                className={direction === d.v ? 'active' : ''}
                onClick={() => setDirection(d.v)}
              >
                {d.l}
              </button>
            ))}
          </div>

          <div className="mode-grid" style={{ marginTop: 16 }}>
            <div
              className={`mode-tile${counts.difficult === 0 ? ' mode-tile--disabled' : ''}`}
              onClick={() => counts.difficult > 0 && setScreen('difficult-only')}
            >
              <div className="icon">🔥</div>
              <div className="label">Сложно</div>
              <div className="text-secondary text-sm">{counts.difficult} шт.</div>
            </div>
            <div
              className="mode-tile"
              onClick={() => setScreen('learned-list')}
            >
              <div className="icon">✅</div>
              <div className="label">Выучено</div>
              <div className="text-secondary text-sm">{counts.learned} шт.</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
