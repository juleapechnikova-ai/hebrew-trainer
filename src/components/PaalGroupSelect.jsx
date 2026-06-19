import {
  PAAL_GROUPS,
  PAAL_GROUP_LABELS,
  countVerbsByBinyan,
  countVerbsByPaalGroup,
} from '../data/helpers'

export default function PaalGroupSelect({ onSelect, onBack }) {
  const total = countVerbsByBinyan('פעל')

  return (
    <div>
      <div className="header">
        <button type="button" className="back-btn" onClick={onBack}>←</button>
        <h2>
          <span className="he">פעל</span>
        </h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        {total} глаголов · выберите подгруппу по книге
      </p>

      <div className="binyan-grid">
        <div className="binyan-item" onClick={() => onSelect(null)}>
          <div className="info">
            <div className="name">Весь <span className="he">פעל</span></div>
            <div className="count text-secondary text-sm">все подгруппы</div>
          </div>
          <div className="count">{total} шт.</div>
        </div>

        {PAAL_GROUPS.map(group => {
          const n = countVerbsByPaalGroup(group)
          const label = PAAL_GROUP_LABELS[group] || group
          return (
            <div key={group} className="binyan-item" onClick={() => onSelect(group)}>
              <div className="info">
                <div className="name">
                  <span className="he">{group}</span>
                </div>
                <div className="count text-secondary text-sm">{label.split(' — ')[1] || ''}</div>
              </div>
              <div className="count">{n} шт.</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
