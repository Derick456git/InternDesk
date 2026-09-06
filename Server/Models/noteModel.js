const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema({
  internName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  technology: { type: String, required: true },
  dayNumber: { type: Number, required: true },
  chapter: { type: String, default: '' },
  topic: { type: String, default: '' },
  content: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true })

module.exports = mongoose.model('Note', noteSchema)
