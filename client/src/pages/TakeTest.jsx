import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function TakeTest() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialTest = location.state?.test

  const [test, setTest] = useState(initialTest || null)
  const [loadingTest, setLoadingTest] = useState(!initialTest?.questions?.length)
  const [answers, setAnswers] = useState({})
  const [profile, setProfile] = useState(null)
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25-minute countdown timer

  // Confirmation Modals
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  useEffect(() => {
    if (!initialTest) {
      navigate('/portal')
      return
    }

    const loadTestDetails = async () => {
      try {
        const [profileRes, testRes] = await Promise.all([
          api.get('/intern/dashboard').catch(() => ({ data: null })),
          initialTest.testId
            ? api.get(`/client/tests/${initialTest.testId}`).catch(() => null)
            : null,
        ])
        setProfile(profileRes.data || null)
        if (testRes?.data) {
          setTest((prev) => ({
            ...prev,
            ...testRes.data,
            questions: testRes.data.questions || prev?.questions || [],
          }))
        }
      } catch (err) {
        console.error('Failed to load test details:', err)
      } finally {
        setLoadingTest(false)
      }
    }

    loadTestDetails()

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [initialTest, navigate])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleAutoSubmit = () => {
    doSubmit(true)
  }

  const handleClickSubmit = (e) => {
    if (e) e.preventDefault()
    setAlert({ type: 'error', message: '' })

    const questions = test?.questions || []
    const answeredCount = questions.filter((q) => (answers[q._id] || '').trim()).length

    if (answeredCount < questions.length) {
      setAlert({
        type: 'error',
        message: `You have answered ${answeredCount} of ${questions.length} questions. Please answer all questions before submitting.`,
      })
      return
    }

    setShowSubmitModal(true)
  }

  const doSubmit = async (isAuto = false) => {
    if (!test) return
    setShowSubmitModal(false)
    setSubmitting(true)
    setAlert({ type: 'error', message: '' })

    const questions = test.questions || []
    try {
      const payloadAnswers = questions.map((q) => ({
        questionId: q._id,
        questionText: q.questionText,
        answerText: (answers[q._id] || '').trim(),
        internAnswer: (answers[q._id] || '').trim(),
        isObjective: q.type === 'Objective',
      }))

      let userObj = null
      try {
        const stored = localStorage.getItem('internUser')
        if (stored) userObj = JSON.parse(stored)
      } catch (e) {}

      const userEmail = profile?.email || userObj?.email || test.email || ''
      const userName = profile?.name || userObj?.name || test.internName || 'Intern'
      const technology = test.technology || userObj?.technology || 'General'
      const testName = test.testName || test.name || `${technology} Assessment ${test.assessmentNumber || 1}`
      const assessmentNumber = Number(test.assessmentNumber || 1)

      const payload = {
        testId: test.testId || test._id,
        internName: userName,
        email: userEmail,
        technology: technology,
        testName: testName,
        assessmentNumber: assessmentNumber,
        answers: payloadAnswers,
      }

      const res = await api.post('/client/submit-test', payload)

      setAlert({
        type: 'success',
        message: isAuto
          ? 'Time expired (25:00). Your assessment has been automatically submitted.'
          : (res.message || 'Assessment submitted successfully! Answers sent to admin for evaluation.'),
      })

      setTimeout(() => navigate('/portal'), 2500)
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Submission failed. Please try again.') })
      setSubmitting(false)
    }
  }

  if (loadingTest || !test) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-gray-500">Initializing test environment...</p>
        </div>
      </div>
    )
  }

  const questions = test.questions || []
  const objectiveQuestions = questions.filter((q) => q.type === 'Objective')
  const descriptiveQuestions = questions.filter((q) => q.type === 'Descriptive')
  const answeredCount = questions.filter((q) => (answers[q._id] || '').trim()).length

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-5">
      {/* Sticky Header with Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-2 sm:top-4 z-40">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
            {test.technology} · Assessment {test.assessmentNumber}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">{test.testName || test.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Total 10 Questions (5 Objective + 5 Descriptive) · Max Score: 35 Marks
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Time Remaining</span>
            <span className="text-xs text-gray-600 font-medium">25:00 Total</span>
          </div>
          <div
            className={`px-4 py-2 rounded-xl text-lg font-mono font-bold tracking-widest transition-all ${
              timeLeft < 300
                ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-200'
                : 'bg-gray-900 text-orange-400 shadow-sm'
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'error', message: '' })} />

      <form onSubmit={handleClickSubmit} className="space-y-6">
        {/* Section 1: Objective Questions */}
        {objectiveQuestions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700">
                  Section 1
                </span>
                <h3 className="text-sm font-bold text-gray-800">
                  Objective Questions (5 Questions · 2 Marks each)
                </h3>
              </div>
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md">
                10 Marks
              </span>
            </div>

            <div className="space-y-5">
              {objectiveQuestions.map((q, i) => (
                <div key={q._id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm font-bold text-gray-800">
                      <span className="text-orange-600 mr-1.5">{i + 1}.</span> {q.questionText}
                    </p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 flex-shrink-0">
                      2 Marks
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {q.options?.map((opt, oi) => {
                      const isSelected = answers[q._id] === opt
                      return (
                        <label
                          key={oi}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/80 text-orange-950 font-bold shadow-xs'
                              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={q._id}
                            checked={isSelected}
                            onChange={() => handleAnswer(q._id, opt)}
                            className="accent-orange-500 h-4 w-4"
                          />
                          <span className="text-xs">{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Descriptive Questions */}
        {descriptiveQuestions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-100 text-cyan-700">
                  Section 2
                </span>
                <h3 className="text-sm font-bold text-gray-800">
                  Descriptive Questions (5 Questions · 5 Marks each)
                </h3>
              </div>
              <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-md">
                25 Marks
              </span>
            </div>

            <div className="space-y-5">
              {descriptiveQuestions.map((q, i) => (
                <div key={q._id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-gray-800">
                      <span className="text-orange-600 mr-1.5">{objectiveQuestions.length + i + 1}.</span> {q.questionText}
                    </p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-700 flex-shrink-0">
                      5 Marks
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={answers[q._id] || ''}
                    onChange={(e) => handleAnswer(q._id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none bg-white font-mono"
                    placeholder="Type your complete technical answer / code solution here..."
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Answered:</span>
            <span className={`font-bold px-2 py-0.5 rounded-full ${
              answeredCount === questions.length ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {answeredCount} of {questions.length} Questions
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-md shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        </div>
      </form>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cancel & Exit Assessment?</h3>
                <p className="text-xs text-gray-500">Your test progress will not be saved</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to cancel and exit? Any answers you have entered so far will be lost and you will return to the portal.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Resume Test
              </button>
              <button
                type="button"
                onClick={() => navigate('/portal')}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
              >
                Yes, Exit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Assessment Submission</h3>
                <p className="text-xs text-gray-500">{test.technology} — Assessment {test.assessmentNumber}</p>
              </div>
            </div>

            <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl text-xs space-y-1 text-gray-700">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-bold text-gray-900">{answeredCount} of {questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Remaining:</span>
                <span className="font-mono font-bold text-orange-600">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to submit? Once submitted, your answers will be finalized and sent to the admin for manual review and grading.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Back to Test
              </button>
              <button
                type="button"
                onClick={() => doSubmit(false)}
                disabled={submitting}
                className="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}