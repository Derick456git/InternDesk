import { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function Dashboard({ user }) {
  const [data, setData] = useState(null)
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/intern/dashboard', { email: user?.email })
        setData(res.data)
      } catch (err) {
        setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to load dashboard data.') })
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [user?.email])

  if (loading) {
    return <p className="text-gray-500 text-center py-20">Loading dashboard...</p>
  }

  if (!data) {
    return <p className="text-gray-500 text-center py-20">No dashboard data available.</p>
  }

  const uploadedNotes = data.totalUploadedNotes ?? data.totalApprovedNotes ?? 0
  const hasAssignedSyllabus = Boolean(
    data.hasAssignedSyllabus === true &&
    Number(data.totalRequiredDays) > 0 &&
    data.technologyCards?.some((t) => t.isAssigned === true && Number(t.requiredDays) > 0)
  )
  const reqDays = hasAssignedSyllabus ? (Number(data.totalRequiredDays) || 0) : 0
  const progressPct = hasAssignedSyllabus ? (data.overallProgress ?? 0) : 0

  const learningNotesSubtitle = hasAssignedSyllabus && reqDays > 0
    ? `${uploadedNotes}/${reqDays} daily notes submitted`
    : `${uploadedNotes} daily notes submitted`

  const cards = [
    {
      title: 'Learning Progress',
      value: `${progressPct}%`,
      subtitle: learningNotesSubtitle,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Pending Tasks',
      value: data.tasksDue ?? 0,
      subtitle: `${data.tasksDue ?? 0} unsubmitted practical task${data.tasksDue === 1 ? '' : 's'}`,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      title: 'Pending Assessments',
      value: data.pendingAssessments ?? 0,
      subtitle: `${data.pendingAssessments ?? 0} unattended assessment${data.pendingAssessments === 1 ? '' : 's'}`,
      color: 'from-emerald-500 to-teal-500',
    },
  ]

  return (
    <div className="space-y-6">
      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'error', message: '' })} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome, {data.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enrolled Track: <strong className="text-gray-700">{data.technologies?.length > 0 ? data.technologies.join(', ') : 'General'}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            data.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {data.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${card.color} mb-4`} />
            <p className="text-sm text-gray-500 font-medium">{card.title}</p>
            <p className="text-4xl font-extrabold text-gray-900 mt-1">{card.value}</p>
            <p className="text-xs text-gray-400 mt-2">{card.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4 text-base">Curriculum Progress by Track</h3>
        <div className="space-y-5">
          {(!data.technologyCards || data.technologyCards.length === 0) && (
            <p className="text-sm text-gray-400">No technology tracks enrolled yet.</p>
          )}
          {data.technologyCards?.map((tech) => (
            <div key={tech.technology} className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                <div>
                  <span className="font-bold text-gray-800">{tech.technology}</span>
                  {tech.syllabusName && (
                    <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md">
                      {tech.syllabusName}
                    </span>
                  )}
                </div>
                <span className="text-gray-600 font-medium text-xs sm:text-sm">
                  {tech.isAssigned && tech.requiredDays > 0 ? (
                    <>{tech.uploadedNotes}/{tech.requiredDays} working days · </>
                  ) : null}
                  <strong className="text-orange-600">{tech.progress || 0}%</strong>
                </span>
              </div>

              {tech.startDateFormatted && tech.endDateFormatted && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                    📅 <span>Schedule:</span>
                  </span>
                  <span className="font-semibold text-gray-800">{tech.startDateFormatted}</span>
                  <span className="text-gray-400">to</span>
                  <span className="font-semibold text-gray-800">{tech.endDateFormatted}</span>
                  <span className="text-gray-500 font-medium">({tech.requiredDays} Working Days · Mon–Fri)</span>
                </div>
              )}

              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, tech.progress || 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
