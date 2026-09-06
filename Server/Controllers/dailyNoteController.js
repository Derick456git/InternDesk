const DailyNote = require('../Models/dailyNoteModel')
const Registration = require('../Models/registrationModel')
const SyllabusAssignment = require('../Models/syllabusAssignmentModel')
const Notification = require('../Models/notificationModel')
const TestSubmission = require('../Models/testSubmissionModel')
const { uploadToCloudinary } = require('../utils/cloudinaryUpload')
const { sendDailyNotesFeedbackEmail, sendAdminNotesSubmissionEmail } = require('../config/mailer')

const resolveRegistration = async (email) => {
  return Registration.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 })
}

const extractDurationDays = (syllabusName) => {
  const match = String(syllabusName || '').match(/(\d+)\s*day/i)
  return match ? parseInt(match[1], 10) : null
}

exports.createDailyNote = async (req, res) => {
  try {
    const { technology, dayNumber } = req.body
    const files = req.files || {}
    const noteFile = files.note && files.note[0]
    const bookFile = files.book && files.book[0]

    if (!noteFile || !bookFile) {
      return res.status(400).json({ success: false, message: 'Please upload both the Note (.docx) and Book (.xlsx) before submitting.' })
    }

    const day = Number(dayNumber)
    if (!technology || !dayNumber || !Number.isInteger(day)) {
      return res.status(400).json({ success: false, message: 'Technology and a valid day are required.' })
    }

    const registration = await resolveRegistration(req.intern.email)
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Intern record not found.' })
    }

    const assignment = await SyllabusAssignment.findOne({
      internId: registration._id,
      technology,
      status: 'Active',
    })
    if (!assignment) {
      return res.status(403).json({ success: false, message: 'You do not have an active assignment for this technology.' })
    }

    const maxDay = extractDurationDays(assignment.syllabusName)
    if (maxDay !== null && (day < 1 || day > maxDay)) {
      return res.status(400).json({ success: false, message: `Day must be between 1 and ${maxDay} for this syllabus.` })
    }

    // Check if already submitted
    const existingSubmission = await DailyNote.findOne({
      internId: registration._id,
      technology,
      dayNumber: day,
    })
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: `You have already submitted notes for Day ${day}.`,
      })
    }

    // Sequential day check: Intern must upload notes sequentially (Day 1, Day 2, ..., Day N)
    if (day > 1) {
      const existingDays = await DailyNote.find({
        internId: registration._id,
        technology,
        dayNumber: { $gte: 1, $lt: day },
      }).select('dayNumber').lean()

      const submittedDaySet = new Set(existingDays.map((d) => d.dayNumber))
      for (let p = 1; p < day; p++) {
        if (!submittedDaySet.has(p)) {
          return res.status(400).json({
            success: false,
            message: `Cannot select or upload Day ${day}. Please upload Day ${p} notes first. Daily notes must be submitted in sequential order without skipping days.`,
          })
        }
      }
    }

    // Test validation: Intern must attend & submit Test m before uploading Day > 5*m
    const prevTest = Math.floor((day - 1) / 5)
    if (prevTest >= 1) {
      for (let m = 1; m <= prevTest; m++) {
        const startDay = (m - 1) * 5 + 1
        const endDay = m * 5
        const testNotesCount = await DailyNote.countDocuments({
          internId: registration._id,
          technology,
          dayNumber: { $gte: startDay, $lte: endDay },
        })

        if (testNotesCount < 5) {
          return res.status(403).json({
            success: false,
            message: `Please upload all daily notes for Days ${startDay}–${endDay} first.`,
          })
        }

        const testSub = await TestSubmission.findOne({
          email: registration.email.toLowerCase(),
          technology,
          $or: [
            { assessmentNumber: m },
            { testName: new RegExp(`Assessment\\s*${m}`, 'i') },
          ],
        })

        if (!testSub) {
          return res.status(403).json({
            success: false,
            message: `Assessment ${m} for ${technology} is unlocked. You must attend and submit Assessment ${m} in 'Attend Test' before uploading notes for Day ${day}.`,
          })
        }
      }
    }

    // Direct in-memory buffer upload to Cloudinary (No local file created)
    let noteUpload, bookUpload
    try {
      [noteUpload, bookUpload] = await Promise.all([
        uploadToCloudinary(noteFile.buffer, {
          folder: 'intern-desk/notes',
          resource_type: 'raw',
          originalname: noteFile.originalname || `note_day_${day}.docx`,
        }),
        uploadToCloudinary(bookFile.buffer, {
          folder: 'intern-desk/books',
          resource_type: 'raw',
          originalname: bookFile.originalname || `book_day_${day}.xlsx`,
        }),
      ])
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr.message || uploadErr)
      return res.status(502).json({
        success: false,
        message: uploadErr.message || 'Failed to upload files to Cloudinary storage. Please check your cloud storage credentials and permissions.',
      })
    }

    if (!noteUpload?.secure_url || !bookUpload?.secure_url) {
      return res.status(500).json({
        success: false,
        message: 'Cloud storage did not return a valid secure URL.',
      })
    }

    const submission = await DailyNote.findOneAndUpdate(
      { internId: registration._id, technology, dayNumber: day },
      {
        internId: registration._id,
        technology,
        dayNumber: day,
        noteFileUrl: noteUpload.secure_url,
        cloudinaryPublicId: noteUpload.public_id,
        bookFileUrl: bookUpload.secure_url,
        bookCloudinaryPublicId: bookUpload.public_id,
        noteFilePath: noteUpload.secure_url,
        bookFilePath: bookUpload.secure_url,
        submissionDate: new Date(),
        status: 'Pending',
        reviewStatus: 'Pending',
      },
      { upsert: true, new: true }
    )

    // Notify Admin via In-App Notification and Email Alert
    try {
      await Notification.create({
        recipientRole: 'admin',
        internName: registration.name,
        internEmail: registration.email,
        technology,
        title: `Daily Notes: ${registration.name} (${technology} Day ${day})`,
        message: `${registration.name} submitted Day ${day} Notes & Book for ${technology}.`,
        type: 'note_submitted',
        referenceId: submission._id,
        meta: { dayNumber: day, technology, internId: registration._id, submissionId: submission._id },
      })
    } catch (notifErr) {
      console.error('Failed to create admin note notification:', notifErr.message)
    }

    try {
      await sendAdminNotesSubmissionEmail({
        internName: registration.name,
        internEmail: registration.email,
        technology,
        dayNumber: day,
        submissionDate: new Date(),
      })
    } catch (emailErr) {
      console.error('Failed to send admin notes email alert:', emailErr.message)
    }

    res.status(201).json({
      success: true,
      message: 'Daily notes and book uploaded successfully to Cloudinary.',
      data: submission,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already submitted the note and book for this day.' })
    }
    console.error('Create daily note error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
}

exports.getMyDailyNotes = async (req, res) => {
  try {
    const registration = await resolveRegistration(req.intern.email)
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Intern record not found.' })
    }
    const submissions = await DailyNote.find({ internId: registration._id })
      .sort({ technology: 1, dayNumber: 1 })
      .lean()

    const mapped = submissions.map((s) => ({
      ...s,
      noteFileUrl: s.noteFileUrl || s.noteFilePath,
      bookFileUrl: s.bookFileUrl || s.bookFilePath,
      status: s.status || (s.reviewStatus === 'Completed' ? 'Approved' : s.reviewStatus || 'Pending'),
    }))

    res.json({ success: true, data: mapped })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getAllDailyNotes = async (req, res) => {
  try {
    const submissions = await DailyNote.find()
      .sort({ submissionDate: -1 })
      .lean()

    const internIds = [...new Set(submissions.map((s) => String(s.internId)))]
    const registrations = await Registration.find({ _id: { $in: internIds } }).lean()
    const regById = new Map(registrations.map((r) => [String(r._id), r]))

    const data = submissions.map((s) => ({
      ...s,
      noteFileUrl: s.noteFileUrl || s.noteFilePath,
      bookFileUrl: s.bookFileUrl || s.bookFilePath,
      status: s.status || (s.reviewStatus === 'Completed' ? 'Approved' : s.reviewStatus || 'Pending'),
      internName: regById.get(String(s.internId))?.name || 'Unknown',
      internEmail: regById.get(String(s.internId))?.email || '',
    }))

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, score, feedback } = req.body

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved, Rejected, or Pending.' })
    }

    const updateData = {
      status,
      reviewStatus: status === 'Approved' ? 'Completed' : status,
    }
    if (feedback !== undefined) updateData.adminFeedback = feedback
    if (score !== undefined && score !== null && score !== '') {
      updateData.feedbackMark = `${score}/10`
    }

    const submission = await DailyNote.findByIdAndUpdate(id, updateData, { new: true })
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' })
    }

    const registration = await Registration.findById(submission.internId)
    if (registration) {
      try {
        await sendDailyNotesFeedbackEmail(registration.email, {
          internName: registration.name,
          technology: submission.technology,
          dayNumber: submission.dayNumber,
          status,
          score: score !== undefined ? score : (submission.feedbackMark ? submission.feedbackMark.split('/')[0] : null),
          feedback: feedback || submission.adminFeedback,
        })
      } catch (e) {
        console.error('Note review email failed:', e.message)
      }

      try {
        await Notification.create({
          recipientId: registration._id,
          email: registration.email,
          internName: registration.name,
          title: `Day ${submission.dayNumber} Notes ${status}`,
          message: `Your Day ${submission.dayNumber} notes for ${submission.technology} have been ${status.toLowerCase()}.${score ? ` Score: ${score}/10.` : ''}`,
          type: 'note_reviewed',
        })
      } catch (e) {
        console.error('Notification failed:', e.message)
      }
    }

    res.json({
      success: true,
      message: `Daily note marked as ${status}.`,
      data: submission,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.giveFeedback = async (req, res) => {
  try {
    const { id } = req.params
    const { score, feedback, status } = req.body

    const numericScore = Number(score)
    if (score === undefined || score === null || score === '') {
      return res.status(400).json({ success: false, message: 'Please enter a score for the submission.' })
    }
    if (!Number.isInteger(numericScore) || numericScore < 0 || numericScore > 10) {
      return res.status(400).json({ success: false, message: 'Score must be an integer between 0 and 10.' })
    }

    const submission = await DailyNote.findById(id)
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' })
    }

    const finalStatus = status || (numericScore >= 5 ? 'Approved' : 'Rejected')

    submission.feedbackMark = `${numericScore}/10`
    submission.reviewStatus = 'Completed'
    submission.status = finalStatus
    if (feedback) submission.adminFeedback = feedback
    await submission.save()

    const registration = await Registration.findById(submission.internId)
    if (registration) {
      try {
        await sendDailyNotesFeedbackEmail(registration.email, {
          internName: registration.name,
          technology: submission.technology,
          dayNumber: submission.dayNumber,
          status: finalStatus,
          score: numericScore,
          feedback: feedback || submission.adminFeedback,
        })
      } catch (emailError) {
        console.error('Daily notes feedback email failed:', emailError.message)
      }

      try {
        await Notification.create({
          recipientId: registration._id,
          email: registration.email,
          internName: registration.name,
          title: `Day ${submission.dayNumber} Notes Reviewed`,
          message: `Your Day ${submission.dayNumber} notes for ${submission.technology} were reviewed: ${numericScore}/10 (${finalStatus}).`,
          type: 'note_reviewed',
        })
      } catch (notifErr) {
        console.error('Notification failed:', notifErr.message)
      }
    }

    res.json({
      success: true,
      message: `Feedback of ${numericScore}/10 saved and note marked as ${finalStatus}.`,
      data: submission,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}