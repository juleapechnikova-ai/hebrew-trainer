import { useState, useMemo } from 'react'
import {
  getWordPool,
  lessonLabel,
  shuffle,
  pickDistractors,
  getErrorWordsFromPool,
  recordWordError,
  recordWordErrorResolved,
} from '../data/helpers'

export default function Quiz({ lessonId, direction, onBack, errorsOnly = false }) {
  const fullPool = useMemo(() => getWordPool(lessonId), [lessonId])
  const pool = useMemo(() => {
    if (!errorsOnly) return fullPool
    return getErrorWordsFromPool(fullPool)
  }, [lessonId, fullPool, errorsOnly])

  const questions = useMemo(() => shuffle(pool), [pool])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])

  const q = questions[idx]
  const showRu = direction === 'ru-he' || (direction === 'mixed' && idx % 2 === 0)
  const prompt = q ? (showRu ? q.ru : q.he) : ''
  const correctAnswer = q ? (showRu ? q.he : q.ru) : ''
  const promptIsHe = !showRu
  const answerIsHe = showRu

  const options = useMemo(() => {
    if (!q) return []
    const distractorPool = errorsOnly ? fullPool : pool
    const distractors = pickDistractors(q, distractorPool)
    const opts = distractors.map(d => showRu ? d.he : d.ru)
    opts.push(correctAnswer)
    return shuffle(opts)
  }, [idx, q, pool, fullPool, showRu, correctAnswer, errorsOnly])

  function handleSelect(opt) {
    if (selected !== null || !q) return
    setSelected(opt)
    const ok = opt === correctAnswer
    if (!ok) {
      recordWordError(q)
    } else if (errorsOnly) {
      recordWordErrorResolved(q)
    }
    const newAnswers = [
      ...answers,
      { prompt, correct: correctAnswer, answer: opt, promptIsHe, answerIsHe, item: q },
    ]
    setAnswers(newAnswers)
    setTimeout(() => {
      setSelected(null)
      setIdx(i => i + 1)
    }, 1200)
  }

  function restart() {
    setIdx(0)
    setSelected(null)
    setAnswers([])
  }

  const titleSuffix = errorsOnly ? ' — только ошибки' : ''
  const label = lessonLabel(lessonId)

  if (errorsOnly && fullPool.length && pool.length === 0) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Тест{titleSuffix} — {label}</h2>
        </div>
        <p className="text-secondary text-sm mb-8">
          Пока нет записанных ошибок по этому объёму слов. Пройдите тест, пары, голос или итоговый тест — неверные ответы попадут сюда.
        </p>
        <button className="btn btn-secondary" onClick={onBack}>Назад к режимам</button>
      </div>
    )
  }

  if (!pool.length) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Тест{titleSuffix} — {label}</h2>
        </div>
        <p className="text-secondary">Нет слов для теста.</p>
        <button className="btn btn-secondary mt-16" onClick={onBack}>Назад</button>
      </div>
    )
  }

  if (idx >= questions.length) {
    const correctCount = answers.filter(a => a.answer === a.correct).length
    const wrongCount = answers.length - correctCount
    const pct = Math.round((correctCount / answers.length) * 100)
    const heStyle = { fontFamily: 'var(--font-he)', direction: 'rtl', unicodeBidi: 'bidi-override' }

    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Тест{titleSuffix} — {label}</h2>
        </div>

        <div className="card result-card">
          <p className="text-secondary">Результат</p>
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
              const ok = a.answer === a.correct
              return (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    borderLeft: `3px solid ${ok ? 'var(--success)' : 'var(--error)'}`,
                    background: ok ? '#f0fdf4' : '#fef2f2',
                    fontSize: '.9rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>
                      {i + 1}.{' '}
                      <span style={a.promptIsHe ? heStyle : undefined}>{a.prompt}</span>
                    </span>
                    <span style={{ fontSize: '1.1rem' }}>{ok ? '✓' : '✗'}</span>
                  </div>
                  {ok ? (
                    <div style={{ color: 'var(--success)' }}>
                      <span style={a.answerIsHe ? heStyle : undefined}>{a.answer}</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ color: 'var(--error)' }}>
                        Ваш ответ: <span style={a.answerIsHe ? heStyle : undefined}>{a.answer}</span>
                      </div>
                      <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                        Правильно: <span style={a.answerIsHe ? heStyle : undefined}>{a.correct}</span>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="gap-12 mt-16">
          <button className="btn btn-primary" onClick={restart}>Пройти ещё раз</button>
          <button className="btn btn-secondary" onClick={onBack}>К режимам</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Тест{titleSuffix} — {label}</h2>
      </div>

      {errorsOnly && (
        <p className="text-secondary text-sm mb-8">
          Слова, в которых вы ошибались в других режимах. Верный ответ уменьшает «штраф» по слову.
        </p>
      )}

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="progress-text">{idx + 1} / {questions.length}</div>

      <div className="card">
        <div className={`big-text ${promptIsHe ? 'he' : ''}`}>{prompt}</div>
      </div>

      <div className="gap-12 mt-16">
        {options.map((opt, i) => {
          let cls = 'option-btn'
          if (selected !== null) {
            if (opt === correctAnswer) cls += ' correct'
            else if (opt === selected) cls += ' wrong'
          }
          return (
            <button
              key={i}
              className={cls}
              style={answerIsHe ? { direction: 'rtl', fontFamily: 'var(--font-he)' } : { direction: 'ltr', textAlign: 'left' }}
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
