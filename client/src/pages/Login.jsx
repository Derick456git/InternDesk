import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (e) => {
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
    if (!password) {
      setAlert({ type: 'error', message: 'Please enter your password.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/intern/login', { email: email.trim(), password })
      localStorage.setItem('internToken', res.token)
      if (res.data) {
        localStorage.setItem('internUser', JSON.stringify(res.data))
      }
      onLogin(res.data)
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Login failed. Please try again.') })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Intern Desk</h1>
        <p className="text-sm text-gray-500 mt-1">Client Login</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
              placeholder="••••••••"
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

        <div className="text-right">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-orange-500 hover:text-orange-600 hover:underline transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="text-center mt-5">
        <span className="text-sm text-gray-500">Don't have an account? </span>
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="text-sm font-medium text-orange-500 hover:text-orange-600 hover:underline transition-colors"
        >
          Sign Up
        </button>
      </div>
    </div>
  )
}