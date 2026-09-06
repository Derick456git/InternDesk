const mongoose = require('mongoose')

const questionMarkSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  questionText: { type: String, default: '' },
  type: { type: String, enum: ['Objective', 'Descriptive'], default: 'Objective' },
  maxMarks: { type: Number, default: 2 },
  marksAwarded: { type: Number, default: 0 },
})

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  questionText: { type: String, default: '' },
  type: { type: String, enum: ['Objective', 'Descriptive'], default: 'Objective' },
  maxMarks: { type: Number, default: 2 },
  answer: { type: String, default: '' },
})

const evaluationSchema = new mongoose.Schema({
  internName: { type: String, required: true },
  technology: { type: String, required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  testName: { type: String },
  totalScore: { type: String, default: null },
  status: { type: String, enum: ['Pending Evaluation', 'Not Published', 'Published'], default: 'Pending Evaluation' },
  marks: [questionMarkSchema],
  answers: [answerSchema],
}, { timestamps: true })

module.exports = mongoose.model('Evaluation', evaluationSchema)
