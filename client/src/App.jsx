import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOtp from './pages/VerifyOtp'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import ViewSyllabus from './pages/ViewSyllabus'
import UploadNotes from './pages/UploadNotes'
import AttendTest from './pages/AttendTest'
import TakeTest from './pages/TakeTest'
import Results from './pages/Results'
import Tasks from './pages/Tasks'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'

function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1a2e] to-[#1a2d4a] flex items-center justify-center p-4">
      {children}
    </div>
  )
}

function Portal({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pages = {
    dashboard: { component: Dashboard, label: 'Dashboard' },
    syllabus: { component: ViewSyllabus, label: 'View Syllabus' },
    notes: { component: UploadNotes, label: 'Upload Notes' },
    tests: { component: AttendTest, label: 'Attend Test' },
    results: { component: Results, label: 'Results' },
    tasks: { component: Tasks, label: 'Tasks' },
    notifications: { component: Notifications, label: 'Notifications' },
    profile: { component: Profile, label: 'Profile' },
  }
  const activePageMeta = pages[activeTab] || { component: Dashboard, label: 'Dashboard' }
  const Page = activePageMeta.component

  return (
    <div className="min-h-screen flex bg-gray-100 relative">
      <Sidebar
        active={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab)
          setSidebarOpen(false)
        }}
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0 w-full transition-all duration-300">
        {/* Mobile Top Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#0f1a2e] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Open Sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <span className="font-bold text-base text-white block leading-tight">Intern Desk</span>
              <span className="text-xs text-orange-400 font-medium">{activePageMeta.label}</span>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 p-3.5 sm:p-5 md:p-6 overflow-auto">
          <Page user={user} onLogout={onLogout} onNavigate={setActiveTab} />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
    navigate('/portal')
  }

  const handleLogout = () => {
    localStorage.removeItem('internToken')
    setUser(null)
    navigate('/login')
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <AuthShell>
            <Login onLogin={handleLogin} />
          </AuthShell>
        }
      />
      <Route
        path="/register"
        element={
          <AuthShell>
            <Register onNavigate={() => navigate('/login')} />
          </AuthShell>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <AuthShell>
            <ForgotPassword />
          </AuthShell>
        }
      />
      <Route
        path="/verify-otp"
        element={
          <AuthShell>
            <VerifyOtp />
          </AuthShell>
        }
      />
      <Route
        path="/reset-password"
        element={
          <AuthShell>
            <ResetPassword />
          </AuthShell>
        }
      />
      <Route
        path="/portal"
        element={user ? <Portal user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/take-test"
        element={user ? <TakeTest /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}