const mongoose = require('mongoose')

const syllabusRowSchema = new mongoose.Schema({
  week: { type: Number, default: 0 },
  day: { type: Number, required: true },
  chapter: { type: String, required: true, trim: true },
  topics: { type: String, default: '' },
})

const syllabusSchema = new mongoose.Schema({
  syllabusName: { type: String, required: true, trim: true },
  technology: { type: String, required: true, trim: true },
  durationDays: { type: Number, required: true, default: 0 },
  rows: [syllabusRowSchema],
}, { timestamps: true })

syllabusSchema.index({ technology: 1, syllabusName: 1 }, { unique: true })

module.exports = mongoose.model('Syllabus', syllabusSchema, 'syllabusses')