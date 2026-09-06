import { useState, useRef, useEffect } from 'react'
import { api, setToken } from '../api'

function AlertBanner({ type, message, onClose }) {
  if (!message) return null
  const colors = type === 'success'
    ? 'bg-green-50 border-green-300 text-green-800'
    : 'bg-red-50 border-red-300 text-red-800'
  return (
    <div className={`mb-4 px-4 py-3 rounded-lg border ${colors} flex items-start justify-between gap-2 text-sm`}>
      <div>
        <span className="font-bold">{type === 'success' ? 'Success!' : 'Error!'} </span>
        {message}
      </div>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 flex-shrink-0">&times;</button>
    </div>
  )
}

export default function AuthFlow({ onLogin }) {
  const [view, setView] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [alert, setAlert] = useState({ type: 'success', message: '' })
  const [loginAlert, setLoginAlert] = useState({ type: 'success', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  useEffect(() => {
    if (view !== 'otp-verification') return

    if (otpRefs[0].current) {
      otpRefs[0].current.focus()
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [view, countdown === 30])

  const handleLogin = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setLoginAlert({ type: 'success', message: '' })
    try {
      const res = await api.post('/admin/login', { email, password })
      onLogin(res.token)
    } catch (err) {
      setLoginAlert({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setSubmitting(true)
    setAlert({ type: 'success', message: '' })
    try {
      const res = await api.post('/admin/forgot-password', { email: forgotEmail })
      setAlert({ type: 'success', message: res.message })
      setCountdown(30)
      setOtp(['', '', '', ''])
      setTimeout(() => { setView('otp-verification'); setAlert({ type: 'success', message: '' }) }, 300)
    } catch (err) {
      setAlert({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 3 && otpRefs[index + 1].current) {
      otpRefs[index + 1].current.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && otpRefs[index - 1].current) {
      otpRefs[index - 1].current.focus()
    }
  }

  const handleOtpVerify = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 4) return
    setSubmitting(true)
    setAlert({ type: 'success', message: '' })
    try {
      await api.post('/admin/verify-otp', { email: forgotEmail, otp: code })
      setView('reset-password')
    } catch (err) {
      setAlert({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setSubmitting(true)
    setAlert({ type: 'success', message: '' })
    try {
      const res = await api.post('/admin/forgot-password', { email: forgotEmail })
      setAlert({ type: 'success', message: res.message })
      setCountdown(30)
      setOtp(['', '', '', ''])
      if (otpRefs[0].current) otpRefs[0].current.focus()
    } catch (err) {
      setAlert({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) return
    if (newPassword !== confirmPassword) return
    setSubmitting(true)
    try {
      await api.post('/admin/reset-password', { email: forgotEmail, password: newPassword })
      setLoginAlert({ type: 'success', message: 'Password updated successfully. Please log in.' })
      setView('login')
      setNewPassword('')
      setConfirmPassword('')
      setOtp(['', '', '', ''])
      setAlert({ type: 'success', message: '' })
    } catch (err) {
      setAlert({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const goToLogin = () => {
    setView('login')
    setOtp(['', '', '', ''])
    setAlert({ type: 'success', message: '' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1a2e] to-[#1a2d4a]">
      {view === 'login' && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 mx-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Intern Desk</h1>
            <p className="text-sm text-gray-500 mt-1">Admin Portal Login</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <AlertBanner type={loginAlert.type} message={loginAlert.message} onClose={() => setLoginAlert({ type: 'success', message: '' })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                placeholder="interndeskadmin@gmail.com"
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
                  className="w-full pl-4 pr-11 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5 text-orange-500 hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="mt-1.5 text-right">
                <button
                  type="button"
                  onClick={() => { setView('forgot-password'); setLoginAlert({ type: 'success', message: '' }) }}
                  className="text-sm text-orange-500 hover:text-orange-600 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      )}

      {view === 'forgot-password' && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 mx-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
            <p className="text-sm text-gray-500 mt-2">
              Enter your registered admin email address. We'll send you a 4-digit code to reset your password.
            </p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'success', message: '' })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                placeholder="interndeskadmin@gmail.com"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Submit'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={goToLogin}
                className="text-sm text-orange-500 hover:text-orange-600 hover:underline transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'otp-verification' && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 mx-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">OTP Verification</h1>
            <p className="text-sm text-gray-500 mt-2">
              Enter the 4-digit code sent to your email.
            </p>
          </div>
          <form onSubmit={handleOtpVerify} className="space-y-5">
            <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: 'success', message: '' })} />
            
            <div className="flex justify-center gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-14 h-14 text-center text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition bg-white"
                />
              ))}
            </div>

            {/* 30-Second Countdown Timer Display */}
            <div className="flex items-center justify-center gap-2 py-1 text-xs">
              <span className="text-gray-500 font-medium">OTP expires in:</span>
              <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full ${
                countdown > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
              }`}>
                {countdown > 0 ? `00:${countdown.toString().padStart(2, '0')}` : 'Expired (00:00)'}
              </span>
            </div>

            <button
              type="submit"
              disabled={otp.join('').length !== 4 || submitting || countdown === 0}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Verifying...' : 'Verify'}
            </button>

            <div className="text-center pt-1">
              {countdown > 0 ? (
                <p className="text-xs text-gray-400">
                  Didn't receive code? Resend in <span className="font-bold text-orange-600 font-mono">{countdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={submitting}
                  className="text-sm font-bold text-orange-500 hover:text-orange-600 hover:underline transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Resending...' : 'Resend OTP'}
                </button>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={goToLogin}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'reset-password' && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 mx-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-sm text-gray-500 mt-2">Enter your new password</p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5 text-orange-500 hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-4 pr-11 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition ${
                    confirmPassword && newPassword !== confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5 text-orange-500 hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6 || submitting}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Resetting...' : 'Done'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={goToLogin}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
