import { useState, useEffect, useMemo } from 'react'
import { api } from '../api'

const ITEMS_PER_PAGE = 5

export default function ViewProgress() {
  const [results, setResults] = useState([])
  const [technologies, setTechnologies] = useState([])
  const [internFilter, setInternFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('All')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams()
        if (internFilter) params.append('internName', internFilter)
        if (techFilter) params.append('technology', techFilter)
        if (resultFilter !== 'All') params.append('result', resultFilter)
        const res = await api.get(`/evaluations/progress?${params}`)
        setResults(res.data || [])

        const techRes = await api.get('/technologies')
        setTechnologies(techRes.data || [])
      } catch (err) {
        console.error('Fetch progress error:', err)
      }
    }
    fetchData()
  }, [internFilter, techFilter, resultFilter])

  const allNames = useMemo(() => [...new Set(results.map((r) => r.internName))].sort(), [results])
  const allTechs = technologies.map((t) => t.name)

  const filtered = results

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const passedCount = filtered.filter((r) => r.result === 'Passed').length
  const failedCount = filtered.filter((r) => r.result === 'Failed').length

  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)))

  const handleFilterChange = (setter) => (val) => {
    setter(val); setPage(1)
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">View Progress</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Interns Passed</p>
            <p className="text-3xl font-bold text-gray-800">{passedCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Interns Failed</p>
            <p className="text-3xl font-bold text-gray-800">{failedCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Intern</label>
            <select
              value={internFilter}
              onChange={(e) => handleFilterChange(setInternFilter)(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="">All Interns</option>
              {allNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Technology</label>
            <select
              value={techFilter}
              onChange={(e) => handleFilterChange(setTechFilter)(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="">All Technologies</option>
              {allTechs.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Result</label>
            <select
              value={resultFilter}
              onChange={(e) => handleFilterChange(setResultFilter)(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="All">All Results</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-w-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Intern Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Technology</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Test Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Percentage</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((row, i) => (
                <tr key={row._id || i} className="hover:bg-orange-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{row.internName}</td>
                  <td className="px-5 py-3 text-gray-600">{row.technology}</td>
                  <td className="px-5 py-3 text-gray-600">{row.testName}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{row.percentage}%</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      row.result === 'Passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {row.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-400">No results found.</div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3">
          <p className="text-sm text-gray-500">
            Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}&ndash;{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage <= 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`w-8 h-8 text-sm font-medium rounded-md transition-colors ${
                  p === safePage
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
