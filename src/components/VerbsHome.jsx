import {
  BINYANS,
  BINYAN_ORDER,
  countVerbsByBinyan,
  VERBS,
} from '../data/helpers'

const BINYAN_HINTS = {
  'פעל': '4 подгруппы: שלמים, עו״י, ל״י, פ״י',
  'פיעל': 'интенсив / транзитив',
  'הפעיל': 'каузатив',
  'התפעל': 'возвратный / взаимный',
}

export default function VerbsHome({ onSelect, onBack }) {
  return (
    <div>
      <div className="header">
        <button type="button" className="back-btn" onClick={onBack}>←</button>
        <h2>Глаголы</h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        {VERBS.length} глаголов из «Глаголы с удовольствием» · по биньянам
      </p>

      <div className="binyan-grid">
        <div className="binyan-item" onClick={() => onSelect('all', null)}>
          <div className="info">
            <div className="name">Все глаголы</div>
            <div className="count text-secondary text-sm">все биньяны</div>
          </div>
          <div className="count">{VERBS.length} шт.</div>
        </div>

        {BINYAN_ORDER.filter(b => BINYANS.includes(b)).map(binyan => {
          const n = countVerbsByBinyan(binyan)
          const hint = BINYAN_HINTS[binyan] || ''
          return (
            <div key={binyan} className="binyan-item" onClick={() => onSelect(binyan, null)}>
              <div className="info">
                <div className="name">
                  <span className="he">{binyan}</span>
                </div>
                {hint ? (
                  <div className="count text-secondary text-sm">{hint}</div>
                ) : null}
              </div>
              <div className="count">{n} шт.</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
