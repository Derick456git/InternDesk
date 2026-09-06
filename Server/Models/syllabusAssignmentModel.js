const mongoose = require('mongoose')

const syllabusAssignmentSchema = new mongoose.Schema({
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
  technology: { type: String, required: true, trim: true },
  syllabusName: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  assignedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
}, { timestamps: true })

syllabusAssignmentSchema.index({ internId: 1, technology: 1 }, { unique: true })

module.exports = mongoose.model('SyllabusAssignment', syllabusAssignmentSchema)
