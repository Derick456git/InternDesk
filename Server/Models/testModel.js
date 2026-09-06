const mongoose = require('mongoose')

const testSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  testName: { type: String, trim: true },
  technology: { type: String, trim: true },
  syllabusDuration: { type: Number, default: 0 },
  assessmentNumber: { type: Number },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  topics: [{ type: String }],
  questionCount: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 35 },
  durationMinutes: { type: Number, default: 25 },
  isPublished: { type: Boolean, default: false },
  isAssigned: { type: Boolean, default: false },
  publishedAt: { type: Date, default: null },
}, { timestamps: true })

testSchema.index({ technology: 1, syllabusDuration: 1, assessmentNumber: 1 }, { unique: true, sparse: true })

module.exports = mongoose.model('Test', testSchema)