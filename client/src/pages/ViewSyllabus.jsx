import { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB')
}

export default function ViewSyllabus() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ type: 'error', message: '' })

  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsAlert, setDetailsAlert] = useState({ type: 'error', message: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await api.get('/client/assigned-syllabuses')
        setAssignments(res.data || [])
        if (res.data && res.data.length > 0) {
          setSelected(res.data[0])
        }
      } catch (err) {
        setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to load assigned syllabuses.') })
      } finally {
        setLoading(false)
      }
    }
    fetchAssignments()
  }, [])

  useEffect(() => {
    if (!selected) {
      setDetails(null)
      return
    }
    setCurrentPage(1)
    const fetchDetails = async () => {
      setDetailsLoading(true)
      setDetailsAlert({ type: 'error', message: '' })
      try {
        const res = await api.get('/client/syllabus-details', {
          technology: selected.technology,
          syllabusName: selected.syllabusName,
        })
        setDetails(res.data)
      } catch (err) {
        setDetailsAlert({ type: 'error', message: getErrorMessage(err, 'Unable to load syllabus details.') })
        setDetails(null)
      } finally {
        setDetailsLoading(false)
      }
    }
    fetchDetails()
  }, [selected])

  const totalRows = details?.rows?.length || 0
  const totalPages = Math.max(1, Math.ceil(totalRows / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedRows = (details?.rows || []).slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalRows, totalPages, currentPage])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">View Syllabus</h2>
        <p className="text-sm text-gray-500 mt-1">Your assigned syllabuses with day-wise study plan.</p>
      </div>

      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'error', message: '' })} />

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-10 text-center text-sm text-gray-400">
          Loading assigned syllabuses...
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-10">
          <AlertBanner
            type="error"
            message="No syllabuses assigned yet. Please contact your administrator."
            onClose={() => {}}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {assignments.map((assignment) => (
              <button
                key={`${assignment._id}-${assignment.technology}`}
                type="button"
                onClick={() => setSelected(assignment)}
                className={`px-4 py-3 rounded-xl border text-left transition-colors ${
                  selected && selected._id === assignment._id
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-white border-gray-200 text-gray-800 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                <p className="text-sm font-semibold">{assignment.technology} - {assignment.syllabusName}</p>
                <p className={`text-xs mt-0.5 ${selected && selected._id === assignment._id ? 'text-orange-100' : 'text-gray-400'}`}>
                  Starts {formatDate(assignment.startDate)}
                </p>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-800">{selected.technology} - {selected.syllabusName}</h3>
                <p className="text-xs text-gray-500">
                  Start Date: {formatDate(selected.startDate)}
                  {details && details.totalDays ? ` · ${details.totalDays} days` : ''}
                </p>
              </div>
              {details && totalRows > 0 && (
                <span className="text-xs text-gray-500 font-medium">
                  Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalRows)} of {totalRows} days (Page {currentPage} of {totalPages})
                </span>
              )}
            </div>

            {detailsAlert.message && (
              <div className="px-5 pt-4">
                <AlertBanner type={detailsAlert.type} message={detailsAlert.message} onClose={() => setDetailsAlert({ type: 'error', message: '' })} />
              </div>
            )}

            {detailsLoading ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">Loading syllabus details...</div>
            ) : details && details.rows.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                No syllabus rows uploaded for this syllabus yet.
              </div>
            ) : details ? (
              <>
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full min-w-[500px] text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Syllabus Name</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Technology</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Week</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Day</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Chapter</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Topics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedRows.map((row) => (
                        <tr key={row._id} className="hover:bg-orange-50 transition-colors">
                          <td className="px-5 py-3 text-gray-700">{details.syllabusName}</td>
                          <td className="px-5 py-3 text-gray-700">{details.technology}</td>
                          <td className="px-5 py-3 text-gray-600">Week {row.week}</td>
                          <td className="px-5 py-3 font-medium text-gray-800">Day {row.day}</td>
                          <td className="px-5 py-3 text-gray-700">{row.chapter}</td>
                          <td className="px-5 py-3 text-gray-600">{row.topics || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
                    <span className="text-xs text-gray-500">
                      Showing <strong className="text-gray-700">{startIndex + 1}</strong> to{' '}
                      <strong className="text-gray-700">{Math.min(startIndex + ITEMS_PER_PAGE, totalRows)}</strong> of{' '}
                      <strong className="text-gray-700">{totalRows}</strong> days (up to 10 per page)
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
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}