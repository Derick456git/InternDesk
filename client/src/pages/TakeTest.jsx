import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function TakeTest() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialTest = location.state?.test

  const [test, setTest] = useState(initialTest || null)
  const [loadingTest, setLoadingTest] = useState(!initialTest?.questions?.length)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [profile, setProfile] = useState(null)
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20) // Initial question countdown

  // Confirmation Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const currentIndexRef = useRef(currentIndex)
  currentIndexRef.current = currentIndex

  const answersRef = useRef(answers)
  answersRef.current = answers

  const testRef = useRef(test)
  testRef.current = test

  const submittingRef = useRef(submitting)
  submittingRef.current = submitting

  // Prevent accidental reload or leaving the test page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!submitting) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [submitting])

  // Prevent browser back button navigation while test is ongoing
  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href)
    const handlePopState = () => {
      if (!submitting) {
        window.history.pushState(null, document.title, window.location.href)
        setAlert({
          type: 'error',
          message: 'Navigation is locked during the assessment. You cannot exit until all 10 questions are submitted.',
        })
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [submitting])

  // Load test details & profile
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
        setProfile(profileRes?.data || null)
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
  }, [initialTest, navigate])

  const doSubmit = useCallback(async (isAuto = false) => {
    if (submittingRef.current) return
    const currentTest = testRef.current
    if (!currentTest) return

    setSubmitting(true)
    setShowSubmitModal(false)
    setAlert({ type: 'error', message: '' })

    const questions = currentTest.questions || []
    const currentAnswers = answersRef.current

    try {
      const payloadAnswers = questions.map((q) => ({
        questionId: q._id,
        questionText: q.questionText,
        answerText: (currentAnswers[q._id] || '').trim(),
        internAnswer: (currentAnswers[q._id] || '').trim(),
        isObjective: q.type === 'Objective',
      }))

      let userObj = null
      try {
        const stored = localStorage.getItem('internUser')
        if (stored) userObj = JSON.parse(stored)
      } catch (e) {}

      const userEmail = profile?.email || userObj?.email || currentTest.email || ''
      const userName = profile?.name || userObj?.name || currentTest.internName || 'Intern'
      const technology = currentTest.technology || userObj?.technology || 'General'
      const testName = currentTest.testName || currentTest.name || `${technology} Assessment ${currentTest.assessmentNumber || 1}`
      const assessmentNumber = Number(currentTest.assessmentNumber || 1)

      const payload = {
        testId: currentTest.testId || currentTest._id,
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
          ? 'Time expired for the final question. Your assessment has been automatically submitted.'
          : (res?.message || 'Assessment submitted successfully! Answers sent to admin for evaluation.'),
      })

      setTimeout(() => navigate('/portal'), 2500)
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Submission failed. Please try again.') })
      setSubmitting(false)
    }
  }, [profile, navigate])

  // Per-question countdown timer with exact timestamp calculation
  useEffect(() => {
    const questions = test?.questions || []
    if (!questions.length || loadingTest || submitting) return

    const currentQ = questions[currentIndex]
    if (!currentQ) return

    // 20s for Objective, 60s for Descriptive
    const questionDuration = currentQ.type === 'Objective' ? 20 : 60
    setTimeLeft(questionDuration)

    const targetEndTime = Date.now() + questionDuration * 1000

    const timer = setInterval(() => {
      const remainingMs = targetEndTime - Date.now()
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000))
      setTimeLeft(remainingSecs)

      if (remainingSecs <= 0) {
        clearInterval(timer)
        const totalQ = questions.length
        if (currentIndex < totalQ - 1) {
          setCurrentIndex((prev) => prev + 1)
        } else {
          doSubmit(true)
        }
      }
    }, 250)

    return () => clearInterval(timer)
  }, [currentIndex, test?.questions, loadingTest, submitting, doSubmit])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    const totalQ = test?.questions?.length || 0
    if (currentIndex < totalQ - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setShowSubmitModal(true)
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
  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const isObjective = currentQuestion?.type === 'Objective'
  const maxTimeForCurrent = isObjective ? 20 : 60
  const isWarningTime = isObjective ? timeLeft <= 5 : timeLeft <= 10
  const answeredCount = questions.filter((q) => (answers[q._id] || '').trim()).length

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-5">
      {/* Sticky Header with Test Details & Per-Question Timer */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-2 sm:top-4 z-40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full inline-block">
                {test.technology} · Assessment {test.assessmentNumber}
              </span>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">{test.testName || test.name}</h2>
          </div>

          {/* Per-Question Live Timer */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Question Timer</span>
              <span className="text-xs text-gray-600 font-semibold">
                {isObjective ? '20s MCQ Limit' : '1m Descriptive'}
              </span>
            </div>
            <div
              className={`px-4 py-2 rounded-xl text-lg font-mono font-bold tracking-widest transition-all ${
                isWarningTime
                  ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-200'
                  : 'bg-gray-900 text-orange-400 shadow-sm'
              }`}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Progress Step Indicator (1 to 10) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
            <span>Progress: {currentIndex + 1} / {questions.length}</span>
            <span>{answeredCount} Answered</span>
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {questions.map((q, idx) => {
              const isDone = idx < currentIndex
              const isCurrent = idx === currentIndex
              const hasAnswer = (answers[q._id] || '').trim().length > 0

              let bgClass = 'bg-gray-200 text-gray-400'
              if (isCurrent) {
                bgClass = 'bg-orange-500 text-white ring-2 ring-orange-300 font-bold scale-105'
              } else if (isDone) {
                bgClass = hasAnswer ? 'bg-green-500 text-white font-semibold' : 'bg-gray-300 text-gray-600 font-medium'
              }

              return (
                <div
                  key={q._id || idx}
                  className={`h-7 rounded-lg flex items-center justify-center text-[11px] transition-all ${bgClass}`}
                  title={`Question ${idx + 1}: ${q.type || 'Question'}`}
                >
                  {idx + 1}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'error', message: '' })} />

      {/* Active Question Card (Only 1 question at a time) */}
      {currentQuestion && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-7 space-y-6">
          {/* Question Meta Badge */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  isObjective ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'
                }`}
              >
                {isObjective ? 'Section 1 · Objective' : 'Section 2 · Descriptive'}
              </span>
              <span className="text-xs font-semibold text-gray-500">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-md ${
                isObjective ? 'bg-purple-50 text-purple-700' : 'bg-cyan-50 text-cyan-700'
              }`}
            >
              {isObjective ? '2 Marks' : '5 Marks'}
            </span>
          </div>

          {/* Question Text */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">Question {currentIndex + 1}</span>
            <p className="text-base sm:text-lg font-bold text-gray-800 leading-relaxed">
              {currentQuestion.questionText}
            </p>
          </div>

          {/* Objective: Radio Options */}
          {isObjective && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-gray-400 font-medium">Select one option before the 20-second timer ends:</p>
              <div className="grid grid-cols-1 gap-2.5">
                {currentQuestion.options?.map((opt, oi) => {
                  const isSelected = answers[currentQuestion._id] === opt
                  return (
                    <label
                      key={oi}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border text-sm cursor-pointer transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/80 text-orange-950 font-bold shadow-sm ring-1 ring-orange-400'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={currentQuestion._id}
                        checked={isSelected}
                        onChange={() => handleAnswer(currentQuestion._id, opt)}
                        className="accent-orange-500 h-4 w-4 flex-shrink-0"
                      />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Descriptive: Text Area */}
          {!isObjective && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium">Type your technical explanation or code solution below:</span>
                <span className="font-mono text-gray-400">1:00 Minute Time Limit</span>
              </div>
              <textarea
                rows={7}
                value={answers[currentQuestion._id] || ''}
                onChange={(e) => handleAnswer(currentQuestion._id, e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none bg-white font-mono leading-relaxed"
                placeholder="Type your complete technical answer / code explanation here..."
                autoFocus
              />
            </div>
          )}

          {/* Bottom Actions Bar for Current Question */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <span>🔒</span>
              <span>Ongoing Assessment · Sequential Timer Active</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isLastQuestion ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next Question</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={submitting}
                  className="w-full sm:w-auto px-7 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{submitting ? 'Submitting...' : 'Submit Assessment'}</span>
                  <span>✓</span>
                </button>
              )}
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

            <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl text-xs space-y-1.5 text-gray-700">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-bold text-gray-900">{answeredCount} of {questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Question Time:</span>
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
                Back to Question
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