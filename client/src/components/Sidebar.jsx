const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'syllabus', label: 'View Syllabus' },
  { id: 'notes', label: 'Upload Notes' },
  { id: 'tests', label: 'Attend Test' },
  { id: 'results', label: 'Results' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'profile', label: 'Profile' },
]

const navIcons = {
  dashboard: '📊',
  syllabus: '📚',
  notes: '📝',
  tests: '✍️',
  results: '📜',
  tasks: '✅',
  notifications: '🔔',
  profile: '👤',
}

export default function Sidebar({ active, onNavigate, user, onLogout }) {
  return (
    <aside className="w-64 bg-[#0f1a2e] text-white flex flex-col shrink-0">
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-xl font-bold">Intern Desk</h1>
        <p className="text-sm text-gray-400 mt-1">Client Portal</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active === item.id
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-base">{navIcons[item.id]}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        {user && (
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-bold flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
