import { useState, useEffect } from 'react'
import Home from './components/Home'
import LessonList from './components/LessonList'
import ModeSelect from './components/ModeSelect'
import Flashcards from './components/Flashcards'
import Quiz from './components/Quiz'
import Pairs from './components/Pairs'
import Voice from './components/Voice'
import FinalTest from './components/FinalTest'
import VerbsHome from './components/VerbsHome'
import VerbsExercise from './components/VerbsExercise'
import AdjectivesHome from './components/AdjectivesHome'
import AdjectiveSentenceFill from './components/AdjectiveSentenceFill'
import AdjectivePairs from './components/AdjectivePairs'
import RepetitionLessonSelect from './components/RepetitionLessonSelect'
import RepetitionTest from './components/RepetitionTest'
import { applyDailyVisit } from './data/helpers'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [lessonId, setLessonId] = useState(null)
  const [repetitionLessonIds, setRepetitionLessonIds] = useState(null)
  const [direction, setDirection] = useState('mixed')
  const [verbBinyan, setVerbBinyan] = useState('all')
  const [streak, setStreak] = useState(() => ({ currentStreak: 0, maxStreak: 0 }))

  useEffect(() => {
    setStreak(applyDailyVisit())
  }, [])

  function goHome() { setScreen('home') }
  function goLessons() { setScreen('lessons') }
  function goVerbs() { setScreen('verbs-home') }
  function goAdjectives() { setScreen('adjectives-home') }

  function selectLesson(id) {
    setLessonId(id)
    setScreen('mode-select')
  }

  function goAllLessons() {
    setLessonId('all')
    setScreen('mode-select')
  }

  function selectMode(mode) { setScreen(mode) }

  function selectBinyan(b) {
    setVerbBinyan(b)
    setScreen('verbs-exercise')
  }

  function backFromModeSelect() {
    if (lessonId === 'all') goHome()
    else goLessons()
  }

  function goRepetition() {
    setRepetitionLessonIds(null)
    setScreen('repetition-select')
  }

  function startRepetition(ids) {
    setRepetitionLessonIds(ids)
    setScreen('repetition-test')
  }

  function backFromRepetitionSelect() {
    setScreen('home')
  }

  function backFromRepetitionTest() {
    setScreen('repetition-select')
  }

  const screenEl = (() => {
  switch (screen) {
    case 'home':
      return (
        <Home
          onLessons={goLessons}
          onAllLessons={goAllLessons}
          onRepetition={goRepetition}
          onVerbs={goVerbs}
          onAdjectives={goAdjectives}
          streakCurrent={streak.currentStreak}
          streakMax={streak.maxStreak}
        />
      )
    case 'lessons':
      return <LessonList onSelect={selectLesson} onBack={goHome} />
    case 'mode-select':
      return (
        <ModeSelect
          lessonId={lessonId}
          direction={direction}
          onDirection={setDirection}
          onSelect={selectMode}
          onBack={backFromModeSelect}
        />
      )
    case 'flashcards':
      return <Flashcards lessonId={lessonId} direction={direction} onBack={() => selectLesson(lessonId)} />
    case 'quiz':
      return <Quiz lessonId={lessonId} direction={direction} onBack={() => selectLesson(lessonId)} />
    case 'errors-only':
      return (
        <Quiz
          lessonId={lessonId}
          direction={direction}
          errorsOnly
          onBack={() => selectLesson(lessonId)}
        />
      )
    case 'pairs':
      return <Pairs lessonId={lessonId} onBack={() => selectLesson(lessonId)} />
    case 'voice':
      return <Voice lessonId={lessonId} direction={direction} onBack={() => selectLesson(lessonId)} />
    case 'final-test':
      return <FinalTest lessonId={lessonId} onBack={() => selectLesson(lessonId)} />
    case 'verbs-home':
      return <VerbsHome onSelect={selectBinyan} onBack={goHome} />
    case 'verbs-exercise':
      return <VerbsExercise binyan={verbBinyan} onBack={goVerbs} />
    case 'adjectives-home':
      return (
        <AdjectivesHome
          onSentences={() => setScreen('adjectives-sentences')}
          onPairs={() => setScreen('adjectives-pairs')}
          onBack={goHome}
        />
      )
    case 'adjectives-sentences':
      return (
        <AdjectiveSentenceFill onBack={() => setScreen('adjectives-home')} />
      )
    case 'adjectives-pairs':
      return <AdjectivePairs onBack={() => setScreen('adjectives-home')} />
    case 'repetition-select':
      return (
        <RepetitionLessonSelect
          onStart={startRepetition}
          onBack={backFromRepetitionSelect}
        />
      )
    case 'repetition-test':
      return repetitionLessonIds?.length ? (
        <RepetitionTest lessonIds={repetitionLessonIds} onBack={backFromRepetitionTest} />
      ) : (
        <Home
          onLessons={goLessons}
          onAllLessons={goAllLessons}
          onRepetition={goRepetition}
          onVerbs={goVerbs}
          onAdjectives={goAdjectives}
          streakCurrent={streak.currentStreak}
          streakMax={streak.maxStreak}
        />
      )
    default:
      return (
        <Home
          onLessons={goLessons}
          onAllLessons={goAllLessons}
          onRepetition={goRepetition}
          onVerbs={goVerbs}
          onAdjectives={goAdjectives}
          streakCurrent={streak.currentStreak}
          streakMax={streak.maxStreak}
        />
      )
  }
  })()

  return <div className="app-view">{screenEl}</div>
}
