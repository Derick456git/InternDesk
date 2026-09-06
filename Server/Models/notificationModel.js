const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' },
  recipientRole: { type: String, enum: ['intern', 'admin'], default: 'intern' },
  email: { type: String, lowercase: true, trim: true },
  internName: { type: String, default: '' },
  internEmail: { type: String, default: '' },
  technology: { type: String, default: '' },
  title: { type: String, default: '' },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'course_completed',
      'task_assigned',
      'test_unlocked',
      'result_published',
      'task_reviewed',
      'note_reviewed',
      'note_submitted',
      'test_submitted',
      'task_submitted',
      'general',
    ],
    default: 'general',
  },
  read: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  meta: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true })

notificationSchema.pre('save', function (next) {
  if (this.isRead && !this.read) this.read = this.isRead
  if (this.read && !this.isRead) this.isRead = this.read
  next()
})

module.exports = mongoose.model('Notification', notificationSchema)
