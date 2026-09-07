import { useState, useEffect } from 'react'
import { api } from '../api'

export default function AdminNotifications({ onNavigate }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterTech, setFilterTech] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 3

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(() => {
      fetchNotifications()
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/admin')
      setNotifications(res.data || [])
    } catch (err) {
      console.error('Failed to load admin notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await api.patch(`/notifications/admin/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, isRead: true } : n))
      )
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    setActionLoading(true)
    try {
      await api.patch('/notifications/admin/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleClearRead = async () => {
    setActionLoading(true)
    try {
      await api.delete('/notifications/admin/clear')
      setNotifications((prev) => prev.filter((n) => !n.read))
    } catch (err) {
      console.error('Failed to clear read notifications:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleActionClick = (n) => {
    if (!n.read) {
      handleMarkAsRead(n._id)
    }
    if (!onNavigate) return

    if (n.type === 'note_submitted') {
      onNavigate('daily-notes')
    } else if (n.type === 'test_submitted') {
      onNavigate('evaluation')
    } else if (n.type === 'task_submitted' || n.type === 'course_completed') {
      onNavigate('task-management', 'assign-task')
    }
  }

  const technologies = ['all', ...new Set(notifications.map((n) => n.technology).filter(Boolean))]

  const unreadCount = notifications.filter((n) => !n.read).length
  const courseCompletedCount = notifications.filter((n) => n.type === 'course_completed').length
  const notesCount = notifications.filter((n) => n.type === 'note_submitted').length
  const testsCount = notifications.filter((n) => n.type === 'test_submitted').length
  const tasksCount = notifications.filter((n) => n.type === 'task_submitted').length

  const filtered = notifications.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false
    if (filterTech !== 'all' && n.technology !== filterTech) return false
    if (filterStatus === 'unread' && n.read) return false
    if (filterStatus === 'read' && !n.read) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const nameMatch = n.internName?.toLowerCase().includes(q)
      const emailMatch = n.internEmail?.toLowerCase().includes(q)
      const titleMatch = n.title?.toLowerCase().includes(q)
      const msgMatch = n.message?.toLowerCase().includes(q)
      const techMatch = n.technology?.toLowerCase().includes(q)
      if (!nameMatch && !emailMatch && !titleMatch && !msgMatch && !techMatch) return false
    }

    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedNotifications = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [filtered.length, totalPages, currentPage])

  const handleFilterTypeChange = (type) => {
    setFilterType(type)
    setCurrentPage(1)
  }

  const handleFilterTechChange = (tech) => {
    setFilterTech(tech)
    setCurrentPage(1)
  }

  const handleFilterStatusChange = (status) => {
    setFilterStatus(status)
    setCurrentPage(1)
  }

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const getTypeMeta = (type) => {
    switch (type) {
      case 'course_completed':
        return {
          icon: '🎓',
          label: 'Course Completed',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          actionText: 'Assign Final Task in Task Management →',
          route: 'task-management',
        }
      case 'note_submitted':
        return {
          icon: '📝',
          label: 'Daily Notes',
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          actionText: 'Review Notes in Daily Notes →',
          route: 'daily-notes',
        }
      case 'test_submitted':
        return {
          icon: '✍️',
          label: 'Test Assessment',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          actionText: 'Grade in Evaluation & Result →',
          route: 'evaluation',
        }
      case 'task_submitted':
        return {
          icon: '📁',
          label: 'Practical Task',
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          actionText: 'Evaluate in Task Management →',
          route: 'task-management',
        }
      default:
        return {
          icon: '🔔',
          label: 'Notification',
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
          actionText: 'View Details →',
          route: 'dashboard',
        }
    }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Intern Submissions & Notifications</h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time activity feed of daily notes uploads, assessment tests completed, and practical task ZIP submissions from interns.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={fetchNotifications}
            className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔄</span> Refresh
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <span>✓</span> Mark All as Read
            </button>
          )}
          {notifications.some((n) => n.read) && (
            <button
              type="button"
              onClick={handleClearRead}
              disabled={actionLoading}
              className="px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Clear Read Alerts
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Alerts</span>
          <p className="text-2xl font-black text-gray-900">{notifications.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-xs space-y-1">
          <span className="text-xs text-orange-600 font-bold uppercase tracking-wider">Unread Alerts</span>
          <p className="text-2xl font-black text-orange-600">{unreadCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-1">
          <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">🎓 Completed</span>
          <p className="text-2xl font-black text-emerald-700">{courseCompletedCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-xs space-y-1">
          <span className="text-xs text-green-700 font-bold uppercase tracking-wider">📝 Daily Notes</span>
          <p className="text-2xl font-black text-green-700">{notesCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs space-y-1">
          <span className="text-xs text-purple-700 font-bold uppercase tracking-wider">✍️ Tests</span>
          <p className="text-2xl font-black text-purple-700">{testsCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by intern name, email, task/test title, day number..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
            <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <select
                value={filterTech}
                onChange={(e) => handleFilterTechChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-400 outline-none bg-white"
              >
                <option value="all">All Technologies</option>
                {technologies.filter((t) => t !== 'all').map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => handleFilterStatusChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-400 outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pt-1">
          {[
            { id: 'all', label: `All Alerts (${notifications.length})` },
            { id: 'course_completed', label: `🎓 Course Completed (${courseCompletedCount})` },
            { id: 'note_submitted', label: `📝 Daily Notes (${notesCount})` },
            { id: 'test_submitted', label: `✍️ Assessment Tests (${testsCount})` },
            { id: 'task_submitted', label: `📁 Practical Tasks (${tasksCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleFilterTypeChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 text-sm">
            Loading submission activity feed...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 text-center space-y-3 border border-gray-100 shadow-xs">
            <span className="text-4xl block">📭</span>
            <h3 className="text-base font-bold text-gray-800">No Notifications Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              There are no notifications matching your selected criteria. When interns submit daily notes, assessments, or tasks, alerts will show up here.
            </p>
          </div>
        ) : (
          paginatedNotifications.map((n) => {
            const meta = getTypeMeta(n.type)
            const isUnread = !n.read

            return (
              <div
                key={n._id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isUnread
                    ? 'border-orange-200 bg-orange-50/20 shadow-xs ring-1 ring-orange-100'
                    : 'border-gray-100 shadow-xs hover:border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0 mt-0.5 shadow-2xs">
                    {meta.icon}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${meta.bg}`}>
                        {meta.label}
                      </span>
                      {n.technology && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {n.technology}
                        </span>
                      )}
                      {isUnread ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white animate-pulse">
                          UNREAD
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-400">
                          Read
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        &bull; {formatDateTime(n.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-gray-900 leading-snug">
                      {n.title || n.message}
                    </h4>

                    <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                      {n.message}
                    </p>

                    {n.internName && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 pt-0.5">
                        <span>Intern: <strong className="text-gray-800">{n.internName}</strong></span>
                        {n.internEmail && <span>&bull; {n.internEmail}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleActionClick(n)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>{meta.icon}</span>
                    {meta.actionText}
                  </button>
                  {isUnread && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(n._id, e)}
                      className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                      title="Mark as Read"
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-gray-500">
            Showing <strong className="text-gray-800">{startIndex + 1}</strong> to{' '}
            <strong className="text-gray-800">{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</strong> of{' '}
            <strong className="text-gray-800">{filtered.length}</strong> notifications (3 per page)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              ← Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
