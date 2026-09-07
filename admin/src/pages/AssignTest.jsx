import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

const tabs = [
  { key: 'add-test', label: 'Add Test' },
  { key: 'list-test', label: 'List Test' },
]

export default function AssignTest({ tab, onTabChange }) {
  const [tests, setTests] = useState([])
  const [form, setForm] = useState({ name: '' })
  const [editingId, setEditingId] = useState(null)
  const [questionsModal, setQuestionsModal] = useState(null)
  const [selectedQIds, setSelectedQIds] = useState({})
  const [allQuestions, setAllQuestions] = useState([])
  const [savedSelections, setSavedSelections] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null) // test object to delete
  const [technologies, setTechnologies] = useState([])
  const [durations, setDurations] = useState([])
  const [assessmentNumbers, setAssessmentNumbers] = useState([])
  const [assignModal, setAssignModal] = useState(null)
  const [assignForm, setAssignForm] = useState({ technology: '', durationDays: '', assessmentNumber: '' })
  const [modalAlert, setModalAlert] = useState({ type: 'error', message: '' })
  const [tableAlert, setTableAlert] = useState({ type: 'error', message: '' })

  // Select Questions Modal search & filter
  const [modalSearch, setModalSearch] = useState('')
  const [modalTypeFilter, setModalTypeFilter] = useState('All')
  const [modalStatusFilter, setModalStatusFilter] = useState('All')

  // List Test filters & 7-item pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTech, setFilterTech] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [testPage, setTestPage] = useState(1)
  const TESTS_PER_PAGE = 7

  useEffect(() => {
    fetchTests()
    fetchQuestions()
    fetchTechnologies()
  }, [])

  const fetchTests = async () => {
    try {
      const res = await api.get('/tests')
      setTests(res.data || [])
    } catch (err) {
      console.error('Fetch tests error:', err)
    }
  }

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/questions')
      setAllQuestions(res.data || [])
    } catch (err) {
      console.error('Fetch questions error:', err)
    }
  }

  const fetchTechnologies = async () => {
    try {
      const res = await api.get('/technologies')
      setTechnologies((res.data || []).filter((t) => t.active !== false))
    } catch (err) {
      console.error('Fetch technologies error:', err)
    }
  }

  const fetchDurations = async (technology) => {
    try {
      const res = await api.get(`/admin/assignable-durations?technology=${encodeURIComponent(technology)}`)
      setDurations(res.data || [])
    } catch (err) {
      console.error('Fetch durations error:', err)
    }
  }

  const fetchAssessmentNumbers = async (technology, durationDays) => {
    try {
      const res = await api.get(`/admin/assessment-numbers?technology=${encodeURIComponent(technology)}&syllabusDuration=${durationDays}`)
      setAssessmentNumbers(res.data.available || [])
    } catch (err) {
      console.error('Fetch assessment numbers error:', err)
    }
  }

  const validateForm = () => {
    if (!form.name.trim()) return 'Assessment name is required'
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'assessmentNumber' ? Number(value) : value }))
  }

  const saveTest = async () => {
    const err = validateForm()
    if (err) return setModalAlert({ type: 'error', message: err })
    setModalAlert({ type: 'error', message: '' })
    try {
      await api.post('/tests', { name: form.name.trim() })
      setForm({ name: '' })
      setModalAlert({ type: 'success', message: 'Assessment created successfully' })
      fetchTests()
    } catch (err) {
      setModalAlert({ type: 'error', message: err.message || 'Failed to create assessment' })
    }
  }

  const saveEdit = async () => {
    if (!form.name.trim()) return
    try {
      await api.put(`/tests/${editingId}`, { name: form.name.trim() })
      setEditingId(null)
      setForm({ name: '' })
      setTableAlert({ type: 'success', message: 'Assessment updated successfully.' })
      fetchTests()
    } catch (err) {
      console.error('Edit test error:', err)
      setTableAlert({ type: 'error', message: err.message || 'Failed to update assessment' })
    }
  }

  const startEdit = (test) => {
    setEditingId(test._id)
    setForm({ name: test.name })
  }

  const openQuestionsModal = (test) => {
    setQuestionsModal(test._id)
    let initialQIds = {}
    if (savedSelections[test._id]?.qIds) {
      initialQIds = { ...savedSelections[test._id].qIds }
    } else if (test.questions && Array.isArray(test.questions)) {
      test.questions.forEach((q) => {
        const id = typeof q === 'object' && q._id ? q._id : q
        if (id) initialQIds[id] = true
      })
    }
    setSelectedQIds(initialQIds)
    setModalAlert({ type: 'error', message: '' })
    setModalSearch('')
    setModalTypeFilter('All')
    setModalStatusFilter('All')
  }

  // Map of questionId -> info about the test that is using it
  const getUsedQuestionsMap = () => {
    const map = {}
    tests.forEach((t) => {
      // Exclude the current test being edited
      if (t._id !== questionsModal && t.questions && Array.isArray(t.questions)) {
        t.questions.forEach((q) => {
          const qId = typeof q === 'object' && q._id ? q._id.toString() : q.toString()
          if (qId) {
            map[qId] = {
              testId: t._id,
              testName: t.testName || t.name,
              technology: t.technology,
              assessmentNumber: t.assessmentNumber,
            }
          }
        })
      }
    })
    return map
  }

  const toggleQuestion = (qId, isUsed) => {
    if (isUsed) return // Cannot select questions already used in another test
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

  const getSelectionCounts = () => {
    const qIds = Object.keys(selectedQIds)
    const selectedQuestions = allQuestions.filter((q) => qIds.includes(q._id))
    const objectiveCount = selectedQuestions.filter((q) => q.type === 'Objective').length
    const descriptiveCount = selectedQuestions.filter((q) => q.type === 'Descriptive').length
    return { total: qIds.length, objectiveCount, descriptiveCount }
  }

  const saveQuestionSelection = async () => {
    const counts = getSelectionCounts()
    if (counts.total !== 10) {
      return setModalAlert({ type: 'error', message: 'Please select exactly 10 questions (5 Objective + 5 Descriptive) before saving this assessment.' })
    }
    if (counts.objectiveCount !== 5 || counts.descriptiveCount !== 5) {
      return setModalAlert({ type: 'error', message: 'Must select exactly 5 Objective and 5 Descriptive questions.' })
    }

    const usedMap = getUsedQuestionsMap()
    const qIds = Object.keys(selectedQIds)
    const usedSelected = qIds.find((id) => usedMap[id])
    if (usedSelected) {
      const info = usedMap[usedSelected]
      return setModalAlert({ type: 'error', message: `One or more selected questions are already used in "${info.testName}". Please select unused questions.` })
    }

    setModalAlert({ type: 'error', message: '' })
    const selectedQuestions = allQuestions.filter((q) => qIds.includes(q._id))
    const topics = [...new Set(selectedQuestions.map((q) => q.topic))]
    setSavedSelections((prev) => ({ ...prev, [questionsModal]: { qIds, topics, count: qIds.length } }))
    try {
      await api.put(`/tests/${questionsModal}/questions`, { questionIds: qIds })
      setTableAlert({ type: 'success', message: '10 questions saved successfully to assessment.' })
      setQuestionsModal(null)
      fetchTests()
    } catch (err) {
      setModalAlert({ type: 'error', message: err.message || 'Failed to save questions' })
    }
  }

  const executeDelete = async () => {
    if (!deleteConfirm) return
    try {
      await api.delete(`/tests/${deleteConfirm._id}`)
      setTableAlert({ type: 'success', message: `Assessment "${deleteConfirm.name}" deleted successfully.` })
      setDeleteConfirm(null)
      const nextTests = tests.filter((t) => t._id !== deleteConfirm._id)
      setTests(nextTests)
      const newTotal = Math.ceil(nextTests.length / TESTS_PER_PAGE) || 1
      if (testPage > newTotal) {
        setTestPage(newTotal)
      }
    } catch (err) {
      console.error('Delete test error:', err)
      setTableAlert({ type: 'error', message: err.message || 'Failed to delete assessment.' })
    }
  }

  const openAssignModal = async (test) => {
    const qCount = test.questions?.length || test.questionCount || 0
    if (qCount === 0) {
      setTableAlert({ type: 'error', message: 'First select questions from question bank' })
      return
    }
    setAssignModal(test)
    setAssignForm({ technology: '', durationDays: '', assessmentNumber: '' })
    setModalAlert({ type: 'error', message: '' })
    setTableAlert({ type: 'error', message: '' })
    try {
      const res = await api.get('/technologies')
      setTechnologies((res.data || []).filter((t) => t.active !== false))
    } catch (err) {
      console.error('Fetch technologies error:', err)
    }
  }

  const handleTechChange = async (tech) => {
    setAssignForm((prev) => ({ ...prev, technology: tech, durationDays: '', assessmentNumber: '' }))
    setDurations([])
    setAssessmentNumbers([])
    if (tech) await fetchDurations(tech)
  }

  const handleDurationChange = async (duration) => {
    setAssignForm((prev) => ({ ...prev, durationDays: duration, assessmentNumber: '' }))
    setAssessmentNumbers([])
    if (duration && assignForm.technology) await fetchAssessmentNumbers(assignForm.technology, duration)
  }

  const assignToCourse = async () => {
    const qCount = assignModal.questions?.length || assignModal.questionCount || 0
    if (qCount === 0) {
      return setModalAlert({ type: 'error', message: 'First select questions from question bank' })
    }
    const { technology, durationDays, assessmentNumber } = assignForm
    if (!technology || !durationDays || !assessmentNumber) {
      return setModalAlert({ type: 'error', message: 'Please select all fields.' })
    }
    setModalAlert({ type: 'error', message: '' })
    try {
      await api.post(`/admin/assign-to-course`, {
        testId: assignModal._id,
        technology,
        syllabusDuration: Number(durationDays),
        assessmentNumber: Number(assessmentNumber),
      })
      setTableAlert({ type: 'success', message: `Successfully assigned assessment to ${technology} (${durationDays}-day) as Assessment ${assessmentNumber}. Status updated to Assigned.` })
      setAssignModal(null)
      fetchTests()
    } catch (err) {
      setModalAlert({ type: 'error', message: err.message || 'Failed to assign assessment.' })
    }
  }

  const getStatusBadge = (test) => {
    if (test.isAssigned) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
          Assigned
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        Unassigned
      </span>
    )
  }

  // Filtering tests
  const filteredTests = tests.filter((t) => {
    if (filterTech && t.technology !== filterTech) return false
    if (filterStatus === 'Assigned' && !t.isAssigned) return false
    if (filterStatus === 'Unassigned' && t.isAssigned) return false
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // 7-item pagination
  const totalTestPages = Math.ceil(filteredTests.length / TESTS_PER_PAGE) || 1
  const paginatedTests = filteredTests.slice(
    (testPage - 1) * TESTS_PER_PAGE,
    testPage * TESTS_PER_PAGE
  )

  useEffect(() => {
    if (testPage > totalTestPages) {
      setTestPage(totalTestPages)
    }
  }, [filteredTests.length, totalTestPages, testPage])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Assign Test / Assessment</h2>
        <p className="text-sm text-gray-500 mt-1">Create assessments, select questions (5 Objective + 5 Descriptive), and assign to courses.</p>
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

      {tab === 'add-test' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
          <AlertBanner type={modalAlert.type} message={modalAlert.message} onClose={() => setModalAlert({ type: 'error', message: '' })} />
          <h3 className="font-semibold text-gray-800 mb-4">Create New Assessment</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                placeholder="e.g. MERN Stack Assessment 1"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={editingId ? saveEdit : saveTest}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                {editingId ? 'Update Assessment' : 'Create Assessment'}
              </button>
              {editingId && (
                <button
                  onClick={() => { setEditingId(null); setForm({ name: '' }) }}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'list-test' && (
        <div className="space-y-4">
          <AlertBanner type={tableAlert.type} message={tableAlert.message} onClose={() => setTableAlert({ type: 'error', message: '' })} />

          {/* Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Search Assessment</label>
                <input
                  type="text"
                  placeholder="Search assessment name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setTestPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Technology</label>
                <select
                  value={filterTech}
                  onChange={(e) => {
                    setFilterTech(e.target.value)
                    setTestPage(1)
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    setTestPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Assessments Catalog</h3>
              <span className="text-xs text-gray-500">
                Total: <strong className="text-gray-700">{filteredTests.length}</strong> assessments (7 per page)
              </span>
            </div>

            {filteredTests.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                No assessments found matching criteria. Go to "Add Test" tab to create one.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 font-semibold text-gray-600 w-12">SL No</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Assessment Name</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Technology</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Syllabus Duration</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Assessment #</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Questions</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedTests.map((test, i) => {
                        const serialNo = (testPage - 1) * TESTS_PER_PAGE + i + 1

                        return (
                          <tr key={test._id} className="hover:bg-orange-50/60 transition-colors">
                            <td className="px-5 py-3 text-gray-500 font-semibold">{serialNo}</td>
                            <td className="px-5 py-3">
                              {editingId === test._id ? (
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => handleChange({ target: { name: 'name', value: e.target.value } })}
                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                    className="border border-gray-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-400 w-48 font-medium"
                                    autoFocus
                                  />
                                  <button onClick={saveEdit} className="text-xs text-green-600 font-bold hover:underline">Save</button>
                                  <button onClick={() => { setEditingId(null); setForm({ name: '' }) }} className="text-xs text-gray-500 hover:underline">Cancel</button>
                                </div>
                              ) : (
                                <span className="font-bold text-gray-800">{test.name}</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-gray-600">{test.technology || '—'}</td>
                            <td className="px-5 py-3 text-gray-600">{test.syllabusDuration ? `${test.syllabusDuration} Days` : '—'}</td>
                            <td className="px-5 py-3">
                              {test.assessmentNumber ? (
                                <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 inline-flex items-center justify-center text-xs font-bold">
                                  {test.assessmentNumber}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                {test.questionCount || 0}/10
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {getStatusBadge(test)}
                            </td>
                            <td className="px-5 py-3">
                              {!test.isAssigned ? (
                                <div className="flex gap-2 flex-wrap items-center">
                                  <button
                                    onClick={() => startEdit(test)}
                                    className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all shadow-xs cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => openQuestionsModal(test)}
                                    className="px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all shadow-xs cursor-pointer"
                                  >
                                    Select Questions
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(test)}
                                    className="px-3.5 py-2 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-all shadow-xs cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => openAssignModal(test)}
                                    className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all shadow-sm cursor-pointer"
                                  >
                                    Assign to Course
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No action available</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 8-Item Pagination Bar */}
                {totalTestPages > 1 && (
                  <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/60">
                    <span className="text-xs text-gray-500">
                      Showing <strong className="text-gray-700">{(testPage - 1) * TESTS_PER_PAGE + 1}</strong> to{' '}
                      <strong className="text-gray-700">{Math.min(testPage * TESTS_PER_PAGE, filteredTests.length)}</strong> of{' '}
                      <strong className="text-gray-700">{filteredTests.length}</strong> assessments
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTestPage((p) => Math.max(p - 1, 1))}
                        disabled={testPage === 1}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Previous
                      </button>

                      {Array.from({ length: totalTestPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setTestPage(pageNum)}
                          className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
                            testPage === pageNum
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setTestPage((p) => Math.min(p + 1, totalTestPages))}
                        disabled={testPage === totalTestPages}
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

      {/* Select Questions Modal */}
      {questionsModal && (() => {
        const usedMap = getUsedQuestionsMap()
        const counts = getSelectionCounts()
        const activeTest = tests.find((t) => t._id === questionsModal)
        const totalUsedCount = allQuestions.filter((q) => !!usedMap[q._id]).length
        const totalAvailableCount = allQuestions.length - totalUsedCount

        const filteredModalQuestions = allQuestions.filter((q) => {
          const isUsed = !!usedMap[q._id]
          if (modalTypeFilter !== 'All' && q.type !== modalTypeFilter) return false
          if (modalStatusFilter === 'Available' && isUsed) return false
          if (modalStatusFilter === 'Used' && !isUsed) return false
          if (modalSearch.trim()) {
            const qry = modalSearch.toLowerCase()
            const textMatch = q.questionText?.toLowerCase().includes(qry)
            const topicMatch = q.topic?.toLowerCase().includes(qry)
            const diffMatch = q.difficulty?.toLowerCase().includes(qry)
            if (!textMatch && !topicMatch && !diffMatch) return false
          }
          return true
        })

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 mx-4 max-h-[88vh] flex flex-col animate-scaleUp">
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    Select Questions for <span className="text-orange-600 font-black">"{activeTest?.name || 'Assessment'}"</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select exactly 10 questions (5 Objective + 5 Descriptive). Questions used in previous assessments are disabled.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                    counts.objectiveCount === 5 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    Objective: {counts.objectiveCount}/5
                  </span>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                    counts.descriptiveCount === 5 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                  }`}>
                    Descriptive: {counts.descriptiveCount}/5
                  </span>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                    counts.total === 10 && counts.objectiveCount === 5 && counts.descriptiveCount === 5
                      ? 'bg-green-600 text-white border-green-600 shadow-xs'
                      : 'bg-orange-500 text-white border-orange-500 shadow-xs'
                  }`}>
                    Total: {counts.total}/10
                  </span>
                </div>
              </div>

              <AlertBanner type={modalAlert.type} message={modalAlert.message} onClose={() => setModalAlert({ type: 'error', message: '' })} />

              {/* Search & Filter Toolbar inside Modal */}
              <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-200/80 mb-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search question text or topic..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  />
                  <span className="absolute left-2.5 top-2 text-gray-400 text-xs">🔍</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={modalTypeFilter}
                    onChange={(e) => setModalTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-orange-400 outline-none bg-white"
                  >
                    <option value="All">All Types</option>
                    <option value="Objective">Objective (5 required)</option>
                    <option value="Descriptive">Descriptive (5 required)</option>
                  </select>

                  <select
                    value={modalStatusFilter}
                    onChange={(e) => setModalStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-orange-400 outline-none bg-white"
                  >
                    <option value="All">All Status ({allQuestions.length})</option>
                    <option value="Available">Available ({totalAvailableCount})</option>
                    <option value="Used">Used in other tests ({totalUsedCount})</option>
                  </select>
                </div>
              </div>

              {/* Questions List */}
              <div className="overflow-y-auto flex-1 space-y-2 mb-4 pr-1">
                {filteredModalQuestions.map((q) => {
                  const usedInfo = usedMap[q._id]
                  const isUsed = !!usedInfo
                  const isSelected = !!selectedQIds[q._id]
                  const isLimitReached = Object.keys(selectedQIds).length >= 10 && !isSelected

                  return (
                    <div
                      key={q._id}
                      onClick={() => !isUsed && !isLimitReached && toggleQuestion(q._id, isUsed)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                        isUsed
                          ? 'border-gray-200 bg-gray-100/80 opacity-60 cursor-not-allowed select-none'
                          : isSelected
                          ? 'border-orange-400 bg-orange-50/70 shadow-xs ring-1 ring-orange-300 cursor-pointer'
                          : isLimitReached
                          ? 'border-gray-200 bg-white opacity-50 cursor-not-allowed'
                          : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/20 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleQuestion(q._id, isUsed)}
                        disabled={isUsed || isLimitReached}
                        className={`mt-1 accent-orange-500 h-4 w-4 ${isUsed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold leading-snug ${isUsed ? 'text-gray-500' : isSelected ? 'text-gray-900 font-bold' : 'text-gray-800'}`}>
                            {q.questionText}
                          </p>

                          {isUsed && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-200 text-gray-700 whitespace-nowrap flex-shrink-0 flex items-center gap-1 border border-gray-300">
                              <span>🔒</span> Used in {usedInfo.testName || `Assessment ${usedInfo.assessmentNumber}`}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 mt-2 flex-wrap items-center">
                          <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                            {q.topic}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {q.difficulty}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            q.type === 'Objective' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                          }`}>
                            {q.type} ({q.type === 'Objective' ? '2 Marks' : '5 Marks'})
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-500 text-white">
                              ✓ Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {filteredModalQuestions.length === 0 && (
                  <div className="text-center py-10 space-y-2 border border-dashed border-gray-200 rounded-xl">
                    <span className="text-2xl block">🔍</span>
                    <p className="text-xs text-gray-500">No questions found matching your filter criteria.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {counts.total === 10 && counts.objectiveCount === 5 && counts.descriptiveCount === 5 ? (
                    <strong className="text-green-600 font-bold">✓ Ready to save! (5 Objective + 5 Descriptive selected)</strong>
                  ) : (
                    <span>
                      Required: <strong className="text-orange-600">{5 - counts.objectiveCount}</strong> more Objective,{' '}
                      <strong className="text-cyan-600">{5 - counts.descriptiveCount}</strong> more Descriptive
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuestionsModal(null)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveQuestionSelection}
                    className="px-5 py-2 text-xs font-extrabold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>💾</span> Save Selection ({counts.total}/10)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
                🗑️
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Assessment Deletion</h3>
                <p className="text-xs text-gray-500">ID: {deleteConfirm._id}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete the assessment <strong className="text-gray-900">"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                Yes, Delete Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Course Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Assign Assessment to Course</h3>
            <p className="text-sm text-gray-500 mb-4">Assessment: <span className="font-bold text-gray-800">{assignModal.name}</span></p>
            <AlertBanner type={modalAlert.type} message={modalAlert.message} onClose={() => setModalAlert({ type: 'error', message: '' })} />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technology</label>
                <select
                  value={assignForm.technology}
                  onChange={(e) => handleTechChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                >
                  <option value="">Select Technology</option>
                  {technologies.map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              {assignForm.technology && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Syllabus Duration</label>
                  <select
                    value={assignForm.durationDays}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                  >
                    <option value="">Select Duration</option>
                    {durations.map((d) => <option key={d.durationDays} value={d.durationDays}>{d.syllabusName} ({d.durationDays} Days)</option>)}
                  </select>
                </div>
              )}
              {assignForm.durationDays && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Number</label>
                  <select
                    value={assignForm.assessmentNumber}
                    onChange={(e) => setAssignForm((prev) => ({ ...prev, assessmentNumber: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                  >
                    <option value="">Select Assessment Number</option>
                    {assessmentNumbers.map((n) => <option key={n} value={n}>Assessment {n}</option>)}
                    {assessmentNumbers.length === 0 && <option value="" disabled>All assessments assigned for this duration</option>}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setAssignModal(null); setAssignForm({ technology: '', durationDays: '', assessmentNumber: '' }) }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={assignToCourse}
                className="px-5 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Assign to Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}