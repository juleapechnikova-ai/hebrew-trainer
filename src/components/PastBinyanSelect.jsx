import { useState, useMemo } from 'react'
import { getPastTenseBinyanStats, PAST_TENSE } from '../data/helpers'

const BINYAN_HINTS = {
  'פעל': 'простой активный',
  'פיעל': 'интенсив / транзитив',
  'הפעיל': 'каузатив',
  'התפעל': 'возвратный / взаимный',
}

export default function PastBinyanSelect({ onStart, onBack }) {
  const stats = useMemo(() => getPastTenseBinyanStats(), [])
  const allBinyans = useMemo(() => stats.map(s => s.binyan), [stats])
  const [selected, setSelected] = useState(() => new Set())
  const allSelected = allBinyans.length > 0 && allBinyans.every(b => selected.has(b))
  const totalSelected = useMemo(() => {
    const set = new Set(selected)
    return PAST_TENSE.filter(v => set.has(v.binyan)).length
  }, [selected])

  function toggle(binyan) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(binyan)) next.delete(binyan)
      else next.add(binyan)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(allBinyans))
  }

  return (
    <div>
      <div className="header">
        <button type="button" className="back-btn" onClick={onBack}>←</button>
        <h2>Прошедшее время</h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        Выберите биньяны для заданий по прошедшему времени.
        {selected.size > 0 ? ` Сейчас: ${totalSelected} глаг.` : ''}
      </p>

      <div style={{ marginBottom: 12 }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={toggleAll}>
          {allSelected ? 'Снять все' : 'Выбрать все'}
        </button>
      </div>

      <div className="binyan-grid">
        {stats.map(({ binyan, count }) => {
          const on = selected.has(binyan)
          const hint = BINYAN_HINTS[binyan] || ''
          return (
            <div
              key={binyan}
              className="binyan-item"
              style={{ opacity: on ? 1 : 0.85 }}
              onClick={() => toggle(binyan)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(binyan)
                }
              }}
            >
              <div className="info" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.1rem' }}>{on ? '☑' : '☐'}</span>
                <div>
                  <div className="name">
                    <span className="he">{binyan}</span>
                  </div>
                  {hint ? (
                    <div className="count text-secondary text-sm">{hint}</div>
                  ) : null}
                </div>
              </div>
              <div className="count">{count} шт.</div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-lg mt-16"
        style={{ width: '100%' }}
        disabled={selected.size === 0}
        onClick={() => onStart([...selected])}
      >
        Дальше
      </button>
    </div>
  )
}
