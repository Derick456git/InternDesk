import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function AssignSyllabus() {
  const [technologies, setTechnologies] = useState([])
  const [techLoading, setTechLoading] = useState(true)
  const [selectedTech, setSelectedTech] = useState('')

  const [durations, setDurations] = useState([])
  const [durationsLoading, setDurationsLoading] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState('')

  const [rows, setRows] = useState([])
  const [rowsLoading, setRowsLoading] = useState(false)
  const [tableError, setTableError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const [showModal, setShowModal] = useState(false)
  const [interns, setInterns] = useState([])
  const [internsLoading, setInternsLoading] = useState(false)
  const [fetchInternError, setFetchInternError] = useState('')
  const [selectedInterns, setSelectedInterns] = useState([])
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [assigning, setAssigning] = useState(false)
  const [modalAlert, setModalAlert] = useState({ type: 'error', message: '' })

  useEffect(() => {
    const fetchTech = async () => {
      try {
        const res = await api.get('/technologies')
        const active = (res.data || []).filter((t) => t.active !== false)
        setTechnologies(active)
      } catch (err) {
        setTableError(err.message || 'Unable to load technologies.')
      } finally {
        setTechLoading(false)
      }
    }
    fetchTech()
  }, [])

  useEffect(() => {
    if (!selectedTech) {
      setDurations([])
      setSelectedDuration('')
      setRows([])
      setCurrentPage(1)
      return
    }
    const fetchDurations = async () => {
      setDurationsLoading(true)
      setTableError('')
      try {
        const res = await api.get(`/syllabus/durations?technology=${encodeURIComponent(selectedTech)}`)
        setDurations((res.data || []).map(d => d.syllabusName))
        setSelectedDuration('')
        setRows([])
        setCurrentPage(1)
      } catch (err) {
        setTableError(err.message || 'Unable to load syllabus durations.')
      } finally {
        setDurationsLoading(false)
      }
    }
    fetchDurations()
  }, [selectedTech])

  useEffect(() => {
    if (!selectedTech || !selectedDuration) {
      setRows([])
      setCurrentPage(1)
      return
    }
    const fetchRows = async () => {
      setRowsLoading(true)
      setTableError('')
      setCurrentPage(1)
      try {
        const res = await api.get(
          `/syllabus?technology=${encodeURIComponent(selectedTech)}&syllabusName=${encodeURIComponent(selectedDuration)}`
        )
        const sortedRows = (res.data || []).sort((a, b) => (Number(a.day) || 0) - (Number(b.day) || 0))
        setRows(sortedRows)
      } catch (err) {
        setTableError(err.message || 'Unable to load syllabus rows.')
      } finally {
        setRowsLoading(false)
      }
    }
    fetchRows()
  }, [selectedTech, selectedDuration])

  const openModal = async () => {
    setShowModal(true)
    setModalAlert({ type: 'error', message: '' })
    setSelectedInterns([])
    setStartDate(new Date().toISOString().slice(0, 10))
    setInternsLoading(true)
    setFetchInternError('')
    try {
      const res = await api.get(
        `/registrations?status=Approved&technology=${encodeURIComponent(selectedTech)}`
      )
      const filtered = (res.data || []).filter(reg => 
        (reg.technologies && reg.technologies.includes(selectedTech)) || 
        reg.technology === selectedTech
      )
      setInterns(filtered)
    } catch (err) {
      setFetchInternError(err.message || 'Unable to load approved interns.')
    } finally {
      setInternsLoading(false)
    }
  }

  const isPastDate = (value) => {
    if (!value) return true
    const today = new Date().toISOString().slice(0, 10)
    return value < today
  }

  const toggleIntern = (id) => {
    setSelectedInterns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleAssign = async () => {
    setModalAlert({ type: 'error', message: '' })
    if (selectedInterns.length === 0) {
      setModalAlert({ type: 'error', message: 'Please select at least one intern to assign the syllabus.' })
      return
    }
    if (!startDate) {
      setModalAlert({ type: 'error', message: 'Please choose a start date for the syllabus.' })
      return
    }
    if (isPastDate(startDate)) {
      setModalAlert({ type: 'error', message: 'Start date cannot be in the past.' })
      return
    }
    setAssigning(true)
    try {
      const res = await api.post('/syllabus/assign', {
        internIds: selectedInterns,
        technology: selectedTech,
        syllabusName: selectedDuration,
        startDate,
      })
      setModalAlert({
        type: 'success',
        message: res.message || `Syllabus "${selectedDuration}" for ${selectedTech} assigned to ${selectedInterns.length} intern(s).`,
      })
      setSelectedInterns([])
    } catch (err) {
      setModalAlert({ type: 'error', message: err.message || 'Assignment failed. Please try again.' })
    } finally {
      setAssigning(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setModalAlert({ type: 'error', message: '' })
    setSelectedInterns([])
  }

  // Pagination calculation
  const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE) || 1
  const paginatedRows = rows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Assign Syllabus</h2>
        <p className="text-sm text-gray-500 mt-1">Select a technology, choose a syllabus duration, and assign it to approved interns.</p>
      </div>

      {tableError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <AlertBanner type="error" message={tableError} onClose={() => setTableError('')} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">1. Select Technology</label>
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
          >
            <option value="">Select Technology</option>
            {technologies.map((t) => (
              <option key={t._id} value={t.name}>{t.name}</option>
            ))}
          </select>
          {techLoading && <p className="text-xs text-gray-400 mt-2">Loading technologies...</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">2. Select Syllabus Duration</label>
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            disabled={!selectedTech}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">{durationsLoading ? 'Loading durations...' : (selectedTech ? 'Select Duration' : 'Select technology first')}</option>
            {durations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {durations.length === 0 && !durationsLoading && selectedTech && (
            <p className="text-xs text-gray-400 mt-2">No syllabus uploaded for {selectedTech} yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-700 mb-1">3. Assign Syllabus</p>
          <p className="text-xs text-gray-500 mb-4">
            {selectedTech ? `Technology: ${selectedTech}\u00A0\u00A0·\u00A0\u00A0${durations.find((d) => d === selectedDuration) || (selectedDuration || 'Duration: —')}` : 'Select technology and duration above.'}
          </p>
          <button
            type="button"
            onClick={openModal}
            disabled={!selectedTech || !selectedDuration || rows.length === 0}
            className="w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign Syllabus
          </button>
        </div>
      </div>

      {(selectedTech && selectedDuration) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">{selectedDuration} — {selectedTech}</h3>
              <p className="text-xs text-gray-500">{rows.length} total syllabus days</p>
            </div>
            {totalPages > 1 && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Page {currentPage} of {totalPages} (10 days / page)
              </span>
            )}
          </div>
          {rowsLoading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Loading syllabus rows...</div>
          ) : (
            <>
              <div className="overflow-x-auto min-w-0">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 font-semibold text-gray-600">Week</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-600">Day</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-600">Chapter</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-600">Topics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedRows.map((row) => (
                      <tr key={row._id || `${row.week}-${row.day}`} className="hover:bg-orange-50/60 transition-colors">
                        <td className="px-5 py-3 text-gray-600">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                            Week {row.week}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-bold text-gray-800">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                            Day {row.day}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-800 font-medium">{row.chapter}</td>
                        <td className="px-5 py-3 text-gray-600">{row.topics || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
                  <span className="text-xs text-gray-500">
                    Showing <strong className="text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{' '}
                    <strong className="text-gray-700">{Math.min(currentPage * ITEMS_PER_PAGE, rows.length)}</strong> of{' '}
                    <strong className="text-gray-700">{rows.length}</strong> days
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
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4 relative max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-gray-800 mb-1">Assign Syllabus to Interns</h3>
            <p className="text-sm text-gray-500 mb-4">
              {selectedDuration} — {selectedTech} ({startDate})
            </p>

            <div className="flex-1 overflow-y-auto space-y-4">
              <AlertBanner
                type={modalAlert.type}
                message={modalAlert.message}
                onClose={() => setModalAlert({ type: 'error', message: '' })}
              />

              {fetchInternError && (
                <AlertBanner type="error" message={fetchInternError} onClose={() => setFetchInternError('')} />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Syllabus Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                />
                {isPastDate(startDate) && (
                  <p className="text-xs text-red-500 mt-1">Start date cannot be in the past.</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Select Approved Interns</p>
                {internsLoading ? (
                  <p className="text-sm text-gray-400">Loading approved interns...</p>
                ) : interns.length === 0 ? (
                  <p className="text-sm text-gray-400">No approved interns registered for {selectedTech}.</p>
                ) : (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {interns.map((intern) => (
                      <label
                        key={intern._id}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-orange-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedInterns.includes(intern._id)}
                          onChange={() => toggleIntern(intern._id)}
                          className="h-4 w-4 accent-orange-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{intern.name}</p>
                          <p className="text-xs text-gray-500">{intern.email} · {(intern.technologies || []).join(', ') || intern.technology}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={assigning || selectedInterns.length === 0 || isPastDate(startDate)}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? 'Assigning...' : `Assign${selectedInterns.length ? ` (${selectedInterns.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}