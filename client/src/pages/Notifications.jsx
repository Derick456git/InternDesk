import { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function Notifications({ user }) {
  const [notifications, setNotifications] = useState([])
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications', { email: user.email })
        setNotifications(res.data || [])
      } catch (err) {
        setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to load notifications.') })
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [user.email])

  const totalPages = Math.max(1, Math.ceil(notifications.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedNotifications = notifications.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [notifications.length, totalPages, currentPage])

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to update notification.') })
    }
  }

  if (loading) {
    return <p className="text-gray-500 text-center py-20">Loading notifications...</p>
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-5">
      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'error', message: '' })} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You are all caught up.'}
          </p>
        </div>
        {notifications.length > 0 && (
          <span className="text-xs text-gray-500 font-medium">
            Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, notifications.length)} of {notifications.length} notifications (Page {currentPage} of {totalPages})
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400">No notifications yet.</div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {paginatedNotifications.map((n) => (
                <div key={n._id} className={`px-5 py-4 flex items-start justify-between gap-4 ${n.read ? '' : 'bg-orange-50/50'}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />}
                      {n.title && <h3 className="font-semibold text-gray-800 text-sm">{n.title}</h3>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markRead(n._id)}
                      className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors flex-shrink-0"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
                <span className="text-xs text-gray-500">
                  Showing <strong className="text-gray-700">{startIndex + 1}</strong> to{' '}
                  <strong className="text-gray-700">{Math.min(startIndex + ITEMS_PER_PAGE, notifications.length)}</strong> of{' '}
                  <strong className="text-gray-700">{notifications.length}</strong> notifications (up to 7 per page)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-orange-500 text-white shadow-sm'
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
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
