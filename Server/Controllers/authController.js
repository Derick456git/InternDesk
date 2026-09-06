const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Admin = require('../Models/adminModel')
const { sendOtpEmail } = require('../config/mailer')

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString()

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }
    const admin = await Admin.findOne({ email: email.toLowerCase() })
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }
    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }
    const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.json({ success: true, message: 'Login successful', token })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }
    const admin = await Admin.findOne({ email: email.toLowerCase() })
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' })
    }
    const otp = generateOtp()
    const salt = await bcrypt.genSalt(10)
    admin.resetOtp = await bcrypt.hash(otp, salt)
    admin.otpExpires = new Date(Date.now() + 30 * 1000)
    await admin.save()
    await sendOtpEmail(admin.email, otp)
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
    const admin = await Admin.findOne({ email: email.toLowerCase() })
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' })
    }
    if (!admin.resetOtp || !admin.otpExpires) {
      return res.status(400).json({ success: false, message: 'No OTP requested' })
    }
    if (new Date() > admin.otpExpires) {
      return res.status(400).json({ success: false, message: 'OTP has expired' })
    }
    const isValid = await bcrypt.compare(otp, admin.resetOtp)
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
    const admin = await Admin.findOne({ email: email.toLowerCase() })
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' })
    }
    const salt = await bcrypt.genSalt(10)
    admin.password = await bcrypt.hash(password, salt)
    admin.resetOtp = null
    admin.otpExpires = null
    await admin.save()
    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
