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
  const Page = pages[activeTab]?.component || Dashboard

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar
        active={activeTab}
        onNavigate={setActiveTab}
        user={user}
        onLogout={onLogout}
      />
      <main className="flex-1 p-6 overflow-auto">
        <Page user={user} onLogout={onLogout} onNavigate={setActiveTab} />
      </main>
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