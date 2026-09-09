import { useState } from 'react'

const menuItems = [
  { id: 'registrations', label: 'Manage Registration', disabled: false },
  { id: 'technology', label: 'Manage Technology', disabled: false },
  { id: 'syllabus', label: 'Manage Syllabus', disabled: false, nested: true, subItems: [
    { key: 'create', label: 'Create Syllabus' },
    { key: 'view', label: 'View Syllabus' },
    { key: 'assign', label: 'Assign Syllabus' },
  ]},
  { id: 'daily-notes', label: 'List Daily Notes', disabled: false },
  { id: 'question-bank', label: 'Question Bank', disabled: false, nested: true, subItems: [
    { key: 'add-topics', label: 'Add Topics' },
    { key: 'list-topics', label: 'List Topics' },
    { key: 'add-question', label: 'Add Question' },
    { key: 'list-questions', label: 'List Questions' },
  ]},
  { id: 'assign-test', label: 'Assign Test', disabled: false, nested: true, subItems: [
    { key: 'add-test', label: 'Add Test' },
    { key: 'list-test', label: 'List Test' },
  ]},
  { id: 'evaluation', label: 'Evaluation & Result', disabled: false },
  { id: 'task-management', label: 'Task Management', disabled: false, nested: true, subItems: [
    { key: 'assign-task', label: 'Assign Task' },
    { key: 'view-assigned-tasks', label: 'View Assigned Tasks' },
    { key: 'view-submissions', label: 'View Submissions' },
  ]},
  { id: 'progress', label: 'View Progress', disabled: false },
  { id: 'issue-certificate', label: 'Issue Certificate', disabled: false },
  { id: 'notifications', label: 'Notifications', disabled: false },
]

export default function Sidebar({ activeTab, onTabChange, subTabs, onSubTabChange, isOpen, onClose }) {
  const [openMenu, setOpenMenu] = useState('question-bank')

  const toggleMenu = (id) => {
    setOpenMenu((prev) => (prev === id ? null : id))
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-[#0f1a2e] flex flex-col z-50 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold tracking-wide">Intern Desk</h1>
            <p className="text-blue-200 text-xs mt-0.5">Admin Portal</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Close Sidebar"
          >
            ✕
          </button>
        </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`w-full text-left px-5 py-3 flex items-center gap-3 border-b border-white/10 mb-2 transition-all duration-150 ${
            activeTab === 'dashboard' ? '' : 'hover:bg-white/5'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
            activeTab === 'dashboard' ? 'bg-orange-500 text-white' : 'bg-white/10 text-orange-400'
          }`}>
            D
          </div>
          <div>
            <p className="text-lg font-bold tracking-wide text-white">Dashboard</p>
          </div>
        </button>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id
          const currentSubTab = subTabs[item.id] || (item.subItems?.[0]?.key)
          return (
            <div key={item.id}>
              <button
                disabled={item.disabled}
                onClick={() => {
                  if (item.nested) {
                    toggleMenu(item.id)
                    onTabChange(item.id)
                    if (item.subItems?.length && !subTabs[item.id]) {
                      onSubTabChange(item.id, item.subItems[0].key)
                    }
                  } else {
                    onTabChange(item.id)
                  }
                }}
                className={`w-full text-left px-5 py-3 text-sm font-medium transition-all duration-150 flex items-center gap-3 ${
                  item.disabled
                    ? 'text-gray-500 cursor-not-allowed'
                    : isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-current opacity-60" />
                <span className="flex-1">{item.label}</span>
                {item.nested && (
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openMenu === item.id ? 'rotate-90' : ''
                    }`}
                    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
              {item.nested && openMenu === item.id && item.subItems && (
                <div className="overflow-hidden transition-all duration-200">
                  {item.subItems.map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => {
                        onTabChange(item.id)
                        onSubTabChange(item.id, sub.key)
                      }}
                      className={`w-full text-left pl-12 pr-5 py-2 text-xs font-medium transition-all duration-150 flex items-center gap-2 ${
                        isActive && currentSubTab === sub.key
                          ? 'text-orange-400 bg-white/5'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="w-1 h-1 rounded-full bg-current" />
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <p className="text-blue-200/60 text-xs">Intern Desk v1.0</p>
      </div>
      </aside>
    </>
  )
}
