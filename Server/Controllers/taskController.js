const Task = require('../Models/taskModel')
const Registration = require('../Models/registrationModel')
const Notification = require('../Models/notificationModel')
const cloudinary = require('../config/cloudinary')
const { uploadToCloudinary } = require('../utils/cloudinaryUpload')
const { sendTaskAssignedEmail, sendTaskReviewedEmail, sendAdminTaskSubmissionEmail } = require('../config/mailer')

/**
 * Generates an authenticated Cloudinary download URL for raw files (e.g. .zip)
 * Bypasses public CDN 401 restrictions by signing with API credentials.
 */
const generateSignedZipUrl = (task) => {
  const rawUrl = task.zipFileUrl || task.zipFile || ''
  if (!rawUrl) return ''

  // Extract Cloudinary publicId
  let publicId = task.cloudinaryPublicId
  if (!publicId && rawUrl.includes('cloudinary.com')) {
    const parts = rawUrl.split('/upload/')
    if (parts[1]) {
      publicId = parts[1].replace(/^v\d+\//, '').replace(/^s--[^/]+--\//, '').replace(/^fl_[^/]+\//, '')
    }
  }

  if (publicId && rawUrl.includes('cloudinary.com')) {
    try {
      return cloudinary.utils.private_download_url(publicId, 'zip', {
        resource_type: 'raw',
        type: 'upload',
        attachment: true,
        expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours validity
      })
    } catch (e) {
      console.error('Cloudinary signed URL error:', e.message)
    }
  }

  return rawUrl
}

exports.getAll = async (req, res) => {
  try {
    const { intern, email, status } = req.query
    const filter = {}
    if (intern) filter.intern = intern
    if (email) filter.internEmail = email.toLowerCase()
    if (status && status !== 'All') filter.status = status

    const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean()

    const isInternReq = req.intern && (!req.user || req.user.role !== 'admin')
    const sanitized = tasks.map((t) => {
      const signedZipUrl = generateSignedZipUrl(t)
      const resObj = {
        ...t,
        zipFileUrl: signedZipUrl || t.zipFileUrl,
        zipFile: signedZipUrl || t.zipFile,
      }

      if (isInternReq && !t.isPublished) {
        resObj.feedback = ''
        resObj.adminFeedback = ''
        resObj.marks = null
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
      const reg = await Registration.findOne({ name: intern, status: 'Approved' }).sort({ createdAt: -1 })
      if (reg) {
        resolvedEmail = reg.email
        regId = reg._id
      }
    }

    const task = await Task.create({
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
      isPublished: false,
    })

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
        await Notification.create({
          recipientId: regId || null,
          email: resolvedEmail,
          internName: intern,
          title: `New Task Assigned: ${name}`,
          message: `Practical task "${name}" for ${technology} has been assigned. Due Date: ${new Date(dueDate).toLocaleDateString('en-GB')}.`,
          type: 'task_assigned',
        })
      } catch (e) {
        console.error('Task notification error:', e.message)
      }
    }

    res.status(201).json({ success: true, message: 'Task assigned successfully.', data: task })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.submitZip = async (req, res) => {
  try {
    const { id } = req.params
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a .zip project file.' })
    }

    const task = await Task.findById(id)
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' })
    }

    const upload = await uploadToCloudinary(req.file.buffer, {
      folder: 'intern-desk/tasks',
      resource_type: 'raw',
      originalname: req.file.originalname || `task_${task._id}.zip`,
    })

    task.zipFile = upload.secure_url
    task.zipFileUrl = upload.secure_url
    task.cloudinaryPublicId = upload.public_id
    task.submissionStatus = 'submitted'
    task.status = 'Completed'
    task.submittedAt = new Date()
    await task.save()

    const signedUrl = generateSignedZipUrl(task)

    // Notify Admin via In-App Notification and Email Alert
    try {
      await Notification.create({
        recipientRole: 'admin',
        internName: task.intern || 'Intern',
        internEmail: task.internEmail || '',
        technology: task.technology || 'General',
        title: `Task Submitted: ${task.intern || 'Intern'} (${task.taskName || task.title})`,
        message: `${task.intern || 'Intern'} uploaded a completed project ZIP for practical task "${task.taskName || task.title}" (${task.technology}).`,
        type: 'task_submitted',
        referenceId: task._id,
        meta: {
          taskId: task._id,
          taskName: task.taskName || task.title,
          technology: task.technology,
          internEmail: task.internEmail,
        },
      })
    } catch (notifErr) {
      console.error('Failed to create admin task notification:', notifErr.message)
    }

    try {
      await sendAdminTaskSubmissionEmail({
        internName: task.intern || 'Intern',
        internEmail: task.internEmail || '',
        technology: task.technology || 'General',
        taskName: task.taskName || task.title,
        submittedAt: new Date(),
      })
    } catch (emailErr) {
      console.error('Failed to send admin task email alert:', emailErr.message)
    }

    res.json({
      success: true,
      message: 'Practical task .zip uploaded successfully to Cloudinary.',
      data: {
        ...task.toObject(),
        zipFileUrl: signedUrl,
        zipFile: signedUrl,
      },
    })
  } catch (error) {
    console.error('Task zip upload error:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to upload task ZIP file.' })
  }
}

exports.downloadZip = async (req, res) => {
  try {
    const { id } = req.params
    const task = await Task.findById(id)
    if (!task || (!task.zipFileUrl && !task.zipFile)) {
      return res.status(404).send('ZIP project file not found for this task.')
    }

    const signedUrl = generateSignedZipUrl(task)
    if (signedUrl) {
      return res.redirect(signedUrl)
    }

    return res.status(404).send('File URL is invalid.')
  } catch (err) {
    console.error('Download ZIP error:', err)
    res.status(500).send('Error downloading ZIP file.')
  }
}

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['Pending', 'Completed', 'Not Done', 'Partially Done'].includes(status)) {
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

exports.sendFeedback = async (req, res) => {
  try {
    const { id } = req.params
    const { feedback, marks, isPublished } = req.body

    const shouldPublish = isPublished !== undefined ? Boolean(isPublished) : true
    const updateData = {
      feedback: feedback || '',
      adminFeedback: feedback || '',
      reviewed: true,
      feedbackSent: shouldPublish,
      submissionStatus: 'reviewed',
      isPublished: shouldPublish,
    }

    if (marks !== undefined && marks !== null && marks !== '') {
      const numMarks = Number(marks)
      if (isNaN(numMarks) || numMarks < 0 || numMarks > 10) {
        return res.status(400).json({ success: false, message: 'Marks must be a valid number between 0 and 10.' })
      }
      updateData.marks = numMarks
    }

    const task = await Task.findByIdAndUpdate(id, updateData, { new: true })
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' })
    }

    if (shouldPublish && task.internEmail) {
      try {
        await sendTaskReviewedEmail(task.internEmail, {
          internName: task.intern,
          taskName: task.taskName,
          marks: task.marks,
          feedback: task.adminFeedback || task.feedback,
          technology: task.technology,
        })
      } catch (e) {
        console.error('Task review email error:', e.message)
      }

      try {
        await Notification.create({
          recipientId: task.assignedInternId || null,
          email: task.internEmail,
          internName: task.intern,
          title: `Task Review Published: ${task.taskName}`,
          message: `Your practical task "${task.taskName}" has been reviewed.${task.marks !== null ? ` Marks: ${task.marks}/10.` : ''}`,
          type: 'task_reviewed',
        })
      } catch (e) {
        console.error('Notification error:', e.message)
      }
    }

    res.json({
      success: true,
      message: shouldPublish ? 'Feedback and evaluation published to intern.' : 'Evaluation saved.',
      data: task,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
