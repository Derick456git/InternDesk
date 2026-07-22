import { useState, useEffect } from 'react'

const mockTechs = ['MERN Stack', 'Python', 'Flutter', 'Java']
const mockInternsByTech = {
  'MERN Stack': ['Amal', 'Sarah', 'Esha', 'Rahul Sharma'],
  'Python': ['Priya Patel', 'Neha Joshi', 'Biju'],
  'Flutter': ['Kavita Nair', 'Celina', 'Amit Kumar'],
  'Java': ['Sneha Reddy', 'Arun Verma', 'Deepak'],
}

const tabs = [
  { key: 'assign-task', label: 'Assign Task' },
  { key: 'view-submissions', label: 'View Submissions' },
]

const initialSubmissions = [
  { id: 1, taskName: 'Build CRUD App', tech: 'MERN Stack', intern: 'Amal', dueDate: '2026-07-25', status: 'Pending', reviewed: false, feedbackSent: false, zipFile: 'Amal_CRUD_App.zip' },
  { id: 2, taskName: 'Python API Design', tech: 'Python', intern: 'Biju', dueDate: '2026-07-22', status: 'Pending', reviewed: false, feedbackSent: false, zipFile: 'Biju_Python_API.zip' },
  { id: 3, taskName: 'Flutter UI Screens', tech: 'Flutter', intern: 'Celina', dueDate: '2026-07-28', status: 'Pending', reviewed: false, feedbackSent: false, zipFile: 'Celina_Flutter_UI.zip' },
  { id: 4, taskName: 'Spring Boot REST API', tech: 'Java', intern: 'Deepak', dueDate: '2026-07-20', status: 'Completed', reviewed: true, feedbackSent: true, zipFile: 'Deepak_SpringBoot.zip' },
  { id: 5, taskName: 'React Component Library', tech: 'MERN Stack', intern: 'Sarah', dueDate: '2026-07-30', status: 'Pending', reviewed: false, feedbackSent: false, zipFile: 'Sarah_React_Lib.zip' },
  { id: 6, taskName: 'Django Models', tech: 'Python', intern: 'Priya Patel', dueDate: '2026-07-26', status: 'Not Done', reviewed: false, feedbackSent: false, zipFile: 'Priya_Django_Models.zip' },
]

function Toast({ message, show }) {
  if (!show) return null
  return (
    <div className="fixed top-5 right-5 z-[60] bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-bounce">
      {message}
    </div>
  )
}

export default function TaskManagement({ tab, onTabChange }) {
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tech, setTech] = useState('')
  const [intern, setIntern] = useState('')
  const [assignedTasks, setAssignedTasks] = useState([])
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [reviewModal, setReviewModal] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [toast, setToast] = useState({ show: false, message: '' })

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast({ show: false, message: '' }), 3000)
      return () => clearTimeout(t)
    }
  }, [toast.show])

  const availableInterns = tech ? mockInternsByTech[tech] || [] : []

  const assignTask = () => {
    if (!taskTitle.trim() || !tech || !intern || !dueDate) return
    setAssignedTasks((prev) => [
      ...prev,
      { id: Date.now(), taskName: taskTitle.trim(), tech, intern, dueDate, status: 'Pending', reviewed: false, feedbackSent: false, zipFile: '' },
    ])
    setSubmissions((prev) => [
      ...prev,
      { id: Date.now(), taskName: taskTitle.trim(), tech, intern, dueDate, status: 'Pending', reviewed: false, feedbackSent: false, zipFile: '' },
    ])
    setTaskTitle('')
    setTaskDesc('')
    setDueDate('')
    setTech('')
    setIntern('')
    setToast({ show: true, message: 'Task assigned successfully' })
  }

  const openReview = (sub) => setReviewModal(sub)
  const openFeedback = (sub) => { setFeedbackModal(sub); setFeedbackText('') }

  const sendFeedback = () => {
    if (!feedbackText.trim()) return
    setSubmissions((prev) =>
      prev.map((s) => (s.id === feedbackModal.id ? { ...s, reviewed: true, feedbackSent: true } : s))
    )
    setFeedbackModal(null)
    setFeedbackText('')
    setToast({ show: true, message: 'Feedback sent successfully' })
  }

  const updateStatus = (id, newStatus) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    )
  }

  return (
    <div className="space-y-5">
      <Toast message={toast.message} show={toast.show} />

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

      {tab === 'assign-task' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Assign new tasks to interns based on their technology track.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
            <h3 className="font-semibold text-gray-800 mb-4">Assign New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                  placeholder="e.g. Build CRUD application"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition resize-none"
                  rows={3}
                  placeholder="Describe the task requirements"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technology</label>
                  <select
                    value={tech}
                    onChange={(e) => { setTech(e.target.value); setIntern('') }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                  >
                    <option value="">Select technology</option>
                    {mockTechs.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intern</label>
                  <select
                    value={intern}
                    onChange={(e) => setIntern(e.target.value)}
                    disabled={!tech}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{tech ? 'Select intern' : 'Choose tech first'}</option>
                    {availableInterns.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={assignTask}
                  disabled={!taskTitle.trim() || !tech || !intern || !dueDate}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Action</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-orange-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{s.taskName}</td>
                    <td className="px-5 py-3 text-gray-600">{s.tech}</td>
                    <td className="px-5 py-3 text-gray-600">{s.intern}</td>
                    <td className="px-5 py-3 text-gray-600">{s.dueDate}</td>
                    <td className="px-5 py-3">
                      <select
                        value={s.status}
                        onChange={(e) => updateStatus(s.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-medium border outline-none ${
                          s.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                          s.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          s.status === 'Not Done' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-blue-100 text-blue-700 border-blue-200'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Not Done">Not Done</option>
                        <option value="Partially Done">Partially Done</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      {s.reviewed ? (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Completed</span>
                      ) : (
                        <button
                          onClick={() => openReview(s)}
                          className="px-3 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-md hover:bg-orange-200 transition-colors"
                        >
                          Review
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {s.feedbackSent ? (
                        <span className="text-xs text-gray-400 italic">Sent</span>
                      ) : (
                        <button
                          onClick={() => openFeedback(s)}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Feedback
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {submissions.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400">No submissions yet.</div>
          )}
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Review Submission</h3>
            <div className="space-y-3 mb-5">
              <div>
                <p className="text-xs text-gray-500">Task</p>
                <p className="text-sm font-medium text-gray-800">{reviewModal.taskName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Intern</p>
                <p className="text-sm font-medium text-gray-800">{reviewModal.intern}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Uploaded File</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-blue-600 font-medium">{reviewModal.zipFile || 'No file uploaded'}</span>
                  {reviewModal.zipFile && (
                    <button
                      onClick={() => {
                        const blob = new Blob(['Simulated ZIP content'], { type: 'application/zip' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url; a.download = reviewModal.zipFile; a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                    >
                      Download ZIP
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setReviewModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Send Feedback</h3>
            <p className="text-sm text-gray-500 mb-3">
              Task: <span className="font-medium text-gray-700">{feedbackModal.taskName}</span> &mdash; {feedbackModal.intern}
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition resize-none"
              rows={4}
              placeholder="Write your feedback here..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendFeedback}
                disabled={!feedbackText.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
