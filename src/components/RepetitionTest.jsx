import { useState, useMemo } from 'react'
import {
  getWordsForLessons,
  shuffle,
  pickDistractors,
  getWordFinalTestBreakdown,
  REPETITION_SET_SIZE,
  recordWordError,
} from '../data/helpers'

function generateQuestionsForChunk(chunk, distractorPool) {
  const items = shuffle([...chunk])
  return items.map((item, i) => {
    const showRu = i % 2 === 0
    const prompt = showRu ? item.ru : item.he
    const correct = showRu ? item.he : item.ru
    const distractors = pickDistractors(item, distractorPool).map(d => (showRu ? d.he : d.ru))
    const options = shuffle([correct, ...distractors])
    return { item, showRu, prompt, correct, options, promptIsHe: !showRu, answerIsHe: showRu }
  })
}

export default function RepetitionTest({ lessonIds, onBack }) {
  const fullPool = useMemo(() => getWordsForLessons(lessonIds), [lessonIds])

  const sets = useMemo(() => {
    const s = shuffle([...fullPool])
    const chunks = []
    for (let i = 0; i < s.length; i += REPETITION_SET_SIZE) {
      chunks.push(s.slice(i, i + REPETITION_SET_SIZE))
    }
    return chunks
  }, [fullPool])

  const [setIndex, setSetIndex] = useState(0)
  const [questions, setQuestions] = useState(() =>
    sets[0]?.length ? generateQuestionsForChunk(sets[0], fullPool) : []
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [setFinished, setSetFinished] = useState(false)

  function handleAnswer(opt) {
    const q = questions[questionIndex]
    if (opt !== q.correct) {
      recordWordError(q.item)
    }
    const newAnswers = [...answers, { question: q, answer: opt }]
    setAnswers(newAnswers)

    if (questionIndex + 1 >= questions.length) {
      setSetFinished(true)
    } else {
      setQuestionIndex(questionIndex + 1)
    }
  }

  function goNextSet() {
    const next = setIndex + 1
    if (next >= sets.length) return
    setSetIndex(next)
    setQuestions(generateQuestionsForChunk(sets[next], fullPool))
    setQuestionIndex(0)
    setAnswers([])
    setSetFinished(false)
  }

  function restartSet() {
    setQuestions(generateQuestionsForChunk(sets[setIndex], fullPool))
    setQuestionIndex(0)
    setAnswers([])
    setSetFinished(false)
  }

  if (!fullPool.length || !sets.length) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Повторение</h2>
        </div>
        <p className="text-secondary">Нет слов для выбранных уроков.</p>
        <button className="btn btn-secondary mt-16" onClick={onBack}>Назад</button>
      </div>
    )
  }

  if (setFinished) {
    const correctCount = answers.filter(a => a.answer === a.question.correct).length
    const wrongCount = questions.length - correctCount
    const pct = Math.round((correctCount / questions.length) * 100)
    const lastSet = setIndex >= sets.length - 1

    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Повторение — сет {setIndex + 1} / {sets.length}</h2>
        </div>

        <div className="card result-card">
          <p className="text-secondary">Сет завершён</p>
          <div className={`score ${pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'bad'}`}>{pct}%</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ {correctCount}</span>
            <span style={{ color: 'var(--error)', fontWeight: 600 }}>✗ {wrongCount}</span>
          </div>
        </div>

        <div className="gap-12 mt-16">
          {!lastSet && (
            <button className="btn btn-primary" onClick={goNextSet}>Следующий сет</button>
          )}
          <button className="btn btn-secondary" onClick={restartSet}>Повторить сет</button>
          <button className="btn btn-outline" onClick={onBack}>К выбору уроков</button>
        </div>
      </div>
    )
  }

  const q = questions[questionIndex]
  const lid = q.item.lessonId
  const wordBreakdown = getWordFinalTestBreakdown(q.item)

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Повторение</h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        Сет {setIndex + 1} / {sets.length} · {questions.length} вопросов · всего слов: {fullPool.length}
      </p>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="progress-text">{questionIndex + 1} / {questions.length}</div>

      <p className="text-secondary text-sm mb-8" style={{ marginTop: 8 }}>
        Урок {lid}
        {wordBreakdown ? (
          <span style={{ marginLeft: 8, fontWeight: 600, color: 'var(--primary)' }}>
            · по этому слову в итоговых тестах: {wordBreakdown.pct}% ({wordBreakdown.correct}/{wordBreakdown.total})
          </span>
        ) : (
          <span style={{ marginLeft: 8 }}>· по этому слову в итоговых тестах: нет данных</span>
        )}
      </p>

      <div className="card">
        <div className={`big-text ${q.promptIsHe ? 'he' : ''}`}>{q.prompt}</div>
      </div>

      <div className="gap-12 mt-16">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className="option-btn"
            style={q.answerIsHe
              ? { direction: 'rtl', fontFamily: 'var(--font-he)' }
              : { direction: 'ltr', textAlign: 'left' }
            }
            onClick={() => handleAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
