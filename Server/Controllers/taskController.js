const Task = require('../Models/taskModel')
const Registration = require('../Models/registrationModel')
const Notification = require('../Models/notificationModel')
const { sendTaskAssignedEmail, sendTaskReviewedEmail, sendAdminTaskSubmissionEmail } = require('../config/mailer')
const { withRetry } = require('../utils/dbRetry')

exports.getAll = async (req, res) => {
  try {
    const { intern, email, status } = req.query
    const filter = {}
    if (intern) filter.intern = intern
    if (email) filter.internEmail = email.toLowerCase()
    if (status && status !== 'All') filter.status = status

    const tasks = await withRetry(() => Task.find(filter).sort({ createdAt: -1 }).lean())

    const isInternReq = req.intern && (!req.user || req.user.role !== 'admin')
    const sanitized = tasks.map((t) => {
      const resObj = {
        ...t,
        driveLink: t.driveLink || '',
        status: t.status || (t.reviewStatus === 'Completed' ? 'Approved' : t.reviewStatus || 'Pending'),
      }

      if (isInternReq && !t.isPublished) {
        resObj.feedback = ''
        resObj.adminFeedback = ''
        resObj.marks = null
        resObj.feedbackMark = ''
      }
      return resObj
    })

    res.json({ success: true, data: sanitized })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { taskName, title, taskDescription, description, technology, intern, internEmail, dueDate, assignedInternId } = req.body
    const name = (taskName || title || '').trim()
    const desc = (taskDescription || description || '').trim()

    if (!name || !technology || !intern || !dueDate) {
      return res.status(400).json({ success: false, message: 'Task name, technology, intern, and due date are required.' })
    }

    let resolvedEmail = internEmail
    let regId = assignedInternId
    if (!resolvedEmail || !regId) {
      const reg = await withRetry(() => Registration.findOne({ name: intern, status: 'Approved' }).sort({ createdAt: -1 }))
      if (reg) {
        resolvedEmail = reg.email
        regId = reg._id
      }
    }

    const task = await withRetry(() => Task.create({
      taskName: name,
      title: name,
      taskDescription: desc,
      description: desc,
      technology,
      intern,
      internEmail: resolvedEmail || '',
      assignedInternId: regId || null,
      dueDate: new Date(dueDate),
      status: 'Pending',
      submissionStatus: 'pending',
      reviewStatus: 'Pending',
      isPublished: false,
    }))

    if (resolvedEmail) {
      try {
        await sendTaskAssignedEmail(resolvedEmail, {
          internName: intern,
          taskName: name,
          technology,
          dueDate,
          taskDescription: desc,
        })
      } catch (e) {
        console.error('Task assigned email error:', e.message)
      }

      try {
        await withRetry(() => Notification.create({
          recipientId: regId || null,
          email: resolvedEmail,
          internName: intern,
          title: `New Task Assigned: ${name}`,
          message: `Practical task "${name}" for ${technology} has been assigned. Due Date: ${new Date(dueDate).toLocaleDateString('en-GB')}.`,
          type: 'task_assigned',
        }))
      } catch (e) {
        console.error('Task notification error:', e.message)
      }
    }

    res.status(201).json({ success: true, message: 'Task assigned successfully.', data: task })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Submit / Re-upload Google Drive link for Practical Task
 */
exports.submitLink = async (req, res) => {
  try {
    const { id } = req.params
    const { driveLink } = req.body

    let trimmedLink = (driveLink || '').trim()
    if (!trimmedLink) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Google Drive shareable link.' })
    }

    // Ensure absolute URL
    if (!trimmedLink.startsWith('http://') && !trimmedLink.startsWith('https://')) {
      trimmedLink = `https://${trimmedLink}`
    }

    const task = await withRetry(() => Task.findById(id))
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' })
    }

    const isAlreadyApproved = task.status === 'Approved' || task.reviewStatus === 'Completed'
    if (isAlreadyApproved) {
      return res.status(400).json({ success: false, message: 'This practical task has already been approved.' })
    }

    const isReupload = task.status === 'Rejected' || task.reviewStatus === 'Rejected' || Boolean(task.driveLink)

    const updatedTask = await withRetry(() => Task.findByIdAndUpdate(
      id,
      {
        driveLink: trimmedLink,
        submissionStatus: 'submitted',
        status: 'Pending',
        reviewStatus: 'Pending',
        submittedAt: new Date(),
        submissionDate: new Date(),
        adminFeedback: '',
        feedback: '',
        feedbackMark: 'Pending',
        isPublished: false,
        reviewed: false,
        isReupload: Boolean(isReupload),
      },
      { new: true }
    ))

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found during update.' })
    }

    // Notify Admin via In-App Notification and Email Alert
    try {
      await withRetry(() => Notification.create({
        recipientRole: 'admin',
        internName: updatedTask.intern || 'Intern',
        internEmail: updatedTask.internEmail || '',
        technology: updatedTask.technology || 'General',
        title: isReupload
          ? `Practical Task Re-uploaded: ${updatedTask.intern || 'Intern'} (${updatedTask.taskName || updatedTask.title})`
          : `Practical Task Submitted: ${updatedTask.intern || 'Intern'} (${updatedTask.taskName || updatedTask.title})`,
        message: isReupload
          ? `${updatedTask.intern || 'Intern'} re-uploaded the Google Drive project link for practical task "${updatedTask.taskName || updatedTask.title}" (${updatedTask.technology}).`
          : `${updatedTask.intern || 'Intern'} submitted the Google Drive project link for practical task "${updatedTask.taskName || updatedTask.title}" (${updatedTask.technology}).`,
        type: 'task_submitted',
        referenceId: updatedTask._id,
        meta: {
          taskId: updatedTask._id,
          taskName: updatedTask.taskName || updatedTask.title,
          technology: updatedTask.technology,
          internEmail: updatedTask.internEmail,
          driveLink: trimmedLink,
          isReupload: Boolean(isReupload),
        },
      }))
    } catch (notifErr) {
      console.error('Failed to create admin task notification:', notifErr.message)
    }

    try {
      await sendAdminTaskSubmissionEmail({
        internName: updatedTask.intern || 'Intern',
        internEmail: updatedTask.internEmail || '',
        technology: updatedTask.technology || 'General',
        taskName: updatedTask.taskName || updatedTask.title,
        driveLink: trimmedLink,
        isReupload: Boolean(isReupload),
        submittedAt: new Date(),
      })
    } catch (emailErr) {
      console.error('Failed to send admin task email alert:', emailErr.message)
    }

    res.json({
      success: true,
      message: isReupload
        ? 'Practical task Google Drive link re-uploaded successfully for admin review.'
        : 'Practical task Google Drive link submitted successfully.',
      data: updatedTask,
    })
  } catch (error) {
    console.error('Task link submission error:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to submit task link.' })
  }
}

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['Pending', 'Approved', 'Rejected', 'Completed', 'Not Done', 'Partially Done'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }
    const task = await Task.findByIdAndUpdate(id, { status }, { new: true })
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Send Feedback & Evaluation for Practical Task (matches Evaluate Daily Notes format)
 */
exports.sendFeedback = async (req, res) => {
  try {
    const { id } = req.params
    const { score, marks, feedback, status } = req.body

    const rawScore = score !== undefined && score !== null && score !== '' ? score : marks
    if (rawScore === undefined || rawScore === null || rawScore === '') {
      return res.status(400).json({ success: false, message: 'Please enter a valid mark (0-10) for the task.' })
    }

    const numericScore = Number(rawScore)
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      return res.status(400).json({ success: false, message: 'Marks must be a valid number between 0 and 10.' })
    }

    const finalStatus = status && ['Approved', 'Rejected'].includes(status)
      ? status
      : (numericScore >= 5 ? 'Approved' : 'Rejected')

    const updateData = {
      marks: numericScore,
      feedbackMark: `${numericScore}/10`,
      feedback: (feedback || '').trim(),
      adminFeedback: (feedback || '').trim(),
      status: finalStatus,
      reviewStatus: finalStatus === 'Approved' ? 'Completed' : 'Rejected',
      reviewed: true,
      feedbackSent: true,
      submissionStatus: 'reviewed',
      isPublished: true,
    }

    const task = await withRetry(() => Task.findByIdAndUpdate(id, updateData, { new: true }))
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' })
    }

    // Send email to intern
    if (task.internEmail) {
      try {
        await sendTaskReviewedEmail(task.internEmail, {
          internName: task.intern,
          taskName: task.taskName || task.title,
          marks: numericScore,
          feedback: task.adminFeedback,
          technology: task.technology,
          status: finalStatus,
          driveLink: task.driveLink,
        })
      } catch (e) {
        console.error('Task review email error:', e.message)
      }

      try {
        await withRetry(() => Notification.create({
          recipientId: task.assignedInternId || null,
          email: task.internEmail,
          internName: task.intern,
          title: `Practical Task ${task.taskName} ${finalStatus === 'Approved' ? 'Approved' : 'Revision Required'}`,
          message: `Your practical task "${task.taskName}" for ${task.technology} was evaluated: ${numericScore}/10 (${finalStatus}).${task.adminFeedback ? ` Feedback: "${task.adminFeedback}"` : ''}`,
          type: 'task_reviewed',
        }))
      } catch (e) {
        console.error('Notification error:', e.message)
      }
    }

    res.json({
      success: true,
      message: `Feedback of ${numericScore}/10 (${finalStatus}) with written remarks sent successfully to ${task.intern}.`,
      data: task,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

