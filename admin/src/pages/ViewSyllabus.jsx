import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function ViewSyllabus({ onNavigate }) {
  const [syllabi, setSyllabi] = useState([])
  const [technologies, setTechnologies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTech, setSelectedTech] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [alert, setAlert] = useState({ type: 'error', message: '' })

  // State for inspecting syllabus details modal
  const [activeSyllabus, setActiveSyllabus] = useState(null)
  const [detailSearch, setDetailSearch] = useState('')
  const [detailPage, setDetailPage] = useState(1)
  const ROWS_PER_PAGE = 8

  // State for Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState(null) // { syllabus }
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setAlert({ type: 'error', message: '' })
    try {
      const [techRes, syllabiRes] = await Promise.all([
        api.get('/technologies'),
        api.get('/syllabus/all'),
      ])
      const activeTechs = (techRes.data || []).filter((t) => t.active !== false)
      setTechnologies(activeTechs)
      setSyllabi(Array.isArray(syllabiRes.data) ? syllabiRes.data : (Array.isArray(syllabiRes) ? syllabiRes : []))
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Unable to load syllabus data.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Technology categories: combine active registered technologies and technologies present in syllabi
  const techCategories = Array.from(
    new Set([
      ...technologies.map((t) => t.name?.trim()),
      ...syllabi.map((s) => s.technology?.trim()),
    ].filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))

  // Filtered Syllabuses
  const filteredSyllabi = syllabi.filter((s) => {
    const sTech = String(s.technology || '').trim().toLowerCase()
    if (selectedTech !== 'All' && sTech !== selectedTech.trim().toLowerCase()) {
      return false
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      const matchName = String(s.syllabusName || '').toLowerCase().includes(q)
      const matchTech = sTech.includes(q)
      const matchTopic = (s.rows || []).some(
        (r) =>
          (r.chapter && String(r.chapter).toLowerCase().includes(q)) ||
          (r.topics && String(r.topics).toLowerCase().includes(q))
      )
      if (!matchName && !matchTech && !matchTopic) return false
    }
    return true
  })

  // Handle Delete Syllabus
  const handleDeleteConfirm = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      const res = await api.delete(`/syllabus/${deleteModal._id}`)
      setAlert({
        type: 'success',
        message: res.message || `Syllabus "${deleteModal.syllabusName}" deleted successfully.`,
      })
      if (activeSyllabus?._id === deleteModal._id) {
        setActiveSyllabus(null)
      }
      setDeleteModal(null)
      await fetchData()
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete syllabus.' })
    } finally {
      setDeleting(false)
    }
  }

  // Details Modal Row Filtering and Pagination
  const filteredRows = (activeSyllabus?.rows || []).filter((r) => {
    if (!detailSearch.trim()) return true
    const q = detailSearch.toLowerCase().trim()
    return (
      String(r.day).includes(q) ||
      (r.chapter && String(r.chapter).toLowerCase().includes(q)) ||
      (r.topics && String(r.topics).toLowerCase().includes(q))
    )
  })

  const totalDetailPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE))
  const startRowIndex = (detailPage - 1) * ROWS_PER_PAGE
  const paginatedRows = filteredRows.slice(startRowIndex, startRowIndex + ROWS_PER_PAGE)

  const openDetails = (syllabus) => {
    setActiveSyllabus(syllabus)
    setDetailSearch('')
    setDetailPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">View Syllabus</h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse, inspect, and manage created syllabuses categorized by technology track.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('syllabus', 'create')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Upload New Syllabus
            </button>
          )}
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <AlertBanner
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: 'error', message: '' })}
      />

      {/* Filter and Category Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Technology Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => { setSelectedTech('All'); setSearchTerm('') }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedTech === 'All'
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Tracks ({syllabi.length})
            </button>
            {techCategories.map((tech) => {
              const count = syllabi.filter((s) => String(s.technology || '').trim().toLowerCase() === tech.toLowerCase()).length
              return (
                <button
                  key={tech}
                  type="button"
                  onClick={() => { setSelectedTech(tech); setSearchTerm('') }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedTech === tech
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tech} ({count})
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64 flex-shrink-0">
            <input
              type="text"
              placeholder="Search syllabus, topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Syllabuses Cards / Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-sm text-gray-400">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading created syllabuses...
        </div>
      ) : filteredSyllabi.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center space-y-4">
          <span className="text-4xl block">📚</span>
          <div>
            <h3 className="text-base font-bold text-gray-800">
              {selectedTech !== 'All' ? `No Syllabus Found for ${selectedTech}` : 'No Syllabuses Found'}
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              {searchTerm
                ? `No syllabuses matched your search "${searchTerm}". Try searching a different keyword or track.`
                : selectedTech !== 'All'
                ? `No syllabus spreadsheet has been uploaded for ${selectedTech} yet.`
                : 'No syllabuses have been uploaded yet. Go to "Create Syllabus" to upload an Excel syllabus spreadsheet.'}
            </p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('syllabus', 'create')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {selectedTech !== 'All' ? `Upload Syllabus for ${selectedTech}` : 'Go to Create Syllabus'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSyllabi.map((syllabus) => (
            <div
              key={syllabus._id || `${syllabus.technology}-${syllabus.syllabusName}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                {/* Top Badge and Tech Track */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200/80 rounded-full">
                    {syllabus.technology}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {syllabus.durationDays} Days Duration
                  </span>
                </div>

                {/* Syllabus Title */}
                <h4 className="text-base font-extrabold text-gray-900 group-hover:text-orange-600 transition-colors mb-2">
                  {syllabus.syllabusName}
                </h4>

                {/* Info Badges */}
                <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap mb-4">
                  <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-[11px]">
                    📖 {syllabus.totalRows || syllabus.rows?.length || syllabus.durationDays} Chapters / Days
                  </span>
                  {syllabus.createdAt && (
                    <span className="text-[11px] text-gray-400">
                      Uploaded: {new Date(syllabus.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  )}
                </div>

                {/* Chapter Peek */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1 mb-4">
                  <p className="font-semibold text-gray-700 text-[11px] uppercase tracking-wider">
                    Topics Summary Preview:
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {(syllabus.rows || []).slice(0, 3).map((r) => `Day ${r.day}: ${r.chapter}`).join(' • ') || 'No topics listed.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => openDetails(syllabus)}
                  className="flex-1 py-2 px-3 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Details
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteModal(syllabus)}
                  className="py-2 px-3 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Delete Syllabus"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Syllabus Day-By-Day Inspection Modal */}
      {activeSyllabus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 mx-4 relative animate-scaleUp space-y-4 max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setActiveSyllabus(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              &times;
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                📖
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {activeSyllabus.syllabusName} ({activeSyllabus.technology})
                </h3>
                <p className="text-xs text-gray-500">
                  Total Duration: {activeSyllabus.durationDays} Days • {activeSyllabus.totalRows || activeSyllabus.rows?.length} Chapters
                </p>
              </div>
            </div>

            {/* Modal Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search within this syllabus by day, chapter, or topic..."
                value={detailSearch}
                onChange={(e) => { setDetailSearch(e.target.value); setDetailPage(1) }}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">Day</th>
                    <th className="px-4 py-3 w-20 text-center">Week</th>
                    <th className="px-4 py-3 w-1/3">Chapter</th>
                    <th className="px-4 py-3">Topics Covered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        No chapters found matching "{detailSearch}".
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/40 transition-colors">
                        <td className="px-4 py-3 text-center font-bold text-orange-600">Day {r.day}</td>
                        <td className="px-4 py-3 text-center text-gray-500 font-medium">Week {r.week || Math.ceil(r.day / 7)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{r.chapter}</td>
                        <td className="px-4 py-3 text-gray-600 leading-relaxed">{r.topics || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-gray-500">
                Showing {startRowIndex + 1}–{Math.min(startRowIndex + ROWS_PER_PAGE, filteredRows.length)} of {filteredRows.length} days (Page {detailPage} of {totalDetailPages})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDetailPage((p) => Math.max(p - 1, 1))}
                  disabled={detailPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  ← Prev
                </button>
                <span className="px-2 text-xs font-bold text-gray-700">
                  {detailPage} / {totalDetailPages}
                </span>
                <button
                  type="button"
                  onClick={() => setDetailPage((p) => Math.min(p + 1, totalDetailPages))}
                  disabled={detailPage === totalDetailPages}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 relative animate-scaleUp space-y-4 border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Syllabus</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Technology:</span>
                <span className="font-bold text-gray-800">{deleteModal.technology}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Syllabus Name:</span>
                <span className="font-bold text-red-700">{deleteModal.syllabusName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Total Days:</span>
                <span className="font-bold text-gray-800">{deleteModal.durationDays} Days ({deleteModal.totalRows || deleteModal.rows?.length} chapters)</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete syllabus <strong>"{deleteModal.syllabusName}"</strong> for <strong>{deleteModal.technology}</strong> from the database?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-200 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Syllabus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
