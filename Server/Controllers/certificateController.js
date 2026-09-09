const Certificate = require('../Models/certificateModel')
const Registration = require('../Models/registrationModel')
const SyllabusAssignment = require('../Models/syllabusAssignmentModel')
const Syllabus = require('../Models/syllabusModel')
const Test = require('../Models/testModel')
const TestSubmission = require('../Models/testSubmissionModel')
const DailyNote = require('../Models/dailyNoteModel')
const Task = require('../Models/taskModel')
const Notification = require('../Models/notificationModel')

// Helper to determine duration days from syllabus / assignment
const getDurationDays = (syllabusName, syllabus) => {
  if (syllabus && syllabus.durationDays) return syllabus.durationDays
  const match = String(syllabusName || '').match(/(\d+)\s*day/i)
  if (match) return parseInt(match[1], 10)
  return 30
}

/**
 * GET /api/certificates/completed-interns
 * Lists only the interns who have attended/submitted the final assessment (completed their course).
 */
exports.getCompletedInterns = async (req, res) => {
  try {
    const { search, technology } = req.query

    // 1. Fetch all test submissions
    const allSubmissions = await TestSubmission.find().sort({ submittedAt: -1 }).lean()

    // Group submissions by intern email + technology
    const internTechMap = new Map()

    for (const sub of allSubmissions) {
      if (!sub.email || !sub.technology) continue
      const key = `${sub.email.toLowerCase().trim()}_${sub.technology.toLowerCase().trim()}`
      if (!internTechMap.has(key)) {
        internTechMap.set(key, {
          internId: sub.internId,
          internName: sub.internName,
          email: sub.email.toLowerCase().trim(),
          technology: sub.technology.trim(),
          submissions: [],
        })
      }
      internTechMap.get(key).submissions.push(sub)
    }

    const completedInterns = []

    for (const [key, data] of internTechMap.entries()) {
      // Find matching registration
      let registration = null
      if (data.internId) {
        registration = await Registration.findById(data.internId).lean()
      }
      if (!registration) {
        registration = await Registration.findOne({ email: data.email }).lean()
      }

      const regId = registration?._id || data.internId

      // Find syllabus assignment
      const assignment = await SyllabusAssignment.findOne({
        $or: [
          { internId: regId },
          { internId: { $in: await Registration.find({ email: data.email }).distinct('_id') } },
        ],
        technology: { $regex: new RegExp(`^${data.technology}$`, 'i') },
      }).lean()

      let durationDays = 30
      let syllabusName = assignment?.syllabusName || '30 Day'
      let startDate = assignment?.startDate || registration?.createdAt || new Date()

      if (assignment) {
        const syllabus = await Syllabus.findOne({
          technology: { $regex: new RegExp(`^${data.technology}$`, 'i') },
          syllabusName: { $regex: new RegExp(`^${assignment.syllabusName.trim()}$`, 'i') },
        }).lean()
        durationDays = getDurationDays(assignment.syllabusName, syllabus)
      }

      // Total assessments calculated as 1 test per 5 days
      const totalAssessments = Math.max(1, Math.floor(durationDays / 5))

      // Check if intern attended the final assessment
      // Condition: any submission where assessmentNumber >= totalAssessments OR testName contains 'final' (case-insensitive) OR is the last assessment
      const finalSubmission = data.submissions.find((s) => {
        const assNum = Number(s.assessmentNumber || 0)
        const isFinalByName = /final/i.test(s.testName || '')
        return assNum >= totalAssessments || isFinalByName
      }) || (data.submissions.length >= totalAssessments ? data.submissions[0] : null)

      // Also check if course completed notification was issued
      const courseCompletedNotif = await Notification.findOne({
        email: data.email,
        technology: { $regex: new RegExp(`^${data.technology}$`, 'i') },
        type: 'course_completed',
      }).lean()

      const isCourseCompleted = !!finalSubmission || !!courseCompletedNotif

      if (isCourseCompleted) {
        // Calculate recommended From Date & To Date
        const start = new Date(startDate)
        const end = finalSubmission?.submittedAt ? new Date(finalSubmission.submittedAt) : new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000)

        const formatDate = (d) => {
          if (!d || isNaN(new Date(d).getTime())) return ''
          return new Date(d).toISOString().split('T')[0]
        }

        // Check if certificate already issued
        const certificate = await Certificate.findOne({
          email: data.email,
          technology: { $regex: new RegExp(`^${data.technology}$`, 'i') },
        }).sort({ createdAt: -1 }).lean()

        completedInterns.push({
          internId: regId,
          internName: registration?.name || data.internName,
          email: data.email,
          technology: data.technology,
          durationDays,
          syllabusName,
          startDate: formatDate(start),
          endDate: formatDate(end),
          completedAt: finalSubmission?.submittedAt || courseCompletedNotif?.createdAt || end,
          finalScore: finalSubmission?.totalScore || 0,
          finalPercentage: finalSubmission?.percentage || 0,
          finalResult: finalSubmission?.resultStatus || 'Passed',
          totalSubmissionsCount: data.submissions.length,
          totalAssessments,
          isIssued: !!certificate,
          certificateId: certificate?._id || null,
          certificateNumber: certificate?.certificateNumber || null,
          issueDate: certificate?.issueDate || null,
          issuedFromDate: certificate?.fromDate || null,
          issuedToDate: certificate?.toDate || null,
        })
      }
    }

    // Filter by search / technology if provided
    let filtered = completedInterns
    if (technology && technology !== 'All') {
      filtered = filtered.filter((i) => i.technology.toLowerCase() === technology.toLowerCase())
    }
    if (search) {
      const q = search.toLowerCase().trim()
      filtered = filtered.filter((i) =>
        i.internName.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.technology.toLowerCase().includes(q)
      )
    }

    // Sort by completion date descending
    filtered.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))

    res.json({ success: true, data: filtered })
  } catch (error) {
    console.error('getCompletedInterns error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * GET /api/certificates/summary/:internId
 * Returns full status summary for an intern:
 * Course details, test marks, pending tests/tasks, daily notes status.
 */
exports.getInternSummary = async (req, res) => {
  try {
    const { internId } = req.params
    const { technology, email: queryEmail } = req.query

    // Find registration
    let registration = null
    if (internId && internId !== 'undefined' && internId !== 'null') {
      try {
        registration = await Registration.findById(internId).lean()
      } catch (err) {
        // invalid object id fallback
      }
    }

    const email = (registration?.email || queryEmail || '').toLowerCase().trim()
    const tech = (technology || registration?.technology || '').trim()

    if (!email) {
      return res.status(400).json({ success: false, message: 'Intern identifier or email required' })
    }

    // 1. Registration details
    const internName = registration?.name || 'Intern'
    const internPhone = registration?.phone || ''
    const internCollege = registration?.college || ''

    // 2. Syllabus Assignment
    const allRegIds = await Registration.find({ email }).distinct('_id')
    const assignment = await SyllabusAssignment.findOne({
      internId: { $in: allRegIds },
      ...(tech ? { technology: { $regex: new RegExp(`^${tech}$`, 'i') } } : {}),
    }).lean()

    let durationDays = 30
    let syllabusName = assignment?.syllabusName || '30 Day Track'
    let startDate = assignment?.startDate || registration?.createdAt || new Date()

    if (assignment) {
      const syllabus = await Syllabus.findOne({
        technology: { $regex: new RegExp(`^${assignment.technology}$`, 'i') },
        syllabusName: { $regex: new RegExp(`^${assignment.syllabusName.trim()}$`, 'i') },
      }).lean()
      durationDays = getDurationDays(assignment.syllabusName, syllabus)
    }

    const totalAssessments = Math.max(1, Math.floor(durationDays / 5))

    // 3. Tests Assigned vs Attended
    const assignedTests = await Test.find({
      ...(tech ? { technology: { $regex: new RegExp(`^${tech}$`, 'i') } } : {}),
      syllabusDuration: durationDays,
    }).sort({ assessmentNumber: 1 }).lean()

    const submissions = await TestSubmission.find({
      email,
      ...(tech ? { technology: { $regex: new RegExp(`^${tech}$`, 'i') } } : {}),
    }).sort({ assessmentNumber: 1, submittedAt: 1 }).lean()

    const submittedTestIds = new Set(submissions.map((s) => String(s.testId)))

    const testsBreakdown = submissions.map((s) => ({
      _id: s._id,
      testName: s.testName,
      assessmentNumber: s.assessmentNumber || 1,
      objectiveScore: s.objectiveScore || 0,
      descriptiveScore: s.descriptiveScore || 0,
      totalScore: s.totalScore || s.totalMarksObtained || 0,
      maxMarks: 35,
      percentage: s.percentage || Number((((s.totalScore || 0) / 35) * 100).toFixed(1)),
      resultStatus: s.resultStatus || (s.totalScore >= 21 ? 'Passed' : 'Failed'),
      status: s.status || 'Completed',
      submittedAt: s.submittedAt,
      evaluatedBy: s.evaluatedBy || 'Admin',
    }))

    const pendingTests = assignedTests.filter((t) => !submittedTestIds.has(String(t._id)))

    // 4. Daily Notes Summary
    const dailyNotes = await DailyNote.find({
      email,
      ...(tech ? { technology: { $regex: new RegExp(`^${tech}$`, 'i') } } : {}),
    }).lean()

    const totalNotesSubmitted = dailyNotes.length
    const approvedNotes = dailyNotes.filter((n) => n.status === 'Approved').length
    const pendingNotes = dailyNotes.filter((n) => n.status === 'Pending').length
    const avgNoteScore = dailyNotes.length > 0
      ? (dailyNotes.reduce((acc, n) => acc + (Number(n.score) || 0), 0) / dailyNotes.length).toFixed(1)
      : '0.0'

    // 5. Tasks Summary
    const tasks = await Task.find({
      $or: [
        { internEmail: email },
        { assignedInternId: { $in: allRegIds } },
        { intern: { $regex: new RegExp(`^${internName}$`, 'i') } },
      ],
      ...(tech ? { technology: { $regex: new RegExp(`^${tech}$`, 'i') } } : {}),
    }).lean()

    const totalTasksAssigned = tasks.length
    const completedTasks = tasks.filter((t) => t.status === 'Completed' || t.submissionStatus === 'reviewed').length
    const pendingTasks = tasks.filter((t) => t.status === 'Pending' || t.submissionStatus === 'pending')

    // 6. Certificate Status
    const certificate = await Certificate.findOne({
      email,
      ...(tech ? { technology: { $regex: new RegExp(`^${tech}$`, 'i') } } : {}),
    }).lean()

    // 7. Overall Summary
    const passedTestsCount = testsBreakdown.filter((t) => t.resultStatus?.toLowerCase() === 'passed').length
    const totalScoreSum = testsBreakdown.reduce((acc, t) => acc + (t.totalScore || 0), 0)
    const avgTestPercentage = testsBreakdown.length > 0
      ? (testsBreakdown.reduce((acc, t) => acc + (t.percentage || 0), 0) / testsBreakdown.length).toFixed(1)
      : '0.0'

    res.json({
      success: true,
      data: {
        intern: {
          id: registration?._id || internId,
          name: internName,
          email,
          phone: internPhone,
          college: internCollege,
        },
        course: {
          technology: tech || assignment?.technology || 'Technology Track',
          syllabusName,
          durationDays,
          startDate,
          totalAssessments,
          isCompleted: submissions.length >= totalAssessments || testsBreakdown.some((t) => t.assessmentNumber >= totalAssessments),
        },
        tests: {
          totalAssigned: assignedTests.length || totalAssessments,
          totalAttended: submissions.length,
          passedTestsCount,
          failedTestsCount: submissions.length - passedTestsCount,
          avgPercentage: avgTestPercentage,
          totalScoreObtained: totalScoreSum,
          maxPossibleScore: submissions.length * 35,
          list: testsBreakdown,
          pending: pendingTests.map((t) => ({ _id: t._id, name: t.name || t.testName, assessmentNumber: t.assessmentNumber })),
        },
        dailyNotes: {
          totalSubmitted: totalNotesSubmitted,
          approved: approvedNotes,
          pending: pendingNotes,
          averageScore: avgNoteScore,
          requiredDays: durationDays,
        },
        tasks: {
          totalAssigned: totalTasksAssigned,
          completed: completedTasks,
          pendingCount: pendingTasks.length,
          list: tasks.map((t) => ({
            _id: t._id,
            title: t.taskName || t.title,
            dueDate: t.dueDate,
            status: t.status,
            submissionStatus: t.submissionStatus,
            marks: t.marks,
            feedback: t.feedback || t.adminFeedback,
          })),
        },
        certificate: certificate ? {
          id: certificate._id,
          certificateNumber: certificate.certificateNumber,
          fromDate: certificate.fromDate,
          toDate: certificate.toDate,
          issueDate: certificate.issueDate,
          status: certificate.status,
          issuedAt: certificate.createdAt,
        } : null,
      },
    })
  } catch (error) {
    console.error('getInternSummary error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * POST /api/certificates/issue
 * Saves/issues certificate details in MongoDB
 */
exports.issueCertificate = async (req, res) => {
  try {
    const { internId, internName, email, technology, fromDate, toDate, issueDate, meta } = req.body

    if (!internName || !internName.trim()) {
      return res.status(400).json({ success: false, message: 'Intern name is required' })
    }
    if (!technology || !technology.trim()) {
      return res.status(400).json({ success: false, message: 'Technology is required' })
    }
    if (!fromDate || !toDate || !issueDate) {
      return res.status(400).json({ success: false, message: 'From date, To date, and Date of issue are required' })
    }

    const trimmedEmail = (email || '').toLowerCase().trim()
    const trimmedTech = technology.trim()

    // Find existing certificate or create a new one
    let certificate = await Certificate.findOne({
      email: trimmedEmail,
      technology: { $regex: new RegExp(`^${trimmedTech}$`, 'i') },
    })

    if (certificate) {
      certificate.internName = internName.trim()
      certificate.fromDate = fromDate
      certificate.toDate = toDate
      certificate.issueDate = issueDate
      certificate.status = 'Issued'
      certificate.issuedBy = 'Admin'
      if (meta) certificate.meta = { ...certificate.meta, ...meta }
      await certificate.save()
    } else {
      certificate = await Certificate.create({
        internId: internId || null,
        internName: internName.trim(),
        email: trimmedEmail,
        technology: trimmedTech,
        fromDate,
        toDate,
        issueDate,
        status: 'Issued',
        issuedBy: 'Admin',
        meta: meta || {},
      })
    }

    // Create in-app notification for the intern
    try {
      await Notification.create({
        recipientId: internId || null,
        recipientRole: 'intern',
        email: trimmedEmail,
        internName: internName.trim(),
        technology: trimmedTech,
        title: `Certificate Issued – ${trimmedTech}`,
        message: `Congratulations! Your internship certificate for ${trimmedTech} has been issued with Certificate No: ${certificate.certificateNumber}.`,
        type: 'certificate_issued',
        referenceId: certificate._id,
        meta: {
          certificateNumber: certificate.certificateNumber,
          fromDate,
          toDate,
          issueDate,
          technology: trimmedTech,
        },
      })
    } catch (notifErr) {
      console.error('Failed to create certificate issued notification:', notifErr.message)
    }

    res.status(201).json({
      success: true,
      message: `Certificate issued successfully for ${internName}.`,
      data: certificate,
    })
  } catch (error) {
    console.error('issueCertificate error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * GET /api/certificates
 * Lists all issued certificates
 */
exports.getAllCertificates = async (req, res) => {
  try {
    const { search, technology } = req.query
    const filter = {}
    if (technology && technology !== 'All') {
      filter.technology = { $regex: new RegExp(`^${technology.trim()}$`, 'i') }
    }
    if (search) {
      const q = search.trim()
      filter.$or = [
        { internName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { certificateNumber: { $regex: q, $options: 'i' } },
      ]
    }
    const certificates = await Certificate.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: certificates })
  } catch (error) {
    console.error('getAllCertificates error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
