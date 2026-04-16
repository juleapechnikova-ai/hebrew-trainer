import { useState, useMemo } from 'react'
import {
  ALL_LESSONS_ID,
  getWordPool,
  lessonLabel,
  shuffle,
  pickDistractors,
  saveTestResult,
  recordFinalTestWordResults,
  recordWordError,
} from '../data/helpers'

function generateQuestions(pool) {
  const items = shuffle([...pool])
  return items.map((item, i) => {
    const showRu = i % 2 === 0
    const prompt = showRu ? item.ru : item.he
    const correct = showRu ? item.he : item.ru
    const distractors = pickDistractors(item, pool).map(d => showRu ? d.he : d.ru)
    const options = shuffle([correct, ...distractors])
    return { item, showRu, prompt, correct, options, promptIsHe: !showRu, answerIsHe: showRu }
  })
}

export default function FinalTest({ lessonId, onBack }) {
  const pool = useMemo(() => getWordPool(lessonId), [lessonId])
  const [questions, setQuestions] = useState(() => generateQuestions(pool))
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)

  function handleAnswer(opt) {
    const q = questions[idx]
    if (opt !== q.correct) {
      recordWordError(q.item)
    }
    const newAnswers = [...answers, { question: q, answer: opt }]
    setAnswers(newAnswers)

    if (idx + 1 >= questions.length) {
      const correct = newAnswers.filter(a => a.answer === a.question.correct).length
      const pct = Math.round((correct / questions.length) * 100)
      saveTestResult(lessonId, pct)
      recordFinalTestWordResults(newAnswers)
      setFinished(true)
    } else {
      setIdx(idx + 1)
    }
  }

  function restart() {
    setQuestions(generateQuestions(pool))
    setIdx(0)
    setAnswers([])
    setFinished(false)
  }

  if (!pool.length) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Итоговый тест — {lessonLabel(lessonId)}</h2>
        </div>
        <p className="text-secondary">Нет слов для теста.</p>
        <button className="btn btn-secondary mt-16" onClick={onBack}>Назад</button>
      </div>
    )
  }

  if (finished) {
    const correctCount = answers.filter(a => a.answer === a.question.correct).length
    const wrongCount = questions.length - correctCount
    const pct = Math.round((correctCount / questions.length) * 100)

    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Итоговый тест — {lessonLabel(lessonId)}</h2>
        </div>

        <div className="card result-card">
          <p className="text-secondary">Ваш результат</p>
          <div className={`score ${pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'bad'}`}>{pct}%</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ {correctCount}</span>
            <span style={{ color: 'var(--error)', fontWeight: 600 }}>✗ {wrongCount}</span>
          </div>
        </div>

        <div className="mt-16">
          <h3 style={{ marginBottom: 10, fontSize: '1rem' }}>Все ответы:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {answers.map((a, i) => {
              const isCorrect = a.answer === a.question.correct
              const heStyle = { fontFamily: 'var(--font-he)', direction: 'rtl', unicodeBidi: 'bidi-override' }
              return (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    borderLeft: `3px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
                    background: isCorrect ? '#f0fdf4' : '#fef2f2',
                    fontSize: '.9rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>
                      {i + 1}.{' '}
                      <span style={a.question.promptIsHe ? heStyle : undefined}>{a.question.prompt}</span>
                    </span>
                    <span style={{ fontSize: '1.1rem' }}>{isCorrect ? '✓' : '✗'}</span>
                  </div>
                  {isCorrect ? (
                    <div style={{ color: 'var(--success)' }}>
                      <span style={a.question.answerIsHe ? heStyle : undefined}>{a.answer}</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ color: 'var(--error)' }}>
                        Ваш ответ:{' '}
                        <span style={a.question.answerIsHe ? heStyle : undefined}>{a.answer}</span>
                      </div>
                      <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                        Правильно:{' '}
                        <span style={a.question.answerIsHe ? heStyle : undefined}>{a.question.correct}</span>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="gap-12 mt-16">
          <button className="btn btn-primary" onClick={restart}>Повторить тест</button>
          <button className="btn btn-secondary" onClick={onBack}>К режимам</button>
        </div>
      </div>
    )
  }

  const q = questions[idx]

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Итоговый тест — {lessonLabel(lessonId)}</h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        {pool.length} {lessonId === ALL_LESSONS_ID ? 'слов во всём курсе' : `слов в уроке ${lessonId}`}
      </p>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="progress-text">{idx + 1} / {questions.length}</div>

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
