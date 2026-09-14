const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  taskName: { type: String, required: true, trim: true },
  title: { type: String, trim: true },
  taskDescription: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  technology: { type: String, required: true, trim: true },
  assignedInternId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' },
  intern: { type: String, required: true, trim: true },
  internEmail: { type: String, default: '', lowercase: true, trim: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed', 'Not Done', 'Partially Done'],
    default: 'Pending',
  },
  submissionStatus: {
    type: String,
    enum: ['pending', 'submitted', 'reviewed'],
    default: 'pending',
  },
  reviewStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Rejected'],
    default: 'Pending',
  },
  driveLink: { type: String, default: '', trim: true },
  zipFile: { type: String, default: '' },
  zipFileUrl: { type: String, default: '' },
  cloudinaryPublicId: { type: String, default: '' },
  submittedAt: { type: Date, default: null },
  submissionDate: { type: Date, default: null },
  reviewed: { type: Boolean, default: false },
  feedbackSent: { type: Boolean, default: false },
  feedback: { type: String, default: '', trim: true },
  adminFeedback: { type: String, default: '', trim: true },
  feedbackMark: { type: String, default: '' },
  marks: { type: Number, default: null },
  isPublished: { type: Boolean, default: false },
  isReupload: { type: Boolean, default: false },
}, { timestamps: true })

taskSchema.pre('save', function (next) {
  if (this.taskName && !this.title) this.title = this.taskName
  if (this.title && !this.taskName) this.taskName = this.title
  if (this.taskDescription && !this.description) this.description = this.taskDescription
  if (this.description && !this.taskDescription) this.taskDescription = this.description
  if (this.feedback && !this.adminFeedback) this.adminFeedback = this.feedback
  if (this.adminFeedback && !this.feedback) this.feedback = this.adminFeedback
  if (this.submittedAt && !this.submissionDate) this.submissionDate = this.submittedAt
  if (this.submissionDate && !this.submittedAt) this.submittedAt = this.submissionDate
  next()
})

module.exports = mongoose.model('Task', taskSchema)
