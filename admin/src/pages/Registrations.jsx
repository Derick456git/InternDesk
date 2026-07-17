import { useState } from 'react'

const initialApplicants = [
  { id: 1, name: 'Rahul Sharma', email: 'rahul@example.com', technology: 'MERN Stack', mode: 'Online', status: 'Pending', phone: '9876543210', qualification: 'B.Tech CSE' },
  { id: 2, name: 'Priya Patel', email: 'priya@example.com', technology: 'Python', mode: 'Offline', status: 'Approved', phone: '9876543211', qualification: 'MCA' },
  { id: 3, name: 'Amit Kumar', email: 'amit@example.com', technology: 'Flutter', mode: 'Online', status: 'Pending', phone: '9876543212', qualification: 'B.Sc IT' },
  { id: 4, name: 'Sneha Reddy', email: 'sneha@example.com', technology: 'Java', mode: 'Offline', status: 'Approved', phone: '9876543213', qualification: 'B.Tech IT' },
  { id: 5, name: 'Vikram Singh', email: 'vikram@example.com', technology: 'MERN Stack', mode: 'Online', status: 'Rejected', phone: '9876543214', qualification: 'BCA' },
  { id: 6, name: 'Neha Joshi', email: 'neha@example.com', technology: 'Python', mode: 'Offline', status: 'Pending', phone: '9876543215', qualification: 'M.Sc CS' },
  { id: 7, name: 'Arun Verma', email: 'arun@example.com', technology: 'Java', mode: 'Online', status: 'Pending', phone: '9876543216', qualification: 'B.Tech CSE' },
  { id: 8, name: 'Kavita Nair', email: 'kavita@example.com', technology: 'Flutter', mode: 'Online', status: 'Approved', phone: '9876543217', qualification: 'B.Sc IT' },
]

export default function Registrations() {
  const [applicants, setApplicants] = useState(initialApplicants)
  const [filter, setFilter] = useState('All')
  const [expandedId, setExpandedId] = useState(null)

  const filters = ['All', 'Pending', 'Approved', 'Rejected']

  const filtered = filter === 'All' ? applicants : applicants.filter((a) => a.status === filter)

  const updateStatus = (id, status) => {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const statusBadge = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
    }
    return `px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Manage Registration</h2>
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
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Technology</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Class Mode</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((applicant) => (
                <tr
                  key={applicant.id}
                  onClick={() => toggleExpand(applicant.id)}
                  className="hover:bg-orange-50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-gray-800">{applicant.name}</td>
                  <td className="px-5 py-3 text-gray-600">{applicant.technology}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      applicant.mode === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {applicant.mode}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={statusBadge(applicant.status)}>{applicant.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {applicant.status !== 'Approved' && (
                        <button
                          onClick={() => updateStatus(applicant.id, 'Approved')}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {applicant.status !== 'Rejected' && (
                        <button
                          onClick={() => updateStatus(applicant.id, 'Rejected')}
                          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-400">No registrations found.</div>
        )}
      </div>
      {expandedId && (() => {
        const a = applicants.find((x) => x.id === expandedId)
        if (!a) return null
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-fadeIn">
            <h3 className="font-semibold text-gray-800 mb-4">Detail - {a.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-800">{a.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Qualification</p>
                <p className="text-sm font-medium text-gray-800">{a.qualification}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Class Mode</p>
                <p className="text-sm font-medium text-gray-800">{a.mode}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => updateStatus(a.id, 'Approved')}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Approve and Activate
              </button>
              <button
                onClick={() => updateStatus(a.id, 'Rejected')}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Reject Request
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
