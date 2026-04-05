import { useState } from 'react'
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

export default function App() {
  const [screen, setScreen] = useState('home')
  const [lessonId, setLessonId] = useState(null)
  const [direction, setDirection] = useState('mixed')
  const [verbBinyan, setVerbBinyan] = useState('all')

  function goHome() { setScreen('home') }
  function goLessons() { setScreen('lessons') }
  function goVerbs() { setScreen('verbs-home') }

  function selectLesson(id) {
    setLessonId(id)
    setScreen('mode-select')
  }

  function selectMode(mode) { setScreen(mode) }

  function selectBinyan(b) {
    setVerbBinyan(b)
    setScreen('verbs-exercise')
  }

  const nav = { goHome, goLessons, goVerbs, selectLesson, selectMode, selectBinyan }

  switch (screen) {
    case 'home':
      return <Home onLessons={goLessons} onVerbs={goVerbs} />
    case 'lessons':
      return <LessonList onSelect={selectLesson} onBack={goHome} />
    case 'mode-select':
      return (
        <ModeSelect
          lessonId={lessonId}
          direction={direction}
          onDirection={setDirection}
          onSelect={selectMode}
          onBack={goLessons}
        />
      )
    case 'flashcards':
      return <Flashcards lessonId={lessonId} direction={direction} onBack={() => selectLesson(lessonId)} />
    case 'quiz':
      return <Quiz lessonId={lessonId} direction={direction} onBack={() => selectLesson(lessonId)} />
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
    default:
      return <Home onLessons={goLessons} onVerbs={goVerbs} />
  }
}
