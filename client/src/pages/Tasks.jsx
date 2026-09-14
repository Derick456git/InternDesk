import { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

const formatExternalUrl = (url) => {
  if (!url) return ''
  const trimmed = String(url).trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [driveLinks, setDriveLinks] = useState({})
  const [submittingId, setSubmittingId] = useState(null)
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 3

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks', { intern: user?.name, email: user?.email })
      const fetchedTasks = res.data || []
      setTasks(fetchedTasks)

      // Initialize driveLinks state for existing submissions
      const linksMap = {}
      fetchedTasks.forEach((t) => {
        if (t.driveLink) {
          linksMap[t._id] = t.driveLink
        }
      })
      setDriveLinks(linksMap)
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to load tasks.') })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [user?.name, user?.email])

  const totalPages = Math.max(1, Math.ceil(tasks.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedTasks = tasks.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [tasks.length, totalPages, currentPage])

  const handleLinkChange = (taskId, value) => {
    setDriveLinks((prev) => ({ ...prev, [taskId]: value }))
  }

  const handleSubmitDriveLink = async (taskId) => {
    let link = (driveLinks[taskId] || '').trim()
    if (!link) {
      setAlert({ type: 'error', message: 'Please enter a valid Google Drive shareable link.' })
      return
    }

    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      link = `https://${link}`
    }

    setAlert({ type: 'error', message: '' })
    setSubmittingId(taskId)

    try {
      const res = await api.post(`/tasks/${taskId}/submit-link`, { driveLink: link })
      setAlert({ type: 'success', message: res.message || 'Practical task Google Drive link submitted successfully!' })
      await fetchTasks()
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Failed to submit Google Drive link. Please try again.') })
    } finally {
      setSubmittingId(null)
    }
  }

  if (loading) {
    return <p className="text-gray-500 text-center py-20">Loading assigned tasks...</p>
  }

  const pendingCount = tasks.filter((t) => !t.driveLink && t.submissionStatus !== 'submitted' && t.status !== 'Approved').length

  return (
    <div className="space-y-5">
      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'error', message: '' })} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Practical Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">
            Pending submissions: <span className="font-semibold text-orange-600">{pendingCount}</span>
          </p>
        </div>
        {tasks.length > 0 && (
          <span className="text-xs text-gray-500 font-medium">
            Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, tasks.length)} of {tasks.length} tasks (Page {currentPage} of {totalPages})
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400">No practical tasks assigned to you yet.</div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {paginatedTasks.map((task) => {
                const isApproved = task.status === 'Approved' || task.reviewStatus === 'Completed'
                const isRejected = task.status === 'Rejected' || task.reviewStatus === 'Rejected'
                const isSubmitted = Boolean(task.driveLink) || task.submissionStatus === 'submitted'
                const isPendingReview = isSubmitted && !isRejected && !isApproved
                const hasFeedback = Boolean(task.adminFeedback || task.feedback)
                const driveUrl = task.driveLink || task.zipFileUrl || ''

                return (
                  <div key={task._id} className="p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">{task.taskName || task.title}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          {task.technology}
                        </span>

                        {isApproved ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                            ✓ Task Approved
                          </span>
                        ) : isRejected ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                            ⚠️ Re-upload Required
                          </span>
                        ) : isSubmitted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            Submitted (Under Review)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            Pending Submission
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {task.taskDescription || task.description || 'No description provided.'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 flex-wrap">
                        <span>
                          Due Date: <strong className="text-gray-700">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : '—'}</strong>
                        </span>
                        {task.submittedAt && (
                          <span>
                            Submitted On: <strong className="text-gray-700">{new Date(task.submittedAt).toLocaleDateString('en-GB')}</strong>
                          </span>
                        )}
                      </div>

                      {/* Admin Review & Evaluation Box */}
                      {task.isPublished && (
                        <div className={`mt-3 p-4 rounded-xl border space-y-2 ${
                          isApproved
                            ? 'bg-green-50/80 border-green-200 text-green-950'
                            : isRejected
                              ? 'bg-red-50/80 border-red-200 text-red-950'
                              : 'bg-purple-50/80 border-purple-200 text-purple-950'
                        }`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <span>📝 Admin Review & Evaluation</span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                isApproved ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                              }`}>
                                {isApproved ? 'Approved' : 'Revision Required'}
                              </span>
                            </span>
                            {task.marks !== null && task.marks !== undefined && (
                              <span className={`text-sm font-extrabold px-3 py-0.5 rounded-full ${
                                isApproved ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'
                              }`}>
                                Score: {task.marks} / 10 Marks
                              </span>
                            )}
                          </div>

                          {hasFeedback && (
                            <div className="p-2.5 bg-white/80 rounded-lg border border-gray-200/60 text-xs italic leading-relaxed text-gray-700">
                              "{task.adminFeedback || task.feedback}"
                            </div>
                          )}

                          {isRejected && (
                            <p className="text-xs font-semibold text-red-700 mt-1">
                              ⚠️ Please address the mentor's feedback above, update your project files on Google Drive, and submit your revised link below.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Google Drive Link Submission Card */}
                    <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <span className="text-base">🔗</span> Google Drive Project Link
                        </span>
                        {isApproved && (
                          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            Locked
                          </span>
                        )}
                      </div>

                      {isApproved ? (
                        <div className="space-y-2 py-1">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 space-y-1">
                            <p className="font-bold flex items-center gap-1">✓ Practical Task Completed & Approved</p>
                            <p className="text-[11px] text-green-700">
                              Your practical project has been evaluated and approved by your administrator.
                            </p>
                          </div>
                          {driveUrl && (
                            <a
                              href={formatExternalUrl(driveUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 text-xs font-bold text-center text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl transition-all block"
                              onClick={(e) => {
                                const formatted = formatExternalUrl(driveUrl)
                                if (formatted) {
                                  window.open(formatted, '_blank', 'noopener,noreferrer')
                                  e.preventDefault()
                                }
                              }}
                            >
                              🔗 View Approved Drive Project
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {isPendingReview ? (
                            <p className="text-[11px] text-blue-700 bg-blue-50/80 border border-blue-200 rounded-lg p-2.5 leading-relaxed">
                              ✓ Your Google Drive project link is submitted and waiting for admin review.
                            </p>
                          ) : isRejected ? (
                            <p className="text-[11px] text-red-700 bg-red-50/80 border border-red-200 rounded-lg p-2.5 leading-relaxed font-medium">
                              ⚠️ Re-upload requested: Please update your files in Google Drive, paste your new shareable link below, and submit.
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                              Upload your project archive (.zip) to Google Drive and paste the shareable link below. (Ensure sharing is set to <em>"Anyone with the link can view"</em>).
                            </p>
                          )}

                          <div>
                            <input
                              type="url"
                              placeholder="https://drive.google.com/file/d/..."
                              value={driveLinks[task._id] || ''}
                              onChange={(e) => handleLinkChange(task._id, e.target.value)}
                              disabled={isPendingReview || submittingId === task._id}
                              className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition ${
                                isPendingReview
                                  ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-orange-400'
                              }`}
                            />
                          </div>

                          {isPendingReview ? (
                            <button
                              type="button"
                              disabled
                              className="w-full py-2.5 text-xs font-bold text-gray-500 bg-gray-200 rounded-xl transition-all shadow-none cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              ✓ Submitted
                            </button>
                          ) : isRejected ? (
                            <button
                              type="button"
                              onClick={() => handleSubmitDriveLink(task._id)}
                              disabled={submittingId === task._id || !driveLinks[task._id]?.trim()}
                              className="w-full py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {submittingId === task._id ? (
                                <>
                                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  <span>Submitting Link...</span>
                                </>
                              ) : (
                                '🔄 Re-upload / Submit Revised Link'
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSubmitDriveLink(task._id)}
                              disabled={submittingId === task._id || !driveLinks[task._id]?.trim()}
                              className="w-full py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {submittingId === task._id ? (
                                <>
                                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  <span>Submitting Link...</span>
                                </>
                              ) : (
                                '📤 Submit Drive Link'
                              )}
                            </button>
                          )}

                          {driveUrl && (
                            <a
                              href={formatExternalUrl(driveUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-center text-blue-600 hover:underline pt-1 block truncate"
                              onClick={(e) => {
                                const formatted = formatExternalUrl(driveUrl)
                                if (formatted) {
                                  window.open(formatted, '_blank', 'noopener,noreferrer')
                                  e.preventDefault()
                                }
                              }}
                            >
                              🔗 Open Currently Submitted Link
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
                <span className="text-xs text-gray-500">
                  Showing <strong className="text-gray-700">{startIndex + 1}</strong> to{' '}
                  <strong className="text-gray-700">{Math.min(startIndex + ITEMS_PER_PAGE, tasks.length)}</strong> of{' '}
                  <strong className="text-gray-700">{tasks.length}</strong> tasks (up to 3 per page)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
