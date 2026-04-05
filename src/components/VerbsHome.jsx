import { VERBS, BINYANS, getVerbsByBinyan } from '../data/helpers'

export default function VerbsHome({ onSelect, onBack }) {
  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Глаголы</h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        {VERBS.length} глаголов из «Глаголы с удовольствием»
      </p>

      <div className="binyan-grid">
        <div className="binyan-item" onClick={() => onSelect('all')}>
          <div className="name">Все глаголы</div>
          <div className="count">{VERBS.length} шт.</div>
        </div>
        {BINYANS.map(b => {
          const verbs = getVerbsByBinyan(b)
          return (
            <div key={b} className="binyan-item" onClick={() => onSelect(b)}>
              <div className="name">
                <span className="he">{b}</span>
              </div>
              <div className="count">{verbs.length} шт.</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
