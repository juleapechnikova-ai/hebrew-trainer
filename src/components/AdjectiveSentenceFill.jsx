import { useState, useMemo, useCallback } from 'react'
import { shuffle } from '../data/helpers'
import adjectivesData from '../data/adjectives.json'
import sentencePrompts from '../data/adjective-sentence-prompts.json'
import adjSentenceRuMap from '../data/adjective-sentence-translations.json'

const LEVEL_TITLE = 'Прилагательные · Предложения'

const GAP = '___'

const FALLBACK_SENTENCE = {
  ms: `בית ___ ליד בית הספר.`,
  fs: `דירה ___ בשכונה ליד הגן.`,
  mp: `ילדים ___ משחקים בחצר.`,
  fp: `בנות ___ לומדות בכיתה.`,
}

function agreementKeys(forms) {
  return ['ms', 'fs', 'mp', 'fp'].filter(k => forms[k])
}

function pickRandomAgreement(forms) {
  const keys = agreementKeys(forms)
  if (!keys.length) return null
  return keys[Math.floor(Math.random() * keys.length)]
}

function makeChoices(correct, adjEntry, otherAdjEntries) {
  const wrong = []
  const pushWrong = f => {
    if (f && f !== correct && !wrong.includes(f)) wrong.push(f)
  }
  for (const f of Object.values(adjEntry.forms)) pushWrong(f)
  for (const op of shuffle([...otherAdjEntries])) {
    for (const f of Object.values(op.forms)) {
      pushWrong(f)
      if (wrong.length >= 30) break
    }
    if (wrong.length >= 30) break
  }
  const distractors = shuffle(wrong).slice(0, 3)
  while (distractors.length < 3 && wrong.length > distractors.length) {
    const x = wrong.find(f => !distractors.includes(f))
    if (x) distractors.push(x)
    else break
  }
  return shuffle([correct, ...distractors.slice(0, 3)])
}

function sentenceRuAdj(sentence, lemmaRu) {
  if (adjSentenceRuMap[sentence]) return adjSentenceRuMap[sentence]
  return `… — прилагательное по смыслу: «${lemmaRu}».`
}

function buildOneQuestion(entries, slotIndex) {
  if (!entries.length) return null
  const adjEntry = entries[slotIndex % entries.length]
  const otherAdj = entries.filter(a => a.lemma !== adjEntry.lemma)

  const list = sentencePrompts[adjEntry.lemma]
  const picked = list?.length && list[Math.floor(Math.random() * list.length)]

  let s = ''
  let corr = ''

  if (picked?.sentenceHe?.includes(GAP) && picked.agreement && adjEntry.forms[picked.agreement]) {
    corr = adjEntry.forms[picked.agreement]
    s = picked.sentenceHe
  }

  if (!s) {
    const ag = pickRandomAgreement(adjEntry.forms)
    if (ag) {
      corr = adjEntry.forms[ag]
      s = FALLBACK_SENTENCE[ag] || FALLBACK_SENTENCE.ms
    }
  }

  const ch = makeChoices(corr, adjEntry, otherAdj)

  return {
    sentence: s,
    correct: corr,
    lemmaRu: adjEntry.ru,
    sentenceRu: sentenceRuAdj(s, adjEntry.ru),
    choices: ch,
  }
}

export default function AdjectiveSentenceFill({ onBack }) {
  const entries = useMemo(() => [...adjectivesData], [])

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])

  const questions = useMemo(() => {
    if (!entries.length) return []
    return Array.from({ length: 20 }, (_, i) => buildOneQuestion(entries, i))
  }, [entries])

  const q = questions[idx]
  const sentence = q?.sentence ?? ''
  const correct = q?.correct ?? ''
  const lemmaRu = q?.lemmaRu ?? ''
  const sentenceRu = q?.sentenceRu ?? ''
  const choices = q?.choices ?? []

  const goNext = useCallback(() => {
    setSelected(null)
    setIdx(i => i + 1)
  }, [])

  const goPrev = useCallback(() => {
    setSelected(null)
    setIdx(i => Math.max(0, i - 1))
  }, [])

  const goNextManual = useCallback(() => {
    setSelected(null)
    setIdx(i => {
      if (i >= 19) return 20
      return i + 1
    })
  }, [])

  const handlePick = useCallback(
    opt => {
      if (selected !== null || !q) return
      setSelected(opt)
      setAnswers(prev => {
        const rest = prev.filter(a => a.questionIdx !== idx)
        return [...rest, { questionIdx: idx, sentence, correct, answer: opt, lemmaRu }]
      })
    },
    [selected, q, idx, sentence, correct, lemmaRu]
  )

  const restart = () => {
    setIdx(0)
    setSelected(null)
    setAnswers([])
  }

  if (!entries.length) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>{LEVEL_TITLE}</h2>
        </div>
        <p className="text-secondary">Нет данных по прилагательным.</p>
        <button className="btn btn-secondary mt-16" onClick={onBack}>Назад</button>
      </div>
    )
  }

  if (idx >= 20) {
    const correctCount = answers.filter(a => a.answer === a.correct).length
    const pct = answers.length ? Math.round((correctCount / answers.length) * 100) : 0
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>{LEVEL_TITLE}</h2>
        </div>
        <div className="card result-card">
          <p className="text-secondary">Результат · прилагательные · 20 предложений</p>
          <div className={`score ${pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'bad'}`}>{pct}%</div>
          <p className="text-secondary text-sm mt-8">✓ {correctCount} · ✗ {answers.length - correctCount}</p>
        </div>
        <div className="gap-12 mt-16">
          <button className="btn btn-primary" onClick={restart}>Заново</button>
          <button className="btn btn-secondary" onClick={onBack}>Назад к разделу</button>
        </div>
      </div>
    )
  }

  const parts = sentence.split(GAP)

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>{LEVEL_TITLE}</h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        Вставьте прилагательное в форме, согласующейся с существительным (число и род); в вариантах — другие формы того же слова и других прилагательных.
      </p>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${((idx + 1) / 20) * 100}%` }} />
      </div>
      <div className="progress-text">{idx + 1} / 20</div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginTop: 12,
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          disabled={idx === 0}
          onClick={goPrev}
        >
          ← Предыдущее
        </button>
        <button type="button" className="btn btn-secondary" onClick={goNextManual}>
          {idx >= 19 ? 'К результату →' : 'Следующее →'}
        </button>
      </div>

      <div className="card" style={{ padding: '20px 16px' }}>
        <div className="big-text he" style={{ fontSize: '1.35rem', lineHeight: 1.6, textAlign: 'right' }}>
          {selected === null ? (
            <>
              <span style={{ direction: 'rtl', fontFamily: 'var(--font-he)', unicodeBidi: 'bidi-override' }}>{parts[0]}</span>
              <span
                style={{
                  display: 'inline-block',
                  minWidth: '2.2em',
                  borderBottom: '2px dashed var(--border)',
                  margin: '0 6px',
                  verticalAlign: 'bottom',
                }}
              >
                {' '}
              </span>
              <span style={{ direction: 'rtl', fontFamily: 'var(--font-he)', unicodeBidi: 'bidi-override' }}>{parts[1] || ''}</span>
            </>
          ) : (
            <span
              style={{
                direction: 'rtl',
                fontFamily: 'var(--font-he)',
                unicodeBidi: 'bidi-override',
                display: 'block',
              }}
            >
              <span>{parts[0]}</span>
              <strong style={{ color: 'var(--accent, #2563eb)', fontWeight: 700, margin: '0 4px' }}>{correct}</strong>
              <span>{parts[1] || ''}</span>
            </span>
          )}
        </div>
        {selected !== null && sentenceRu ? (
          <p
            className="text-secondary text-sm"
            style={{ textAlign: 'left', marginTop: 14, lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 12 }}
          >
            {sentenceRu}
          </p>
        ) : null}
      </div>

      <div className="gap-12 mt-16">
        {choices.map((opt, i) => {
          let cls = 'option-btn'
          if (selected !== null) {
            if (opt === correct) cls += ' correct'
            else if (opt === selected) cls += ' wrong'
          }
          return (
            <button
              key={`${idx}-${opt}-${i}`}
              type="button"
              className={cls}
              style={{ direction: 'rtl', fontFamily: 'var(--font-he)' }}
              onClick={() => handlePick(opt)}
              disabled={selected !== null}
            >
              {opt}
            </button>
          )
        })}
        {selected !== null && (
          <button type="button" className="btn btn-primary" onClick={goNext}>
            Дальше
          </button>
        )}
      </div>
    </div>
  )
}
