import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Registrations from './pages/Registrations'
import Technology from './pages/Technology'
import Syllabus from './pages/Syllabus'
import ListDailyNotes from './pages/ListDailyNotes'
import QuestionBank from './pages/QuestionBank'
import AssignTest from './pages/AssignTest'
import EvaluationResult from './pages/EvaluationResult'
import TaskManagement from './pages/TaskManagement'
import ViewProgress from './pages/ViewProgress'

const pages = {
  dashboard: { component: Dashboard, label: 'Dashboard' },
  registrations: { component: Registrations, label: 'Manage Registration' },
  technology: { component: Technology, label: 'Manage Technology' },
  syllabus: { component: Syllabus, label: 'Manage Syllabus' },
  'daily-notes': { component: ListDailyNotes, label: 'List Daily Notes' },
  'question-bank': { component: QuestionBank, label: 'Question Bank' },
  'assign-test': { component: AssignTest, label: 'Assign Test' },
  evaluation: { component: EvaluationResult, label: 'Evaluation & Result' },
  'task-management': { component: TaskManagement, label: 'Task Management' },
  progress: { component: ViewProgress, label: 'View Progress' },
}

function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [subTabs, setSubTabs] = useState({
    'question-bank': 'add-topics',
    'assign-test': 'add-test',
    'task-management': 'assign-task',
  })

  if (!user) {
    return <Login onLogin={setUser} />
  }

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
        <Navbar user={user} onLogout={() => setUser(null)} />
        <main className="p-6">
          {activeTab === 'question-bank' && <QuestionBank tab={subTabs['question-bank']} onTabChange={(t) => handleSubTabChange('question-bank', t)} />}
          {activeTab === 'assign-test' && <AssignTest tab={subTabs['assign-test']} onTabChange={(t) => handleSubTabChange('assign-test', t)} />}
          {activeTab === 'task-management' && <TaskManagement tab={subTabs['task-management']} onTabChange={(t) => handleSubTabChange('task-management', t)} />}
          {!['question-bank', 'assign-test', 'task-management'].includes(activeTab) && <Page />}
        </main>
      </div>
    </div>
  )
}

export default App
