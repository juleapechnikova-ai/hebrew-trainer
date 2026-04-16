import { LESSONS, loadProgress } from '../data/helpers'

export default function LessonList({ onSelect, onBack }) {
  const progress = loadProgress()
  const first = LESSONS[0]?.id
  const last = LESSONS[LESSONS.length - 1]?.id
  const rangeHint =
    first != null && last != null ? `Уроки ${first}–${last} — слова только выбранного урока` : ''

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Выберите урок</h2>
      </div>
      <p className="text-secondary text-sm mb-8">
        {rangeHint}
      </p>
      <div className="lesson-list">
        {LESSONS.map(l => {
          const result = progress[l.id]
          return (
            <div key={l.id} className="lesson-item" onClick={() => onSelect(l.id)}>
              <div className="num">{l.id}</div>
              <div className="info">
                <div className="title">Урок {l.id}</div>
                <div className="count">{l.items.length} слов в уроке</div>
              </div>
              {result && (
                <span className={`badge ${result.pct >= 70 ? 'badge-done' : ''}`}>
                  {result.pct}%
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
