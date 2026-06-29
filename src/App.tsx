import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import Dashboard from './pages/Dashboard'
import Flashcards from './pages/Flashcards'
import Listening from './pages/Listening'
import Reading from './pages/Reading'
import Shadowing from './pages/Shadowing'
import Speaking from './pages/Speaking'
import Writing from './pages/Writing'
import News from './pages/News'
import Podcasts from './pages/Podcasts'
import AITutor from './pages/AITutor'
import Settings from './pages/Settings'

export default function App(): JSX.Element {
  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/listening" element={<Listening />} />
            <Route path="/reading" element={<Reading />} />
            <Route path="/shadowing" element={<Shadowing />} />
            <Route path="/speaking" element={<Speaking />} />
            <Route path="/writing" element={<Writing />} />
            <Route path="/news" element={<News />} />
            <Route path="/podcasts" element={<Podcasts />} />
            <Route path="/tutor" element={<AITutor />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
