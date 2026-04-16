import { useState, useMemo, useCallback } from 'react'
import { shuffle } from '../data/helpers'
import pastTenseData from '../data/past-tense.json'
import presentByRoot from '../data/verb-present-by-root.json'
import levelBConfig from '../data/verb-roots-level-b.json'
import sentencePrompts from '../data/verb-sentence-prompts-b.json'
import verbSentenceRuMap from '../data/verb-sentence-translations.json'

const LEVEL_B_ROOTS = new Set(levelBConfig.roots)
const LEVEL_TITLE = 'Предложения · ב'

const GAP = '___'

const PRONOUNS = ['אני', 'אתה', 'את', 'הוא', 'היא', 'אנחנו', 'אתם', 'הם/הן']

function subjectForSentence(pronoun) {
  if (pronoun === 'הם/הן') return 'הם'
  return pronoun
}

function buildSentencePast(pronoun) {
  const subj = subjectForSentence(pronoun)
  return `אתמול ${subj} ${GAP} בבית.`
}

function buildSentencePresent() {
  return `היום הוא ${GAP} כאן.`
}

function makeChoices(correct, pastEntry, presentHe, otherPastEntries) {
  const wrong = []
  const pushWrong = f => {
    if (f && f !== correct && !wrong.includes(f)) wrong.push(f)
  }
  for (const f of Object.values(pastEntry.forms)) pushWrong(f)
  pushWrong(presentHe)
  for (const op of shuffle([...otherPastEntries])) {
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

function sentenceRuVerb(sentence, pastEntry, pUsePast) {
  if (verbSentenceRuMap[sentence]) return verbSentenceRuMap[sentence]
  if (sentence.includes('היום הוא') && sentence.includes('כאן')) {
    return `Сегодня он здесь — ${pastEntry.ru} (нужная форма).`
  }
  const m = sentence.match(/^אתמול (\S+) ___ בבית\.$/)
  const subj = m ? m[1] : pUsePast ? subjectForSentence(pUsePast) : 'הוא'
  const ruSubj = HEB_SUBJ_TO_RU[subj] || 'он/она'
  return `Вчера ${ruSubj} … дома — глагол «${pastEntry.ru}».`
}

const HEB_SUBJ_TO_RU = {
  אני: 'я',
  אתה: 'ты',
  את: 'ты',
  הוא: 'он',
  היא: 'она',
  אנחנו: 'мы',
  אתם: 'вы',
  הם: 'они',
  הן: 'они',
}

function buildOneQuestion(entries, pastLevelB, slotIndex) {
  if (!entries.length) return null
  const pastEntry = entries[slotIndex % entries.length]
  const presentHe = presentByRoot[pastEntry.root]
  const otherPast = pastLevelB.filter(p => p.root !== pastEntry.root)

  const rootPrompts = sentencePrompts[pastEntry.root]
  const picked =
    rootPrompts?.length &&
    rootPrompts[Math.floor(Math.random() * rootPrompts.length)]

  let s = ''
  let corr = ''
  let pUsePast = null

  if (picked?.sentenceHe?.includes(GAP)) {
    if (picked.mode === 'past') {
      const pronoun = picked.pronoun || 'הוא'
      corr = pastEntry.forms[pronoun] || pastEntry.forms.הוא
      s = picked.sentenceHe
    } else if (picked.mode === 'present') {
      corr = presentHe
      s = picked.sentenceHe
    }
  }

  if (!s) {
    const usePast = Math.random() < 0.55
    if (usePast) {
      const pronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)]
      corr = pastEntry.forms[pronoun]
      const pUse = corr ? pronoun : 'הוא'
      corr = corr || pastEntry.forms.הוא
      pUsePast = pUse
      s = buildSentencePast(pUse)
    } else {
      corr = presentHe
      s = buildSentencePresent()
    }
  }

  const ch = makeChoices(corr, pastEntry, presentHe, otherPast)

  return {
    sentence: s,
    correct: corr,
    rootRu: pastEntry.ru,
    sentenceRu: sentenceRuVerb(s, pastEntry, pUsePast),
    choices: ch,
  }
}

export default function VerbSentenceFill({ binyan, onBack }) {
  const pastLevelB = useMemo(
    () => pastTenseData.filter(p => LEVEL_B_ROOTS.has(p.root)),
    []
  )

  const entries = useMemo(() => {
    const list = pastLevelB.filter(p => p.binyan === binyan || binyan === 'all')
    return list.filter(p => presentByRoot[p.root])
  }, [binyan, pastLevelB])

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])

  const questions = useMemo(() => {
    if (!entries.length) return []
    return Array.from({ length: 20 }, (_, i) => buildOneQuestion(entries, pastLevelB, i))
  }, [entries, pastLevelB])

  const q = questions[idx]
  const sentence = q?.sentence ?? ''
  const correct = q?.correct ?? ''
  const rootRu = q?.rootRu ?? ''
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
        return [...rest, { questionIdx: idx, sentence, correct, answer: opt, rootRu }]
      })
    },
    [selected, q, idx, sentence, correct, rootRu]
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
        <p className="text-secondary">Нет глаголов уровня ב для выбранного биньяна.</p>
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
          <p className="text-secondary">Результат · ב · 20 предложений</p>
          <div className={`score ${pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'bad'}`}>{pct}%</div>
          <p className="text-secondary text-sm mt-8">✓ {correctCount} · ✗ {answers.length - correctCount}</p>
        </div>
        <div className="gap-12 mt-16">
          <button className="btn btn-primary" onClick={restart}>Заново</button>
          <button className="btn btn-secondary" onClick={onBack}>К режимам</button>
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
        {levelBConfig.labelRu}. Вставьте глагол в нужной форме; в вариантах — настоящее и прошедшее, разные лица.
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
