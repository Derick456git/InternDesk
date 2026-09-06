import { useState, useEffect, useMemo } from 'react'
import { api } from '../api'

const ITEMS_PER_PAGE = 6

export default function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Total Registrations', value: 0, color: 'from-blue-500 to-indigo-600', text: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Approved Interns', value: 0, color: 'from-emerald-500 to-green-600', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Technologies', value: 0, color: 'from-purple-500 to-violet-600', text: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Active Tasks', value: 0, color: 'from-amber-500 to-orange-600', text: 'text-amber-600', bg: 'bg-amber-50' },
  ])
  const [approvedInterns, setApprovedInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIntern, setSelectedIntern] = useState(null)

  // Maximum Filtration States
  const [searchQuery, setSearchQuery] = useState('')
  const [techFilter, setTechFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [qualFilter, setQualFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  // Pagination State (6 rows per page)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [regRes, techRes, taskRes] = await Promise.all([
        api.get('/registrations'),
        api.get('/technologies'),
        api.get('/tasks'),
      ])

      const allRegs = regRes.data || []
      const techs = techRes.data || []
      const tasks = taskRes.data || []
      const approved = allRegs.filter((r) => r.status === 'Approved')

      setStats([
        { label: 'Total Registrations', value: allRegs.length, color: 'from-blue-500 to-indigo-600', text: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Approved Interns', value: approved.length, color: 'from-emerald-500 to-green-600', text: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Technologies', value: techs.length, color: 'from-purple-500 to-violet-600', text: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Active Tasks', value: tasks.filter((t) => t.status === 'Pending').length, color: 'from-amber-500 to-orange-600', text: 'text-amber-600', bg: 'bg-amber-50' },
      ])
      setApprovedInterns(approved)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Extract unique filter dropdown values
  const uniqueTechs = useMemo(() => {
    const set = new Set()
    approvedInterns.forEach((intern) => {
      if (intern.technology) set.add(intern.technology)
      if (Array.isArray(intern.technologies)) {
        intern.technologies.forEach((t) => set.add(t))
      }
    })
    return [...set].sort()
  }, [approvedInterns])

  const uniqueQualifications = useMemo(() => {
    return [...new Set(approvedInterns.map((i) => i.qualification).filter(Boolean))].sort()
  }, [approvedInterns])

  const uniquePeriods = useMemo(() => {
    return [...new Set(approvedInterns.map((i) => i.internshipPeriod).filter(Boolean))].sort()
  }, [approvedInterns])

  // Filtered and Sorted Interns
  const filteredInterns = useMemo(() => {
    return approvedInterns
      .filter((intern) => {
        // Search across Name, Email, Phone, College, University, Location
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const nameMatch = intern.name?.toLowerCase().includes(q)
          const emailMatch = intern.email?.toLowerCase().includes(q)
          const phoneMatch = intern.phone?.toLowerCase().includes(q)
          const collegeMatch = intern.collegeName?.toLowerCase().includes(q)
          const univMatch = intern.universityName?.toLowerCase().includes(q)
          const locMatch = intern.location?.toLowerCase().includes(q)
          const qualMatch = intern.qualification?.toLowerCase().includes(q)
          if (!nameMatch && !emailMatch && !phoneMatch && !collegeMatch && !univMatch && !locMatch && !qualMatch) {
            return false
          }
        }

        // Technology Filter
        if (techFilter) {
          const hasTech =
            intern.technology === techFilter ||
            (Array.isArray(intern.technologies) && intern.technologies.includes(techFilter))
          if (!hasTech) return false
        }

        // Mode Filter (Online / Offline)
        if (modeFilter && intern.classMode !== modeFilter) {
          return false
        }

        // Gender Filter
        if (genderFilter && intern.gender !== genderFilter) {
          return false
        }

        // Qualification Filter
        if (qualFilter && intern.qualification !== qualFilter) {
          return false
        }

        // Internship Period Filter
        if (periodFilter && intern.internshipPeriod !== periodFilter) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '')
        if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '')
        if (sortBy === 'college') return (a.collegeName || '').localeCompare(b.collegeName || '')
        return 0
      })
  }, [approvedInterns, searchQuery, techFilter, modeFilter, genderFilter, qualFilter, periodFilter, sortBy])

  // Reset pagination to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, techFilter, modeFilter, genderFilter, qualFilter, periodFilter, sortBy])

  // Pagination Math (6 rows per page)
  const totalPages = Math.ceil(filteredInterns.length / ITEMS_PER_PAGE) || 1
  const paginatedInterns = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredInterns.slice(startIdx, startIdx + ITEMS_PER_PAGE)
  }, [filteredInterns, currentPage])

  const clearAllFilters = () => {
    setSearchQuery('')
    setTechFilter('')
    setModeFilter('')
    setGenderFilter('')
    setQualFilter('')
    setPeriodFilter('')
    setSortBy('newest')
  }

  const hasActiveFilters = Boolean(
    searchQuery || techFilter || modeFilter || genderFilter || qualFilter || periodFilter || sortBy !== 'newest'
  )

  if (loading) {
    return <p className="text-gray-500 text-center py-20">Loading dashboard...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Overview metrics and comprehensive approved intern database.</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{stat.label}</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.text} flex items-center justify-center font-bold text-lg shadow-sm`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-[240px] relative">
            <input
              type="text"
              placeholder="Search by Name, Email, Phone, College, Location, Qualification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-400 outline-none bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="college">College Name</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Granular Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Technology</label>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">All Technologies</option>
              {uniqueTechs.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Mode</label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">All Modes</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Gender</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Qualification</label>
            <select
              value={qualFilter}
              onChange={(e) => setQualFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">All Qualifications</option>
              {uniqueQualifications.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Duration</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">All Durations</option>
              {uniquePeriods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Approved Interns Full Table (6 Rows Per Page) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-base">Approved Interns Directory</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Showing {filteredInterns.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredInterns.length)} of {filteredInterns.length} approved interns
            </p>
          </div>
          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
            {filteredInterns.length} Approved Records
          </span>
        </div>

        {filteredInterns.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-gray-400">
            No approved interns match your search / filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">
                  <th className="text-left px-5 py-3.5">Intern Name</th>
                  <th className="text-left px-5 py-3.5">Contact Details</th>
                  <th className="text-left px-5 py-3.5">Technology Track</th>
                  <th className="text-left px-5 py-3.5">College & University</th>
                  <th className="text-left px-5 py-3.5">Qualification</th>
                  <th className="text-left px-5 py-3.5">Duration & Mode</th>
                  <th className="text-left px-5 py-3.5">Location</th>
                  <th className="text-left px-5 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedInterns.map((intern) => {
                  const techList = intern.technologies?.length > 0 ? intern.technologies.join(', ') : intern.technology || '—'
                  return (
                    <tr key={intern._id} className="hover:bg-orange-50/40 transition-colors">
                      {/* Name & Demographic */}
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {intern.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-gray-900">{intern.name}</span>
                            <span className="text-[10px] text-gray-400 font-normal">
                              {intern.gender || '—'} {intern.age ? `· ${intern.age} yrs` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="px-5 py-3.5">
                        <span className="block font-medium text-gray-800">{intern.email}</span>
                        <span className="text-[11px] text-gray-500">{intern.phone}</span>
                      </td>

                      {/* Technology Track */}
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-100 text-orange-800 inline-block max-w-[150px] truncate" title={techList}>
                          {techList}
                        </span>
                      </td>

                      {/* College & University */}
                      <td className="px-5 py-3.5 max-w-[180px]">
                        <span className="block font-semibold text-gray-800 truncate" title={intern.collegeName || '—'}>
                          {intern.collegeName || '—'}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate" title={intern.universityName || '—'}>
                          {intern.universityName || '—'}
                        </span>
                      </td>

                      {/* Qualification */}
                      <td className="px-5 py-3.5 font-medium text-gray-700">
                        {intern.qualification || '—'}
                      </td>

                      {/* Duration & Mode */}
                      <td className="px-5 py-3.5">
                        <span className="block font-bold text-gray-800">{intern.internshipPeriod || '—'}</span>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                          intern.classMode === 'Offline' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {intern.classMode || 'Online'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-3.5 text-gray-600 max-w-[120px] truncate" title={`${intern.location || ''} ${intern.address || ''}`}>
                        {intern.location || intern.address || '—'}
                        {intern.pincode && <span className="block text-[10px] text-gray-400">PIN: {intern.pincode}</span>}
                      </td>

                      {/* View Dossier Action */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setSelectedIntern(intern)}
                          className="px-3.5 py-2 text-xs font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                        >
                          View Full Dossier
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar (6 rows per page) */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredInterns.length} interns)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
              >
                &larr; Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => {
                  const showEllipsis = idx > 0 && page - arr[idx - 1] > 1
                  return (
                    <span key={page} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-gray-400 text-xs">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                          currentPage === page
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  )
                })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Intern Registration Details Modal */}
      {selectedIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-orange-200">
                  {selectedIntern.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{selectedIntern.name}</h3>
                  <p className="text-xs text-gray-500">{selectedIntern.email} · {selectedIntern.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIntern(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Account Status</span>
                  <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-[11px] inline-block mt-1">
                    {selectedIntern.status}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Registration Date</span>
                  <span className="font-bold text-gray-800 text-xs block mt-1">
                    {selectedIntern.createdAt ? new Date(selectedIntern.createdAt).toLocaleString('en-GB') : '—'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Technology Track(s)</span>
                  <span className="font-bold text-orange-700 text-xs block mt-1">
                    {selectedIntern.technologies?.length > 0 ? selectedIntern.technologies.join(', ') : selectedIntern.technology || '—'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Class Mode & Period</span>
                  <span className="font-bold text-gray-800 text-xs block mt-1">
                    {selectedIntern.classMode || 'Online'} · {selectedIntern.internshipPeriod || '—'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Gender & Age</span>
                  <span className="font-semibold text-gray-800 text-xs block mt-1">
                    {selectedIntern.gender || '—'} {selectedIntern.age ? `(${selectedIntern.age} years old)` : ''}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Qualification / Degree</span>
                  <span className="font-semibold text-gray-800 text-xs block mt-1">
                    {selectedIntern.qualification || '—'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 sm:col-span-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">College Name</span>
                  <span className="font-semibold text-gray-800 text-xs block mt-1">
                    {selectedIntern.collegeName || '—'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 sm:col-span-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">University Name</span>
                  <span className="font-semibold text-gray-800 text-xs block mt-1">
                    {selectedIntern.universityName || '—'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 sm:col-span-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Residential Address & Location</span>
                  <span className="font-semibold text-gray-800 text-xs block mt-1">
                    {selectedIntern.address || '—'} {selectedIntern.location ? `· ${selectedIntern.location}` : ''} {selectedIntern.pincode ? `(PIN: ${selectedIntern.pincode})` : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-2">
              <button
                onClick={() => setSelectedIntern(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-gray-900 rounded-xl hover:bg-black transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}