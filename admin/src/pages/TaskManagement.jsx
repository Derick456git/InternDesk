import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

const tabs = [
  { key: 'assign-task', label: 'Assign Task' },
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
  const [reviewModal, setReviewModal] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [marksInput, setMarksInput] = useState('')
  const [alert, setAlert] = useState({ type: 'success', message: '' })

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

  const assignTask = async () => {
    if (!taskTitle.trim() || !tech || !intern || !dueDate) return
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
      setTaskTitle('')
      setTaskDesc('')
      setDueDate('')
      setTech('')
      setIntern('')
      setSelectedInternObj(null)
      setAlert({ type: 'success', message: 'Practical task assigned successfully. Email sent to intern.' })
      fetchTasks()
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to assign task' })
    }
  }

  const openReview = (sub) => setReviewModal(sub)
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
      setAlert({ type: 'success', message: publish ? 'Task review published! Email sent to intern.' : 'Draft evaluation saved.' })
      setFeedbackModal(null)
      setFeedbackText('')
      setMarksInput('')
      fetchTasks()
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to send feedback' })
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/tasks/${id}/status`, { status: newStatus })
      fetchTasks()
    } catch (err) {
      console.error('Update status error:', err)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Task Management</h2>

      <div className="flex gap-2 flex-wrap border-b border-gray-200 pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-150 ${
              tab === t.key
                ? 'bg-white text-orange-600 border border-b-white border-gray-200 -mb-[1px] shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'success', message: '' })} />

      {tab === 'assign-task' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Assign practical project tasks to interns based on their technology track.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
            <h3 className="font-semibold text-gray-800 mb-4">Assign New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                  placeholder="e.g. Build Full-Stack E-Commerce REST API"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition resize-none"
                  rows={3}
                  placeholder="Describe the task specifications, required features, and submission criteria..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technology *</label>
                  <select
                    value={tech}
                    onChange={(e) => { setTech(e.target.value); setIntern(''); setSelectedInternObj(null) }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  >
                    <option value="">Select technology</option>
                    {technologies.map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intern *</label>
                  <select
                    value={intern}
                    onChange={(e) => handleInternChange(e.target.value)}
                    disabled={!tech}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{tech ? 'Select intern' : 'Choose tech first'}</option>
                    {availableInterns.map((r) => <option key={r._id} value={r.name}>{r.name} ({r.email})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={assignTask}
                  disabled={!taskTitle.trim() || !tech || !intern || !dueDate}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Assign Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'view-submissions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Task Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Technology</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Intern</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Due Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Submission</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">ZIP File</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Marks / 10</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map((s) => {
                  const hasZip = Boolean(s.zipFileUrl || s.zipFile)
                  const downloadLink = s.zipFileUrl || s.zipFile

                  return (
                    <tr key={s._id} className="hover:bg-orange-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{s.taskName}</td>
                      <td className="px-5 py-3 text-gray-600">{s.technology}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {s.intern}
                        {s.internEmail && <span className="block text-xs text-gray-400">{s.internEmail}</span>}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{s.dueDate ? new Date(s.dueDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          s.submissionStatus === 'submitted' ? 'bg-green-100 text-green-700' :
                          s.submissionStatus === 'reviewed' ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {s.submissionStatus === 'submitted' ? 'Submitted' : s.submissionStatus === 'reviewed' ? 'Reviewed' : 'Pending Upload'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
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
                      <td className="px-5 py-3 font-bold text-gray-800">
                        {s.marks !== null && s.marks !== undefined ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                            {s.marks} / 10
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openFeedback(s)}
                            className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all shadow-xs cursor-pointer"
                          >
                            {s.isPublished ? 'Edit Review' : 'Grade & Review'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {tasks.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400">No tasks created yet.</div>
          )}
        </div>
      )}

      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Grade & Review Task</h3>
            <p className="text-sm text-gray-500 mb-4">
              Task: <span className="font-semibold text-gray-800">{feedbackModal.taskName}</span> ({feedbackModal.intern})
            </p>

            {feedbackModal.zipFileUrl || feedbackModal.zipFile ? (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <span className="text-xs text-green-800 font-medium">Intern's submitted code package:</span>
                <a
                  href={feedbackModal.zipFileUrl || feedbackModal.zipFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-3 py-1 text-xs font-bold text-green-800 bg-green-200 rounded hover:bg-green-300"
                >
                  Download .ZIP
                </a>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
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

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => sendFeedback(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={() => sendFeedback(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Publish Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
