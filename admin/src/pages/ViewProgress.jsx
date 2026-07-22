import { useState, useMemo } from 'react'

const PASS_THRESHOLD = 60

const mockResults = [
  { name: 'Amal', tech: 'MERN Stack', test: 'MERN Stack Assessment 1', score: 28 },
  { name: 'Sarah', tech: 'MERN Stack', test: 'MERN Stack Assessment 1', score: 31 },
  { name: 'Esha', tech: 'MERN Stack', test: 'MERN Stack Assessment 1', score: 15 },
  { name: 'Rahul Sharma', tech: 'MERN Stack', test: 'MERN Stack Assessment 1', score: 22 },
  { name: 'Biju', tech: 'Python', test: 'Python Basics Test', score: 19 },
  { name: 'Priya Patel', tech: 'Python', test: 'Python Basics Test', score: 33 },
  { name: 'Neha Joshi', tech: 'Python', test: 'Python Basics Test', score: 24 },
  { name: 'Celina', tech: 'Flutter', test: 'Flutter Quiz 1', score: 26 },
  { name: 'Kavita Nair', tech: 'Flutter', test: 'Flutter Quiz 1', score: 14 },
  { name: 'Amit Kumar', tech: 'Flutter', test: 'Flutter Quiz 1', score: 20 },
  { name: 'Deepak', tech: 'Java', test: 'Java Core Test', score: 29 },
  { name: 'Sneha Reddy', tech: 'Java', test: 'Java Core Test', score: 35 },
  { name: 'Arun Verma', tech: 'Java', test: 'Java Core Test', score: 17 },
  { name: 'Vikram Singh', tech: 'MERN Stack', test: 'MERN Stack Assessment 1', score: 11 },
  { name: 'Amal', tech: 'MERN Stack', test: 'Advanced React Test', score: 24 },
  { name: 'Sarah', tech: 'MERN Stack', test: 'Advanced React Test', score: 27 },
  { name: 'Biju', tech: 'Python', test: 'Django Basics Test', score: 21 },
  { name: 'Celina', tech: 'Flutter', test: 'Flutter Widgets Test', score: 18 },
]

const allTechs = [...new Set(mockResults.map((r) => r.tech))].sort()
const allNames = [...new Set(mockResults.map((r) => r.name))].sort()

const ITEMS_PER_PAGE = 5

export default function ViewProgress() {
  const [internFilter, setInternFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('All')
  const [page, setPage] = useState(1)

  const enriched = useMemo(
    () =>
      mockResults.map((r) => {
        const pct = ((r.score / 35) * 100).toFixed(1)
        const passed = r.score >= 21
        return { ...r, percentage: pct, result: passed ? 'Passed' : 'Failed' }
      }),
    []
  )

  const filtered = useMemo(() => {
    let data = enriched
    if (internFilter) data = data.filter((r) => r.name === internFilter)
    if (techFilter) data = data.filter((r) => r.tech === techFilter)
    if (resultFilter !== 'All') data = data.filter((r) => r.result === resultFilter)
    return data
  }, [enriched, internFilter, techFilter, resultFilter])

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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
                <tr key={i} className="hover:bg-orange-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{row.name}</td>
                  <td className="px-5 py-3 text-gray-600">{row.tech}</td>
                  <td className="px-5 py-3 text-gray-600">{row.test}</td>
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
