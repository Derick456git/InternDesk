import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

export default function Navbar({ user, onLogout, onNavigate }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [toastAlert, setToastAlert] = useState(null)
  const prevCountRef = useRef(0)

  const fetchNotifications = async (showToastOnNew = false) => {
    try {
      const res = await api.get('/notifications/admin')
      const list = res.data || []
      const unread = res.unreadCount !== undefined ? res.unreadCount : list.filter((n) => !n.read).length

      // Alert the admin when new intern submissions arrive
      if (showToastOnNew && list.length > 0 && unread > prevCountRef.current && prevCountRef.current > 0) {
        const latest = list[0]
        setToastAlert(latest)
        setTimeout(() => setToastAlert(null), 6000)
      }

      prevCountRef.current = unread
      setUnreadCount(unread)
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(() => {
      fetchNotifications(true)
    }, 15000) // Poll every 15 seconds

    return () => clearInterval(interval)
  }, [])

  const handleNotificationToastClick = (n) => {
    setToastAlert(null)
    if (onNavigate) {
      onNavigate('notifications')
    }
  }

  const getToastIcon = (type) => {
    switch (type) {
      case 'note_submitted':
        return '📝'
      case 'test_submitted':
        return '✍️'
      case 'task_submitted':
        return '📁'
      default:
        return '🔔'
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Intern Desk &mdash; Admin Portal</h2>
      </div>

      <div className="flex items-center gap-5">
        {/* Real-time Visual Alert Toast Banner */}
        {toastAlert && (
          <div
            onClick={() => handleNotificationToastClick(toastAlert)}
            className="flex items-center gap-3 px-4 py-2 bg-gray-900 text-white text-xs rounded-xl shadow-xl cursor-pointer hover:bg-black transition-all animate-bounce"
            title="Click to view full notification details"
          >
            <span className="text-base">{getToastIcon(toastAlert.type)}</span>
            <div className="max-w-xs truncate">
              <strong className="block text-white font-bold truncate">
                {toastAlert.title || 'New Intern Submission'}
              </strong>
              <span className="text-gray-300 truncate block text-[11px]">{toastAlert.message}</span>
            </div>
            <span className="text-[10px] text-orange-400 font-bold ml-1 whitespace-nowrap">View All &rarr;</span>
          </div>
        )}

        {/* Bell Icon navigating directly to Notifications Page */}
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('notifications')}
          className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all focus:outline-none cursor-pointer flex items-center justify-center border border-gray-100 hover:border-gray-200"
          aria-label="Notifications"
          title="View All Intern Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>

          {/* Unread Badge Counter & Ping Alert */}
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-black text-white shadow-xs border-2 border-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
              <span className="absolute -top-1 -right-1 h-5 w-5 animate-ping rounded-full bg-orange-400 opacity-60 pointer-events-none" />
            </>
          )}
        </button>

        {/* User Greeting & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <span className="text-xs text-gray-600 hidden sm:inline">
            Welcome, <span className="font-bold text-gray-800">{user?.name || 'Admin'}</span>
          </span>
          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors duration-150 cursor-pointer shadow-2xs"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
