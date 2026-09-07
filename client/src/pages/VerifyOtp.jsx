import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [otp, setOtp] = useState(['', '', '', ''])
  const [countdown, setCountdown] = useState(30)
  const [alert, setAlert] = useState({ type: 'success', message: location.state?.info || '' })
  const [submitting, setSubmitting] = useState(false)
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  useEffect(() => {
    if (otpRefs[0].current) {
      otpRefs[0].current.focus()
    }
  }, [])

  useEffect(() => {
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
  }, [countdown === 30])

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
    } else if (e.key === 'ArrowLeft' && index > 0 && otpRefs[index - 1].current) {
      otpRefs[index - 1].current.focus()
    } else if (e.key === 'ArrowRight' && index < 3 && otpRefs[index + 1].current) {
      otpRefs[index + 1].current.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!pasted) return
    const newOtp = ['', '', '', '']
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i]
    }
    setOtp(newOtp)
    const nextIdx = Math.min(pasted.length, 3)
    if (otpRefs[nextIdx]?.current) {
      otpRefs[nextIdx].current.focus()
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setAlert({ type: 'error', message: '' })

    const otpCode = otp.join('')

    if (!email) {
      setAlert({ type: 'error', message: 'Session expired. Please request a new OTP from Forgot Password.' })
      return
    }
    if (otpCode.length !== 4) {
      setAlert({ type: 'error', message: 'Please enter the complete 4-digit OTP.' })
      return
    }
    if (countdown === 0) {
      setAlert({ type: 'error', message: 'OTP has expired. Please click Resend OTP to get a new code.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/client/verify-otp', { email, otp: otpCode })
      setAlert({ type: 'success', message: res.message || 'OTP verified successfully.' })
      navigate('/reset-password', { state: { email } })
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'OTP verification failed. Please try again.') })
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setAlert({ type: 'error', message: '' })
    if (!email) {
      setAlert({ type: 'error', message: 'Session expired. Please request a new OTP from Forgot Password.' })
      return
    }
    setSubmitting(true)
    try {
      await api.post('/client/forgot-password', { email })
      setAlert({ type: 'success', message: 'OTP has been sent to your email. Please check your mail.' })
      setCountdown(30)
      setOtp(['', '', '', ''])
      if (otpRefs[0].current) otpRefs[0].current.focus()
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Unable to resend OTP. Please try again.') })
    } finally {
      setSubmitting(false)
    }
  }

  const isOtpComplete = otp.join('').length === 4

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-8 mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Intern Desk</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">OTP Verification</p>
      </div>

      <form onSubmit={handleVerify} className="space-y-5">
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: 'error', message: '' })}
        />

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 text-center mb-3">
            Enter 4-Digit Verification Code
          </label>
          
          {/* Modern 4-Box Segmented OTP Inputs */}
          <div className="flex justify-center gap-2 sm:gap-4 my-2" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`w-11 h-12 sm:w-16 sm:h-16 text-center text-xl sm:text-2xl font-extrabold rounded-xl sm:rounded-2xl border-2 outline-none transition-all duration-150 ${
                  digit
                    ? 'border-orange-500 bg-orange-50/50 text-orange-950 shadow-sm ring-2 ring-orange-200/50'
                    : 'border-gray-200 bg-gray-50/60 text-gray-800 hover:border-gray-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100'
                }`}
                placeholder="•"
              />
            ))}
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-2">
            Code sent to <span className="font-medium text-gray-600">{email || 'your registered email'}</span>
          </p>
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
          disabled={submitting || !isOtpComplete || countdown === 0}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
        >
          {submitting ? 'Verifying...' : 'Verify Code'}
        </button>
      </form>

      <div className="mt-5 text-center">
        {countdown > 0 ? (
          <p className="text-xs text-gray-400">
            Didn't receive the code? Resend in <span className="font-bold text-orange-600 font-mono">{countdown}s</span>
          </p>
        ) : (
          <div>
            <span className="text-sm text-gray-500">Didn't receive the code? </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={submitting}
              className="text-sm font-bold text-orange-500 hover:text-orange-600 hover:underline transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Resending...' : 'Resend OTP'}
            </button>
          </div>
        )}
      </div>

      <div className="text-center mt-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-sm font-semibold text-gray-500 hover:text-gray-700 hover:underline transition-colors cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}