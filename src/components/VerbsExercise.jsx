import { useState, useMemo } from 'react'
import { getVerbsByBinyan, shuffle, normalize } from '../data/helpers'
import pastTenseData from '../data/past-tense.json'

export default function VerbsExercise({ binyan, onBack }) {
  const verbs = useMemo(() => shuffle(getVerbsByBinyan(binyan)), [binyan])
  const [mode, setMode] = useState(null)
  const [direction, setDirection] = useState('mixed')

  if (!mode) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Глаголы {binyan === 'all' ? '— все' : `— ${binyan}`}</h2>
        </div>
        <p className="text-secondary text-sm mb-8">{verbs.length} глаголов</p>

        <div className="direction-toggle">
          {[
            { v: 'ru-he', l: 'RU → HE' },
            { v: 'he-ru', l: 'HE → RU' },
            { v: 'mixed', l: 'Микс' },
          ].map(d => (
            <button
              key={d.v}
              className={direction === d.v ? 'active' : ''}
              onClick={() => setDirection(d.v)}
            >
              {d.l}
            </button>
          ))}
        </div>

        <div className="mode-grid">
          <div className="mode-tile" onClick={() => setMode('flashcards')}>
            <div className="icon">🃏</div>
            <div className="label">Карточки</div>
          </div>
          <div className="mode-tile" onClick={() => setMode('quiz')}>
            <div className="icon">✅</div>
            <div className="label">Тест</div>
          </div>
          <div className="mode-tile" onClick={() => setMode('past-pairs')}>
            <div className="icon">🔗</div>
            <div className="label">Прошедшее время</div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'flashcards') return <VerbFlashcards verbs={verbs} direction={direction} onBack={() => setMode(null)} />
  if (mode === 'quiz') return <VerbQuiz verbs={verbs} direction={direction} onBack={() => setMode(null)} />
  if (mode === 'past-pairs') return <VerbPastPairs onBack={() => setMode(null)} />
  return null
}

function VerbFlashcards({ verbs, direction, onBack }) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (idx >= verbs.length) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Глаголы — Карточки</h2>
        </div>
        <div className="card result-card">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Все карточки просмотрены!</p>
          <div className="gap-12 mt-16">
            <button className="btn btn-primary" onClick={() => { setIdx(0); setFlipped(false) }}>Заново</button>
            <button className="btn btn-secondary" onClick={onBack}>К режимам</button>
          </div>
        </div>
      </div>
    )
  }

  const v = verbs[idx]
  const showRu = direction === 'ru-he' || (direction === 'mixed' && idx % 2 === 0)
  const front = showRu ? v.ru : v.he
  const back = showRu ? v.he : v.ru
  const frontIsHe = !showRu
  const backIsHe = showRu

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Глаголы — Карточки</h2>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${((idx + 1) / verbs.length) * 100}%` }} />
      </div>
      <div className="progress-text">{idx + 1} / {verbs.length}</div>

      <div className="card" style={{ cursor: 'pointer', minHeight: 180 }} onClick={() => setFlipped(!flipped)}>
        {!flipped ? (
          <>
            <div className={`big-text ${frontIsHe ? 'he' : ''}`}>{front}</div>
            <p className="text-center text-secondary text-sm">Нажмите, чтобы увидеть перевод</p>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className={`big-text ${backIsHe ? 'he' : ''}`} style={{ marginBottom: 8 }}>{back}</div>
            <p className="text-secondary text-sm">
              <span className="he" style={{ marginRight: 8 }}>{v.binyan}</span>
              {v.group && <span>· {v.group}</span>}
            </p>
          </div>
        )}
      </div>

      <div className="gap-12 mt-16">
        {flipped ? (
          <button className="btn btn-primary" onClick={() => { setIdx(idx + 1); setFlipped(false) }}>
            Дальше →
          </button>
        ) : (
          <button className="btn btn-outline" onClick={() => setFlipped(true)}>
            Показать перевод
          </button>
        )}
      </div>
    </div>
  )
}

function VerbQuiz({ verbs, direction, onBack }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])

  const v = verbs[idx]
  const showRu = v ? (direction === 'ru-he' || (direction === 'mixed' && idx % 2 === 0)) : true
  const prompt = v ? (showRu ? v.ru : v.he) : ''
  const correct = v ? (showRu ? v.he : v.ru) : ''
  const promptIsHe = !showRu
  const answerIsHe = showRu

  const options = useMemo(() => {
    if (!v) return []
    const others = verbs.filter(x => x.he !== v.he)
    const distractors = shuffle(others).slice(0, 3).map(d => showRu ? d.he : d.ru)
    return shuffle([correct, ...distractors])
  }, [idx, v, verbs, correct, showRu])

  function handleSelect(opt) {
    if (selected !== null) return
    setSelected(opt)
    setAnswers(prev => [...prev, { prompt, correct, answer: opt, promptIsHe, answerIsHe }])
    setTimeout(() => { setSelected(null); setIdx(i => i + 1) }, 1200)
  }

  function restart() {
    setIdx(0)
    setSelected(null)
    setAnswers([])
  }

  if (idx >= verbs.length) {
    const correctCount = answers.filter(a => a.answer === a.correct).length
    const wrongCount = answers.length - correctCount
    const pct = Math.round((correctCount / answers.length) * 100)
    const heStyle = { fontFamily: 'var(--font-he)', direction: 'rtl', unicodeBidi: 'bidi-override' }

    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Глаголы — Тест</h2>
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
          <button className="btn btn-primary" onClick={restart}>Заново</button>
          <button className="btn btn-secondary" onClick={onBack}>К режимам</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Глаголы — Тест</h2>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${((idx + 1) / verbs.length) * 100}%` }} />
      </div>
      <div className="progress-text">{idx + 1} / {verbs.length}</div>

      <div className="card">
        <div className={`big-text ${promptIsHe ? 'he' : ''}`}>{prompt}</div>
      </div>

      <div className="gap-12 mt-16">
        {options.map((opt, i) => {
          let cls = 'option-btn'
          if (selected !== null) {
            if (opt === correct) cls += ' correct'
            else if (opt === selected) cls += ' wrong'
          }
          return (
            <button
              key={i}
              className={cls}
              style={answerIsHe
                ? { direction: 'rtl', fontFamily: 'var(--font-he)' }
                : { direction: 'ltr', textAlign: 'left' }
              }
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

const PRONOUNS = ['אני', 'אתה', 'את', 'הוא', 'היא', 'אנחנו', 'אתם', 'הם/הן']
const PRONOUN_RU = {
  'אני': 'я', 'אתה': 'ты (м)', 'את': 'ты (ж)',
  'הוא': 'он', 'היא': 'она', 'אנחנו': 'мы',
  'אתם': 'вы', 'הם/הן': 'они'
}

function VerbPastPairs({ onBack }) {
  const allVerbs = useMemo(() => shuffle([...pastTenseData]), [])
  const [verbIdx, setVerbIdx] = useState(0)

  const verb = allVerbs[verbIdx]

  const pronounList = useMemo(
    () => verb ? shuffle(PRONOUNS.filter(p => verb.forms[p])) : [],
    [verb]
  )
  const formList = useMemo(
    () => verb ? shuffle(pronounList.map(p => ({ pronoun: p, form: verb.forms[p] }))) : [],
    [verb, pronounList]
  )

  const [selectedLeft, setSelectedLeft] = useState(null)
  const [selectedRight, setSelectedRight] = useState(null)
  const [matched, setMatched] = useState(new Set())
  const [wrongFlash, setWrongFlash] = useState(null)

  function reset() {
    setSelectedLeft(null)
    setSelectedRight(null)
    setMatched(new Set())
    setWrongFlash(null)
  }

  if (verbIdx >= allVerbs.length) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Прошедшее время — Пары</h2>
        </div>
        <div className="card result-card">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Все глаголы пройдены!</p>
          <div className="gap-12 mt-16">
            <button className="btn btn-primary" onClick={() => { setVerbIdx(0); reset() }}>Заново</button>
            <button className="btn btn-secondary" onClick={onBack}>К режимам</button>
          </div>
        </div>
      </div>
    )
  }

  function handleLeft(pronoun) {
    if (matched.has(pronoun)) return
    setSelectedLeft(pronoun)
    if (selectedRight !== null) tryMatch(pronoun, selectedRight)
  }

  function handleRight(pronoun) {
    if (matched.has(pronoun)) return
    setSelectedRight(pronoun)
    if (selectedLeft !== null) tryMatch(selectedLeft, pronoun)
  }

  function tryMatch(leftPronoun, rightPronoun) {
    if (leftPronoun === rightPronoun) {
      setMatched(prev => new Set([...prev, leftPronoun]))
      setSelectedLeft(null)
      setSelectedRight(null)
    } else {
      setWrongFlash({ l: leftPronoun, r: rightPronoun })
      setTimeout(() => {
        setWrongFlash(null)
        setSelectedLeft(null)
        setSelectedRight(null)
      }, 600)
    }
  }

  const allMatched = matched.size === pronounList.length

  function nextVerb() {
    setVerbIdx(i => i + 1)
    reset()
  }

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Прошедшее время — Пары</h2>
      </div>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${((verbIdx + 1) / allVerbs.length) * 100}%` }} />
      </div>
      <div className="progress-text">
        Глагол {verbIdx + 1} / {allVerbs.length}
      </div>

      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>{verb.ru}</div>
        <div className="he" style={{ fontSize: '1.3rem', fontWeight: 600 }}>{verb.root}</div>
        <div className="text-secondary text-sm" style={{ marginTop: 4 }}>{verb.binyan}</div>
      </div>

      <div className="pairs-container" style={{ direction: 'rtl' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pronounList.map(p => {
            let cls = 'pair-item he'
            if (matched.has(p)) cls += ' matched'
            else if (selectedLeft === p) cls += ' selected'
            if (wrongFlash?.l === p) cls += ' wrong-flash'
            return (
              <div key={p} className={cls} onClick={() => handleLeft(p)}>
                <span>{p}</span>
                <span className="text-secondary text-sm" style={{ marginRight: 6 }}>{PRONOUN_RU[p]}</span>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {formList.map(({ pronoun, form }) => {
            let cls = 'pair-item he'
            if (matched.has(pronoun)) cls += ' matched'
            else if (selectedRight === pronoun) cls += ' selected'
            if (wrongFlash?.r === pronoun) cls += ' wrong-flash'
            return (
              <div key={pronoun} className={cls} onClick={() => handleRight(pronoun)}>
                {form}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-16" style={{ display: 'flex', gap: 12 }}>
        <button
          className="btn btn-secondary"
          style={{ flex: 1 }}
          disabled={verbIdx === 0}
          onClick={() => { setVerbIdx(i => i - 1); reset() }}
        >
          ← Назад
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={nextVerb}
        >
          Вперёд →
        </button>
      </div>
    </div>
  )
}
