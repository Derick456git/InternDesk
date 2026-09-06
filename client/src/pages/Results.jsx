import { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function Results() {
  const [submissions, setSubmissions] = useState([])
  const [selectedResult, setSelectedResult] = useState(null)
  const [selectedTech, setSelectedTech] = useState('All')
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    setAlert({ type: 'error', message: '' })
    try {
      let userObj = null
      try {
        const stored = localStorage.getItem('internUser')
        if (stored) userObj = JSON.parse(stored)
      } catch (e) {}

      const emailParam = userObj?.email ? `?email=${encodeURIComponent(userObj.email)}` : ''
      const res = await api.get(`/test-submissions/my${emailParam}`)
      setSubmissions(res.data || [])
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to load test results.') })
    } finally {
      setLoading(false)
    }
  }

  const publishedList = submissions.filter((s) => s.isPublished || s.status === 'Published')
  const pendingCount = submissions.filter((s) => !s.isPublished && s.status !== 'Published').length

  const technologies = ['All', ...new Set(publishedList.map((s) => s.technology).filter(Boolean))]

  const filtered = publishedList.filter((s) => {
    if (selectedTech !== 'All' && s.technology !== selectedTech) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedResults = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [filtered.length, totalPages, currentPage])

  const handleTechChange = (tech) => {
    setSelectedTech(tech)
    setCurrentPage(1)
  }

  const passedCount = filtered.filter((s) => (s.totalScore ?? s.totalMarksObtained ?? 0) >= 21).length
  const failedCount = filtered.length - passedCount

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-gray-500">Loading published assessment results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'error', message: '' })} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assessment Results</h2>
          <p className="text-sm text-gray-500 mt-1">
            View detailed results, scores, and answer sheets evaluated and published by the administration.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            <span>⏳</span>
            <span>{pendingCount} Assessment(s) Under Review</span>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-1">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Evaluated</span>
          <p className="text-2xl font-black text-gray-900">{filtered.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm space-y-1">
          <span className="text-xs text-green-600 font-bold uppercase tracking-wider">Passed (≥60%)</span>
          <p className="text-2xl font-black text-green-700">{passedCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm space-y-1">
          <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Failed (&lt;60%)</span>
          <p className="text-2xl font-black text-red-700">{failedCount}</p>
        </div>
      </div>

      {/* Filter by Technology */}
      {technologies.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-gray-500 mr-2">Filter Technology:</span>
          {technologies.map((tech) => (
            <button
              key={tech}
              onClick={() => handleTechChange(tech)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTech === tech
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>
      )}

      {/* Published Results Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-gray-800 text-base">Published Results ({filtered.length})</h3>
            <span className="text-xs text-gray-400">Passing Criteria: 21 / 35 Marks (60%)</span>
          </div>
          {filtered.length > 0 && (
            <span className="text-xs text-gray-500 font-medium">
              Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} results (Page {currentPage} of {totalPages})
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto text-xl font-bold">
              📜
            </div>
            <h4 className="text-sm font-bold text-gray-700">No Published Results Available</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Once you complete an assessment and the administrator evaluates your answers, your official scorecard will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="text-left px-6 py-3.5">Assessment Name</th>
                    <th className="text-left px-6 py-3.5">Technology</th>
                    <th className="text-left px-6 py-3.5">Score / 35</th>
                    <th className="text-left px-6 py-3.5">Percentage</th>
                    <th className="text-left px-6 py-3.5">Result</th>
                    <th className="text-left px-6 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedResults.map((sub) => {
                    const score = sub.totalScore ?? sub.totalMarksObtained ?? 0
                    const isPass = score >= 21
                    const pct = sub.percentage || Number(((score / 35) * 100).toFixed(1))

                    return (
                      <tr key={sub._id} className="hover:bg-orange-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 block">{sub.testName}</span>
                          {sub.assessmentNumber && (
                            <span className="text-[11px] text-gray-400">Test #{sub.assessmentNumber}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{sub.technology}</td>
                        <td className="px-6 py-4 font-black text-gray-900 text-base">
                          {score} <span className="text-xs text-gray-400 font-normal">/ 35</span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-semibold">{pct}%</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider ${
                            isPass
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {isPass ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedResult(sub)}
                            className="px-3.5 py-1.5 text-xs font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <span>🔍</span>
                            View Answer Sheet
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
                <span className="text-xs text-gray-500">
                  Showing <strong className="text-gray-700">{startIndex + 1}</strong> to{' '}
                  <strong className="text-gray-700">{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</strong> of{' '}
                  <strong className="text-gray-700">{filtered.length}</strong> results (up to 5 per page)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
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

      {/* Answer Sheet Detailed Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] flex flex-col animate-scaleUp">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Evaluated Result Card
                </span>
                <h3 className="text-lg font-extrabold text-gray-900">{selectedResult.testName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedResult.technology} · Test #{selectedResult.assessmentNumber || 1}
                </p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1"
              >
                &times;
              </button>
            </div>

            {/* Score Summary Box */}
            <div className="my-4 p-4 rounded-xl bg-orange-50/60 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-gray-900">
                  {selectedResult.totalScore ?? selectedResult.totalMarksObtained ?? 0}
                  <span className="text-sm font-bold text-gray-500 ml-1">/ 35 Marks</span>
                </span>
                <span className="text-xs font-semibold text-gray-500 ml-2">
                  ({selectedResult.percentage || Number((((selectedResult.totalScore ?? selectedResult.totalMarksObtained ?? 0) / 35) * 100).toFixed(1))}%)
                </span>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider ${
                (selectedResult.totalScore ?? selectedResult.totalMarksObtained ?? 0) >= 21
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'bg-red-600 text-white shadow-xs'
              }`}>
                {(selectedResult.totalScore ?? selectedResult.totalMarksObtained ?? 0) >= 21 ? 'PASSED (≥60%)' : 'FAILED (<60%)'}
              </span>
            </div>

            {/* Answer List */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {(selectedResult.answers || []).map((ans, idx) => {
                const maxMarks = ans.maxMarks || (ans.isObjective || ans.type === 'Objective' ? 2 : 5)
                const isObj = ans.isObjective || ans.type === 'Objective'

                return (
                  <div key={idx} className="p-4 border rounded-xl bg-gray-50/50 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-600 font-extrabold text-sm">{idx + 1}.</span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{ans.questionText}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isObj ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                          }`}>
                            {isObj ? 'Objective (2M)' : 'Descriptive (5M)'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-900 flex-shrink-0 bg-white px-2.5 py-1 border border-gray-200 rounded-lg shadow-2xs">
                        {ans.marksAwarded ?? 0} / {maxMarks} Marks
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-800">
                      <span className="text-gray-400 block mb-1 font-bold uppercase tracking-wider text-[10px]">
                        Your Answer:
                      </span>
                      <p className="whitespace-pre-wrap font-mono">{ans.internAnswer || ans.answerText || ans.answer || '—'}</p>
                    </div>

                    {ans.feedback && (
                      <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs text-amber-900">
                        <span className="font-bold block mb-0.5">Admin Feedback:</span>
                        <p>{ans.feedback}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-5 py-2 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
