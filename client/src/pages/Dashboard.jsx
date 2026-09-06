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
  const reqDays = data.totalRequiredDays || 0
  const progressPct = data.overallProgress ?? 0

  const cards = [
    {
      title: 'Learning Progress',
      value: `${progressPct}%`,
      subtitle: `${uploadedNotes}/${reqDays} daily notes submitted`,
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
            <div key={tech.technology} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-gray-800">{tech.technology}</span>
                <span className="text-gray-600 font-medium">
                  {tech.uploadedNotes}/{tech.requiredDays} days · <strong className="text-orange-600">{tech.progress}%</strong>
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
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
