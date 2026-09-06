const bcrypt = require('bcryptjs')
const Registration = require('../Models/registrationModel')
const Intern = require('../Models/internModel')
const { sendOtpEmail } = require('../config/mailer')

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString()

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }
    const registration = await Registration.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 })
    if (!registration) {
      return res.status(404).json({ success: false, message: 'No registration found for this email' })
    }
    const otp = generateOtp()
    const salt = await bcrypt.genSalt(10)
    registration.resetOtp = await bcrypt.hash(otp, salt)
    registration.otpExpires = new Date(Date.now() + 30 * 1000)
    await registration.save()
    await sendOtpEmail(registration.email, otp)
    res.json({ success: true, message: 'OTP code sent to your email' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' })
    }
    const registration = await Registration.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 })
    if (!registration) {
      return res.status(404).json({ success: false, message: 'No registration found for this email' })
    }
    if (!registration.resetOtp || !registration.otpExpires) {
      return res.status(400).json({ success: false, message: 'No OTP requested for this email' })
    }
    if (new Date() > registration.otpExpires) {
      return res.status(400).json({ success: false, message: 'OTP has expired' })
    }
    const isValid = await bcrypt.compare(otp, registration.resetOtp)
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' })
    }
    res.json({ success: true, message: 'OTP verified successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }
    const registration = await Registration.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 })
    if (!registration) {
      return res.status(404).json({ success: false, message: 'No registration found for this email' })
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    registration.password = hashedPassword
    registration.resetOtp = null
    registration.otpExpires = null
    await registration.save()

    const intern = await Intern.findOne({ email: email.toLowerCase() })
    if (intern) {
      intern.password = hashedPassword
      await intern.save()
    }

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}