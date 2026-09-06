import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setAlert({ type: 'error', message: '' })

    if (!email) {
      setAlert({ type: 'error', message: 'Session expired. Please restart the password reset process.' })
      return
    }
    if (!password) {
      setAlert({ type: 'error', message: 'Please enter a new password.' })
      return
    }
    if (password.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters.' })
      return
    }
    if (!confirmPassword) {
      setAlert({ type: 'error', message: 'Please confirm your new password.' })
      return
    }
    if (password !== confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match. Please re-enter.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/client/reset-password', { email, password })
      setAlert({ type: 'success', message: res.message || 'Password updated successfully.' })
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to update password. Please try again.') })
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition'

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Intern Desk</h1>
        <p className="text-sm text-gray-500 mt-1">Reset Password</p>
      </div>

      <form onSubmit={handleReset} className="space-y-5">
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: 'error', message: '' })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-12`}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-3 flex items-center text-sm text-orange-500 hover:text-orange-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${inputClass} pr-12`}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="absolute inset-y-0 right-3 flex items-center text-sm text-orange-500 hover:text-orange-600 transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Updating...' : 'Done'}
        </button>
      </form>

      <div className="text-center mt-5">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-sm font-medium text-orange-500 hover:text-orange-600 hover:underline transition-colors"
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}