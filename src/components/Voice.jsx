import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { getLessonOnly, shuffle, normalize } from '../data/helpers'

const SpeechRecognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition

const PRAISE = ['Отлично! 🎉', 'Молодец! 👏', 'Супер! ⭐', 'Правильно! ✅', 'Верно! 💪', 'Круто! 🔥']

export default function Voice({ lessonId, direction, onBack }) {
  const pool = useMemo(() => shuffle(getLessonOnly(lessonId)), [lessonId])
  const [idx, setIdx] = useState(0)
  const [recording, setRecording] = useState(false)
  const [recognized, setRecognized] = useState('')
  const [result, setResult] = useState(null)
  const [praise, setPraise] = useState('')
  const [score, setScore] = useState(0)
  const recRef = useRef(null)
  const recognizedRef = useRef('')
  const autoAdvanceTimer = useRef(null)
  const idxRef = useRef(idx)
  const userStoppedRef = useRef(false)
  idxRef.current = idx

  const noSpeech = !SpeechRecognition

  const resetState = useCallback(() => {
    clearTimeout(autoAdvanceTimer.current)
    setRecognized('')
    setResult(null)
    setPraise('')
    recognizedRef.current = ''
  }, [])

  const goTo = useCallback((newIdx) => {
    userStoppedRef.current = true
    if (recRef.current) { recRef.current.abort(); recRef.current = null }
    setRecording(false)
    const clamped = Math.max(0, Math.min(newIdx, pool.length - 1))
    setIdx(clamped)
    resetState()
  }, [pool.length, resetState])

  function doCheck(text, itemIdx) {
    const item = pool[itemIdx]
    if (!item || !text.trim()) return
    const showRu = direction === 'ru-he' || (direction === 'mixed' && itemIdx % 2 === 0)
    const expected = showRu ? item.he : item.ru

    if (normalize(text) === normalize(expected)) {
      setScore(s => s + 1)
      setResult('correct')
      setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)])
      autoAdvanceTimer.current = setTimeout(() => {
        if (idxRef.current + 1 < pool.length) goTo(idxRef.current + 1)
        else setIdx(pool.length)
      }, 1500)
    } else {
      setResult('wrong')
    }
  }

  function startRecording() {
    if (!SpeechRecognition) return
    if (recRef.current) { recRef.current.abort(); recRef.current = null }
    clearTimeout(autoAdvanceTimer.current)
    resetState()

    const capturedIdx = idx
    const rec = new SpeechRecognition()
    const answerIsHe = direction === 'ru-he' || (direction === 'mixed' && idx % 2 === 0)
    rec.lang = answerIsHe ? 'he-IL' : 'ru-RU'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript
      }
      text = text.trim()
      if (text) {
        recognizedRef.current = text
        setRecognized(text)
      }
    }

    rec.onerror = () => {
      setRecording(false)
      recRef.current = null
    }

    rec.onend = () => {
      recRef.current = null
      if (userStoppedRef.current) {
        setRecording(false)
        const text = recognizedRef.current.trim()
        if (text) doCheck(text, capturedIdx)
        return
      }
      setTimeout(() => {
        if (!recRef.current && userStoppedRef.current === false) {
          try {
            const next = new SpeechRecognition()
            next.lang = rec.lang
            next.continuous = true
            next.interimResults = true
            next.maxAlternatives = 1
            next.onresult = rec.onresult
            next.onerror = rec.onerror
            next.onend = rec.onend
            recRef.current = next
            next.start()
          } catch {
            setRecording(false)
          }
        }
      }, 100)
    }

    recRef.current = rec
    userStoppedRef.current = false
    try {
      rec.start()
    } catch {
      setRecording(false)
      recRef.current = null
      return
    }
    setRecording(true)
  }

  function stopRecording() {
    userStoppedRef.current = true
    if (recRef.current) recRef.current.stop()
  }

  useEffect(() => {
    return () => {
      clearTimeout(autoAdvanceTimer.current)
      if (recRef.current) recRef.current.abort()
    }
  }, [])

  const item = pool[idx]
  if (!item) {
    const pct = pool.length > 0 ? Math.round((score / pool.length) * 100) : 0
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>Голос — Урок {lessonId}</h2>
        </div>
        <div className="card result-card">
          <p className="text-secondary">Результат</p>
          <div className={`score ${pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'bad'}`}>{pct}%</div>
          <p>{score} из {pool.length} правильно</p>
          <div className="gap-12 mt-16">
            <button className="btn btn-primary" onClick={() => { setScore(0); goTo(0) }}>
              Пройти ещё раз
            </button>
            <button className="btn btn-secondary" onClick={onBack}>К режимам</button>
          </div>
        </div>
      </div>
    )
  }

  const showRu = direction === 'ru-he' || (direction === 'mixed' && idx % 2 === 0)
  const prompt = showRu ? item.ru : item.he
  const expected = showRu ? item.he : item.ru
  const promptIsHe = !showRu
  const answerIsHe = showRu

  function speakPrompt() {
    const u = new SpeechSynthesisUtterance(prompt)
    u.lang = promptIsHe ? 'he-IL' : 'ru-RU'
    speechSynthesis.speak(u)
  }

  function speakAnswer() {
    userStoppedRef.current = true
    if (recRef.current) { recRef.current.abort(); recRef.current = null }
    setRecording(false)
    const u = new SpeechSynthesisUtterance(expected)
    u.lang = answerIsHe ? 'he-IL' : 'ru-RU'
    speechSynthesis.speak(u)
    setResult('skip')
    setRecognized('')
    recognizedRef.current = ''
  }

  function manualCheck() {
    doCheck(recognized, idx)
  }

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Голос — Урок {lessonId}</h2>
      </div>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${((idx + 1) / pool.length) * 100}%` }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button
          className="btn btn-sm btn-secondary"
          style={{ width: 'auto', opacity: idx === 0 ? 0.4 : 1 }}
          onClick={() => goTo(idx - 1)}
          disabled={idx === 0}
        >
          ← Назад
        </button>
        <span className="text-secondary text-sm">{idx + 1} / {pool.length}</span>
        <button
          className="btn btn-sm btn-secondary"
          style={{ width: 'auto', opacity: idx >= pool.length - 1 ? 0.4 : 1 }}
          onClick={() => goTo(idx + 1)}
          disabled={idx >= pool.length - 1}
        >
          Вперёд →
        </button>
      </div>

      <div className="card">
        <div className={`big-text ${promptIsHe ? 'he' : ''}`}>{prompt}</div>
        <div className="text-center">
          <button className="btn btn-sm btn-secondary" onClick={speakPrompt} style={{ width: 'auto', display: 'inline-flex' }}>
            🔊 Озвучить
          </button>
        </div>
      </div>

      <div className="voice-area mt-16">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          <button
            className={`voice-btn ${recording ? 'recording' : ''}`}
            onClick={() => {
              if (recording) { stopRecording() }
              else { resetState(); startRecording() }
            }}
            style={{
              ...(recording ? { flexDirection: 'column', gap: 4, fontSize: '1.5rem' } : {}),
              ...(noSpeech ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}),
            }}
            title={noSpeech ? 'Микрофон недоступен (Chrome/Edge)' : undefined}
          >
            {recording ? <>⏹<span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Стоп</span></> : '🎤'}
          </button>
          <button
            className="voice-btn"
            style={{ background: 'var(--warning)', fontSize: '1rem', width: 80, height: 80 }}
            onClick={speakAnswer}
            disabled={recording}
          >
            🤷 Не знаю
          </button>
        </div>

        <p className="text-secondary text-sm" style={{ marginTop: 8 }}>
          {noSpeech
            ? 'Микрофон недоступен. Введите перевод ниже и нажмите Проверить.'
            : recording
              ? 'Слушаю… Скажите перевод и нажмите Стоп, когда закончите'
              : 'Нажмите 🎤 — скажите перевод — нажмите Стоп — проверю'}
        </p>

        {recognized && !noSpeech && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f1f5f9', borderRadius: 'var(--radius)', fontSize: '1.05rem' }}>
            <span className="text-secondary text-sm">Вы сказали: </span>
            <span className={answerIsHe ? 'he' : ''} style={{ fontWeight: 600 }}>{recognized}</span>
          </div>
        )}

        {result === null && (
          <div style={{ marginTop: 12 }}>
            <input
              className="recognized-text"
              value={recognized}
              onChange={e => { setRecognized(e.target.value); recognizedRef.current = e.target.value }}
              placeholder={noSpeech ? 'Введите перевод слова' : 'Подправьте, если нужно'}
              dir={answerIsHe ? 'rtl' : 'ltr'}
            />
            <button className="btn btn-primary" onClick={manualCheck} style={{ marginTop: 8 }}>
              Проверить
            </button>
          </div>
        )}

        {result === 'correct' && (
          <div className="card" style={{ borderLeft: '4px solid var(--success)', padding: 16, marginTop: 12, textAlign: 'center' }}>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{praise}</p>
            <p className="text-secondary text-sm" style={{ marginTop: 4 }}>Переход через 1.5 сек…</p>
          </div>
        )}

        {result === 'wrong' && (
          <div style={{ marginTop: 12 }} className="gap-12">
            <div className="card" style={{ borderLeft: '4px solid var(--error)', padding: 12 }}>
              <p style={{ fontWeight: 600, color: 'var(--error)', marginBottom: 8 }}>✗ Неверно</p>
              <p>
                Правильный ответ: <strong className={answerIsHe ? 'he' : ''} style={{ fontSize: '1.2rem' }}>{expected}</strong>
              </p>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => { const u = new SpeechSynthesisUtterance(expected); u.lang = answerIsHe ? 'he-IL' : 'ru-RU'; speechSynthesis.speak(u) }}
                style={{ width: 'auto', display: 'inline-flex', marginTop: 8 }}
              >
                🔊 Послушать
              </button>
            </div>
            <button className="btn btn-primary" onClick={() => goTo(idx + 1)} disabled={idx >= pool.length - 1}>
              Дальше →
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => resetState()}>
              Попробовать ещё раз
            </button>
          </div>
        )}

        {result === 'skip' && (
          <div style={{ marginTop: 12 }} className="gap-12">
            <div className="card" style={{ borderLeft: '4px solid var(--warning)', padding: 12 }}>
              <p style={{ fontWeight: 600, color: 'var(--warning)' }}>Ответ:</p>
              <p className={answerIsHe ? 'he' : ''} style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4 }}>
                {expected}
              </p>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => { const u = new SpeechSynthesisUtterance(expected); u.lang = answerIsHe ? 'he-IL' : 'ru-RU'; speechSynthesis.speak(u) }}
                style={{ width: 'auto', display: 'inline-flex', marginTop: 8 }}
              >
                🔊 Послушать ещё раз
              </button>
            </div>
            <button className="btn btn-primary" onClick={() => goTo(idx + 1)} disabled={idx >= pool.length - 1}>
              Дальше →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
