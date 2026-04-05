export default function Home({ onLessons, onVerbs }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
      <h1 style={{ textAlign: 'center', fontSize: '1.6rem', marginBottom: 8 }}>
        עברית מן ההתחלה
      </h1>
      <p className="text-center text-secondary" style={{ marginBottom: 24 }}>
        Тренажёр иврита — уроки 20–28
      </p>

      <button className="btn btn-primary btn-lg" onClick={onLessons}>
        📚 Уроки
      </button>
      <button className="btn btn-outline btn-lg" onClick={onVerbs}>
        🔤 Глаголы
      </button>
    </div>
  )
}
