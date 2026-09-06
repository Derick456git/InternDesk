import { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function Profile({ user, onLogout }) {
  const [data, setData] = useState(null)
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/intern/dashboard', { email: user?.email })
        setData(res.data)
      } catch (err) {
        setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to load profile.') })
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user?.email])

  if (loading) {
    return <p className="text-gray-500 text-center py-20">Loading profile...</p>
  }

  if (!data) {
    return <p className="text-gray-500 text-center py-20">No profile found.</p>
  }

  const isApproved = data.status === 'Approved'
  const statusColor = isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'

  const rows = [
    { label: 'Full Name', value: data.name },
    { label: 'Email Address', value: data.email },
    { label: 'Enrolled Tracks', value: data.technologies?.join(', ') || '—' },
    { label: 'Account Status', value: data.status },
    { label: 'Approved Daily Notes', value: `${data.totalApprovedNotes ?? data.totalUploadedNotes}/${data.totalRequiredDays} Days` },
    { label: 'Learning Progress', value: `${data.overallProgress}%` },
    { label: 'Pending Practical Tasks', value: data.tasksDue || 0 },
    { label: 'Assessments Completed', value: `${data.totalCompletedTests} of ${data.totalTests}` },
  ]

  return (
    <div className="space-y-6">
      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'error', message: '' })} />

      <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-2xl font-bold text-white shadow-md shadow-orange-200">
            {data.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{data.name}</h3>
            <p className="text-sm text-gray-500">{data.email}</p>
            <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold ${statusColor}`}>
              {data.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((row) => (
            <div key={row.label} className="border border-gray-100 rounded-xl p-4 bg-gray-50/60">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{row.label}</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{String(row.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
