import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function AttendTest() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [activeTech, setActiveTech] = useState('')
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ type: 'error', message: '' })

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    setLoading(true)
    setAlert({ type: 'error', message: '' })
    try {
      const res = await api.get('/client/available-tests')
      const catList = res.data || []
      setCategories(catList)
      if (catList.length > 0 && !activeTech) {
        setActiveTech(catList[0].technology)
      }
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to load assessments.') })
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = (assessment) => {
    if (!assessment.isUnlocked || !assessment.isAssignedByAdmin || assessment.hasSubmitted) return
    navigate('/take-test', { state: { test: assessment } })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-gray-500">Loading assessments catalog...</p>
        </div>
      </div>
    )
  }

  const currentCategory = categories.find((c) => c.technology === activeTech) || categories[0]

  return (
    <div className="space-y-6">
      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'error', message: '' })} />

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Attend Test</h2>
          <p className="text-sm text-gray-500 mt-1">
            Attend your 25-minute tests. Upload all 5 daily notes for each test block to unlock its test.
          </p>
        </div>

        {currentCategory && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-50/70 rounded-xl border border-orange-200 text-xs">
            <span className="text-gray-600 font-medium">
              Course: <strong className="text-gray-900">{currentCategory.technology}</strong>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 font-medium">
              Duration: <strong className="text-orange-600">{currentCategory.durationDays} Days</strong>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 font-medium">
              Total tests: <strong className="text-orange-600">{currentCategory.totalAssessments} Tests</strong>
            </span>
          </div>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto text-xl font-bold">
            📚
          </div>
          <h3 className="text-base font-bold text-gray-800">No Active Syllabus Assigned</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            You do not currently have an active course syllabus assigned. Once the admin assigns your syllabus, your assessments will automatically populate here.
          </p>
        </div>
      ) : (
        <>
          {/* Technology Tabs (Category Wise) */}
          {categories.length > 1 && (
            <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat.technology}
                  onClick={() => setActiveTech(cat.technology)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTech === cat.technology
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>💻</span>
                  {cat.technology}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-black/10 font-normal">
                    {cat.durationDays} Days
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Assessment Blocks / Cards */}
          {currentCategory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span>{currentCategory.technology} Assessments</span>
                  <span className="text-xs font-normal text-gray-500">
                    ({currentCategory.assessments.length} Total Tests)
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentCategory.assessments.map((item) => {
                  const isReady = item.isUnlocked && item.isAssignedByAdmin && !item.hasSubmitted
                  const isResultPublished = item.hasSubmitted && (item.isPublished === true || item.submissionStatus === 'Published')

                  return (
                    <div
                      key={item.assessmentNumber}
                      className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col justify-between transition-all ${
                        isResultPublished
                          ? 'border-green-200 bg-green-50/20'
                          : item.hasSubmitted
                          ? 'border-blue-200 bg-blue-50/20'
                          : isReady
                          ? 'border-orange-300 ring-2 ring-orange-200/50 shadow-md'
                          : 'border-gray-200 opacity-90'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header Badge & Title */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                              Test {item.assessmentNumber}
                            </span>
                            <h4 className="text-base font-extrabold text-gray-900 leading-snug">
                              {item.testName || `${currentCategory.technology} Assessment ${item.assessmentNumber}`}
                            </h4>
                          </div>

                          {isResultPublished ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex-shrink-0">
                              Result Published
                            </span>
                          ) : item.hasSubmitted ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex-shrink-0">
                              Under Evaluation
                            </span>
                          ) : item.isUnlocked ? (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                              item.isAssignedByAdmin ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {item.isAssignedByAdmin ? 'Unlocked' : 'Pending Test'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 flex-shrink-0">
                              Locked
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500">
                          Covers <strong className="text-gray-700">Days {item.startDay} to {item.endDay}</strong> material.
                        </p>

                        {/* Test Spec Badges */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 flex-wrap py-1">
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold text-[11px]">
                            5 Objective (10M)
                          </span>
                          <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-semibold text-[11px]">
                            5 Descriptive (25M)
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold text-[11px]">
                            25 Mins
                          </span>
                        </div>

                        {/* Unlock Condition Status */}
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-500">Daily Notes Progress:</span>
                            <span className={item.isUnlocked ? 'text-green-600 font-bold' : 'text-gray-700 font-bold'}>
                              {item.uploadedDaysCount} / {item.requiredDaysCount} Days Uploaded
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                item.isUnlocked ? 'bg-green-500' : 'bg-orange-400'
                              }`}
                              style={{ width: `${(item.uploadedDaysCount / item.requiredDaysCount) * 100}%` }}
                            />
                          </div>
                          {!item.isUnlocked && (
                            <p className="text-[11px] text-gray-400">
                              Upload notes for Days {item.startDay}–{item.endDay} to unlock this assessment.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-4 mt-2">
                        {isResultPublished ? (
                          <button
                            disabled
                            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-green-100 text-green-800 cursor-not-allowed border border-green-200 flex items-center justify-center gap-1.5"
                          >
                            <span>✓</span>
                            Result published successfully
                          </button>
                        ) : item.hasSubmitted ? (
                          <button
                            disabled
                            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-blue-100 text-blue-800 cursor-not-allowed border border-blue-200 flex items-center justify-center gap-1.5"
                          >
                            <span>✓</span>
                            Assessment Submitted (Under Evaluation)
                          </button>
                        ) : isReady ? (
                          <button
                            onClick={() => handleStartTest(item)}
                            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>✍️</span>
                            Start Test (25 Mins)
                          </button>
                        ) : item.isUnlocked && !item.isAssignedByAdmin ? (
                          <button
                            disabled
                            className="w-full py-2.5 px-4 text-xs font-medium rounded-xl bg-amber-50 text-amber-700 cursor-not-allowed border border-amber-200"
                          >
                            Awaiting Admin Test Assignment
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2.5 px-4 text-xs font-medium rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                          >
                            🔒 Locked (Upload Days {item.startDay}–{item.endDay} Notes)
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}