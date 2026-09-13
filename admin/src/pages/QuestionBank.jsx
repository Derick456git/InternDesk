import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

const tabs = [
  { key: 'add-chapters', label: 'Add Chapters' },
  { key: 'list-chapters', label: 'List Chapters' },
  { key: 'add-question', label: 'Add Question' },
  { key: 'list-questions', label: 'List Questions' },
]

export default function QuestionBank({ tab, onTabChange }) {
  const [topics, setTopics] = useState([])
  const [technologies, setTechnologies] = useState([])
  const [chapterInput, setChapterInput] = useState('')
  const [chapterSearch, setChapterSearch] = useState('')
  const [chapterPage, setChapterPage] = useState(1)
  const CHAPTERS_PER_PAGE = 8

  const [questions, setQuestions] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [deleteChapterModal, setDeleteChapterModal] = useState(null) // { id, title }
  const [deleteQuestionModal, setDeleteQuestionModal] = useState(null) // question object
  const [questionPage, setQuestionPage] = useState(1)
  const [questionSearch, setQuestionSearch] = useState('')
  const QUESTIONS_PER_PAGE = 8

  const [alert, setAlert] = useState({ type: 'success', message: '' })

  const [qForm, setQForm] = useState({
    technology: '',
    topic: '',
    difficulty: 'Easy',
    type: 'Objective',
    questionText: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
  })

  useEffect(() => {
    fetchQuestions()
    fetchChapters()
    fetchTechnologies()
  }, [])

  const fetchTechnologies = async () => {
    try {
      const res = await api.get('/technologies')
      setTechnologies(res.data || [])
    } catch (err) {
      console.error('Fetch technologies error:', err)
    }
  }

  const fetchChapters = async () => {
    try {
      const res = await api.get('/chapters')
      setTopics(res.data || [])
    } catch (err) {
      console.error('Fetch chapters error:', err)
    }
  }

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/questions')
      setQuestions(res.data || [])
    } catch (err) {
      console.error('Fetch questions error:', err)
    }
  }

  const addChapter = async () => {
    if (!chapterInput.trim()) return
    const title = chapterInput.trim()
    if (topics.find((t) => (t.name || t.title || '').toLowerCase() === title.toLowerCase())) {
      setAlert({ type: 'error', message: `Chapter "${title}" already exists.` })
      return
    }
    try {
      const res = await api.post('/chapters', { name: title })
      const createdChapter = res.data || { _id: title, name: title }
      setTopics((prev) => [...prev, createdChapter])
      setChapterInput('')
      setAlert({ type: 'success', message: `Chapter "${title}" added successfully.` })
    } catch (err) {
      console.error('Add chapter error:', err)
      setAlert({ type: 'error', message: err.message || `Failed to add chapter "${title}".` })
    }
  }

  const handleOpenDeleteChapter = (chapter) => {
    setDeleteChapterModal(chapter)
  }

  const handleConfirmDeleteChapter = async () => {
    if (!deleteChapterModal) return
    const chapterId = deleteChapterModal._id || deleteChapterModal.id
    const chapterTitle = deleteChapterModal.name || deleteChapterModal.title
    try {
      if (deleteChapterModal._id) {
        await api.delete(`/chapters/${deleteChapterModal._id}`)
      }
      const nextChapters = topics.filter((t) => (t._id || t.id) !== chapterId && (t.name || t.title) !== chapterTitle)
      setTopics(nextChapters)
      const newTotalPages = Math.ceil(nextChapters.length / CHAPTERS_PER_PAGE) || 1
      if (chapterPage > newTotalPages) {
        setChapterPage(newTotalPages)
      }
      setAlert({ type: 'success', message: `Chapter "${chapterTitle}" has been deleted.` })
      setDeleteChapterModal(null)
    } catch (err) {
      console.error('Delete chapter error:', err)
      setAlert({ type: 'error', message: err.message || 'Failed to delete chapter.' })
    }
  }

  const updateOption = (index, value) => {
    setQForm((prev) => {
      const opts = [...prev.options]
      opts[index] = value
      return { ...prev, options: opts }
    })
  }

  const saveQuestion = async () => {
    if (!qForm.topic || !qForm.questionText.trim()) return
    const selectedCorrectAnswer = qForm.type === 'Objective' ? (qForm.options[qForm.correctOptionIndex] || qForm.options[0] || '').trim() : ''

    try {
      if (editingId) {
        await api.put(`/questions/${editingId}`, {
          technology: qForm.technology,
          topic: qForm.topic,
          difficulty: qForm.difficulty,
          type: qForm.type,
          questionText: qForm.questionText.trim(),
          options: qForm.type === 'Objective' ? qForm.options : [],
          correctAnswer: selectedCorrectAnswer,
        })
        setAlert({ type: 'success', message: 'Question updated successfully.' })
      } else {
        await api.post('/questions', {
          technology: qForm.technology,
          topic: qForm.topic,
          difficulty: qForm.difficulty,
          type: qForm.type,
          questionText: qForm.questionText.trim(),
          options: qForm.type === 'Objective' ? qForm.options : [],
          correctAnswer: selectedCorrectAnswer,
        })
        setAlert({ type: 'success', message: 'Question created successfully.' })
      }
      setEditingId(null)
      setQForm({ technology: '', topic: '', difficulty: 'Easy', type: 'Objective', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 })
      fetchQuestions()
      onTabChange('list-questions')
    } catch (err) {
      console.error('Save question error:', err)
      setAlert({ type: 'error', message: err.message || 'Failed to save question.' })
    }
  }

  const handleOpenDeleteQuestion = (question) => {
    setDeleteQuestionModal(question)
  }

  const handleConfirmDeleteQuestion = async () => {
    if (!deleteQuestionModal) return
    try {
      await api.delete(`/questions/${deleteQuestionModal._id}`)
      setAlert({ type: 'success', message: 'Question deleted successfully.' })
      setDeleteQuestionModal(null)
      const nextQuestions = questions.filter((q) => q._id !== deleteQuestionModal._id)
      setQuestions(nextQuestions)
      const newTotal = Math.ceil(nextQuestions.length / QUESTIONS_PER_PAGE) || 1
      if (questionPage > newTotal) {
        setQuestionPage(newTotal)
      }
    } catch (err) {
      console.error('Delete question error:', err)
      setAlert({ type: 'error', message: err.message || 'Failed to delete question.' })
    }
  }

  const editQuestion = (q) => {
    setEditingId(q._id)
    const opts = q.options && q.options.length === 4 ? [...q.options] : ['', '', '', '']
    let correctIdx = 0
    if (q.correctAnswer && opts.includes(q.correctAnswer)) {
      correctIdx = opts.indexOf(q.correctAnswer)
    }
    setQForm({
      technology: q.technology || '',
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      questionText: q.questionText,
      options: opts,
      correctOptionIndex: correctIdx,
    })
    onTabChange('add-question')
  }

  const [topicFilter, setTopicFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')

  // Questions filtering
  const filteredQuestions = questions.filter((q) => {
    if (techFilter && q.technology !== techFilter) return false
    if (topicFilter && q.topic !== topicFilter) return false
    if (diffFilter && q.difficulty !== diffFilter) return false
    if (questionSearch && !q.questionText.toLowerCase().includes(questionSearch.toLowerCase())) return false
    return true
  })

  // Questions pagination (8 per page)
  const totalQuestionPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE) || 1
  const paginatedQuestions = filteredQuestions.slice(
    (questionPage - 1) * QUESTIONS_PER_PAGE,
    questionPage * QUESTIONS_PER_PAGE
  )

  // Chapters filtering and pagination (8 per page)
  const filteredChapters = topics.filter((t) =>
    chapterSearch ? (t.name || t.title || '').toLowerCase().includes(chapterSearch.toLowerCase()) : true
  )
  const totalChapterPages = Math.ceil(filteredChapters.length / CHAPTERS_PER_PAGE) || 1
  const paginatedChapters = filteredChapters.slice(
    (chapterPage - 1) * CHAPTERS_PER_PAGE,
    chapterPage * CHAPTERS_PER_PAGE
  )

  const difficultyBadge = (d) => {
    const colors = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-yellow-100 text-yellow-700', Hard: 'bg-red-100 text-red-700' }
    return `${colors[d] || 'bg-gray-100 text-gray-700'} px-2 py-0.5 rounded-full text-xs font-medium`
  }

  const associatedQuestionsCount = deleteChapterModal
    ? questions.filter((q) => q.topic?.toLowerCase() === (deleteChapterModal.name || deleteChapterModal.title)?.toLowerCase()).length
    : 0

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Question Bank</h2>

      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-gray-200 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              if (t.key === 'add-question' && tab !== 'add-question') {
                setEditingId(null)
                setQForm({ technology: '', topic: '', difficulty: 'Easy', type: 'Objective', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 })
              }
              onTabChange(t.key)
            }}
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

      <AlertBanner
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: 'success', message: '' })}
      />

      {tab === 'add-chapters' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Chapter</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Title</label>
              <input
                type="text"
                value={chapterInput}
                onChange={(e) => setChapterInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addChapter()
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                placeholder="Enter chapter title (e.g. State Management, React Hooks)"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={addChapter}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Save Chapter
              </button>
              <button
                onClick={() => setChapterInput('')}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'list-chapters' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                📚
              </span>
              <div>
                <h3 className="font-bold text-gray-800 text-base">Chapters Catalog</h3>
                <p className="text-xs text-gray-500">
                  Total: <strong className="text-gray-700">{topics.length}</strong> chapters (8 per page)
                </p>
              </div>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search chapters..."
                value={chapterSearch}
                onChange={(e) => {
                  setChapterSearch(e.target.value)
                  setChapterPage(1)
                }}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredChapters.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                {chapterSearch ? `No chapters match "${chapterSearch}".` : 'No chapters added yet.'}
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {paginatedChapters.map((t, idx) => {
                    const chapterTitle = t.name || t.title
                    const count = questions.filter((q) => q.topic?.toLowerCase() === chapterTitle?.toLowerCase()).length
                    const serialNo = (chapterPage - 1) * CHAPTERS_PER_PAGE + idx + 1

                    return (
                      <div key={t._id || t.id || chapterTitle} className="px-5 py-3.5 flex items-center justify-between hover:bg-orange-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {serialNo}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-gray-800 block">{chapterTitle}</span>
                            <span className="text-xs text-gray-400">{count} associated question(s)</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenDeleteChapter(t)}
                          className="px-3.5 py-2 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* 8-Item Pagination Bar */}
                {totalChapterPages > 1 && (
                  <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/60">
                    <span className="text-xs text-gray-500">
                      Showing <strong className="text-gray-700">{(chapterPage - 1) * CHAPTERS_PER_PAGE + 1}</strong> to{' '}
                      <strong className="text-gray-700">{Math.min(chapterPage * CHAPTERS_PER_PAGE, filteredChapters.length)}</strong> of{' '}
                      <strong className="text-gray-700">{filteredChapters.length}</strong> chapters
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setChapterPage((p) => Math.max(p - 1, 1))}
                        disabled={chapterPage === 1}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Previous
                      </button>

                      {Array.from({ length: totalChapterPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setChapterPage(pageNum)}
                          className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
                            chapterPage === pageNum
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setChapterPage((p) => Math.min(p + 1, totalChapterPages))}
                        disabled={chapterPage === totalChapterPages}
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
      )}

      {tab === 'add-question' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-4">{editingId ? 'Edit Question' : 'Add New Question'}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technology (Optional)</label>
                <select
                  value={qForm.technology}
                  onChange={(e) => setQForm((prev) => ({ ...prev, technology: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                >
                  <option value="">All / Generic</option>
                  {technologies.map((t) => (
                    <option key={t._id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Chapter *</label>
                <select
                  value={qForm.topic}
                  onChange={(e) => setQForm((prev) => ({ ...prev, topic: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                >
                  <option value="">Select chapter</option>
                  {topics.map((t) => {
                    const chapterTitle = t.name || t.title
                    return (
                      <option key={t._id || t.id || chapterTitle} value={chapterTitle}>{chapterTitle}</option>
                    )
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={qForm.difficulty}
                  onChange={(e) => setQForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                >
                  <option value="Easy">Easy (Default)</option>
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
                  <option value="Objective">Objective (2 Marks)</option>
                  <option value="Descriptive">Descriptive (5 Marks)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
              <textarea
                value={qForm.questionText}
                onChange={(e) => setQForm((prev) => ({ ...prev, questionText: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition resize-none"
                rows={3}
                placeholder="Enter your question here"
              />
            </div>

            {qForm.type === 'Objective' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600">
                  Options (Select radio for Correct Answer):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map((letter, i) => (
                    <div key={letter} className="flex items-center gap-2 p-2 border rounded-lg hover:border-orange-300 bg-gray-50">
                      <input
                        type="radio"
                        name="correctAnswerOption"
                        checked={qForm.correctOptionIndex === i}
                        onChange={() => setQForm((prev) => ({ ...prev, correctOptionIndex: i }))}
                        className="accent-orange-500 h-4 w-4 cursor-pointer"
                        title={`Select Option ${letter} as correct answer`}
                      />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-gray-600 mr-1">Option {letter}:</span>
                        <input
                          type="text"
                          value={qForm.options[i]}
                          onChange={(e) => updateOption(i, e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white"
                          placeholder={`Enter option ${letter} text`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation Info</label>
                <div className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                  Descriptive Question carries 5 marks. Interns will type full explanation answers evaluated manually by Admin.
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveQuestion}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                {editingId ? 'Update Question' : 'Save Question'}
              </button>
              <button
                onClick={() => {
                  setEditingId(null)
                  setQForm({ technology: '', topic: '', difficulty: 'Easy', type: 'Objective', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 })
                  onTabChange('list-questions')
                }}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'list-questions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Technology</label>
                <select
                  value={techFilter}
                  onChange={(e) => {
                    setTechFilter(e.target.value)
                    setQuestionPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  <option value="">All Technologies</option>
                  {technologies.map((t) => (
                    <option key={t._id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Chapter</label>
                <select
                  value={topicFilter}
                  onChange={(e) => {
                    setTopicFilter(e.target.value)
                    setQuestionPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  <option value="">All Chapters</option>
                  {topics.map((t) => {
                    const chapterTitle = t.name || t.title
                    return (
                      <option key={t._id || t.id || chapterTitle} value={chapterTitle}>{chapterTitle}</option>
                    )
                  })}
                </select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Difficulty</label>
                <select
                  value={diffFilter}
                  onChange={(e) => {
                    setDiffFilter(e.target.value)
                    setQuestionPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  <option value="">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Search Question</label>
                <input
                  type="text"
                  placeholder="Search question text..."
                  value={questionSearch}
                  onChange={(e) => {
                    setQuestionSearch(e.target.value)
                    setQuestionPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>

              <button
                onClick={() => {
                  setEditingId(null)
                  setQForm({ technology: '', topic: '', difficulty: 'Easy', type: 'Objective', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 })
                  onTabChange('add-question')
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm self-end whitespace-nowrap cursor-pointer"
              >
                + Add Question
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Questions Catalog</h3>
              <span className="text-xs text-gray-500">
                Total: <strong className="text-gray-700">{filteredQuestions.length}</strong> questions (8 per page)
              </span>
            </div>

            {filteredQuestions.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">No questions found matching criteria.</div>
            ) : (
              <>
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 font-semibold text-gray-600 w-12">SL No</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Question</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Technology</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Chapter</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Difficulty</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Type</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedQuestions.map((q, i) => {
                        const serialNo = (questionPage - 1) * QUESTIONS_PER_PAGE + i + 1

                        return (
                          <tr key={q._id} className="hover:bg-orange-50/60 transition-colors">
                            <td className="px-5 py-3 text-gray-500 font-semibold">{serialNo}</td>
                            <td className="px-5 py-3 text-gray-800 max-w-xs font-medium truncate" title={q.questionText}>
                              {q.questionText}
                            </td>
                            <td className="px-5 py-3 text-gray-600 text-xs">
                              {q.technology || <span className="text-gray-400 italic">Generic</span>}
                            </td>
                            <td className="px-5 py-3 text-gray-600">{q.topic}</td>
                            <td className="px-5 py-3">
                              <span className={difficultyBadge(q.difficulty)}>{q.difficulty}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                q.type === 'Objective' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                              }`}>
                                {q.type} ({q.type === 'Objective' ? '2M' : '5M'})
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => editQuestion(q)}
                                  className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors shadow-xs cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleOpenDeleteQuestion(q)}
                                  className="px-3.5 py-2 text-xs font-bold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors shadow-xs cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 8-Item Pagination Bar */}
                {totalQuestionPages > 1 && (
                  <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/60">
                    <span className="text-xs text-gray-500">
                      Showing <strong className="text-gray-700">{(questionPage - 1) * QUESTIONS_PER_PAGE + 1}</strong> to{' '}
                      <strong className="text-gray-700">{Math.min(questionPage * QUESTIONS_PER_PAGE, filteredQuestions.length)}</strong> of{' '}
                      <strong className="text-gray-700">{filteredQuestions.length}</strong> questions
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuestionPage((p) => Math.max(p - 1, 1))}
                        disabled={questionPage === 1}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Previous
                      </button>

                      {Array.from({ length: totalQuestionPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setQuestionPage(pageNum)}
                          className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
                            questionPage === pageNum
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setQuestionPage((p) => Math.min(p + 1, totalQuestionPages))}
                        disabled={questionPage === totalQuestionPages}
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
      )}

      {/* Delete Chapter Confirmation Modal */}
      {deleteChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
                🗑️
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Chapter Deletion</h3>
                <p className="text-xs text-gray-500">Chapter: {deleteChapterModal.name || deleteChapterModal.title}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete the chapter <strong className="text-gray-900">"{deleteChapterModal.name || deleteChapterModal.title}"</strong>?
            </p>

            {associatedQuestionsCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <span className="font-bold block">⚠️ Associated Questions:</span>
                <span>There are <strong>{associatedQuestionsCount}</strong> question(s) in the Question Bank currently categorized under this chapter.</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteChapterModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteChapter}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                Yes, Delete Chapter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Question Confirmation Modal */}
      {deleteQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
                🗑️
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Question Deletion</h3>
                <p className="text-xs text-gray-500">Chapter: {deleteQuestionModal.topic}</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700">
              <span className="font-bold block mb-1">Question:</span>
              <p className="line-clamp-3 italic">"{deleteQuestionModal.questionText}"</p>
            </div>

            <p className="text-xs text-gray-600">
              Are you sure you want to permanently remove this question from the Question Bank?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteQuestionModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteQuestion}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                Yes, Delete Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
