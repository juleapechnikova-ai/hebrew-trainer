import { LESSONS, loadProgress } from '../data/helpers'

export default function LessonList({ onSelect, onBack }) {
  const progress = loadProgress()

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Выберите урок</h2>
      </div>
      <p className="text-secondary text-sm mb-8">
        Материал уроков 20 до выбранного включительно
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
