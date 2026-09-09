import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

const extractDurationDays = (syllabusName) => {
  const match = String(syllabusName || '').match(/(\d+)\s*day/i)
  return match ? parseInt(match[1], 10) : 0
}

export default function UploadNotes({ onNavigate }) {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [technology, setTechnology] = useState('')
  const [dayNumber, setDayNumber] = useState('')
  const [noteFile, setNoteFile] = useState(null)
  const [bookFile, setBookFile] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [testSubmissions, setTestSubmissions] = useState([])
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [eligibilityAlert, setEligibilityAlert] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  const submissionKeys = new Set(submissions.map((s) => s.technology + '-' + s.dayNumber))

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      let userObj = null
      try {
        const stored = localStorage.getItem('internUser')
        if (stored) userObj = JSON.parse(stored)
      } catch (e) {}
      const emailParam = userObj?.email ? `?email=${encodeURIComponent(userObj.email)}` : ''

      const [assignRes, subRes, testSubRes] = await Promise.all([
        api.get('/client/assigned-syllabuses'),
        api.get('/client/daily-notes'),
        api.get(`/test-submissions/my${emailParam}`).catch(() => ({ data: [] })),
      ])
      setAssignments(assignRes.data || [])
      setSubmissions(subRes.data || [])
      setTestSubmissions(testSubRes.data || [])
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to load assigned technologies.') })
    } finally {
      setLoading(false)
    }
  }

  const technologies = [...new Set((assignments || []).map((a) => a.technology))]

  const totalPages = Math.max(1, Math.ceil(submissions.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedSubmissions = submissions.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [submissions.length, totalPages, currentPage])

  const selectedAssignment = assignments.find((a) => a.technology === technology)
  const durationDays = selectedAssignment ? extractDurationDays(selectedAssignment.syllabusName) : 30
  const dayOptions = Array.from({ length: durationDays }, (_, i) => i + 1)

  const handleTechnologyChange = (tech) => {
    setTechnology(tech)
    setDayNumber('')
    setEligibilityAlert(null)
  }

  // Check sequential notes requirement: all days 1 .. day-1 must be submitted
  const getSequentialDayStatus = (tech, day) => {
    if (!tech || !day) return { isLocked: false }
    const dayNum = Number(day)
    if (dayNum <= 1) return { isLocked: false }

    const subDays = submissions.filter((s) => s.technology === tech).map((s) => s.dayNumber)
    for (let p = 1; p < dayNum; p++) {
      if (!subDays.includes(p)) {
        return {
          isLocked: true,
          missingDay: p,
          reason: `Please upload Day ${p} notes first. Daily notes must be uploaded in sequential order.`,
        }
      }
    }
    return { isLocked: false }
  }

  // Check if a day is locked because a previous test is pending attendance & submission
  const getDayLockStatus = (tech, day) => {
    if (!tech || !day) return { isLocked: false }
    const dayNum = Number(day)
    const prevTest = Math.floor((dayNum - 1) / 5)
    if (prevTest < 1) return { isLocked: false }

    const subDays = submissions.filter((s) => s.technology === tech).map((s) => s.dayNumber)

    for (let m = 1; m <= prevTest; m++) {
      const startDay = (m - 1) * 5 + 1
      const endDay = m * 5
      const mDays = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)
      const allNotesSubmitted = mDays.every((d) => subDays.includes(d))

      const hasTestSubmitted = testSubmissions.some(
        (ts) =>
          ts.technology === tech &&
          (ts.assessmentNumber === m ||
            (ts.testName && new RegExp(`(?:Test|Assessment)\\s*${m}`, 'i').test(ts.testName)))
      )

      if (!hasTestSubmitted) {
        return {
          isLocked: true,
          blockedByTest: m,
          allNotesSubmitted,
          reason: `Please attend and submit ${tech} Test ${m} in 'Attend Test' before uploading notes for Day ${dayNum}.`,
        }
      }
    }

    return { isLocked: false }
  }

  // Find if current technology has any active unlocked test blocking subsequent days
  const getActiveBlockingAssessment = (tech) => {
    if (!tech) return null
    const subDays = submissions.filter((s) => s.technology === tech).map((s) => s.dayNumber)
    const totalTests = Math.floor(durationDays / 5)

    for (let m = 1; m <= totalTests; m++) {
      const startDay = (m - 1) * 5 + 1
      const endDay = m * 5
      const mDays = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)
      const allNotesSubmitted = mDays.every((d) => subDays.includes(d))

      const hasTestSubmitted = testSubmissions.some(
        (ts) =>
          ts.technology === tech &&
          (ts.assessmentNumber === m ||
            (ts.testName && new RegExp(`(?:Test|Assessment)\\s*${m}`, 'i').test(ts.testName)))
      )

      if (allNotesSubmitted && !hasTestSubmitted) {
        return {
          testNumber: m,
          startDay,
          endDay,
          nextDay: endDay + 1,
        }
      }
    }
    return null
  }

  const activeBlockingAssessment = technology ? getActiveBlockingAssessment(technology) : null

  const checkEligibility = (tech, day, allSubs) => {
    const subDays = allSubs.filter((s) => s.technology === tech).map((s) => s.dayNumber)
    const dayNum = Number(day)
    const blockStart = Math.floor((dayNum - 1) / 5) * 5 + 1
    const blockEnd = Math.min(blockStart + 4, durationDays)
    const blockDays = Array.from({ length: blockEnd - blockStart + 1 }, (_, i) => blockStart + i)
    const allSubmitted = blockDays.every((d) => subDays.includes(d))
    const assessmentNumber = Math.ceil(dayNum / 5)
    return { allSubmitted, assessmentNumber, blockStart, blockEnd }
  }

  const handleOpenConfirm = (e) => {
    e.preventDefault()
    setAlert({ type: 'error', message: '' })
    setEligibilityAlert(null)

    if (!technology) return setAlert({ type: 'error', message: 'Please select a technology.' })
    if (!dayNumber) return setAlert({ type: 'error', message: 'Please select a day.' })

    const seqStatus = getSequentialDayStatus(technology, dayNumber)
    if (seqStatus.isLocked) {
      return setAlert({
        type: 'error',
        message: seqStatus.reason || `Please upload Day ${seqStatus.missingDay} notes first.`,
      })
    }

    const lockStatus = getDayLockStatus(technology, dayNumber)
    if (lockStatus.isLocked) {
      return setAlert({
        type: 'error',
        message: lockStatus.reason || `You must attend and submit Test ${lockStatus.blockedByTest} in 'Attend Test'`,
      })
    }

    if (!noteFile || !bookFile) {
      return setAlert({ type: 'error', message: 'Please upload both the Note (.docx) and Book (.xlsx) before submitting.' })
    }

    setShowConfirmModal(true)
  }

  const handleConfirmSubmission = async () => {
    setSubmitting(true)
    setAlert({ type: 'error', message: '' })
    setEligibilityAlert(null)

    try {
      const formData = new FormData()
      formData.append('technology', technology)
      formData.append('dayNumber', dayNumber)
      formData.append('note', noteFile)
      formData.append('book', bookFile)

      const res = await api.upload('/client/daily-notes', formData)
      setAlert({ type: 'success', message: res.message || 'Daily notes and book uploaded successfully.' })
      setNoteFile(null)
      setBookFile(null)
      const submittedDay = dayNumber
      setDayNumber('')
      setShowConfirmModal(false)

      const e1 = document.getElementById('note-input')
      const e2 = document.getElementById('book-input')
      if (e1) e1.value = ''
      if (e2) e2.value = ''

      const subRes = await api.get('/client/daily-notes')
      const newSubs = subRes.data || []
      setSubmissions(newSubs)

      const eligibility = checkEligibility(technology, submittedDay, newSubs)
      if (eligibility.allSubmitted) {
        setEligibilityAlert({
          type: 'success',
          message: `Congratulations! All 5 daily notes for Days ${eligibility.blockStart}–${eligibility.blockEnd} are submitted. Assessment ${eligibility.assessmentNumber} is now unlocked in 'Attend Test'.`,
        })
      }
    } catch (err) {
      setShowConfirmModal(false)
      setAlert({ type: 'error', message: getErrorMessage(err, 'Upload failed. Please try again.') })
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition'

  return (
    <div className="space-y-6">
      {/* Header with Title and Static Template Download Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Upload Notes</h2>
          <p className="text-sm text-gray-500 mt-1">Upload your daily note (.docx) and book (.xlsx) for each assigned day.</p>
        </div>

        {/* Static Template Download Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="/templates/note_template.docx"
            download="Note_Template.docx"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Note Template
          </a>
          <a
            href="/templates/book_template.xlsx"
            download="Book_Template.xlsx"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-sm"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Book Template
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: 'error', message: '' })}
        />

        {!activeBlockingAssessment && eligibilityAlert && (
          <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-3">
              <span className="text-xl">🎉</span>
              <div>
                <h4 className="text-sm font-bold text-green-900">
                  Assessment Unlocked!
                </h4>
                <p className="text-xs text-green-700 mt-0.5">
                  {eligibilityAlert.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('tests')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span>✍️</span>
                Go to Attend Test →
              </button>
              <button
                type="button"
                onClick={() => setEligibilityAlert(null)}
                className="text-green-700 hover:text-green-900 px-2 py-1 text-base font-bold cursor-pointer"
                title="Dismiss"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {activeBlockingAssessment && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  {technology} Test {activeBlockingAssessment.testNumber} is Unlocked!
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  You have uploaded all 5 daily notes for Days {activeBlockingAssessment.startDay}–{activeBlockingAssessment.endDay}. You must attend and submit <strong>Test {activeBlockingAssessment.testNumber}</strong> in 'Attend Test' before you can upload notes for Day {activeBlockingAssessment.nextDay} onwards.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('tests')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer flex-shrink-0"
            >
              <span>✍️</span>
              Go to Attend Test →
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-400 py-4">Loading assigned technologies...</p>
        ) : technologies.length === 0 ? (
          <AlertBanner
            type="error"
            message="No syllabuses assigned yet. Please contact your administrator."
            onClose={() => {}}
          />
        ) : (
          <form onSubmit={handleOpenConfirm} className="space-y-5 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Technology</label>
                <select
                  value={technology}
                  onChange={(e) => handleTechnologyChange(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select Technology</option>
                  {technologies.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {selectedAssignment && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Assigned syllabus: {selectedAssignment.syllabusName} ({durationDays} days)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Day</label>
                <select
                  value={dayNumber}
                  onChange={(e) => setDayNumber(e.target.value)}
                  disabled={!technology || dayOptions.length === 0}
                  className={inputClass + ' disabled:bg-gray-100 disabled:text-gray-400'}
                >
                  <option value="">{dayOptions.length === 0 ? (technology ? 'No days available' : 'Select technology first') : 'Select Day'}</option>
                  {dayOptions.map((day) => {
                    const isAlreadySubmitted = submissionKeys.has(technology + '-' + day)
                    const seqStatus = getSequentialDayStatus(technology, day)
                    const lockStatus = getDayLockStatus(technology, day)
                    const isLocked = isAlreadySubmitted || seqStatus.isLocked || lockStatus.isLocked

                    return (
                      <option
                        key={day}
                        value={day}
                        disabled={isLocked}
                      >
                        Day {day}
                        {isAlreadySubmitted
                          ? ' (Submitted)'
                          : seqStatus.isLocked
                          ? ` (Locked - Submit Day ${seqStatus.missingDay} first)`
                          : lockStatus.isLocked
                          ? ` (Locked - Attend Test ${lockStatus.blockedByTest} first)`
                          : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Note File (.docx)</label>
                <input
                  id="note-input"
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setNoteFile(e.target.files[0] || null)}
                  className="w-full text-sm text-gray-600 file:mr-4 file:px-4 file:py-2.5 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs file:font-bold hover:file:bg-blue-100 transition border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Book File (.xlsx)</label>
                <input
                  id="book-input"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setBookFile(e.target.files[0] || null)}
                  className="w-full text-sm text-gray-600 file:mr-4 file:px-4 file:py-2.5 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700 file:text-xs file:font-bold hover:file:bg-emerald-100 transition border border-gray-300 rounded-xl"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Save Submission'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp space-y-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                📤
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Notes Submission</h3>
                <p className="text-xs text-gray-500">
                  {technology} — Day {dayNumber}
                </p>
              </div>
            </div>

            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Technology:</span>
                <span className="font-bold text-gray-800">{technology}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Day:</span>
                <span className="font-bold text-orange-600">Day {dayNumber}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-orange-200/80">
                <span className="text-gray-500 font-medium">Note Document:</span>
                <span className="font-medium text-gray-800 truncate max-w-[200px]" title={noteFile?.name}>
                  {noteFile?.name}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Book Spreadsheet:</span>
                <span className="font-medium text-gray-800 truncate max-w-[200px]" title={bookFile?.name}>
                  {bookFile?.name}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to submit your notes and book for <strong>Day {dayNumber}</strong>? Once submitted, this will be saved and submitted for evaluation.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmission}
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-200 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Yes, Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-gray-800">Submission History ({submissions.length})</h3>
          {submissions.length > 0 && (
            <span className="text-xs text-gray-500 font-medium">
              Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, submissions.length)} of {submissions.length} notes (Page {currentPage} of {totalPages})
            </span>
          )}
        </div>
        {submissions.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">No submissions yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto min-w-0">
              <table className="w-full min-w-[550px] text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Technology</th>
                    <th className="text-left px-6 py-3">Day</th>
                    <th className="text-left px-6 py-3">Notes</th>
                    <th className="text-left px-6 py-3">Book</th>
                    <th className="text-left px-6 py-3">Feedback / Mark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedSubmissions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{sub.technology}</td>
                      <td className="px-6 py-4 text-gray-600 font-semibold">Day {sub.dayNumber}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">Uploaded Successfully</td>
                      <td className="px-6 py-4 text-green-600 font-medium">Uploaded Successfully</td>
                      <td className="px-6 py-4">
                        {sub.feedbackMark && sub.feedbackMark !== 'Pending' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            {sub.feedbackMark}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
                <span className="text-xs text-gray-500">
                  Showing <strong className="text-gray-700">{startIndex + 1}</strong> to{' '}
                  <strong className="text-gray-700">{Math.min(startIndex + ITEMS_PER_PAGE, submissions.length)}</strong> of{' '}
                  <strong className="text-gray-700">{submissions.length}</strong> submissions (up to 6 per page)
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
    </div>
  )
}