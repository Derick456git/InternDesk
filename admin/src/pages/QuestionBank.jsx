import { useState } from 'react'

const tabs = [
  { key: 'add-topics', label: 'Add Topics' },
  { key: 'list-topics', label: 'List Topics' },
  { key: 'add-question', label: 'Add Question' },
  { key: 'list-questions', label: 'List Questions' },
]

export default function QuestionBank({ tab, onTabChange }) {
  const [topics, setTopics] = useState([])
  const [topicInput, setTopicInput] = useState('')
  const [questions, setQuestions] = useState([])
  const [qForm, setQForm] = useState({
    topic: '',
    difficulty: 'Easy',
    type: 'Objective',
    questionText: '',
    options: ['', '', '', ''],
  })

  const addTopic = () => {
    if (!topicInput.trim()) return
    setTopics((prev) => [...prev, { id: Date.now(), title: topicInput.trim() }])
    setTopicInput('')
  }

  const deleteTopic = (id) => {
    setTopics((prev) => prev.filter((t) => t.id !== id))
  }

  const updateOption = (index, value) => {
    setQForm((prev) => {
      const opts = [...prev.options]
      opts[index] = value
      return { ...prev, options: opts }
    })
  }

  const saveQuestion = () => {
    if (!qForm.topic || !qForm.questionText.trim()) return
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        sl: prev.length + 1,
        topic: qForm.topic,
        difficulty: qForm.difficulty,
        type: qForm.type,
        questionText: qForm.questionText.trim(),
        options: qForm.type === 'Objective' ? [...qForm.options] : [],
      },
    ])
    setQForm({ topic: '', difficulty: 'Easy', type: 'Objective', questionText: '', options: ['', '', '', ''] })
  }

  const deleteQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const editQuestion = (q) => {
    setQForm({
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      questionText: q.questionText,
      options: q.options.length === 4 ? [...q.options] : ['', '', '', ''],
    })
    onTabChange('add-question')
  }

  const [topicFilter, setTopicFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')

  const filteredQuestions = questions.filter((q) => {
    if (topicFilter && q.topic !== topicFilter) return false
    if (diffFilter && q.difficulty !== diffFilter) return false
    return true
  })

  const difficultyBadge = (d) => {
    const colors = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-yellow-100 text-yellow-700', Hard: 'bg-red-100 text-red-700' }
    return `${colors[d] || 'bg-gray-100 text-gray-700'} px-2 py-0.5 rounded-full text-xs font-medium`
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Question Bank</h2>

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

      {tab === 'add-topics' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Topic</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic Title</label>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                placeholder="Enter topic title"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={addTopic}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setTopicInput('')}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'list-topics' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Topics List</h3>
          </div>
          {topics.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400">No topics added yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topics.map((t) => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                      {t.id.toString().slice(-2)}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{t.title}</span>
                  </div>
                  <button
                    onClick={() => deleteTopic(t.id)}
                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'add-question' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Question</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Topic Area</label>
                <select
                  value={qForm.topic}
                  onChange={(e) => setQForm((prev) => ({ ...prev, topic: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                >
                  <option value="">Select topic</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.title}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={qForm.difficulty}
                  onChange={(e) => setQForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Format Type</label>
                <select
                  value={qForm.type}
                  onChange={(e) => setQForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                >
                  <option value="Objective">Objective</option>
                  <option value="Descriptive">Descriptive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <textarea
                value={qForm.questionText}
                onChange={(e) => setQForm((prev) => ({ ...prev, questionText: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition resize-none"
                rows={3}
                placeholder="Enter your question here"
              />
            </div>
            {qForm.type === 'Objective' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter, i) => (
                  <div key={letter}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Option {letter}</label>
                    <input
                      type="text"
                      value={qForm.options[i]}
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                      placeholder={`Option ${letter}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intern Answer Workspace</label>
                <div className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-400 min-h-[80px]">
                  Intern answer workspace mockup — students will write their answer here.
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={saveQuestion}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setQForm({ topic: '', difficulty: 'Easy', type: 'Objective', questionText: '', options: ['', '', '', ''] })}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'list-questions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Topic</label>
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  <option value="">All Topics</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.title}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Difficulty</label>
                <select
                  value={diffFilter}
                  onChange={(e) => setDiffFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  <option value="">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <button
                onClick={() => onTabChange('add-question')}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm self-end"
              >
                + Add Question
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 w-12">SL No</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Question</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Topic</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Difficulty</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Type</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredQuestions.map((q, i) => (
                    <tr key={q.id} className="hover:bg-orange-50 transition-colors">
                      <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-5 py-3 text-gray-800 max-w-xs truncate">{q.questionText}</td>
                      <td className="px-5 py-3 text-gray-600">{q.topic}</td>
                      <td className="px-5 py-3"><span className={difficultyBadge(q.difficulty)}>{q.difficulty}</span></td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          q.type === 'Objective' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                        }`}>
                          {q.type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => editQuestion(q)}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteQuestion(q.id)}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredQuestions.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-400">No questions found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
