import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

const tabs = [
  { key: 'assign-task', label: 'Assign Task' },
  { key: 'view-assigned-tasks', label: 'View Assigned Tasks' },
  { key: 'view-submissions', label: 'View Submissions' },
]

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
  const [feedbackModal, setFeedbackModal] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [marksInput, setMarksInput] = useState('')
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
    setFeedbackModal(sub)
    setFeedbackText(sub.adminFeedback || sub.feedback || '')
    setMarksInput(sub.marks !== null && sub.marks !== undefined ? sub.marks : '')
  }

  const sendFeedback = async (publish = true) => {
    if (marksInput !== '') {
      const num = Number(marksInput)
      if (isNaN(num) || num < 0 || num > 10) {
        setAlert({ type: 'error', message: 'Marks must be between 0 and 10.' })
        return
      }
    }

    try {
      await api.post(`/tasks/${feedbackModal._id}/feedback`, {
        feedback: feedbackText.trim(),
        marks: marksInput !== '' ? Number(marksInput) : null,
        isPublished: publish,
      })
      setAlert({
        type: 'success',
        message: publish
          ? `Task evaluation completed for ${feedbackModal.intern}! Review published and notification sent.`
          : 'Draft evaluation saved.',
      })
      setFeedbackModal(null)
      setFeedbackText('')
      setMarksInput('')
      fetchTasks()
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to send feedback' })
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

  // Filtered list for "View Submissions" -> Only show tasks when intern uploaded from "Tasks" module
  const submittedTasks = tasks.filter((t) => {
    const hasSubmission =
      t.submissionStatus === 'submitted' ||
      t.submissionStatus === 'reviewed' ||
      Boolean(t.zipFile || t.zipFileUrl) ||
      Boolean(t.submittedAt)

    if (!hasSubmission) return false

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
          Assign practical tasks, inspect assigned tasks, and review uploaded project ZIP submissions from interns.
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

      {/* Submodule 2: View Assigned Tasks (NEW) */}
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
                        <th className="text-left px-5 py-3">Submission Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedAssignedTasks.map((t) => {
                        const isSubmitted = t.submissionStatus === 'submitted' || Boolean(t.zipFileUrl || t.zipFile)
                        const isReviewed = t.isPublished || t.submissionStatus === 'reviewed'

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
                              {isReviewed ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                  Evaluation Completed
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

      {/* Submodule 3: View Submissions (Only shows tasks submitted by intern from portal) */}
      {tab === 'view-submissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-800 text-base">Project Submissions ({submittedTasks.length})</h3>
              <p className="text-xs text-gray-500">
                Only lists tasks where intern has uploaded their project code ZIP file from the client portal.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search submission by task, intern..."
                value={submissionSearch}
                onChange={(e) => {
                  setSubmissionSearch(e.target.value)
                  setSubmissionPage(1)
                }}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {submittedTasks.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400 text-sm space-y-2">
                <span className="text-3xl block">📦</span>
                <h4 className="font-bold text-gray-700">No Task Submissions Yet</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Submissions will appear here only when an intern uploads their completed project ZIP from the "Tasks" module in the intern portal.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full min-w-[840px] text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="text-left px-5 py-3">Task Name</th>
                        <th className="text-left px-5 py-3">Technology</th>
                        <th className="text-left px-5 py-3">Intern</th>
                        <th className="text-left px-5 py-3">Due Date</th>
                        <th className="text-left px-5 py-3">Evaluation Status</th>
                        <th className="text-left px-5 py-3">ZIP File</th>
                        <th className="text-left px-5 py-3">Marks / 10</th>
                        <th className="text-left px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedSubmissions.map((s) => {
                        const hasZip = Boolean(s.zipFileUrl || s.zipFile)
                        const downloadLink = s.zipFileUrl || s.zipFile
                        const isEvaluationCompleted = s.isPublished || s.submissionStatus === 'reviewed' || s.reviewed === true

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
                              {isEvaluationCompleted ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                  Evaluation Completed
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Evaluation Pending
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {hasZip ? (
                                <a
                                  href={downloadLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-all shadow-xs cursor-pointer"
                                >
                                  📦 Download ZIP
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No upload</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-bold text-gray-800">
                              {s.marks !== null && s.marks !== undefined ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                  {s.marks} / 10
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Ungraded</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {isEvaluationCompleted ? (
                                <span className="text-gray-400 font-medium text-xs">—</span>
                              ) : (
                                <button
                                  onClick={() => openFeedback(s)}
                                  className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all shadow-xs cursor-pointer whitespace-nowrap"
                                >
                                  Grade & Review
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

      {/* Grade & Review Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Grade & Review Task</h3>
            <p className="text-sm text-gray-500 mb-4">
              Task: <span className="font-semibold text-gray-800">{feedbackModal.taskName || feedbackModal.title}</span> ({feedbackModal.intern})
            </p>

            {feedbackModal.zipFileUrl || feedbackModal.zipFile ? (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                <span className="text-xs text-green-800 font-medium">Intern's submitted code package:</span>
                <a
                  href={feedbackModal.zipFileUrl || feedbackModal.zipFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-3 py-1 text-xs font-bold text-green-800 bg-green-200 rounded-lg hover:bg-green-300 cursor-pointer"
                >
                  Download .ZIP
                </a>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                Intern has not uploaded a .zip file yet.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Marks Awarded (Max: 10 Marks)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    placeholder="0-10"
                    value={marksInput}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || (Number(val) >= 0 && Number(val) <= 10)) {
                        setMarksInput(val)
                      }
                    }}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-orange-400 outline-none"
                  />
                  <span className="text-sm font-bold text-gray-500">/ 10 Marks</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Feedback & Remarks</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition resize-none text-sm"
                  rows={4}
                  placeholder="Provide detailed feedback on the intern's implementation, code structure, and performance..."
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 mt-5">
              <button
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => sendFeedback(false)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Save Draft
              </button>
              <button
                onClick={() => sendFeedback(true)}
                className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
              >
                Publish & Complete Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

