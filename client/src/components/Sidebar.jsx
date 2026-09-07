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

export default function Sidebar({ active, onNavigate, user, onLogout, isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity duration-300 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f1a2e] text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Intern Desk</h1>
            <p className="text-xs text-orange-400 font-semibold mt-0.5 uppercase tracking-wider">Client Portal</p>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id)
                if (onClose) onClose()
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                active === item.id
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-base">{navIcons[item.id]}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 bg-[#0c1526]">
          {user && (
            <div className="flex items-center gap-3 px-1 mb-3">
              <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-xs">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
