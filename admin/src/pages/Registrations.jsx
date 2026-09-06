import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function Registrations() {
  const [applicants, setApplicants] = useState([])
  const [filter, setFilter] = useState('All')
  const [expandedId, setExpandedId] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null) // { applicant: obj, action: 'Approved' | 'Rejected' }
  const [loadingAction, setLoadingAction] = useState(false)
  const [alert, setAlert] = useState({ type: 'success', message: '' })

  const filters = ['All', 'Pending', 'Approved', 'Rejected']

  useEffect(() => {
    fetchRegistrations()
  }, [filter])

  const fetchRegistrations = async () => {
    try {
      const params = filter !== 'All' ? `?status=${filter}` : ''
      const res = await api.get(`/registrations${params}`)
      setApplicants(res.data || [])
    } catch (err) {
      console.error('Fetch registrations error:', err)
    }
  }

  const handleOpenConfirm = (applicant, action, e) => {
    if (e) e.stopPropagation()
    setConfirmModal({ applicant, action })
  }

  const handleConfirmAction = async () => {
    if (!confirmModal?.applicant || !confirmModal?.action) return
    const { applicant, action } = confirmModal
    setLoadingAction(true)
    setAlert({ type: 'success', message: '' })

    try {
      await api.patch(`/registrations/${applicant._id}/status`, { status: action })
      setAlert({
        type: 'success',
        message: `Registration for "${applicant.name}" has been marked as ${action}.`,
      })
      setConfirmModal(null)
      fetchRegistrations()
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || `Failed to mark registration as ${action}.`,
      })
    } finally {
      setLoadingAction(false)
    }
  }

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const statusBadge = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      Approved: 'bg-green-100 text-green-800 border border-green-200',
      Rejected: 'bg-red-100 text-red-800 border border-red-200',
    }
    return `px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Manage Registration</h2>

      <AlertBanner
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: 'success', message: '' })}
      />

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
              filter === f
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Email & Phone</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Technology</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Internship Mode</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {applicants.map((applicant) => {
                const isPending = applicant.status === 'Pending'

                return (
                  <tr
                    key={applicant._id}
                    onClick={() => toggleExpand(applicant._id)}
                    className="hover:bg-orange-50/60 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-gray-800">{applicant.name}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">
                      <div>{applicant.email}</div>
                      <div className="text-gray-400">{applicant.phone || '—'}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{applicant.technology}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                          applicant.classMode === 'Online'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {applicant.classMode || 'Online'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={statusBadge(applicant.status)}>{applicant.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      {isPending ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenConfirm(applicant, 'Approved', e)}
                            className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>✓</span>
                            Approve
                          </button>
                          <button
                            onClick={(e) => handleOpenConfirm(applicant, 'Rejected', e)}
                            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>✕</span>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No action available</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {applicants.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-400">No registrations found.</div>
        )}
      </div>

      {/* Expanded Dossier Card */}
      {expandedId && (() => {
        const a = applicants.find((x) => x._id === expandedId)
        if (!a) return null
        const isPending = a.status === 'Pending'

        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-800 text-base">Registration Dossier — {a.name}</h3>
              <span className={statusBadge(a.status)}>{a.status}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400">Email Address</p>
                <p className="text-sm font-semibold text-gray-800">{a.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Phone Number</p>
                <p className="text-sm font-semibold text-gray-800">{a.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Qualification</p>
                <p className="text-sm font-semibold text-gray-800">{a.qualification || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">College / University</p>
                <p className="text-sm font-semibold text-gray-800">{a.collegeName || a.universityName || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Technology Track</p>
                <p className="text-sm font-semibold text-gray-800">{a.technology}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Internship Mode</p>
                <p className="text-sm font-semibold text-gray-800">{a.classMode || 'Online'}</p>
              </div>
            </div>

            {/* Only show action buttons if still Pending */}
            {isPending && (
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleOpenConfirm(a, 'Approved')}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Approve Registration
                </button>
                <button
                  onClick={() => handleOpenConfirm(a, 'Rejected')}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Reject Registration
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  confirmModal.action === 'Approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {confirmModal.action === 'Approved' ? '✓' : '!'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Confirm {confirmModal.action === 'Approved' ? 'Approval' : 'Rejection'}
                </h3>
                <p className="text-xs text-gray-500">
                  Registration ID: {confirmModal.applicant._id}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to{' '}
              <strong className={confirmModal.action === 'Approved' ? 'text-green-700' : 'text-red-700'}>
                {confirmModal.action === 'Approved' ? 'APPROVE' : 'REJECT'}
              </strong>{' '}
              the registration for <strong className="text-gray-900">{confirmModal.applicant.name}</strong> (
              <span className="text-gray-500">{confirmModal.applicant.email}</span>)?
              {confirmModal.action === 'Approved' && (
                <span className="block mt-2 text-xs text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-200">
                  ✓ An approval confirmation email will be sent to the intern with login details.
                </span>
              )}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={loadingAction}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={loadingAction}
                className={`px-5 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 ${
                  confirmModal.action === 'Approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loadingAction ? 'Processing...' : `Yes, ${confirmModal.action === 'Approved' ? 'Approve' : 'Reject'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
