const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  technology: { type: String, default: '', trim: true },
  topic: { type: String, required: true, trim: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  type: { type: String, enum: ['Objective', 'Descriptive'], required: true },
  questionText: { type: String, required: true, trim: true },
  options: [{ type: String }],
  correctAnswer: { type: String, default: '', trim: true },
  defaultMarks: { type: Number, default: 2 },
}, { timestamps: true })

questionSchema.pre('save', function (next) {
  if (this.type === 'Objective') {
    this.defaultMarks = 2
  } else if (this.type === 'Descriptive') {
    this.defaultMarks = 5
  }
  next()
})

module.exports = mongoose.model('Question', questionSchema)
