const mongoose = require('mongoose')

const submittedAnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  questionText: { type: String, default: '' },
  type: { type: String, enum: ['Objective', 'Descriptive'], default: 'Objective' },
  isObjective: { type: Boolean, default: false },
  options: [{ type: String }],
  correctAnswer: { type: String, default: '' },
  internAnswer: { type: String, default: '' },
  answerText: { type: String, default: '' },
  marksAwarded: { type: Number, default: 0 },
  maxMarks: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
})

const testSubmissionSchema = new mongoose.Schema({
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  internName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  technology: { type: String, required: true },
  testName: { type: String, required: true },
  assessmentNumber: { type: Number },
  syllabusDuration: { type: Number },
  answers: [submittedAnswerSchema],
  objectiveScore: { type: Number, default: 0 },
  descriptiveScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  totalMarksObtained: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  resultStatus: { type: String, enum: ['pending', 'passed', 'failed', 'Pending Evaluation', 'Passed', 'Failed'], default: 'pending' },
  status: { type: String, enum: ['Pending Evaluation', 'Completed', 'Not Published', 'Published'], default: 'Pending Evaluation' },
  isPublished: { type: Boolean, default: false },
  evaluatedAt: { type: Date, default: null },
  evaluatedBy: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true })

testSubmissionSchema.pre('save', function (next) {
  if (this.totalMarksObtained !== undefined && this.totalScore === 0 && this.totalMarksObtained !== 0) {
    this.totalScore = this.totalMarksObtained
  } else if (this.totalScore !== undefined) {
    this.totalMarksObtained = this.totalScore
  }
  if (this.totalScore !== undefined) {
    this.percentage = Number(((this.totalScore / 35) * 100).toFixed(2))
    if (this.status === 'Completed' || this.isPublished) {
      this.resultStatus = this.totalScore >= 21 ? 'passed' : 'failed'
    }
  }
  next()
})

module.exports = mongoose.model('TestSubmission', testSubmissionSchema)