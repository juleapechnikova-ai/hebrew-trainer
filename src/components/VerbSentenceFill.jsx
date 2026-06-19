import { useState, useMemo, useCallback } from 'react'
import { shuffle, buildRootPaalGroupMap } from '../data/helpers'
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

/** @param {'past'|'present'|'mixed'} tenseMode */
function makeChoices(correct, pastEntry, presentHe, otherPastEntries, tenseMode = 'mixed') {
  const wrong = []
  const pushWrong = f => {
    if (f && f !== correct && !wrong.includes(f)) wrong.push(f)
  }
  if (tenseMode !== 'present') {
    for (const f of Object.values(pastEntry.forms)) pushWrong(f)
  }
  if (tenseMode !== 'past') {
    pushWrong(presentHe)
  }
  for (const op of shuffle([...otherPastEntries])) {
    if (tenseMode !== 'present') {
      for (const f of Object.values(op.forms)) {
        pushWrong(f)
        if (wrong.length >= 30) break
      }
    }
    if (tenseMode !== 'past') {
      pushWrong(presentByRoot[op.root])
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

function resolveTenseMode({ pastOnly, presentOnly }) {
  if (pastOnly) return 'past'
  if (presentOnly) return 'present'
  return 'mixed'
}

function buildOneQuestion(entries, pastLevelB, slotIndex, { pastOnly = false, presentOnly = false } = {}) {
  if (!entries.length) return null
  const tenseMode = resolveTenseMode({ pastOnly, presentOnly })
  const pastEntry = entries[slotIndex % entries.length]
  const presentHe = presentByRoot[pastEntry.root]
  const otherPast = pastLevelB.filter(p => p.root !== pastEntry.root)

  const rootPrompts = sentencePrompts[pastEntry.root]
  const pool =
    tenseMode === 'past'
      ? (rootPrompts || []).filter(p => p.mode === 'past')
      : tenseMode === 'present'
        ? (rootPrompts || []).filter(p => p.mode === 'present')
        : rootPrompts
  const picked =
    pool?.length &&
    pool[Math.floor(Math.random() * pool.length)]

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
    if (tenseMode === 'past') {
      const pronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)]
      corr = pastEntry.forms[pronoun]
      const pUse = corr ? pronoun : 'הוא'
      corr = corr || pastEntry.forms.הוא
      pUsePast = pUse
      s = buildSentencePast(pUse)
    } else if (tenseMode === 'present') {
      corr = presentHe
      s = buildSentencePresent()
    } else {
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
  }

  // Варианты как в учебнике: настоящее + прошедшее (и для наст., и для прош. вопросов)
  const choiceMode = pastOnly || presentOnly ? 'mixed' : tenseMode
  const ch = makeChoices(corr, pastEntry, presentHe, otherPast, choiceMode)

  return {
    sentence: s,
    correct: corr,
    rootRu: pastEntry.ru,
    sentenceRu: sentenceRuVerb(s, pastEntry, pUsePast),
    choices: ch,
  }
}

export default function VerbSentenceFill({
  binyan,
  paalGroup = null,
  binyans = null,
  pastOnly = false,
  presentOnly = false,
  onBack,
}) {
  const pastLevelB = useMemo(
    () => pastTenseData.filter(p => LEVEL_B_ROOTS.has(p.root)),
    []
  )

  const rootPaalGroup = useMemo(() => buildRootPaalGroupMap(presentByRoot), [])

  const title = pastOnly
    ? 'Прошедшее (ב)'
    : presentOnly
      ? 'Настоящее (ב)'
      : LEVEL_TITLE

  const entries = useMemo(() => {
    if (binyans?.length) {
      const set = new Set(binyans)
      return pastLevelB.filter(p => set.has(p.binyan))
    }
    let list = pastLevelB.filter(p => p.binyan === binyan || binyan === 'all')
    if (binyan === 'פעל' && paalGroup) {
      list = list.filter(p => p.binyan === 'פעל' && rootPaalGroup[p.root] === paalGroup)
    }
    return list.filter(p => presentByRoot[p.root])
  }, [binyan, paalGroup, binyans, pastLevelB, rootPaalGroup])

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])

  const questionPool = useMemo(() => {
    if (pastOnly || presentOnly) return entries
    return pastLevelB
  }, [pastOnly, presentOnly, pastLevelB, entries])

  const questions = useMemo(() => {
    if (!entries.length) return []
    return Array.from({ length: 20 }, (_, i) =>
      buildOneQuestion(entries, questionPool, i, { pastOnly, presentOnly })
    )
  }, [entries, questionPool, pastOnly, presentOnly])

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
          <h2>{title}</h2>
        </div>
        <p className="text-secondary">Нет глаголов уровня ב для выбранного фильтра.</p>
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
          <h2>{title}</h2>
        </div>
        <div className="card result-card">
          <p className="text-secondary">
            Результат · {pastOnly ? 'прошедшее' : presentOnly ? 'настоящее' : 'ב'} · 20 предложений
          </p>
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
        <h2>{title}</h2>
      </div>

      <p className="text-secondary text-sm mb-8">
        {levelBConfig.labelRu}.{' '}
        {pastOnly
          ? 'Вставьте глагол в прошедшем времени; в вариантах — настоящее и прошедшее (как в учебнике).'
          : presentOnly
            ? 'Вставьте глагол в настоящем времени; в вариантах — настоящее и прошедшее (как в учебнике).'
            : 'Вставьте глагол в нужной форме; в вариантах — настоящее и прошедшее, разные лица.'}
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
        <div className="sentence-fill-block he">
          <p className="sentence-fill-line">
            {parts[0]}
            {selected === null ? (
              <span className="sentence-gap" aria-hidden="true" />
            ) : (
              <strong className="sentence-answer">{correct}</strong>
            )}
            {parts[1] || ''}
          </p>
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
