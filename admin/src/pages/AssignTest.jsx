import { useState, useEffect, useCallback } from 'react'

const mockQuestions = [
  { id: 1, text: 'What is React?', topic: 'JavaScript', difficulty: 'Easy', type: 'Objective' },
  { id: 2, text: 'Explain closures in JavaScript', topic: 'JavaScript', difficulty: 'Medium', type: 'Descriptive' },
  { id: 3, text: 'What is a REST API?', topic: 'Node.js', difficulty: 'Easy', type: 'Objective' },
  { id: 4, text: 'Describe the virtual DOM', topic: 'React', difficulty: 'Medium', type: 'Descriptive' },
  { id: 5, text: 'What is useState hook?', topic: 'React', difficulty: 'Easy', type: 'Objective' },
  { id: 6, text: 'Explain MongoDB indexing', topic: 'MongoDB', difficulty: 'Hard', type: 'Descriptive' },
  { id: 7, text: 'What is JSX?', topic: 'React', difficulty: 'Easy', type: 'Objective' },
  { id: 8, text: 'What are middleware in Express?', topic: 'Node.js', difficulty: 'Medium', type: 'Objective' },
  { id: 9, text: 'Explain Python decorators', topic: 'Python', difficulty: 'Hard', type: 'Descriptive' },
  { id: 10, text: 'What is Flexbox?', topic: 'CSS', difficulty: 'Easy', type: 'Objective' },
  { id: 11, text: 'Describe Redux flow', topic: 'React', difficulty: 'Hard', type: 'Descriptive' },
  { id: 12, text: 'What is Docker?', topic: 'DevOps', difficulty: 'Medium', type: 'Objective' },
]

const mockTechTracks = ['MERN Stack', 'Python', 'Flutter', 'Java']

const mockApprovedInterns = {
  'MERN Stack': ['Amal', 'Sarah', 'Esha', 'Rahul Sharma', 'Vikram Singh'],
  'Python': ['Priya Patel', 'Neha Joshi', 'Biju'],
  'Flutter': ['Kavita Nair', 'Celina', 'Amit Kumar'],
  'Java': ['Sneha Reddy', 'Arun Verma', 'Deepak'],
}

const tabs = [
  { key: 'add-test', label: 'Add Test' },
  { key: 'list-test', label: 'List Test' },
]

function Toast({ message, show }) {
  if (!show) return null
  return (
    <div className="fixed top-5 right-5 z-[60] bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-bounce">
      {message}
    </div>
  )
}

export default function AssignTest({ tab, onTabChange }) {
  const [tests, setTests] = useState([])
  const [testName, setTestName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [questionsModal, setQuestionsModal] = useState(null)
  const [selectedQIds, setSelectedQIds] = useState({})
  const [savedSelections, setSavedSelections] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [publishModal, setPublishModal] = useState(null)
  const [publishTech, setPublishTech] = useState('')
  const [publishInterns, setPublishInterns] = useState([])
  const [toast, setToast] = useState({ show: false, message: '' })

  const showToast = useCallback((msg) => {
    setToast({ show: true, message: msg })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }, [])

  useEffect(() => { if (toast.show) { const t = setTimeout(() => setToast({ show: false, message: '' }), 3000); return () => clearTimeout(t) } }, [toast.show])

  const saveTest = () => {
    if (!testName.trim()) return
    setTests((prev) => [...prev, { id: Date.now(), name: testName.trim(), questions: [], topics: [] }])
    setTestName('')
  }

  const startEdit = (test) => {
    setEditingId(test.id)
    setEditName(test.name)
  }

  const saveEdit = (id) => {
    if (!editName.trim()) return
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, name: editName.trim() } : t)))
    setEditingId(null)
    setEditName('')
  }

  const openQuestionsModal = (test) => {
    setQuestionsModal(test.id)
    setSelectedQIds(savedSelections[test.id] ? { ...savedSelections[test.id].qIds } : {})
  }

  const toggleQuestion = (qId) => {
    setSelectedQIds((prev) => {
      const count = Object.keys(prev).length
      if (prev[qId]) {
        const { [qId]: _, ...rest } = prev
        return rest
      }
      if (count >= 10) return prev
      return { ...prev, [qId]: true }
    })
  }

  const saveQuestionSelection = () => {
    const qIds = { ...selectedQIds }
    const selectedQuestions = mockQuestions.filter((q) => qIds[q.id])
    const topics = [...new Set(selectedQuestions.map((q) => q.topic))]
    setSavedSelections((prev) => ({ ...prev, [questionsModal]: { qIds, topics, count: Object.keys(qIds).length } }))
    setTests((prev) =>
      prev.map((t) =>
        t.id === questionsModal
          ? { ...t, questions: selectedQuestions, topics, questionCount: Object.keys(qIds).length }
          : t
      )
    )
    setQuestionsModal(null)
  }

  const confirmDelete = (id) => setDeleteConfirm(id)

  const executeDelete = () => {
    setTests((prev) => prev.filter((t) => t.id !== deleteConfirm))
    const { [deleteConfirm]: _, ...rest } = savedSelections
    setSavedSelections(rest)
    setDeleteConfirm(null)
  }

  const openPublish = (test) => {
    setPublishModal(test)
    setPublishTech('')
    setPublishInterns([])
  }

  const toggleIntern = (name) => {
    setPublishInterns((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const publishTest = () => {
    if (!publishTech || publishInterns.length === 0) return
    showToast('Test assigned successfully')
    setPublishModal(null)
  }

  const questionCount = (test) => {
    const s = savedSelections[test.id]
    return s ? `${s.count}/10` : '0/10'
  }

  return (
    <div className="space-y-5">
      <Toast message={toast.message} show={toast.show} />

      <h2 className="text-2xl font-bold text-gray-800">Assign Test</h2>

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

      {tab === 'add-test' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Test</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                placeholder="e.g. MERN Stack Assessment 1"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveTest}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Save Test
              </button>
              <button
                onClick={() => setTestName('')}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'list-test' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 w-12">SL No</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Test Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Topics Cover</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Questions</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tests.map((test, i) => (
                  <tr key={test.id} className="hover:bg-orange-50 transition-colors">
                    <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-5 py-3">
                      {editingId === test.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(test.id)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-400 w-48"
                            autoFocus
                          />
                          <button onClick={() => saveEdit(test.id)} className="text-xs text-green-600 font-medium hover:underline">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-800">{test.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(test.topics && test.topics.length > 0 ? test.topics : ['—']).map((topic, ti) => (
                          <span key={ti} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{topic}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-gray-700">{questionCount(test)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => startEdit(test)}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openQuestionsModal(test)}
                          className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
                        >
                          Select Questions
                        </button>
                        <button
                          onClick={() => confirmDelete(test.id)}
                          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => openPublish(test)}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                        >
                          Publish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tests.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400">No tests created yet. Go to "Add Test" tab to create one.</div>
          )}
        </div>
      )}

      {questionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Select Questions</h3>
              <span className="text-sm text-gray-500">{Object.keys(selectedQIds).length}/10 selected</span>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2 mb-4">
              {mockQuestions.map((q) => (
                <label
                  key={q.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedQIds[q.id] ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                  } ${Object.keys(selectedQIds).length >= 10 && !selectedQIds[q.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedQIds[q.id]}
                    onChange={() => toggleQuestion(q.id)}
                    disabled={Object.keys(selectedQIds).length >= 10 && !selectedQIds[q.id]}
                    className="mt-0.5 accent-orange-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{q.text}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-gray-500">{q.topic}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{q.difficulty}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        q.type === 'Objective' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                      }`}>{q.type}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setQuestionsModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveQuestionSelection}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Save Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Test</h3>
            <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete this test? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {publishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-5">Publish this assessment to:</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technology Track</label>
                <select
                  value={publishTech}
                  onChange={(e) => { setPublishTech(e.target.value); setPublishInterns([]) }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  <option value="">Select technology</option>
                  {mockTechTracks.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {publishTech && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approved Interns</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {(mockApprovedInterns[publishTech] || []).map((name) => (
                      <label
                        key={name}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                          publishInterns.includes(name) ? 'bg-orange-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={publishInterns.includes(name)}
                          onChange={() => toggleIntern(name)}
                          className="accent-orange-500"
                        />
                        <span className="text-sm text-gray-800">{name}</span>
                      </label>
                    ))}
                    {mockApprovedInterns[publishTech]?.length === 0 && (
                      <p className="px-3 py-4 text-sm text-gray-400 text-center">No approved interns for this track.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setPublishModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={publishTest}
                disabled={!publishTech || publishInterns.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publish Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
