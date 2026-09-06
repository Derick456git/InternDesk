const mongoose = require('mongoose')

const internSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
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
  technologies: [{ type: String }],
  technology: {
    type: String,
    default: '',
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

module.exports = mongoose.model('Intern', internSchema)
