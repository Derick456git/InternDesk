const mongoose = require('mongoose')

const certificateSchema = new mongoose.Schema({
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
  internName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  technology: { type: String, required: true, trim: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  issueDate: { type: String, required: true },
  certificateNumber: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['Issued', 'Revoked'], default: 'Issued' },
  issuedBy: { type: String, default: 'Admin' },
  meta: {
    durationDays: { type: Number, default: 0 },
    syllabusName: { type: String, default: '' },
    finalScore: { type: Number, default: 0 },
  },
}, { timestamps: true })

certificateSchema.pre('save', function (next) {
  if (!this.certificateNumber) {
    const year = new Date().getFullYear()
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase()
    this.certificateNumber = `RI-CERT-${year}-${randomHex}`
  }
  next()
})

module.exports = mongoose.model('Certificate', certificateSchema)
