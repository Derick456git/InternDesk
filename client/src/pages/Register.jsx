import { useState, useEffect } from 'react'
import { api, getErrorMessage } from '../api'
import AlertBanner from '../components/AlertBanner'

const genderOptions = ['Male', 'Female', 'Other']
const periodOptions = ['1 Month', '2 Months', '3 Months', '4 Months', '5 Months', '6 Months']
const modeOptions = ['Online', 'Offline']

export default function Register({ onNavigate }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    age: '',
    phone: '',
    location: '',
    address: '',
    pincode: '',
    technologies: [],
    collegeName: '',
    universityName: '',
    internshipPeriod: '',
    classMode: '',
  })
  const [technologies, setTechnologies] = useState([])
  const [techError, setTechError] = useState(false)
  const [alert, setAlert] = useState({ type: 'error', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const fetchTechnologies = async () => {
      try {
        const res = await api.get('/technologies')
        const active = (res.data || []).filter((t) => t.active !== false)
        setTechnologies(active)
      } catch (err) {
        setTechError(true)
        setAlert({ type: 'error', message: 'Unable to load technology options. Please try again later.' })
      }
    }
    fetchTechnologies()
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const toggleTechnology = (techName) => {
    setForm((prev) => {
      const already = prev.technologies.includes(techName)
      return {
        ...prev,
        technologies: already
          ? prev.technologies.filter((t) => t !== techName)
          : [...prev.technologies, techName],
      }
    })
  }

  const validate = () => {
    if (!form.fullName.trim()) return 'Full Name is required.'
    if (!form.email.trim()) return 'Email ID is required.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid email address.'
    if (!form.password) return 'Password is required.'
    if (!form.confirmPassword) return 'Confirm password is required.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match. Please re-enter.'
    if (!form.gender) return 'Please select your gender.'
    if (!form.age) return 'Age is required.'
    if (Number(form.age) < 15 || Number(form.age) > 60) return 'Age must be between 15 and 60.'
    if (!form.phone.trim()) return 'Phone Number is required.'
    if (!/^\d{10}$/.test(form.phone.trim())) return 'Phone Number must be a valid 10-digit number.'
    if (!form.location.trim()) return 'Current Location is required.'
    if (!form.address.trim()) return 'Address is required.'
    if (!form.pincode.trim()) return 'Pincode is required.'
    if (!/^\d{6}$/.test(form.pincode.trim())) return 'Pincode must be a valid 6-digit number.'
    if (form.technologies.length === 0) return 'Please select at least one technology you are interested in.'
    if (!form.collegeName.trim()) return 'College Name is required.'
    if (!form.universityName.trim()) return 'University Name is required.'
    if (!form.internshipPeriod) return 'Please select the internship period.'
    if (!form.classMode) return 'Please select the mode of internship.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlert({ type: 'error', message: '' })

    const error = validate()
    if (error) {
      setAlert({ type: 'error', message: error })
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/registrations', {
        name: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        gender: form.gender,
        age: Number(form.age),
        phone: form.phone.trim(),
        location: form.location.trim(),
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        technologies: form.technologies,
        collegeName: form.collegeName.trim(),
        universityName: form.universityName.trim(),
        internshipPeriod: form.internshipPeriod,
        classMode: form.classMode,
      })
      setAlert({ type: 'success', message: res.message || 'Please wait.. the approval will be done shortly' })
      setForm({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
        age: '',
        phone: '',
        location: '',
        address: '',
        pincode: '',
        technologies: [],
        collegeName: '',
        universityName: '',
        internshipPeriod: '',
        classMode: '',
      })
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err, 'Registration failed. Please try again.') })
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition'

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 my-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Intern Desk</h1>
        <p className="text-sm text-gray-500 mt-1">Intern Registration</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: 'error', message: '' })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`${inputClass} pr-12`}
                placeholder="Enter your password"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`${inputClass} pr-12`}
                placeholder="Confirm your password"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
              <option value="">Select Gender</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              name="age"
              min="15"
              max="60"
              value={form.age}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. 21"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
              placeholder="10-digit mobile number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Chennai"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              rows="2"
              value={form.address}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter your complete address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
            <input
              type="text"
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              className={inputClass}
              placeholder="6-digit pincode"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Technology Interested</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-300 rounded-lg p-3 bg-gray-50">
              {technologies.length === 0 && !techError && (
                <p className="text-xs text-gray-400 col-span-full">Loading technologies...</p>
              )}
              {techError && (
                <p className="text-xs text-red-500 col-span-full">Could not load technology options. Check the server connection.</p>
              )}
              {technologies.map((t) => (
                <label
                  key={t._id}
                  className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={form.technologies.includes(t.name)}
                    onChange={() => toggleTechnology(t.name)}
                    className="h-4 w-4 accent-orange-500"
                  />
                  {t.icon ? `${t.icon} ` : ''}{t.name}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Select one or more technologies (multi-track study).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
            <input
              type="text"
              name="collegeName"
              value={form.collegeName}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter your college name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University Name</label>
            <input
              type="text"
              name="universityName"
              value={form.universityName}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter your university name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internship Period</label>
            <select name="internshipPeriod" value={form.internshipPeriod} onChange={handleChange} className={inputClass}>
              <option value="">Select Period</option>
              {periodOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode of Internship</label>
            <select name="classMode" value={form.classMode} onChange={handleChange} className={inputClass}>
              <option value="">Select Mode</option>
              {modeOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Registration'}
        </button>
      </form>

      <div className="text-center mt-5">
        <span className="text-sm text-gray-500">Already have an account? </span>
        <button
          type="button"
          onClick={onNavigate}
          className="text-sm font-medium text-orange-500 hover:text-orange-600 hover:underline transition-colors"
        >
          Sign In
        </button>
      </div>
    </div>
  )
}
