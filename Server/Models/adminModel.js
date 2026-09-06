const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  resetOtp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
}, { timestamps: true })

module.exports = mongoose.model('Admin', adminSchema)
