const mongoose = require('mongoose')

const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: null },
  age: { type: Number, min: 0, default: null },
  location: { type: String, default: '' },
  address: { type: String, default: '' },
  pincode: { type: String, default: '' },
  qualification: { type: String, default: '' },
  technologies: [{ type: String }],
  technology: { type: String, default: '' },
  collegeName: { type: String, default: '' },
  universityName: { type: String, default: '' },
  internshipPeriod: { type: String, default: '' },
  classMode: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  resetOtp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model('Registration', registrationSchema)
