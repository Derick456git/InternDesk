import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import AuthFlow from './pages/AuthFlow'
import Dashboard from './pages/Dashboard'
import Registrations from './pages/Registrations'
import Technology from './pages/Technology'
import CreateSyllabus from './pages/CreateSyllabus'
import ViewSyllabus from './pages/ViewSyllabus'
import AssignSyllabus from './pages/AssignSyllabus'
import ListDailyNotes from './pages/ListDailyNotes'
import QuestionBank from './pages/QuestionBank'
import AssignTest from './pages/AssignTest'
import EvaluationResult from './pages/EvaluationResult'
import TaskManagement from './pages/TaskManagement'
import ViewProgress from './pages/ViewProgress'
import AdminNotifications from './pages/AdminNotifications'
import { isAuthenticated, setToken, clearToken, api } from './api'

const pages = {
  dashboard: { component: Dashboard, label: 'Dashboard' },
  registrations: { component: Registrations, label: 'Manage Registration' },
  technology: { component: Technology, label: 'Manage Technology' },
  'daily-notes': { component: ListDailyNotes, label: 'List Daily Notes' },
  'question-bank': { component: QuestionBank, label: 'Question Bank' },
  'assign-test': { component: AssignTest, label: 'Assign Test' },
  evaluation: { component: EvaluationResult, label: 'Evaluation & Result' },
  'task-management': { component: TaskManagement, label: 'Task Management' },
  progress: { component: ViewProgress, label: 'View Progress' },
  notifications: { component: AdminNotifications, label: 'Notifications' },
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [subTabs, setSubTabs] = useState({
    syllabus: 'create',
    'question-bank': 'add-topics',
    'assign-test': 'add-test',
    'task-management': 'assign-task',
  })

  useEffect(() => {
    if (isAuthenticated()) {
      setUser({ name: 'Admin', email: 'interndeskadmin@gmail.com' })
    }
    setLoading(false)
  }, [])

  const handleLogin = (token) => {
    setToken(token)
    setUser({ name: 'Admin', email: 'interndeskadmin@gmail.com' })
  }

  const handleLogout = () => {
    clearToken()
    setUser(null)
  }

  if (loading) return null
  if (!user) return <AuthFlow onLogin={handleLogin} />

  const Page = pages[activeTab]?.component || Dashboard

  const handleSubTabChange = (pageId, subTab) => {
    setSubTabs((prev) => ({ ...prev, [pageId]: subTab }))
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        subTabs={subTabs}
        onSubTabChange={handleSubTabChange}
      />
      <div className="flex-1 flex flex-col ml-64">
        <Navbar
          user={user}
          onLogout={handleLogout}
          onNavigate={(tab, subTab) => {
            setActiveTab(tab)
            if (subTab) handleSubTabChange(tab, subTab)
          }}
        />
        <main className="p-6">
          {activeTab === 'syllabus' && (
            subTabs.syllabus === 'create'
              ? <CreateSyllabus onNavigate={(tab, sub) => { setActiveTab(tab); if (sub) handleSubTabChange(tab, sub) }} />
              : subTabs.syllabus === 'view'
              ? <ViewSyllabus onNavigate={(tab, sub) => { setActiveTab(tab); if (sub) handleSubTabChange(tab, sub) }} />
              : <AssignSyllabus onNavigate={(tab, sub) => { setActiveTab(tab); if (sub) handleSubTabChange(tab, sub) }} />
          )}
          {activeTab === 'question-bank' && <QuestionBank tab={subTabs['question-bank']} onTabChange={(t) => handleSubTabChange('question-bank', t)} />}
          {activeTab === 'assign-test' && <AssignTest tab={subTabs['assign-test']} onTabChange={(t) => handleSubTabChange('assign-test', t)} />}
          {activeTab === 'task-management' && <TaskManagement tab={subTabs['task-management']} onTabChange={(t) => handleSubTabChange('task-management', t)} />}
          {!['syllabus', 'question-bank', 'assign-test', 'task-management'].includes(activeTab) && (
            <Page
              onNavigate={(tab, subTab) => {
                setActiveTab(tab)
                if (subTab) handleSubTabChange(tab, subTab)
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
