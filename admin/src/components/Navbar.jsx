export default function Navbar({ user, onLogout }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Intern Desk - Admin</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Welcome, <span className="font-medium text-gray-800">{user?.name || 'Admin'}</span>
        </span>
        <button
          onClick={onLogout}
          className="px-4 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors duration-150"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
