import { ALL_LESSONS_ID, getWordPool, lessonLabel, loadProgress } from '../data/helpers'

const MODES = [
  { id: 'flashcards', icon: '🃏', label: 'Карточки' },
  { id: 'quiz', icon: '✅', label: 'Тест' },
  { id: 'errors-only', icon: '🎯', label: 'Только ошибки' },
  { id: 'pairs', icon: '🔗', label: 'Пары' },
  { id: 'voice', icon: '🎤', label: 'Голос' },
  { id: 'final-test', icon: '🏆', label: 'Итоговый тест' },
]

export default function ModeSelect({ lessonId, direction, onDirection, onSelect, onBack }) {
  const pool = getWordPool(lessonId)
  const progress = loadProgress()
  const testResult = progress[lessonId]

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>{lessonLabel(lessonId)}</h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        {pool.length} {lessonId === ALL_LESSONS_ID ? 'слов во всём курсе' : 'слов в уроке'}
      </p>

      <div className="direction-toggle">
        {[
          { v: 'ru-he', l: 'RU → HE' },
          { v: 'he-ru', l: 'HE → RU' },
          { v: 'mixed', l: 'Микс' },
        ].map(d => (
          <button
            key={d.v}
            className={direction === d.v ? 'active' : ''}
            onClick={() => onDirection(d.v)}
          >
            {d.l}
          </button>
        ))}
      </div>

      <div className="mode-grid">
        {MODES.map(m => (
          <div key={m.id} className="mode-tile" onClick={() => onSelect(m.id)}>
            <div className="icon">{m.icon}</div>
            <div className="label">{m.label}</div>
            {m.id === 'final-test' && testResult && (
              <div style={{
                marginTop: 6,
                fontSize: '.8rem',
                fontWeight: 700,
                color: testResult.pct >= 80 ? 'var(--success)' : testResult.pct >= 50 ? 'var(--warning)' : 'var(--error)',
              }}>
                {testResult.pct}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
