import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function ListDailyNotes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [nameFilter, setNameFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [scores, setScores] = useState({})
  const [confirmModal, setConfirmModal] = useState(null) // { note, score }
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [tableAlert, setTableAlert] = useState({ type: 'error', message: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  const fetchNotes = async () => {
    setLoading(true)
    setTableAlert({ type: 'error', message: '' })
    try {
      const res = await api.get('/admin/daily-notes')
      setNotes(res.data || [])
    } catch (err) {
      setTableAlert({ type: 'error', message: err.message || 'Unable to load daily notes.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  const names = [...new Set(notes.map((n) => n.internName))].sort()
  const techs = [...new Set(notes.map((n) => n.technology))].sort()

  const filtered = notes.filter((n) => {
    if (nameFilter && n.internName !== nameFilter) return false
    if (techFilter && n.technology !== techFilter) return false
    const isReviewed = Boolean(n.feedbackMark && n.feedbackMark !== 'Pending')
    if (statusFilter === 'Review Pending' && isReviewed) return false
    if (statusFilter === 'Feedback Sent' && !isReviewed) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedNotes = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [filtered.length, totalPages, currentPage])

  const handleNameFilterChange = (val) => {
    setNameFilter(val)
    setCurrentPage(1)
  }

  const handleTechFilterChange = (val) => {
    setTechFilter(val)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val)
    setCurrentPage(1)
  }

  const handleOpenConfirm = (note) => {
    setTableAlert({ type: 'error', message: '' })
    const score = scores[note._id]

    if (score === undefined || score === null || score === '') {
      setTableAlert({ type: 'error', message: 'Please enter a mark (0-10) before sending feedback.' })
      return
    }

    const numericScore = Number(score)
    if (!Number.isInteger(numericScore) || numericScore < 0 || numericScore > 10) {
      setTableAlert({ type: 'error', message: 'Mark must be an integer between 0 and 10.' })
      return
    }

    setConfirmModal({ note, score: numericScore })
  }

  const handleConfirmSend = async () => {
    if (!confirmModal?.note) return
    const { note, score } = confirmModal
    setSubmittingFeedback(true)

    try {
      const res = await api.put(`/admin/daily-notes/${note._id}/feedback`, {
        score,
        status: 'Approved',
      })
      setTableAlert({
        type: 'success',
        message: res.message || `Feedback mark of ${score}/10 sent for ${note.internName} (Day ${note.dayNumber}). Status changed to Feedback Sent.`,
      })
      setConfirmModal(null)
      await fetchNotes()
    } catch (err) {
      setTableAlert({ type: 'error', message: err.message || 'Unable to send feedback mark.' })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const resolveFileUrl = (url) => {
    if (!url) return '#'
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const serverBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
    return `${serverBase}/${url.replace(/\\/g, '/')}`
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">List Daily Notes</h2>
        <p className="text-sm text-gray-500 mt-1">Review intern daily notes & book submissions and evaluate with feedback marks.</p>
      </div>

      <AlertBanner
        type={tableAlert.type}
        message={tableAlert.message}
        onClose={() => setTableAlert({ type: 'error', message: '' })}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Intern Name</label>
            <select
              value={nameFilter}
              onChange={(e) => handleNameFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
            >
              <option value="">All Interns</option>
              {names.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Technology</label>
            <select
              value={techFilter}
              onChange={(e) => handleTechFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
            >
              <option value="">All Technologies</option>
              {techs.map((tech) => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Review Pending">Review Pending</option>
              <option value="Feedback Sent">Feedback Sent</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading daily notes...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No daily notes found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Intern Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Technology</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Day</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Download Notes</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Download Book</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Feedback Mark</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedNotes.map((note) => {
                    const isReviewed = Boolean(note.feedbackMark && note.feedbackMark !== 'Pending')

                    return (
                      <tr key={note._id} className="hover:bg-orange-50/60 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {note.internName}
                          {note.internEmail && <span className="block text-xs text-gray-400">{note.internEmail}</span>}
                        </td>
                        <td className="px-5 py-3 text-gray-600">{note.technology}</td>
                        <td className="px-5 py-3">
                          <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 inline-flex items-center justify-center text-xs font-bold">
                            {note.dayNumber}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <a
                            href={resolveFileUrl(note.noteFileUrl || note.noteFilePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all shadow-xs cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Notes
                          </a>
                        </td>
                        <td className="px-5 py-3">
                          <a
                            href={resolveFileUrl(note.bookFileUrl || note.bookFilePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-all shadow-xs cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Book
                          </a>
                        </td>
                        <td className="px-5 py-3">
                          {isReviewed ? (
                            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                              {note.feedbackMark}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                placeholder="0-10"
                                value={scores[note._id] ?? ''}
                                onChange={(e) => setScores((prev) => ({ ...prev, [note._id]: e.target.value }))}
                                className="w-20 px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none text-center font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleOpenConfirm(note)}
                                className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                              >
                                Send Feedback
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {isReviewed ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                              Feedback Sent
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              Review Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
                <span className="text-xs text-gray-500">
                  Showing <strong className="text-gray-700">{startIndex + 1}</strong> to{' '}
                  <strong className="text-gray-700">{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</strong> of{' '}
                  <strong className="text-gray-700">{filtered.length}</strong> daily notes (up to 8 per page)
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

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                📝
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Feedback Submission</h3>
                <p className="text-xs text-gray-500">
                  {confirmModal.note.technology} — Day {confirmModal.note.dayNumber}
                </p>
              </div>
            </div>

            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Intern:</span>
                <span className="font-bold text-gray-800">{confirmModal.note.internName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Email:</span>
                <span className="text-gray-600">{confirmModal.note.internEmail || '—'}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-orange-200">
                <span className="text-gray-700 font-bold">Feedback Mark:</span>
                <span className="text-sm font-extrabold text-orange-600">{confirmModal.score} / 10</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to send this mark? Once submitted, the status will automatically change from{' '}
              <strong className="text-amber-700">Review Pending</strong> to <strong className="text-green-700">Feedback Sent</strong> and an automated notification will be delivered to the intern.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={submittingFeedback}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={submittingFeedback}
                className="px-5 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submittingFeedback ? 'Sending...' : 'Yes, Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}