import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function EvaluationResult() {
  const [submissions, setSubmissions] = useState([])
  const [tests, setTests] = useState([])
  const [technologies, setTechnologies] = useState([])
  const [viewing, setViewing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [marks, setMarks] = useState({})
  const [testFilter, setTestFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')
  const [internFilter, setInternFilter] = useState('')
  const [assessmentFilter, setAssessmentFilter] = useState('')
  const [alert, setAlert] = useState({ type: 'success', message: '' })
  const [loading, setLoading] = useState(false)
  const [confirmPublishModal, setConfirmPublishModal] = useState(false)
  const [submittingPublish, setSubmittingPublish] = useState(false)

  useEffect(() => {
    fetchData()
  }, [testFilter, techFilter, internFilter, assessmentFilter])

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (testFilter) params.append('test', testFilter)
      if (techFilter) params.append('technology', techFilter)
      if (internFilter) params.append('internName', internFilter)
      if (assessmentFilter) params.append('assessmentNumber', assessmentFilter)
      const res = await api.get(`/evaluations?${params}`)
      setSubmissions(res.data || [])

      const testRes = await api.get('/tests')
      setTests(testRes.data || [])
      const techRes = await api.get('/technologies')
      setTechnologies(techRes.data || [])
    } catch (err) {
      console.error('Fetch evaluation data error:', err)
    }
  }

  const openView = async (submission) => {
    setViewing(submission._id)
    setAlert({ type: 'success', message: '' })
    setLoading(true)
    try {
      const res = await api.get(`/evaluations/${submission._id}`)
      const evalData = res.data
      setDetail(evalData)
      const m = {}
      ;(evalData.answers || []).forEach((q) => {
        m[q.questionId] = q.marksAwarded !== undefined ? q.marksAwarded : 0
      })
      setMarks(m)
    } catch (err) {
      setAlert({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const closeView = () => {
    setViewing(null)
    setDetail(null)
    setMarks({})
    setConfirmPublishModal(false)
  }

  const setMark = (questionId, maxMarks, value) => {
    const num = Math.min(Math.max(0, Number(value) || 0), maxMarks)
    setMarks((prev) => ({ ...prev, [questionId]: num }))
  }

  const currentTotal = detail
    ? (detail.answers || []).reduce((s, a) => s + (Number(marks[a.questionId]) || 0), 0)
    : 0

  const currentPercentage = Number(((currentTotal / 35) * 100).toFixed(1))
  const isPassed = currentTotal >= 21

  const handleOpenConfirmPublish = () => {
    setConfirmPublishModal(true)
  }

  const executeSaveAndPublish = async () => {
    if (!detail) return
    setSubmittingPublish(true)

    const payload = (detail.answers || []).map((a) => ({
      questionId: a.questionId,
      questionText: a.questionText,
      type: a.type || (a.isObjective ? 'Objective' : 'Descriptive'),
      maxMarks: a.maxMarks || (a.type === 'Objective' ? 2 : 5),
      marksAwarded: Number(marks[a.questionId]) || 0,
    }))

    try {
      await api.put(`/evaluations/${detail._id}/marks`, { marks: payload })
      await api.patch(`/evaluations/${detail._id}/publish`)
      setAlert({
        type: 'success',
        message: `Evaluation finalized! Result (${isPassed ? 'Passed' : 'Failed'} - ${currentTotal}/35) published and sent to ${detail.internName}.`,
      })
      closeView()
      await fetchData()
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to publish evaluation result.' })
    } finally {
      setSubmittingPublish(false)
    }
  }

  const typeBadge = (type) =>
    type === 'Objective'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-cyan-100 text-cyan-700'

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Evaluation & Result</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review intern test submissions, grade objective & descriptive answers (out of 35), and publish results.
        </p>
      </div>

      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'success', message: '' })} />

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Test</label>
            <select
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="">All Tests</option>
              {tests.map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
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
              {technologies.map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
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
              {[...new Set(submissions.map((s) => s.internName))].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assessment #</label>
            <select
              value={assessmentFilter}
              onChange={(e) => setAssessmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="">All</option>
              <option value="1">Assessment 1</option>
              <option value="2">Assessment 2</option>
              <option value="3">Assessment 3</option>
              <option value="4">Assessment 4</option>
              <option value="5">Assessment 5</option>
              <option value="6">Assessment 6</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Intern Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Technology</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Test Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Assessment #</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Score / 35</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Percentage</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Result</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {submissions.map((s) => {
                const score = s.totalScore ?? s.totalMarksObtained ?? 0
                const pct = s.percentage ?? ((score / 35) * 100).toFixed(1)
                const pass = score >= 21
                const isPub = s.isPublished || s.status === 'Published'

                return (
                  <tr key={s._id} className="hover:bg-orange-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {s.internName}
                      {s.email && <span className="block text-xs text-gray-400">{s.email}</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{s.technology}</td>
                    <td className="px-5 py-3 text-gray-600">{s.testName}</td>
                    <td className="px-5 py-3">
                      {s.assessmentNumber ? (
                        <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 inline-flex items-center justify-center text-xs font-bold">
                          {s.assessmentNumber}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-800">
                      {isPub ? `${score} / 35` : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {isPub ? `${pct}%` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {isPub ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          pass
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {pass ? 'Passed' : 'Failed'}
                        </span>
                      ) : (
                        <span className="text-gray-300 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isPub ? (
                        <span className="text-gray-400 font-medium">—</span>
                      ) : (
                        <button
                          onClick={() => openView(s)}
                          className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>📝</span>
                          Review & Grade
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {submissions.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-400">No submissions found.</div>
        )}
      </div>

      {/* Review & Grade Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] flex flex-col animate-scaleUp">
            <div className="flex items-start justify-between mb-4 border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Assessment Evaluation
                </span>
                <h3 className="text-lg font-extrabold text-gray-900">
                  {detail?.internName} — {detail?.testName}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Technology: <strong className="text-gray-700">{detail?.technology}</strong>
                  {detail?.assessmentNumber && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md font-semibold">
                      Assessment #{detail.assessmentNumber}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={closeView} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1">
                &times;
              </button>
            </div>

            {/* Score & Passing Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-orange-50/70 rounded-xl border border-orange-200 mb-4">
              <div className="text-xs text-gray-600 space-y-0.5">
                <p className="font-semibold text-gray-800">Format: 5 Objective (10M) + 5 Descriptive (25M) = 35 Marks</p>
                <p className="text-gray-500">Passing Threshold: &ge; 21 Marks (60%)</p>
              </div>
              <div className="sm:text-right">
                <span className="text-base sm:text-lg font-black text-gray-900">
                  Total: <span className="text-orange-600">{currentTotal}</span> / 35 ({currentPercentage}%)
                </span>
                <span className={`block text-xs font-bold mt-0.5 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                  {isPassed ? '✓ PASSED (≥60%)' : '✕ FAILED (<60%)'}
                </span>
              </div>
            </div>

            {/* Questions List */}
            <div className="overflow-y-auto flex-1 space-y-3.5 pr-1">
              {loading ? (
                <p className="text-center text-gray-400 py-10">Loading answers...</p>
              ) : (detail?.answers || []).length === 0 ? (
                <p className="text-center text-gray-400 py-10">No questions found for this submission.</p>
              ) : (
                (detail?.answers || []).map((q, i) => {
                  const maxMarks = q.maxMarks || (q.isObjective || q.type === 'Objective' ? 2 : 5)
                  const isObj = q.isObjective || q.type === 'Objective'
                  const currentMark = Number(marks[q.questionId] !== undefined ? marks[q.questionId] : q.marksAwarded) || 0
                  const isCorrect = isObj && currentMark === 2

                  return (
                    <div key={i} className="border border-gray-200 rounded-xl p-3.5 sm:p-4 bg-gray-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{q.questionText}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeBadge(isObj ? 'Objective' : 'Descriptive')}`}>
                                {isObj ? 'Objective (2 Marks)' : 'Descriptive (5 Marks)'}
                              </span>
                              {isObj && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  isCorrect
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-red-100 text-red-700 border-red-200'
                                }`}>
                                  {isCorrect ? '✓ Correct Answer' : '✕ Wrong answer'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Marks control */}
                        {isObj ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                            <span className="text-xs font-semibold text-gray-500">Auto Score:</span>
                            <span className={`text-sm font-black ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              {currentMark}
                            </span>
                            <span className="text-xs font-bold text-gray-400">/ 2</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-shrink-0 bg-white px-3 py-1.5 rounded-lg border border-orange-200 shadow-2xs">
                            <label className="text-xs font-bold text-gray-700">Marks (0-5):</label>
                            <input
                              type="number"
                              min="0"
                              max={5}
                              value={marks[q.questionId] ?? ''}
                              onChange={(e) => setMark(q.questionId, 5, e.target.value)}
                              className="w-14 px-2 py-1 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-orange-400 outline-none font-bold bg-orange-50/40 text-orange-950"
                              placeholder="0"
                            />
                            <span className="text-xs font-bold text-gray-500">/ 5</span>
                          </div>
                        )}
                      </div>

                      {/* Answer Details */}
                      {isObj ? (
                        <div className="ml-8 space-y-2">
                          <div className={`p-3 rounded-lg border text-xs ${
                            isCorrect
                              ? 'bg-green-50/60 border-green-200'
                              : 'bg-red-50/60 border-red-200'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                Intern Chosen Option:
                              </span>
                              <span className={`font-bold text-xs ${isCorrect ? 'text-green-700' : 'text-red-600 font-extrabold'}`}>
                                {isCorrect ? '✓ 2 Marks Auto-added' : '✕ Wrong answer (0 Marks)'}
                              </span>
                            </div>
                            <p className="font-mono bg-white p-2.5 rounded-md border border-gray-200 text-gray-800 font-medium">
                              {q.internAnswer || q.answerText || q.answer || '—'}
                            </p>

                            {!isCorrect && q.correctAnswer && (
                              <div className="mt-2.5 pt-2 border-t border-red-200/60">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                                  Correct Answer (Set in Question Bank):
                                </span>
                                <p className="font-mono bg-emerald-50 text-emerald-800 p-2 rounded-md border border-emerald-200 font-semibold">
                                  {q.correctAnswer}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="ml-8 bg-white border border-gray-200 rounded-lg p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Intern Answer (Descriptive):
                            </span>
                            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                              Manual Evaluation
                            </span>
                          </div>
                          <p className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed bg-gray-50/50 p-2.5 rounded border border-gray-100">
                            {q.internAnswer || q.answerText || q.answer || '—'}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={closeView}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOpenConfirmPublish}
                disabled={loading}
                className="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>✓</span>
                Save & Publish Result
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save & Publish Confirmation Modal */}
      {confirmPublishModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isPassed ? '✓' : '✕'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Result Publication</h3>
                <p className="text-xs text-gray-500">
                  {detail?.testName} · {detail?.technology}
                </p>
              </div>
            </div>

            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Intern:</span>
                <span className="font-bold text-gray-800">{detail?.internName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Evaluated Score:</span>
                <span className="font-black text-gray-900 text-sm">{currentTotal} / 35 ({currentPercentage}%)</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-orange-200">
                <span className="text-gray-700 font-bold">Result Status:</span>
                <span className={`font-black text-sm ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
                  {isPassed ? 'PASSED (≥60%)' : 'FAILED (<60%)'}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to finalize and publish this evaluation? The result status will update to{' '}
              <strong className={isPassed ? 'text-green-700' : 'text-red-700'}>{isPassed ? 'Passed' : 'Failed'}</strong> and an automated scorecard notification will be sent to the intern.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPublishModal(false)}
                disabled={submittingPublish}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSaveAndPublish}
                disabled={submittingPublish}
                className="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submittingPublish ? 'Publishing...' : 'Yes, Submit & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}