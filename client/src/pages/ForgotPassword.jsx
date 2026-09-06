import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setAlert({ type: 'error', message: '' })

    if (!email.trim()) {
      setAlert({ type: 'error', message: 'Please enter your email address.' })
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setAlert({ type: 'error', message: 'Please enter a valid email address.' })
      return
    }

    setSubmitting(true)
    try {
      await api.post('/client/forgot-password', { email: email.trim() })
      navigate('/verify-otp', {
        state: {
          email: email.trim(),
          info: 'OTP has been sent to your email. Please check your mail.',
        },
      })
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to send OTP. Please try again.') })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Intern Desk</h1>
        <p className="text-sm text-gray-500 mt-1">Forgot Password</p>
      </div>

      <form onSubmit={handleSendOtp} className="space-y-5">
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: 'error', message: '' })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
            placeholder="intern@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Sending...' : 'Send OTP'}
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