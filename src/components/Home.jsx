export default function Home({ onLessons, onAllLessons, onRepetition, onVerbs, onAdjectives, streakCurrent, streakMax }) {
  return (
    <div className="home-screen">
      <div className="home-brand">
        <h1 className="home-title-he">עברית מן ההתחלה</h1>
        <p className="home-subtitle">
          Тренажёр иврита — уроки и общий режим
        </p>
      </div>

      <nav className="home-nav" aria-label="Главное меню">
        <button type="button" className="nav-card nav-card--primary" onClick={onLessons}>
          <span className="nav-card__icon" aria-hidden>📚</span>
          <span className="nav-card__label">Уроки</span>
        </button>
        <button type="button" className="nav-card nav-card--surface" onClick={onAllLessons}>
          <span className="nav-card__icon" aria-hidden>🌐</span>
          <span className="nav-card__label">Все уроки</span>
        </button>
        <button type="button" className="nav-card nav-card--surface" onClick={onRepetition}>
          <span className="nav-card__icon" aria-hidden>🔁</span>
          <span className="nav-card__label">Повторение</span>
        </button>
        <button type="button" className="nav-card nav-card--surface" onClick={onVerbs}>
          <span className="nav-card__icon" aria-hidden>🔤</span>
          <span className="nav-card__label">Глаголы</span>
        </button>
        <button type="button" className="nav-card nav-card--surface" onClick={onAdjectives}>
          <span className="nav-card__icon" aria-hidden>📝</span>
          <span className="nav-card__label">Прилагательные</span>
        </button>
      </nav>

      <footer className="home-streak" aria-label="Серия дней захода">
        {streakCurrent > 0 ? <span className="home-streak__icon" aria-hidden>🔥</span> : null}
        <span>
          Подряд: <strong>{streakCurrent}</strong> дн. · Рекорд: <strong>{streakMax}</strong>
        </span>
      </footer>
    </div>
  )
}
