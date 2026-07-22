import { useState } from 'react'

const initialStats = [
  { label: 'Total Interns', value: 142, color: 'bg-blue-500' },
  { label: 'Pending Approvals', value: 18, color: 'bg-yellow-500' },
  { label: 'Active Tasks', value: 37, color: 'bg-green-500' },
  { label: 'Tests Open', value: 5, color: 'bg-purple-500' },
]

const initialRegistrations = [
  { name: 'Rahul Sharma', technology: 'MERN Stack', status: 'Pending', date: '2026-07-14' },
  { name: 'Priya Patel', technology: 'Python', status: 'Approved', date: '2026-07-13' },
  { name: 'Amit Kumar', technology: 'Flutter', status: 'Pending', date: '2026-07-12' },
  { name: 'Sneha Reddy', technology: 'Java', status: 'Approved', date: '2026-07-11' },
  { name: 'Vikram Singh', technology: 'MERN Stack', status: 'Rejected', date: '2026-07-10' },
]

const initialSubmissions = [
  { name: 'Neha Joshi', task: 'React CRUD App', submitted: '2026-07-14', status: 'Pending' },
  { name: 'Arun Verma', task: 'Python API Design', submitted: '2026-07-13', status: 'Reviewed' },
  { name: 'Kavita Nair', task: 'Flutter UI', submitted: '2026-07-12', status: 'Pending' },
  { name: 'Rohit Das', task: 'Java Spring Boot', submitted: '2026-07-11', status: 'Approved' },
]

export default function Dashboard() {
  const [stats] = useState(initialStats)
  const [registrations] = useState(initialRegistrations)
  const [submissions] = useState(initialSubmissions)

  const statusBadge = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Reviewed: 'bg-blue-100 text-blue-800',
    }
    return `px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.color} bg-opacity-20 flex items-center justify-center`}>
                <div className={`w-6 h-6 rounded-full ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Registrations</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {registrations.map((reg, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{reg.name}</p>
                  <p className="text-xs text-gray-500">{reg.technology}</p>
                </div>
                <span className={statusBadge(reg.status)}>{reg.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Task Submissions</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {submissions.map((sub, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{sub.name}</p>
                  <p className="text-xs text-gray-500">{sub.task}</p>
                </div>
                <span className={statusBadge(sub.status)}>{sub.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
