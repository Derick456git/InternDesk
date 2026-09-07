import { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Completed: 'bg-green-100 text-green-700',
  'Not Done': 'bg-red-100 text-red-700',
  'Partially Done': 'bg-blue-100 text-blue-700',
}

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [zipFiles, setZipFiles] = useState({})
  const [uploadingId, setUploadingId] = useState(null)
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 3

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks', { intern: user?.name, email: user?.email })
      setTasks(res.data || [])
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

  const handleZipChange = (taskId, file) => {
    setZipFiles((prev) => ({ ...prev, [taskId]: file }))
  }

  const handleUploadZip = async (taskId) => {
    const file = zipFiles[taskId]
    if (!file) {
      setAlert({ type: 'error', message: 'Please select a .zip project file to upload.' })
      return
    }
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setAlert({ type: 'error', message: 'Only .zip files are allowed for practical task submissions.' })
      return
    }

    setAlert({ type: 'error', message: '' })
    setUploadingId(taskId)

    try {
      const formData = new FormData()
      formData.append('zipFile', file)

      const res = await api.upload(`/tasks/${taskId}/upload-zip`, formData)
      setAlert({ type: 'success', message: res.message || 'Practical task .zip uploaded successfully.' })
      setZipFiles((prev) => ({ ...prev, [taskId]: null }))
      fetchTasks()
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Task upload failed. Please try again.') })
    } finally {
      setUploadingId(null)
    }
  }

  const formatZipDownloadUrl = (rawUrl) => {
    if (!rawUrl) return '#'
    if (rawUrl.includes('/raw/upload/') && !rawUrl.includes('/fl_attachment')) {
      return rawUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')
    }
    return rawUrl
  }

  if (loading) {
    return <p className="text-gray-500 text-center py-20">Loading assigned tasks...</p>
  }

  const pendingCount = tasks.filter((t) => t.submissionStatus !== 'submitted' && t.status === 'Pending').length

  return (
    <div className="space-y-5">
      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'error', message: '' })} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Practical Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">Pending submissions: <span className="font-semibold text-orange-600">{pendingCount}</span></p>
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
                const isSubmitted = task.submissionStatus === 'submitted' || Boolean(task.zipFileUrl || task.zipFile)
                const hasFeedback = Boolean(task.adminFeedback || task.feedback)
                const downloadUrl = formatZipDownloadUrl(task.zipFileUrl || task.zipFile)

                return (
                  <div key={task._id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">{task.taskName || task.title}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          {task.technology}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isSubmitted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {isSubmitted ? 'Submitted successfully!' : 'Pending Submission'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.taskDescription || task.description || 'No description provided.'}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                        <span>Due Date: <strong className="text-gray-700">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : '—'}</strong></span>
                        {task.submittedAt && (
                          <span>Submitted On: <strong className="text-gray-700">{new Date(task.submittedAt).toLocaleDateString('en-GB')}</strong></span>
                        )}
                      </div>

                      {/* Published Review & Marks */}
                      {task.isPublished && (
                        <div className="mt-3 p-4 bg-purple-50/80 border border-purple-200 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-800">Admin Review & Evaluation</span>
                            {task.marks !== null && task.marks !== undefined && (
                              <span className="text-sm font-extrabold text-purple-950 bg-purple-200 px-3 py-0.5 rounded-full">
                                Score: {task.marks} / 10 Marks
                              </span>
                            )}
                          </div>
                          {hasFeedback && (
                            <p className="text-sm text-purple-900">{task.adminFeedback || task.feedback}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Submission Upload Action */}
                    <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-xs font-bold text-gray-700">Submit Project (.zip)</span>
                      <input
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        onChange={(e) => handleZipChange(task._id, e.target.files[0] || null)}
                        className="text-xs text-gray-600 file:mr-2 file:px-2.5 file:py-1.5 file:rounded-md file:border-0 file:bg-orange-100 file:text-orange-700 file:text-xs file:font-semibold hover:file:bg-orange-200"
                      />
                      <button
                        onClick={() => handleUploadZip(task._id)}
                        disabled={uploadingId === task._id || !zipFiles[task._id]}
                        className="w-full py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {uploadingId === task._id ? 'Uploading...' : isSubmitted ? 'Re-upload .ZIP' : 'Upload .ZIP Project'}
                      </button>
                      {(task.zipFileUrl || task.zipFile) && (
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="text-[11px] text-center text-blue-600 hover:underline mt-1 truncate block"
                        >
                          ✓ View / Download Uploaded Project
                        </a>
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
