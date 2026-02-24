import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import AnalyzePage from './pages/AnalyzePage'
import BatchAnalyzePage from './pages/BatchAnalyzePage'
import PreOpPage from './pages/PreOpPage'
import PostOpPage from './pages/PostOpPage'
import TriagePage from './pages/TriagePage'
import MorphologyPage from './pages/MorphologyPage'
import AboutPage from './pages/AboutPage'
import AuthPage from './pages/AuthPage'
import AIChatWidget from './components/AIChatWidget'
import './index.css'
import './App.css'

function App() {
  const [page, setPage] = useState('home')
  const [result, setResult] = useState(null)
  const [user, setUser] = useState(null) // Mock Auth State

  const navigate = (p) => {
    // If trying to access protected route without auth, redirect to auth page
    if ((['analyze', 'batch', 'preop', 'postop', 'triage', 'smear'].includes(p)) && !user) {
      setPage('auth')
    } else {
      setPage(p)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
    navigate('home')
  }

  return (
    <div className="app">
      {page !== 'auth' && <Navbar page={page} navigate={navigate} user={user} onLogout={handleLogout} />}
      <main>
        {page === 'auth' && <AuthPage navigate={navigate} onLogin={handleLogin} />}
        {page === 'home' && <HomePage navigate={navigate} />}
        {page === 'analyze' && user && <AnalyzePage result={result} setResult={setResult} />}
        {page === 'batch' && user && <BatchAnalyzePage />}
        {page === 'triage' && user && <TriagePage navigate={navigate} />}
        {page === 'smear' && user && <MorphologyPage />}
        {page === 'preop' && user && <PreOpPage />}
        {page === 'postop' && user && <PostOpPage />}
        {page === 'about' && <AboutPage navigate={navigate} />}
      </main>
      <AIChatWidget />
    </div>
  )
}

export default App
