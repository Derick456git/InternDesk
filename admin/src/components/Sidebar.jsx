const menuItems = [
  { id: 'registrations', label: 'Manage Registration', disabled: false },
  { id: 'technology', label: 'Manage Technology', disabled: false },
  { id: 'syllabus', label: 'Manage Syllabus', disabled: false },
  { id: 'daily-notes', label: 'List Daily Notes', disabled: false },
  { id: 'question-bank', label: 'Question Bank', disabled: true },
  { id: 'assign-test', label: 'Assign Test', disabled: true },
  { id: 'evaluation', label: 'Evaluation & Result', disabled: true },
  { id: 'assign-task', label: 'Assign Task', disabled: true },
  { id: 'progress', label: 'View Progress', disabled: true },
]

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f1a2e] flex flex-col z-50">
      <div className="p-5 border-b border-white/10">
        <h1 className="text-white text-xl font-bold tracking-wide">Intern Desk</h1>
        <p className="text-blue-200 text-xs mt-0.5">Admin Portal</p>
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
            <p className={`text-lg font-bold tracking-wide text-white`}>
              Dashboard
            </p>
            {/* <p className="text-[10px] text-blue-200/50 text-left">Overview</p> */}
          </div>
        </button>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'registrations' && activeTab === 'dashboard')
          return (
            <button
              key={item.id}
              disabled={item.disabled}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left px-5 py-3 text-sm font-medium transition-all duration-150 flex items-center gap-3 ${
                item.disabled
                  ? 'text-gray-500 cursor-not-allowed'
                  : isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-current opacity-60" />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <p className="text-blue-200/60 text-xs">Intern Desk v1.0</p>
      </div>
    </aside>
  )
}
