import { useState, useMemo } from 'react'
import { LESSONS, loadProgress } from '../data/helpers'

export default function RepetitionLessonSelect({ onStart, onBack }) {
  const progress = loadProgress()
  const [selected, setSelected] = useState(() => new Set())

  const allIds = useMemo(() => LESSONS.map(l => l.id), [])
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(allIds))
  }

  const canStart = selected.size > 0

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Повторение</h2>
      </div>
      <p className="text-secondary text-sm mb-8">
        Выберите уроки: тест по всем словам выбранных уроков, сеты по 30 слов. У слова показан % итогового теста по его уроку (если уже проходили).
      </p>

      <div style={{ marginBottom: 12 }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={toggleAll}>
          {allSelected ? 'Снять все' : 'Выбрать все'}
        </button>
      </div>

      <div className="lesson-list">
        {LESSONS.map(l => {
          const result = progress[l.id]
          const on = selected.has(l.id)
          return (
            <div
              key={l.id}
              className="lesson-item"
              style={{ opacity: on ? 1 : 0.85 }}
              onClick={() => toggle(l.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(l.id) } }}
            >
              <div className="num" style={{ fontSize: '1rem' }}>{on ? '☑' : '☐'}</div>
              <div className="info">
                <div className="title">Урок {l.id}</div>
                <div className="count">{l.items.length} слов</div>
              </div>
              {result && (
                <span className={`badge ${result.pct >= 70 ? 'badge-done' : ''}`}>
                  итог. {result.pct}%
                </span>
              )}
            </div>
          )
        })}
      </div>

      <button
        className="btn btn-primary btn-lg mt-16"
        style={{ width: '100%' }}
        disabled={!canStart}
        onClick={() => onStart([...selected].sort((a, b) => a - b))}
      >
        Начать
      </button>
    </div>
  )
}
