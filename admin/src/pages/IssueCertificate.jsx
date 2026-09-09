import { useState, useEffect, useRef } from 'react'
import { jsPDF } from 'jspdf'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function IssueCertificate({ onNavigate }) {
  const [interns, setInterns] = useState([])
  const [technologies, setTechnologies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [techFilter, setTechFilter] = useState('All')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  const [alert, setAlert] = useState({ type: 'success', message: '' })

  // Summary Modal State
  const [summaryModalOpen, setSummaryModalOpen] = useState(false)
  const [selectedInternSummary, setSelectedInternSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Issue Certificate Modal State
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [selectedInternForCert, setSelectedInternForCert] = useState(null)
  const [certForm, setCertForm] = useState({
    internName: '',
    technology: '',
    fromDate: '',
    toDate: '',
    issueDate: '',
  })
  const [savingCert, setSavingCert] = useState(false)
  const canvasRef = useRef(null)
  const [templateLoaded, setTemplateLoaded] = useState(false)
  const templateImgRef = useRef(null)

  useEffect(() => {
    fetchCompletedInterns()
    fetchTechnologies()

    // Preload certificate template image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/templates/certificate_template.jpg'
    img.onload = () => {
      templateImgRef.current = img
      setTemplateLoaded(true)
    }
    img.onerror = () => {
      console.warn('Could not load /templates/certificate_template.jpg directly. Will fallback gracefully.')
    }
  }, [])

  const fetchTechnologies = async () => {
    try {
      const res = await api.get('/technologies')
      setTechnologies(res.data || [])
    } catch (err) {
      console.error('Fetch technologies error:', err)
    }
  }

  const fetchCompletedInterns = async () => {
    setLoading(true)
    try {
      const res = await api.get('/certificates/completed-interns')
      setInterns(res.data || [])
    } catch (err) {
      console.error('Fetch completed interns error:', err)
      setAlert({ type: 'error', message: 'Failed to load completed interns list.' })
    } finally {
      setLoading(false)
    }
  }

  // Draw certificate onto canvas whenever form inputs or template change
  useEffect(() => {
    if (!issueModalOpen) return
    renderCertificateCanvas()
  }, [issueModalOpen, certForm, templateLoaded])

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return ''
    try {
      const [y, m, d] = dateStr.split('-')
      if (y && m && d) return `${d}/${m}/${y}`
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (e) {
      return dateStr
    }
  }

  const renderCertificateCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const templateImg = templateImgRef.current

    if (templateImg && templateImg.complete && templateImg.naturalWidth > 0) {
      // Set canvas dimensions to high-resolution template size (724 x 1024 or 2x for sharpness)
      const scale = 2
      const baseW = templateImg.naturalWidth || 724
      const baseH = templateImg.naturalHeight || 1024

      canvas.width = baseW * scale
      canvas.height = baseH * scale

      ctx.save()
      ctx.scale(scale, scale)

      // Draw blank template image
      ctx.drawImage(templateImg, 0, 0, baseW, baseH)

      const centerX = baseW / 2 // 362

      // 1. Intern Name (Centered above line 1)
      const nameText = certForm.internName.trim()
      if (nameText) {
        ctx.fillStyle = '#0a2540'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.font = 'bold 26px "Georgia", "Times New Roman", serif'

        // Adjust font size dynamically if name is long
        if (nameText.length > 25) {
          ctx.font = 'bold 21px "Georgia", "Times New Roman", serif'
        }
        if (nameText.length > 35) {
          ctx.font = 'bold 18px "Georgia", "Times New Roman", serif'
        }

        ctx.fillText(nameText, centerX, 365)
      }

      // 2. Technology / Domain Name (Centered above line 2)
      const techText = certForm.technology.trim()
      if (techText) {
        ctx.fillStyle = '#0f2b5c'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.font = 'bold 20px "Segoe UI", "Helvetica Neue", Arial, sans-serif'

        if (techText.length > 30) {
          ctx.font = 'bold 17px "Segoe UI", "Helvetica Neue", Arial, sans-serif'
        }
        ctx.fillText(techText, centerX, 447)
      }

      // 3. Duration: From Date & To Date
      // "at Reubro International from [From Date] to [To Date] ."
      const fromText = formatDateDisplay(certForm.fromDate)
      const toText = formatDateDisplay(certForm.toDate)

      ctx.fillStyle = '#1e293b'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.font = 'bold 14px "Segoe UI", "Helvetica Neue", Arial, sans-serif'

      if (fromText) {
        // Blank slot 1 for from date
        ctx.fillText(fromText, 360, 482)
      }

      if (toText) {
        // Blank slot 2 for to date
        ctx.fillText(toText, 565, 482)
      }

      // 4. Date of Issue (Centered above "DATE OF ISSUE" line at bottom-left)
      const issueText = formatDateDisplay(certForm.issueDate)
      if (issueText) {
        ctx.fillStyle = '#0f172a'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.font = 'bold 14px "Segoe UI", "Helvetica Neue", Arial, sans-serif'
        ctx.fillText(issueText, 142, 802)
      }

      ctx.restore()
    } else {
      // Fallback placeholder rendering while image loads
      canvas.width = 724
      canvas.height = 1024
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 724, 1024)
      ctx.fillStyle = '#0f2b5c'
      ctx.font = 'bold 24px serif'
      ctx.textAlign = 'center'
      ctx.fillText('Loading Certificate Template...', 362, 512)
    }
  }

  const handleOpenSummary = async (intern) => {
    setSummaryModalOpen(true)
    setSummaryLoading(true)
    setSelectedInternSummary(null)
    try {
      const res = await api.get(`/certificates/summary/${intern.internId || 'all'}?email=${encodeURIComponent(intern.email)}&technology=${encodeURIComponent(intern.technology)}`)
      setSelectedInternSummary(res.data || null)
    } catch (err) {
      console.error('Fetch intern summary error:', err)
      setAlert({ type: 'error', message: 'Failed to load intern progress summary.' })
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleOpenIssueModal = (intern) => {
    setSelectedInternForCert(intern)
    const today = new Date().toISOString().split('T')[0]
    const from = (intern.issuedFromDate && intern.issuedFromDate >= today) ? intern.issuedFromDate : today
    const to = (intern.issuedToDate && intern.issuedToDate >= from) ? intern.issuedToDate : today
    const issue = (intern.issueDate && intern.issueDate >= today) ? intern.issueDate : today

    setCertForm({
      internName: intern.internName || '',
      technology: intern.technology || '',
      fromDate: from,
      toDate: to,
      issueDate: issue,
    })
    setIssueModalOpen(true)
  }

  const handleSaveAndDownloadCertificate = async () => {
    if (!certForm.internName || !certForm.technology) return
    if (!certForm.fromDate || !certForm.toDate || !certForm.issueDate) {
      setAlert({ type: 'error', message: 'Please provide From Date, To Date, and Date of Issue.' })
      return
    }

    const today = new Date().toISOString().split('T')[0]
    if (certForm.fromDate < today) {
      setAlert({ type: 'error', message: 'From Date cannot be a previous date. Please select today or a future date.' })
      return
    }
    if (certForm.toDate < today) {
      setAlert({ type: 'error', message: 'To Date cannot be a previous date. Please select today or a future date.' })
      return
    }
    if (certForm.toDate < certForm.fromDate) {
      setAlert({ type: 'error', message: 'To Date cannot be earlier than From Date.' })
      return
    }
    if (certForm.issueDate < today) {
      setAlert({ type: 'error', message: 'Date of Issue cannot be a previous date. Please select today or a future date.' })
      return
    }

    setSavingCert(true)
    try {
      // 1. Save certificate record to backend DB
      const res = await api.post('/certificates/issue', {
        internId: selectedInternForCert?.internId || null,
        internName: certForm.internName,
        email: selectedInternForCert?.email || '',
        technology: certForm.technology,
        fromDate: certForm.fromDate,
        toDate: certForm.toDate,
        issueDate: certForm.issueDate,
        meta: {
          durationDays: selectedInternForCert?.durationDays || 30,
          syllabusName: selectedInternForCert?.syllabusName || '',
          finalScore: selectedInternForCert?.finalScore || 0,
        },
      })

      // 2. Export and download certificate as PDF
      const canvas = canvasRef.current
      if (canvas) {
        const imgData = canvas.toDataURL('image/jpeg', 0.98)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        })
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
        const safeName = certForm.internName.replace(/[^a-zA-Z0-9_-]/g, '_')
        const safeTech = certForm.technology.replace(/[^a-zA-Z0-9_-]/g, '_')
        pdf.save(`Certificate_${safeName}_${safeTech}.pdf`)
      }

      setAlert({
        type: 'success',
        message: `Certificate for ${certForm.internName} saved and downloaded as PDF successfully!`,
      })
      setIssueModalOpen(false)
      fetchCompletedInterns()
    } catch (err) {
      console.error('Save certificate error:', err)
      setAlert({ type: 'error', message: err.message || 'Failed to issue and save certificate.' })
    } finally {
      setSavingCert(false)
    }
  }

  // Filtered interns
  const filteredInterns = interns.filter((item) => {
    if (techFilter !== 'All' && item.technology.toLowerCase() !== techFilter.toLowerCase()) {
      return false
    }
    if (search) {
      const q = search.toLowerCase()
      const matchName = item.internName?.toLowerCase().includes(q)
      const matchEmail = item.email?.toLowerCase().includes(q)
      const matchTech = item.technology?.toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchTech) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredInterns.length / ITEMS_PER_PAGE))
  const paginatedInterns = filteredInterns.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const totalCompletedCount = interns.length
  const issuedCount = interns.filter((i) => i.isIssued).length
  const pendingCount = totalCompletedCount - issuedCount
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-base font-bold shadow-xs">
              📜
            </span>
            Issue Certificate
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            View course-completed interns who have attended their final assessment, inspect their progress summary, and issue official certificates.
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      <AlertBanner
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: 'success', message: '' })}
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            🎓
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Completed Interns</p>
            <p className="text-2xl font-bold text-gray-800">{totalCompletedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-xl">
            ✅
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Certificates Issued</p>
            <p className="text-2xl font-bold text-gray-800">{issuedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
            ⏳
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pending Issuance</p>
            <p className="text-2xl font-bold text-gray-800">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by intern name, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-400 outline-none transition"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={techFilter}
              onChange={(e) => {
                setTechFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="All">All Technologies</option>
              {technologies.map((t) => (
                <option key={t._id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchCompletedInterns}
          className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Completed Interns Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Course-Completed Interns</h3>
            <p className="text-xs text-gray-400">Interns who have submitted their final assessment for the course track</p>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-700">{filteredInterns.length}</strong> eligible intern(s)
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm space-y-2">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Loading course-completed interns...</p>
          </div>
        ) : filteredInterns.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm space-y-2">
            <p className="text-2xl">🎓</p>
            <p className="font-medium text-gray-600">No completed interns found.</p>
            <p className="text-xs text-gray-400">Interns who submit their final assessment will automatically appear in this table.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto min-w-0">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-600">
                    <th className="text-left px-5 py-3 w-14">SL No</th>
                    <th className="text-left px-5 py-3">Intern Name</th>
                    <th className="text-left px-5 py-3">Technology / Course</th>
                    <th className="text-left px-5 py-3">Duration</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedInterns.map((intern, idx) => {
                    const serialNo = (page - 1) * ITEMS_PER_PAGE + idx + 1
                    return (
                      <tr key={`${intern.email}_${intern.technology}`} className="hover:bg-orange-50/40 transition-colors">
                        <td className="px-5 py-3.5 text-gray-500 font-semibold">{serialNo}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-gray-800">{intern.internName}</div>
                          <div className="text-xs text-gray-400">{intern.email}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100/60">
                            {intern.technology}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">
                          {intern.durationDays} Days ({intern.syllabusName || 'Track'})
                        </td>
                        <td className="px-5 py-3.5">
                          {intern.isIssued ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              Issued
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Pending Issue
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {/* 1. View Summary Button */}
                            <button
                              onClick={() => handleOpenSummary(intern)}
                              className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/60 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                              title="View current status, marks and pending tasks"
                            >
                              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Summary
                            </button>

                            {/* 2. Issue Certificate Button */}
                            <button
                              onClick={() => handleOpenIssueModal(intern)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                              title="Configure and generate certificate"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {intern.isIssued ? 'Re-issue / Download' : 'Issue Certificate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/60">
                <span className="text-xs text-gray-500">
                  Showing <strong>{(page - 1) * ITEMS_PER_PAGE + 1}</strong> to{' '}
                  <strong>{Math.min(page * ITEMS_PER_PAGE, filteredInterns.length)}</strong> of{' '}
                  <strong>{filteredInterns.length}</strong> interns
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 text-xs font-bold rounded-lg transition ${
                        page === pageNum
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. VIEW SUMMARY MODAL                                      */}
      {/* ========================================================= */}
      {summaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-[#0f1a2e] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-bold text-lg">
                  📊
                </div>
                <div>
                  <h3 className="font-bold text-lg">Intern Progress Summary</h3>
                  <p className="text-xs text-blue-200">
                    Comprehensive performance evaluation, test marks, and pending status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {summaryLoading ? (
                <div className="py-16 text-center text-gray-400 space-y-2">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm">Fetching intern performance breakdown...</p>
                </div>
              ) : selectedInternSummary ? (
                <>
                  {/* Intern Profile Card */}
                  <div className="bg-gradient-to-r from-orange-50 to-blue-50 border border-orange-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">
                        {selectedInternSummary.intern?.name}
                      </h4>
                      <p className="text-xs text-gray-500">{selectedInternSummary.intern?.email}</p>
                      {selectedInternSummary.intern?.college && (
                        <p className="text-xs text-gray-500">🎓 {selectedInternSummary.intern?.college}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-1">
                      <span className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-orange-700 shadow-2xs border border-orange-200">
                        {selectedInternSummary.course?.technology}
                      </span>
                      <span className="text-xs text-gray-500">
                        Track: <strong>{selectedInternSummary.course?.syllabusName}</strong> ({selectedInternSummary.course?.durationDays} Days)
                      </span>
                    </div>
                  </div>

                  {/* Summary Status Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 font-medium">Tests Attended</p>
                      <p className="text-xl font-bold text-gray-800">
                        {selectedInternSummary.tests?.totalAttended} / {selectedInternSummary.tests?.totalAssigned}
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 font-medium">Avg Test Score</p>
                      <p className="text-xl font-bold text-blue-600">
                        {selectedInternSummary.tests?.avgPercentage && selectedInternSummary.tests?.avgPercentage !== '—'
                          ? `${selectedInternSummary.tests?.avgPercentage}%`
                          : '—'}
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 font-medium">Daily Notes</p>
                      <p className="text-xl font-bold text-green-600">
                        {selectedInternSummary.dailyNotes?.totalSubmitted} Days
                      </p>
                      <span className="text-[10px] text-gray-400">Avg Rating: {selectedInternSummary.dailyNotes?.averageScore}/10</span>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 font-medium">Pending Tasks</p>
                      <p className={`text-xl font-bold ${selectedInternSummary.tasks?.pendingCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {selectedInternSummary.tasks?.pendingCount}
                      </p>
                    </div>
                  </div>

                  {/* Section 1: Tests and Marks Breakdown */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                      <span>📝</span> Test Scores & Marks Breakdown
                    </h5>
                    {selectedInternSummary.tests?.list?.length === 0 ? (
                      <div className="p-4 bg-gray-50 rounded-lg text-xs text-gray-400 text-center">
                        No test submissions recorded yet.
                      </div>
                    ) : (
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                            <tr>
                              <th className="text-left px-3.5 py-2.5">Assessment</th>
                              <th className="text-left px-3.5 py-2.5">Objective (10M)</th>
                              <th className="text-left px-3.5 py-2.5">Descriptive (25M)</th>
                              <th className="text-left px-3.5 py-2.5">Total (35M)</th>
                              <th className="text-left px-3.5 py-2.5">Percentage</th>
                              <th className="text-left px-3.5 py-2.5">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {selectedInternSummary.tests?.list?.map((t, idx) => {
                              const isEvaluated = t.resultStatus?.toLowerCase() === 'passed' || t.resultStatus?.toLowerCase() === 'failed'

                              return (
                                <tr key={t._id || idx} className="hover:bg-gray-50/60">
                                  <td className="px-3.5 py-2 font-medium text-gray-800">
                                    {t.testName || `Assessment ${t.assessmentNumber}`}
                                  </td>
                                  <td className="px-3.5 py-2 text-gray-600">
                                    {isEvaluated && t.objectiveScore !== null && t.objectiveScore !== undefined
                                      ? `${t.objectiveScore} marks`
                                      : '—'}
                                  </td>
                                  <td className="px-3.5 py-2 text-gray-600">
                                    {isEvaluated && t.descriptiveScore !== null && t.descriptiveScore !== undefined
                                      ? `${t.descriptiveScore} marks`
                                      : '—'}
                                  </td>
                                  <td className="px-3.5 py-2 font-bold text-gray-900">
                                    {isEvaluated && t.totalScore !== null && t.totalScore !== undefined
                                      ? `${t.totalScore} / 35`
                                      : '—'}
                                  </td>
                                  <td className="px-3.5 py-2 text-blue-700 font-semibold">
                                    {isEvaluated && t.percentage !== null && t.percentage !== undefined
                                      ? `${t.percentage}%`
                                      : '—'}
                                  </td>
                                  <td className="px-3.5 py-2">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      t.resultStatus?.toLowerCase() === 'passed'
                                        ? 'bg-green-100 text-green-700'
                                        : t.resultStatus?.toLowerCase() === 'failed'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {t.resultStatus?.toLowerCase() === 'passed'
                                        ? 'Passed'
                                        : t.resultStatus?.toLowerCase() === 'failed'
                                        ? 'Failed'
                                        : 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Section 2: Pending Checks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pending Assessments */}
                    <div className="border border-gray-100 rounded-xl p-3.5 space-y-2 bg-gray-50/50">
                      <h6 className="font-bold text-gray-700 text-xs flex items-center justify-between">
                        <span>🎯 Pending Assessments</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedInternSummary.tests?.pending?.length === 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {selectedInternSummary.tests?.pending?.length === 0 ? 'All Completed' : `${selectedInternSummary.tests?.pending?.length} Pending`}
                        </span>
                      </h6>
                      {selectedInternSummary.tests?.pending?.length === 0 ? (
                        <p className="text-xs text-green-700">✓ All scheduled tests have been attended.</p>
                      ) : (
                        <ul className="text-xs text-gray-600 space-y-1">
                          {selectedInternSummary.tests?.pending?.map((p, i) => (
                            <li key={p._id || i} className="flex items-center gap-1.5 text-amber-800">
                              <span>•</span> {p.name || `Assessment ${p.assessmentNumber}`}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Pending Tasks */}
                    <div className="border border-gray-100 rounded-xl p-3.5 space-y-2 bg-gray-50/50">
                      <h6 className="font-bold text-gray-700 text-xs flex items-center justify-between">
                        <span>📂 Practical Tasks Status</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedInternSummary.tasks?.pendingCount === 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {selectedInternSummary.tasks?.completed} / {selectedInternSummary.tasks?.totalAssigned} Completed
                        </span>
                      </h6>
                      {selectedInternSummary.tasks?.list?.length === 0 ? (
                        <p className="text-xs text-gray-400">No project tasks assigned for this track.</p>
                      ) : (
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {selectedInternSummary.tasks?.list?.map((task, i) => (
                            <div key={task._id || i} className="flex items-center justify-between text-xs py-0.5 border-b border-gray-100 last:border-0">
                              <span className="truncate max-w-[160px] text-gray-700">{task.title}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                task.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Existing Certificate Information if already issued */}
                  {selectedInternSummary.certificate && (
                    <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-green-800 flex items-center gap-1.5">
                        <span>🏆</span> Certificate Already Issued
                      </div>
                      <div className="text-green-700 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div>Cert No: <strong>{selectedInternSummary.certificate.certificateNumber}</strong></div>
                        <div>Duration: <strong>{selectedInternSummary.certificate.fromDate} to {selectedInternSummary.certificate.toDate}</strong></div>
                        <div>Date of Issue: <strong>{selectedInternSummary.certificate.issueDate}</strong></div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-10 text-center text-gray-400 text-sm">
                  Failed to load intern details.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSummaryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                Close
              </button>

              {selectedInternSummary && (
                <button
                  type="button"
                  onClick={() => {
                    const intern = interns.find((i) => i.email === selectedInternSummary.intern?.email)
                    setSummaryModalOpen(false)
                    if (intern) handleOpenIssueModal(intern)
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  Proceed to Issue Certificate →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ISSUE CERTIFICATE MODAL WITH DYNAMIC FIELDS & PREVIEW   */}
      {/* ========================================================= */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6 overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#0f1a2e] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-bold text-lg">
                  📜
                </div>
                <div>
                  <h3 className="font-bold text-lg">Issue Internship Certificate</h3>
                  <p className="text-xs text-blue-200">
                    Fill the certificate details and download the official signed certificate
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIssueModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
              {/* Left Side: Form Inputs */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-3 bg-orange-50/60 border border-orange-100 rounded-xl text-xs text-orange-900 leading-relaxed">
                  <strong>ℹ️ Auto-Fill Notice:</strong> The Intern Name and Technology are fixed based on course completion records. You can select the Duration Dates and Date of Issue via the calendar selectors below.
                </div>

                {/* 1. Intern Name (Static / Read-only) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Name of Intern <span className="text-gray-400 font-normal"></span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={certForm.internName}
                    className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-800 font-semibold cursor-not-allowed outline-none"
                    placeholder="Intern Name"
                  />
                </div>

                {/* 2. Name of Technology (Static / Read-only) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Name of Technology <span className="text-gray-400 font-normal"></span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={certForm.technology}
                    className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-800 font-semibold cursor-not-allowed outline-none"
                    placeholder="Technology Name"
                  />
                </div>

                {/* 3. Duration: From Date & To Date (Dynamic Calendar) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      From Date * <span className="text-orange-500 font-normal">(Today/Future)</span>
                    </label>
                    <input
                      type="date"
                      value={certForm.fromDate}
                      min={today}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val && val < today) {
                          setAlert({ type: 'error', message: 'Previous dates cannot be selected for From Date.' })
                          return
                        }
                        setCertForm((prev) => ({
                          ...prev,
                          fromDate: val,
                          toDate: prev.toDate && prev.toDate < val ? val : prev.toDate,
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      To Date * <span className="text-orange-500 font-normal">(Today/Future)</span>
                    </label>
                    <input
                      type="date"
                      value={certForm.toDate}
                      min={certForm.fromDate && certForm.fromDate > today ? certForm.fromDate : today}
                      onChange={(e) => {
                        const val = e.target.value
                        const minAllowed = certForm.fromDate || today
                        if (val && val < minAllowed) {
                          setAlert({
                            type: 'error',
                            message: val < today ? 'Previous dates cannot be selected for To Date.' : 'To Date cannot be earlier than From Date.',
                          })
                          return
                        }
                        setCertForm((prev) => ({ ...prev, toDate: val }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                    />
                  </div>
                </div>

                {/* 4. Date of Issue (Dynamic Calendar) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Date of Issue * <span className="text-orange-500 font-normal">(Today/Future)</span>
                  </label>
                  <input
                    type="date"
                    value={certForm.issueDate}
                    min={today}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val && val < today) {
                        setAlert({ type: 'error', message: 'Previous dates cannot be selected for Date of Issue.' })
                        return
                      }
                      setCertForm((prev) => ({ ...prev, issueDate: val }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                  />
                </div>

                {/* Form Quick Info Box */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 space-y-1">
                  <div className="font-semibold text-gray-700">Previewed Placements:</div>
                  <div>• <strong>Intern Name:</strong> {certForm.internName || '—'}</div>
                  <div>• <strong>Technology:</strong> {certForm.technology || '—'}</div>
                  <div>• <strong>Duration:</strong> {formatDateDisplay(certForm.fromDate)} to {formatDateDisplay(certForm.toDate)}</div>
                  <div>• <strong>Issue Date:</strong> {formatDateDisplay(certForm.issueDate)}</div>
                </div>
              </div>

              {/* Right Side: Live Certificate Preview Canvas */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center bg-gray-100/70 border border-gray-200 rounded-xl p-3">
                <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-gray-200 text-xs font-semibold text-gray-700">
                  <span className="flex items-center gap-1">
                    <span>👁️</span> Live Certificate Preview
                  </span>
                  <span className="text-[11px] text-gray-400">Auto-filled Template</span>
                </div>

                <div className="w-full flex justify-center overflow-hidden rounded-lg shadow-sm border border-gray-300 bg-white">
                  <canvas
                    ref={canvasRef}
                    className="w-full max-w-[340px] h-auto object-contain transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  The downloaded certificate will be rendered in ultra high-resolution matching this preview.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => setIssueModalOpen(false)}
                disabled={savingCert}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAndDownloadCertificate}
                disabled={savingCert}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {savingCert ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving & Generating...
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    Save and Download Certificate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
