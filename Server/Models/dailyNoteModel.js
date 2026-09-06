const mongoose = require('mongoose')

const dailyNoteSchema = new mongoose.Schema({
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
  technology: { type: String, required: true, trim: true },
  dayNumber: { type: Number, required: true },
  noteFileUrl: { type: String, default: '' },
  cloudinaryPublicId: { type: String, default: '' },
  bookFileUrl: { type: String, default: '' },
  bookCloudinaryPublicId: { type: String, default: '' },
  noteFilePath: { type: String, default: '' }, // backwards-compatibility
  bookFilePath: { type: String, default: '' }, // backwards-compatibility
  submissionDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed'], default: 'Pending' },
  adminFeedback: { type: String, default: '', trim: true },
  feedbackMark: { type: String, default: 'Pending', trim: true },
}, { timestamps: true })

dailyNoteSchema.index({ internId: 1, technology: 1, dayNumber: 1 }, { unique: true })

module.exports = mongoose.model('DailyNote', dailyNoteSchema)