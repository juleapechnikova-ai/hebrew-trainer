import adjectivesData from '../data/adjectives.json'

export default function AdjectivesHome({ onSentences, onPairs, onBack }) {
  const n = adjectivesData.length

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Прилагательные</h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        {n} прилагательных из основного файла уроков (форма мн.ч. — только там, где задана вручную в базе парадигм)
      </p>

      <div className="mode-grid">
        <div className="mode-tile" onClick={onSentences}>
          <div className="icon">✏️</div>
          <div className="label">Предложения</div>
        </div>
        <div className="mode-tile" onClick={onPairs}>
          <div className="icon">🔗</div>
          <div className="label">Пары</div>
        </div>
      </div>
    </div>
  )
}
