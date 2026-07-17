import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Registrations from './pages/Registrations'
import Technology from './pages/Technology'
import Syllabus from './pages/Syllabus'
import ListDailyNotes from './pages/ListDailyNotes'

const pages = {
  dashboard: { component: Dashboard, label: 'Dashboard' },
  registrations: { component: Registrations, label: 'Manage Registration' },
  technology: { component: Technology, label: 'Manage Technology' },
  syllabus: { component: Syllabus, label: 'Manage Syllabus' },
  'daily-notes': { component: ListDailyNotes, label: 'List Daily Notes' },
}

function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  if (!user) {
    return <Login onLogin={setUser} />
  }

  const Page = pages[activeTab]?.component || Dashboard

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col ml-64">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <main className="p-6">
          <Page />
        </main>
      </div>
    </div>
  )
}

export default App
