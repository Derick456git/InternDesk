import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

const tabs = [
  { key: 'assign-task', label: 'Assign Task' },
  { key: 'view-assigned-tasks', label: 'View Assigned Tasks' },
  { key: 'view-submissions', label: 'View Submissions' },
]

const formatExternalUrl = (url) => {
  if (!url) return ''
  const trimmed = String(url).trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export default function TaskManagement({ tab, onTabChange }) {
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tech, setTech] = useState('')
  const [intern, setIntern] = useState('')
  const [selectedInternObj, setSelectedInternObj] = useState(null)
  const [technologies, setTechnologies] = useState([])
  const [approvedInterns, setApprovedInterns] = useState([])
  const [tasks, setTasks] = useState([])
  const [feedbackModal, setFeedbackModal] = useState(null) // { task, score, feedback, status }
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [alert, setAlert] = useState({ type: 'success', message: '' })
  const [assigning, setAssigning] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Pagination for View Assigned Tasks (3 items per page)
  const [assignedPage, setAssignedPage] = useState(1)
  const [assignedSearch, setAssignedSearch] = useState('')
  const [assignedTechFilter, setAssignedTechFilter] = useState('')
  const ASSIGNED_PER_PAGE = 3

  // Pagination for View Submissions (3 items per page)
  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionSearch, setSubmissionSearch] = useState('')
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('All')
  const SUBMISSIONS_PER_PAGE = 3

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchTech()
    fetchTasks()
  }, [])

  const fetchTech = async () => {
    try {
      const res = await api.get('/technologies')
      setTechnologies(res.data || [])
      const regRes = await api.get('/registrations?status=Approved')
      setApprovedInterns(regRes.data || [])
    } catch (err) {
      console.error('Fetch tech error:', err)
    }
  }

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks')
      setTasks(res.data || [])
    } catch (err) {
      console.error('Fetch tasks error:', err)
    }
  }

  const availableInterns = tech
    ? approvedInterns.filter((r) =>
        r.technology === tech || (Array.isArray(r.technologies) && r.technologies.includes(tech))
      )
    : approvedInterns

  const handleInternChange = (internName) => {
    setIntern(internName)
    const obj = approvedInterns.find((r) => r.name === internName)
    setSelectedInternObj(obj || null)
  }

  const validateAssignForm = () => {
    if (!taskTitle.trim()) return 'Task title is required.'
    if (!tech) return 'Please select a technology.'
    if (!intern) return 'Please select an intern.'
    if (!dueDate) return 'Due date is required.'
    if (dueDate < today) return 'Due date cannot be in the past. Please select today or a future date.'
    return null
  }

  const handleOpenConfirm = (e) => {
    if (e) e.preventDefault()
    setAlert({ type: 'error', message: '' })
    const err = validateAssignForm()
    if (err) {
      setAlert({ type: 'error', message: err })
      return
    }
    setShowConfirmModal(true)
  }

  const executeAssignTask = async () => {
    setAssigning(true)
    setAlert({ type: 'success', message: '' })
    try {
      await api.post('/tasks', {
        taskName: taskTitle.trim(),
        title: taskTitle.trim(),
        taskDescription: taskDesc.trim(),
        description: taskDesc.trim(),
        technology: tech,
        intern,
        internEmail: selectedInternObj?.email || '',
        assignedInternId: selectedInternObj?._id || null,
        dueDate,
      })
      setAlert({
        type: 'success',
        message: `Practical task "${taskTitle.trim()}" assigned successfully to ${intern}. Notification and email sent.`,
      })
      setTaskTitle('')
      setTaskDesc('')
      setDueDate('')
      setTech('')
      setIntern('')
      setSelectedInternObj(null)
      setShowConfirmModal(false)
      await fetchTasks()
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to assign task' })
    } finally {
      setAssigning(false)
    }
  }

  const openFeedback = (sub) => {
    const existingMark = sub.feedbackMark && sub.feedbackMark !== 'Pending'
      ? sub.feedbackMark.replace('/10', '').trim()
      : (sub.marks !== null && sub.marks !== undefined ? String(sub.marks) : '')
    const initialScore = existingMark !== '' ? Number(existingMark) : ''
    const initialStatus = sub.status === 'Rejected' ? 'Rejected' : 'Approved'
    const initialFeedback = sub.adminFeedback || sub.feedback || ''

    setFeedbackModal({
      task: sub,
      score: initialScore,
      feedback: initialFeedback,
      status: initialStatus,
    })
  }

  const handleScoreChangeInModal = (val) => {
    const num = val === '' ? '' : Number(val)
    setFeedbackModal((prev) => {
      if (!prev) return prev
      let autoStatus = prev.status
      if (num !== '' && !isNaN(num)) {
        autoStatus = num >= 5 ? 'Approved' : 'Rejected'
      }
      return {
        ...prev,
        score: val,
        status: autoStatus,
      }
    })
  }

  const handleConfirmSendFeedback = async () => {
    if (!feedbackModal?.task) return
    const { task, score, feedback, status } = feedbackModal

    if (score === undefined || score === null || score === '') {
      setAlert({ type: 'error', message: 'Please enter a valid mark (0-10).' })
      return
    }

    const numericScore = Number(score)
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      setAlert({ type: 'error', message: 'Mark must be a number between 0 and 10.' })
      return
    }

    setSubmittingFeedback(true)

    try {
      const res = await api.put(`/tasks/${task._id}/feedback`, {
        score: numericScore,
        marks: numericScore,
        feedback: feedback ? feedback.trim() : '',
        status: status || (numericScore >= 5 ? 'Approved' : 'Rejected'),
      })

      setAlert({
        type: 'success',
        message: res.message || `Feedback mark of ${numericScore}/10 (${status}) sent for ${task.intern}. Notification & Email sent to intern.`,
      })
      setFeedbackModal(null)
      await fetchTasks()
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Unable to send feedback.' })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // Filtered list for "View Assigned Tasks"
  const filteredAssignedTasks = tasks.filter((t) => {
    if (assignedTechFilter && t.technology !== assignedTechFilter) return false
    if (assignedSearch.trim()) {
      const q = assignedSearch.toLowerCase().trim()
      const matchName = (t.taskName || t.title || '').toLowerCase().includes(q)
      const matchIntern = (t.intern || '').toLowerCase().includes(q)
      const matchEmail = (t.internEmail || '').toLowerCase().includes(q)
      const matchDesc = (t.taskDescription || t.description || '').toLowerCase().includes(q)
      if (!matchName && !matchIntern && !matchEmail && !matchDesc) return false
    }
    return true
  })

  const totalAssignedPages = Math.max(1, Math.ceil(filteredAssignedTasks.length / ASSIGNED_PER_PAGE))
  const startAssignedIndex = (assignedPage - 1) * ASSIGNED_PER_PAGE
  const paginatedAssignedTasks = filteredAssignedTasks.slice(
    startAssignedIndex,
    startAssignedIndex + ASSIGNED_PER_PAGE
  )

  useEffect(() => {
    if (assignedPage > totalAssignedPages) {
      setAssignedPage(totalAssignedPages)
    }
  }, [filteredAssignedTasks.length, totalAssignedPages, assignedPage])

  // Filtered list for "View Submissions" -> Show tasks submitted via Google Drive link or zip
  const submittedTasks = tasks.filter((t) => {
    const hasSubmission =
      Boolean(t.driveLink) ||
      t.submissionStatus === 'submitted' ||
      t.submissionStatus === 'reviewed' ||
      Boolean(t.zipFile || t.zipFileUrl) ||
      Boolean(t.submittedAt)

    if (!hasSubmission) return false

    const isReviewed = Boolean(t.feedbackMark && t.feedbackMark !== 'Pending') || t.status === 'Approved' || t.status === 'Rejected'
    if (submissionStatusFilter === 'Review Pending' && isReviewed) return false
    if (submissionStatusFilter === 'Approved' && (!isReviewed || t.status !== 'Approved')) return false
    if (submissionStatusFilter === 'Rejected' && (!isReviewed || t.status !== 'Rejected')) return false
    if (submissionStatusFilter === 'Feedback Sent' && !isReviewed) return false

    if (submissionSearch.trim()) {
      const q = submissionSearch.toLowerCase().trim()
      const matchName = (t.taskName || t.title || '').toLowerCase().includes(q)
      const matchIntern = (t.intern || '').toLowerCase().includes(q)
      const matchTech = (t.technology || '').toLowerCase().includes(q)
      if (!matchName && !matchIntern && !matchTech) return false
    }
    return true
  })

  const totalSubmissionPages = Math.max(1, Math.ceil(submittedTasks.length / SUBMISSIONS_PER_PAGE))
  const startSubmissionIndex = (submissionPage - 1) * SUBMISSIONS_PER_PAGE
  const paginatedSubmissions = submittedTasks.slice(
    startSubmissionIndex,
    startSubmissionIndex + SUBMISSIONS_PER_PAGE
  )

  useEffect(() => {
    if (submissionPage > totalSubmissionPages) {
      setSubmissionPage(totalSubmissionPages)
    }
  }, [submittedTasks.length, totalSubmissionPages, submissionPage])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Task Management</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Assign practical tasks, inspect assigned tasks, and evaluate submitted Google Drive project archives from interns.
        </p>
      </div>

      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-gray-200 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors duration-150 whitespace-nowrap cursor-pointer ${
              tab === t.key
                ? 'bg-white text-orange-600 border border-b-white border-gray-200 -mb-[1px] shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'success', message: '' })} />

      {/* Submodule 1: Assign Task */}
      {tab === 'assign-task' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs sm:text-sm text-gray-500">Assign practical project tasks to approved interns based on their technology track.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 max-w-2xl">
            <h3 className="font-semibold text-gray-800 mb-4 text-base">Assign New Task</h3>
            <form onSubmit={handleOpenConfirm} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition text-sm"
                  placeholder="e.g. Build Full-Stack E-Commerce REST API"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Task Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition resize-none text-sm"
                  rows={3}
                  placeholder="Describe the task specifications, required features, and submission criteria..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={dueDate}
                    min={today}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition text-sm"
                    required
                  />
                  {dueDate && dueDate < today && (
                    <p className="text-xs text-red-500 mt-1">Due date cannot be in the past.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Technology *</label>
                  <select
                    value={tech}
                    onChange={(e) => { setTech(e.target.value); setIntern(''); setSelectedInternObj(null) }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                    required
                  >
                    <option value="">Select technology</option>
                    {technologies.map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Intern *</label>
                  <select
                    value={intern}
                    onChange={(e) => handleInternChange(e.target.value)}
                    disabled={!tech}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">{tech ? 'Select intern' : 'Choose tech first'}</option>
                    {availableInterns.map((r) => <option key={r._id} value={r.name}>{r.name} ({r.email})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!taskTitle.trim() || !tech || !intern || !dueDate || (dueDate && dueDate < today)}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Assign Task */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                📝
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Task Assignment</h3>
                <p className="text-xs text-gray-500">Review task details before assigning</p>
              </div>
            </div>

            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 font-medium">Task Title:</span>
                <span className="font-bold text-gray-900 text-right">{taskTitle}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 font-medium">Technology:</span>
                <span className="font-bold text-orange-700 text-right">{tech}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 font-medium">Assigned Intern:</span>
                <span className="font-bold text-gray-900 text-right">
                  {intern} {selectedInternObj?.email ? `(${selectedInternObj.email})` : ''}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 font-medium">Due Date:</span>
                <span className="font-bold text-gray-800 text-right">
                  {dueDate ? new Date(dueDate).toLocaleDateString('en-GB') : '—'}
                </span>
              </div>
              {taskDesc && (
                <div className="pt-2 border-t border-orange-200/60">
                  <span className="text-gray-500 font-medium block mb-0.5">Description:</span>
                  <p className="text-gray-700 italic line-clamp-3">{taskDesc}</p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to assign this practical task to <strong>{intern}</strong>? An email and portal notification will be dispatched immediately.
            </p>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                disabled={assigning}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={assigning}
                onClick={executeAssignTask}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {assigning ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Assigning...</span>
                  </>
                ) : (
                  <span>Yes, Assign Task</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submodule 2: View Assigned Tasks */}
      {tab === 'view-assigned-tasks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                📋
              </span>
              <div>
                <h3 className="font-bold text-gray-800 text-base">Assigned Tasks Catalog</h3>
                <p className="text-xs text-gray-500">
                  Total: <strong className="text-gray-700">{filteredAssignedTasks.length}</strong> assigned task(s) (3 per page)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <select
                value={assignedTechFilter}
                onChange={(e) => {
                  setAssignedTechFilter(e.target.value)
                  setAssignedPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                <option value="">All Technologies</option>
                {technologies.map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
              </select>

              <input
                type="text"
                placeholder="Search task, intern, email..."
                value={assignedSearch}
                onChange={(e) => {
                  setAssignedSearch(e.target.value)
                  setAssignedPage(1)
                }}
                className="w-full sm:w-56 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredAssignedTasks.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">
                {assignedSearch || assignedTechFilter ? 'No assigned tasks match your filter criteria.' : 'No tasks assigned yet. Go to "Assign Task" to assign one.'}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="text-left px-5 py-3">Task Name</th>
                        <th className="text-left px-5 py-3">Technology</th>
                        <th className="text-left px-5 py-3">Assigned Intern</th>
                        <th className="text-left px-5 py-3">Assigned Date</th>
                        <th className="text-left px-5 py-3">Due Date</th>
                        <th className="text-left px-5 py-3">Task Details</th>
                        <th className="text-left px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedAssignedTasks.map((t) => {
                        const isApproved = t.status === 'Approved' || t.reviewStatus === 'Completed'
                        const isRejected = t.status === 'Rejected' || t.reviewStatus === 'Rejected'
                        const isSubmitted = Boolean(t.driveLink) || t.submissionStatus === 'submitted'

                        return (
                          <tr key={t._id} className="hover:bg-orange-50/40 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-gray-800">
                              {t.taskName || t.title}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                {t.technology}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-gray-800 text-xs sm:text-sm">{t.intern}</p>
                              {t.internEmail && <span className="block text-xs text-gray-400">{t.internEmail}</span>}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-600">
                              {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : '—'}
                            </td>
                            <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">
                              {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : '—'}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-600 max-w-xs truncate" title={t.taskDescription || t.description || 'No description'}>
                              {t.taskDescription || t.description || <span className="text-gray-400 italic">No description</span>}
                            </td>
                            <td className="px-5 py-3.5">
                              {isApproved ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                  Approved
                                </span>
                              ) : isRejected ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                  Rejected (Re-upload)
                                </span>
                              ) : isSubmitted ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                  Submitted (Under Review)
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  Pending Submission
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 3-Item Pagination Bar for View Assigned Tasks */}
                {totalAssignedPages > 1 && (
                  <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/60">
                    <span className="text-xs text-gray-500">
                      Showing <strong className="text-gray-700">{startAssignedIndex + 1}</strong> to{' '}
                      <strong className="text-gray-700">{Math.min(startAssignedIndex + ASSIGNED_PER_PAGE, filteredAssignedTasks.length)}</strong> of{' '}
                      <strong className="text-gray-700">{filteredAssignedTasks.length}</strong> assigned tasks (3 per page)
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAssignedPage((p) => Math.max(p - 1, 1))}
                        disabled={assignedPage === 1}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        ← Previous
                      </button>

                      {Array.from({ length: totalAssignedPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setAssignedPage(pageNum)}
                          className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            assignedPage === pageNum
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setAssignedPage((p) => Math.min(p + 1, totalAssignedPages))}
                        disabled={assignedPage === totalAssignedPages}
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
      )}

      {/* Submodule 3: View Submissions */}
      {tab === 'view-submissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-800 text-base">Project Submissions ({submittedTasks.length})</h3>
              <p className="text-xs text-gray-500">
                Lists tasks where intern submitted their project archive link from Google Drive.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <select
                value={submissionStatusFilter}
                onChange={(e) => {
                  setSubmissionStatusFilter(e.target.value)
                  setSubmissionPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Review Pending">Review Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected (Re-upload)</option>
                <option value="Feedback Sent">All Feedback Sent</option>
              </select>

              <input
                type="text"
                placeholder="Search submission by task, intern..."
                value={submissionSearch}
                onChange={(e) => {
                  setSubmissionSearch(e.target.value)
                  setSubmissionPage(1)
                }}
                className="w-full sm:w-56 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {submittedTasks.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400 text-sm space-y-2">
                <span className="text-3xl block">🔗</span>
                <h4 className="font-bold text-gray-700">No Task Submissions Found</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Submissions will appear here when an intern pastes their Google Drive project link in the "Tasks" module.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full min-w-[880px] text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="text-left px-5 py-3">Task Name</th>
                        <th className="text-left px-5 py-3">Technology</th>
                        <th className="text-left px-5 py-3">Intern</th>
                        <th className="text-left px-5 py-3">Due Date</th>
                        <th className="text-left px-5 py-3">Google Drive Link</th>
                        <th className="text-left px-5 py-3">Feedback & Mark</th>
                        <th className="text-left px-5 py-3">Status</th>
                        <th className="text-center px-5 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedSubmissions.map((s) => {
                        const driveUrl = s.driveLink || s.zipFileUrl || s.zipFile || ''
                        const isApproved = s.status === 'Approved' || s.reviewStatus === 'Completed'
                        const isRejected = s.status === 'Rejected' || s.reviewStatus === 'Rejected'
                        const isReviewed = Boolean(s.feedbackMark && s.feedbackMark !== 'Pending') || isApproved || isRejected

                        return (
                          <tr key={s._id} className="hover:bg-orange-50/40 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-gray-800">{s.taskName || s.title}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                {s.technology}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-gray-800 text-xs sm:text-sm">{s.intern}</p>
                              {s.internEmail && <span className="block text-xs text-gray-400">{s.internEmail}</span>}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-600">
                              {s.dueDate ? new Date(s.dueDate).toLocaleDateString('en-GB') : '—'}
                            </td>
                            <td className="px-5 py-3.5">
                              {driveUrl ? (
                                <a
                                  href={formatExternalUrl(driveUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all shadow-xs cursor-pointer max-w-[170px] truncate"
                                  title={formatExternalUrl(driveUrl)}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const formatted = formatExternalUrl(driveUrl)
                                    if (formatted) {
                                      window.open(formatted, '_blank', 'noopener,noreferrer')
                                      e.preventDefault()
                                    }
                                  }}
                                >
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  <span>Open Drive Link</span>
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No link</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 max-w-[200px]">
                              {isReviewed ? (
                                <div className="space-y-1">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                    isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {s.feedbackMark || `${s.marks}/10`}
                                  </span>
                                  {s.adminFeedback ? (
                                    <p className="text-xs text-gray-600 line-clamp-2 italic" title={s.adminFeedback}>
                                      "{s.adminFeedback}"
                                    </p>
                                  ) : (
                                    <span className="text-xs text-gray-400 block">No remarks</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium italic">Pending evaluation</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {isReviewed ? (
                                isApproved ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                    Approved
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                    Rejected (Re-upload)
                                  </span>
                                )
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  Review Pending
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {isReviewed ? (
                                <span className="text-xs text-gray-400 font-medium">—</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openFeedback(s)}
                                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap bg-orange-500 text-white hover:bg-orange-600"
                                >
                                  📝 Send Feedback
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 3-Item Pagination Bar for View Submissions */}
                {totalSubmissionPages > 1 && (
                  <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/60">
                    <span className="text-xs text-gray-500">
                      Showing <strong className="text-gray-700">{startSubmissionIndex + 1}</strong> to{' '}
                      <strong className="text-gray-700">{Math.min(startSubmissionIndex + SUBMISSIONS_PER_PAGE, submittedTasks.length)}</strong> of{' '}
                      <strong className="text-gray-700">{submittedTasks.length}</strong> submissions (3 per page)
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSubmissionPage((p) => Math.max(p - 1, 1))}
                        disabled={submissionPage === 1}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        ← Previous
                      </button>

                      {Array.from({ length: totalSubmissionPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setSubmissionPage(pageNum)}
                          className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            submissionPage === pageNum
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setSubmissionPage((p) => Math.min(p + 1, totalSubmissionPages))}
                        disabled={submissionPage === totalSubmissionPages}
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
      )}

      {/* Enhanced Evaluate Practical Task Modal (matches Evaluate Daily Notes design) */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4 animate-scaleUp space-y-4 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                  📝
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Evaluate Practical Task</h3>
                  <p className="text-xs text-gray-500">
                    {feedbackModal.task.technology} — {feedbackModal.task.taskName || feedbackModal.task.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackModal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Intern & Submission Info */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400 font-medium block">Intern Name</span>
                  <strong className="text-gray-800">{feedbackModal.task.intern}</strong>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Intern Email</span>
                  <span className="text-gray-600 truncate block">{feedbackModal.task.internEmail || '—'}</span>
                </div>
              </div>

              {/* Submitted Google Drive Link */}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between gap-2">
                <span className="text-gray-500 font-medium">Submitted Project Drive Link:</span>
                {feedbackModal.task.driveLink || feedbackModal.task.zipFileUrl ? (
                  <a
                    href={formatExternalUrl(feedbackModal.task.driveLink || feedbackModal.task.zipFileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all shadow-xs cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      const formatted = formatExternalUrl(feedbackModal.task.driveLink || feedbackModal.task.zipFileUrl)
                      if (formatted) {
                        window.open(formatted, '_blank', 'noopener,noreferrer')
                        e.preventDefault()
                      }
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Drive Link
                  </a>
                ) : (
                  <span className="text-gray-400 italic">No link provided</span>
                )}
              </div>
            </div>

            {/* Form Fields: Marks & Status */}
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Feedback Mark (0 – 10) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    placeholder="Enter mark (0-10)"
                    value={feedbackModal.score}
                    onChange={(e) => handleScoreChangeInModal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-orange-400 outline-none"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Score out of 10 marks</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Evaluation Decision <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFeedbackModal((prev) => ({ ...prev, status: 'Approved' }))}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        feedbackModal.status === 'Approved'
                          ? 'bg-green-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ✓ Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackModal((prev) => ({ ...prev, status: 'Rejected' }))}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        feedbackModal.status === 'Rejected'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ✗ Reject (Re-upload)
                    </button>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    {feedbackModal.status === 'Rejected'
                      ? 'Intern will be asked to re-upload task'
                      : 'Intern task accepted as approved'}
                  </span>
                </div>
              </div>

              {/* Written Feedback / Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Written Feedback & Observations (Sent to Intern)
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide detailed feedback, code review observations, what went well, or specific correction requirements if re-upload is needed..."
                  value={feedbackModal.feedback}
                  onChange={(e) => setFeedbackModal((prev) => ({ ...prev, feedback: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-orange-400 outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-gray-700 leading-relaxed">
              📧 An automated email and in-portal notification with the mark, decision, and written remarks will be delivered directly to <strong>{feedbackModal.task.intern}</strong>.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFeedbackModal(null)}
                disabled={submittingFeedback}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendFeedback}
                disabled={submittingFeedback}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-200 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {submittingFeedback ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


