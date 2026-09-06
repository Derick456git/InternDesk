const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Intern = require('../Models/internModel')
const Registration = require('../Models/registrationModel')
const { sendOtpEmail } = require('../config/mailer')

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString()

const STATUS_MESSAGE = {
  Pending: 'Please wait.. the approval will be done shortly',
  Approved: 'Approved as intern, Now login to your portal. Thank you',
  Rejected: 'Sorry you are not approved as an intern',
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }
    const intern = await Intern.findOne({ email: email.toLowerCase() })
    if (!intern) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }
    const isMatch = await bcrypt.compare(password, intern.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const registration = await Registration.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 })
    const status = registration?.status || 'Approved'

    const token = jwt.sign({ id: intern._id, email: intern.email, role: 'intern' }, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.json({
      success: true,
      message: STATUS_MESSAGE[status] || 'Login successful',
      token,
      data: {
        id: intern._id,
        name: intern.name,
        email: intern.email,
        technologies: intern.technologies?.length ? intern.technologies : (intern.technology ? [intern.technology] : []),
        status,
        statusMessage: STATUS_MESSAGE[status] || 'Login successful',
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.status = async (req, res) => {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }
    const registration = await Registration.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 })
    if (!registration) {
      return res.status(404).json({ success: false, message: 'No registration found for this email' })
    }
    res.json({
      success: true,
      data: {
        status: registration.status,
        message: STATUS_MESSAGE[registration.status] || '',
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.clientLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }
    const registration = await Registration.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 })
    if (!registration || !registration.password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }
    const isMatch = await bcrypt.compare(password, registration.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }
    const status = registration.status || 'Pending'
    const token = jwt.sign({ id: registration._id, email: registration.email, role: 'intern' }, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.json({
      success: true,
      message: STATUS_MESSAGE[status] || 'Login successful',
      token,
      data: {
        id: registration._id,
        name: registration.name,
        email: registration.email,
        technologies: registration.technologies?.length ? registration.technologies : (registration.technology ? [registration.technology] : []),
        status,
        statusMessage: STATUS_MESSAGE[status] || 'Login successful',
      },
    })
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
    const intern = await Intern.findOne({ email: email.toLowerCase() })
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found' })
    }
    const otp = generateOtp()
    const salt = await bcrypt.genSalt(10)
    intern.resetOtp = await bcrypt.hash(otp, salt)
    intern.otpExpires = new Date(Date.now() + 30 * 1000)
    await intern.save()
    await sendOtpEmail(intern.email, otp)
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
    const intern = await Intern.findOne({ email: email.toLowerCase() })
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found' })
    }
    if (!intern.resetOtp || !intern.otpExpires) {
      return res.status(400).json({ success: false, message: 'No OTP requested' })
    }
    if (new Date() > intern.otpExpires) {
      return res.status(400).json({ success: false, message: 'OTP has expired' })
    }
    const isValid = await bcrypt.compare(otp, intern.resetOtp)
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
    const intern = await Intern.findOne({ email: email.toLowerCase() })
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found' })
    }
    const salt = await bcrypt.genSalt(10)
    intern.password = await bcrypt.hash(password, salt)
    intern.resetOtp = null
    intern.otpExpires = null
    await intern.save()
    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
