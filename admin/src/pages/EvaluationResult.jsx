import { useState, useEffect } from 'react'

const mockTests = ['MERN Stack Assessment 1', 'Python Basics Test', 'Flutter Quiz 1', 'Java Core Test']
const mockTechs = ['MERN Stack', 'Python', 'Flutter', 'Java']
const mockInterns = ['Amal', 'Sarah', 'Biju', 'Celina', 'Deepak', 'Esha', 'Rahul Sharma', 'Priya Patel']

const initialSubmissions = [
  { id: 1, name: 'Amal', tech: 'MERN Stack', test: 'MERN Stack Assessment 1', score: null, status: 'Pending Evaluation' },
  { id: 2, name: 'Sarah', tech: 'MERN Stack', test: 'MERN Stack Assessment 1', score: null, status: 'Pending Evaluation' },
  { id: 3, name: 'Biju', tech: 'Python', test: 'Python Basics Test', score: null, status: 'Pending Evaluation' },
  { id: 4, name: 'Celina', tech: 'Flutter', test: 'Flutter Quiz 1', score: null, status: 'Pending Evaluation' },
  { id: 5, name: 'Deepak', tech: 'Java', test: 'Java Core Test', score: null, status: 'Pending Evaluation' },
  { id: 6, name: 'Esha', tech: 'MERN Stack', test: 'MERN Stack Assessment 1', score: null, status: 'Pending Evaluation' },
  { id: 7, name: 'Rahul Sharma', tech: 'MERN Stack', test: 'MERN Stack Assessment 1', score: null, status: 'Pending Evaluation' },
  { id: 8, name: 'Priya Patel', tech: 'Python', test: 'Python Basics Test', score: null, status: 'Pending Evaluation' },
]

const mockQuestions = [
  { id: 1, text: 'What is React?', type: 'Objective', maxMarks: 2 },
  { id: 2, text: 'What is JSX?', type: 'Objective', maxMarks: 2 },
  { id: 3, text: 'What is useState?', type: 'Objective', maxMarks: 2 },
  { id: 4, text: 'What is a component?', type: 'Objective', maxMarks: 2 },
  { id: 5, text: 'What is the virtual DOM?', type: 'Objective', maxMarks: 2 },
  { id: 6, text: 'Explain React lifecycle methods.', type: 'Descriptive', maxMarks: 5 },
  { id: 7, text: 'Describe how Redux works.', type: 'Descriptive', maxMarks: 5 },
  { id: 8, text: 'Explain the useEffect hook.', type: 'Descriptive', maxMarks: 5 },
  { id: 9, text: 'How does React handle forms?', type: 'Descriptive', maxMarks: 5 },
  { id: 10, text: 'Describe component communication patterns.', type: 'Descriptive', maxMarks: 5 },
]

const mockAnswers = [
  'React is a JavaScript library for building user interfaces.',
  'JSX is a syntax extension for JavaScript that looks like HTML.',
  'useState is a hook that lets you add state to functional components.',
  'A component is a reusable piece of UI.',
  'The virtual DOM is a lightweight representation of the real DOM.',
  'Lifecycle methods include mounting, updating, and unmounting phases. ComponentDidMount runs after render.',
  'Redux uses a single store and actions dispatched to reducers to update state.',
  'useEffect runs side effects after render. It can clean up subscriptions.',
  'React uses controlled components with state and onChange handlers.',
  'Components communicate via props, callbacks, and context.',
]

const statusColors = {
  'Pending Evaluation': 'bg-yellow-100 text-yellow-700',
  'Not Published': 'bg-blue-100 text-blue-700',
  'Published': 'bg-green-100 text-green-700',
}

export default function EvaluationResult() {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [marksMap, setMarksMap] = useState({})
  const [expandedId, setExpandedId] = useState(null)
  const [testFilter, setTestFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')
  const [internFilter, setInternFilter] = useState('')
  const [toast, setToast] = useState({ show: false, message: '' })

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast({ show: false, message: '' }), 3000)
      return () => clearTimeout(t)
    }
  }, [toast.show])

  const filtered = submissions.filter((s) => {
    if (testFilter && s.test !== testFilter) return false
    if (techFilter && s.tech !== techFilter) return false
    if (internFilter && s.name !== internFilter) return false
    return true
  })

  const toggleExpand = (submission) => {
    if (expandedId === submission.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(submission.id)
    if (!marksMap[submission.id]) {
      setMarksMap((prev) => ({ ...prev, [submission.id]: {} }))
    }
  }

  const setMark = (subId, qId, value) => {
    const q = mockQuestions.find((x) => x.id === qId)
    const num = Math.min(Math.max(0, Number(value) || 0), q ? q.maxMarks : 0)
    setMarksMap((prev) => ({
      ...prev,
      [subId]: { ...prev[subId], [qId]: num },
    }))
  }

  const saveEvaluation = (subId) => {
    const subMarks = marksMap[subId] || {}
    const total = Object.values(subMarks).reduce((sum, v) => sum + (Number(v) || 0), 0)
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === subId
          ? { ...s, score: `${total}/35`, status: 'Not Published' }
          : s
      )
    )
    setExpandedId(null)
  }

  const cancelEvaluation = () => {
    setExpandedId(null)
  }

  const publishResult = (id) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Published' } : s))
    )
    setToast({ show: true, message: 'Evaluated and published successfully' })
  }

  const drawerMarks = expandedId ? marksMap[expandedId] || {} : {}
  const drawerTotal = Object.values(drawerMarks).reduce((s, v) => s + (Number(v) || 0), 0)

  return (
    <div className="space-y-5">
      {toast.show && (
        <div className="fixed top-5 right-5 z-[60] bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-bounce">
          {toast.message}
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800">Evaluation & Result</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Test</label>
            <select
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="">All Tests</option>
              {mockTests.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Technology</label>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="">All Technologies</option>
              {mockTechs.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Intern Name</label>
            <select
              value={internFilter}
              onChange={(e) => setInternFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="">All Interns</option>
              {mockInterns.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Technology Track</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Test Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Total Score</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-orange-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-5 py-3 text-gray-600">{s.tech}</td>
                  <td className="px-5 py-3 text-gray-600">{s.test}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{s.score || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[s.status] || 'bg-gray-100 text-gray-700'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {s.status === 'Pending Evaluation' && (
                      <button
                        onClick={() => toggleExpand(s)}
                        className="px-3 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-md hover:bg-orange-200 transition-colors"
                      >
                        Evaluate
                      </button>
                    )}
                    {s.status === 'Not Published' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleExpand(s)}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Edit Mark
                        </button>
                        <button
                          onClick={() => publishResult(s.id)}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                        >
                          Publish
                        </button>
                      </div>
                    )}
                    {s.status === 'Published' && (
                      <span className="text-xs text-gray-400 italic">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
              {expandedId && (
                <tr key={`${expandedId}-drawer`}>
                  <td colSpan={6} className="px-0 py-0">
                    <div className="bg-orange-50 border-t-2 border-orange-300 p-5 animate-fadeIn">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-gray-800">
                            {submissions.find((x) => x.id === expandedId)?.name} — Evaluation
                          </h3>
                          <p className="text-sm text-gray-500">
                            {submissions.find((x) => x.id === expandedId)?.test}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          Total: {drawerTotal}/35
                        </span>
                      </div>
                      <div className="space-y-3">
                        {mockQuestions.map((q, i) => (
                          <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                  </span>
                                  <p className="text-sm font-medium text-gray-800 truncate">{q.text}</p>
                                </div>
                                <div className="ml-8 space-y-1.5">
                                  <p className="text-xs text-gray-500 italic leading-relaxed">
                                    Intern answer: &ldquo;{mockAnswers[i]}&rdquo;
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-600 font-medium">Marks:</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max={q.maxMarks}
                                      value={drawerMarks[q.id] ?? ''}
                                      onChange={(e) => setMark(expandedId, q.id, e.target.value)}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-orange-400 outline-none"
                                    />
                                    <span className="text-xs text-gray-400">/ {q.maxMarks}</span>
                                  </div>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0 self-start ${
                                q.type === 'Objective' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                              }`}>
                                {q.type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          onClick={cancelEvaluation}
                          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEvaluation(expandedId)}
                          className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          Save Marks
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-400">No submissions found.</div>
        )}
      </div>
    </div>
  )
}
