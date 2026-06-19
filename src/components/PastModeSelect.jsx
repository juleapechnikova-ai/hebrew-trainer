import { PAST_TENSE, pastBinyansLabel } from '../data/helpers'

export default function PastModeSelect({ binyans, onPairs, onSentences, onBack }) {
  const total = PAST_TENSE.filter(v => binyans.includes(v.binyan)).length
  const hint = pastBinyansLabel(binyans)

  return (
    <div>
      <div className="header">
        <button type="button" className="back-btn" onClick={onBack}>←</button>
        <h2>Прошедшее время</h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        {hint} · {total} глаг. — выберите тип задания
      </p>

      <div className="mode-grid">
        <div className="mode-tile" onClick={onPairs}>
          <div className="icon">🔗</div>
          <div className="label">Пары</div>
        </div>
        <div className="mode-tile" onClick={onSentences}>
          <div className="icon">✏️</div>
          <div className="label">Прошедшее (ב)</div>
        </div>
      </div>
    </div>
  )
}
