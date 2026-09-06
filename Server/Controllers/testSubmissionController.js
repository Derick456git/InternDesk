const jwt = require('jsonwebtoken')
const TestSubmission = require('../Models/testSubmissionModel')
const Test = require('../Models/testModel')
const Question = require('../Models/questionModel')
const Registration = require('../Models/registrationModel')
const Evaluation = require('../Models/evaluationModel')
const Notification = require('../Models/notificationModel')
const Syllabus = require('../Models/syllabusModel')
const SyllabusAssignment = require('../Models/syllabusAssignmentModel')
const {
  sendAdminTestSubmissionEmail,
  sendInternCourseCompletionEmail,
  sendAdminCourseCompletionEmail,
} = require('../config/mailer')

exports.submit = async (req, res) => {
  try {
    const { testId, answers } = req.body
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers array is required' })
    }

    const email = (req.body.email || req.intern?.email || '').toLowerCase().trim()
    if (!email) {
      return res.status(400).json({ success: false, message: 'Authenticated email is required' })
    }

    const registration = await Registration.findOne({ email }).sort({ createdAt: -1 })
    const internName = req.body.internName || registration?.name || 'Intern'

    let test = null
    if (testId) {
      test = await Test.findById(testId).populate('questions')
    }
    if (!test && req.body.testName) {
      test = await Test.findOne({
        $or: [{ testName: req.body.testName }, { name: req.body.testName }],
        ...(req.body.technology ? { technology: req.body.technology } : {}),
      }).populate('questions')
    }
    if (!test && req.body.technology && req.body.assessmentNumber) {
      test = await Test.findOne({
        technology: req.body.technology,
        assessmentNumber: Number(req.body.assessmentNumber),
      }).populate('questions')
    }
    if (!test) {
      return res.status(404).json({ success: false, message: 'Assessment not found' })
    }

    const technology = req.body.technology || test.technology || 'General'
    const testName = req.body.testName || test.testName || test.name
    const assessmentNumber = req.body.assessmentNumber || test.assessmentNumber || 1

    let objectiveScore = 0
    const processedAnswers = answers.map((ans) => {
      const question = test.questions.find((q) => q._id.toString() === String(ans.questionId))
      const rawAnswer = (ans.answerText ?? ans.internAnswer ?? ans.answer ?? '').trim()
      if (!question) {
        return {
          questionId: ans.questionId,
          questionText: ans.questionText || '',
          type: ans.isObjective ? 'Objective' : 'Descriptive',
          isObjective: Boolean(ans.isObjective),
          internAnswer: rawAnswer,
          answerText: rawAnswer,
          marksAwarded: 0,
          maxMarks: 0,
        }
      }

      const qType = question.type || (ans.isObjective ? 'Objective' : 'Descriptive')
      const isObj = qType === 'Objective'

      let isCorrect = false
      let expected = ''
      if (isObj) {
        expected = (question.correctAnswer || (question.options && question.options[0]) || '').trim()
        const normalizedExpected = expected.toLowerCase()
        const normalizedRaw = rawAnswer.toLowerCase()

        isCorrect = normalizedExpected === normalizedRaw

        // Handle letter/index matching if stored as 'A' or 'Option A'
        if (!isCorrect && question.options && question.options.length > 0) {
          const letterMap = { a: 0, b: 1, c: 2, d: 3 }
          const expectedIdx = letterMap[normalizedExpected.replace(/^option\s*/, '')]
          if (expectedIdx !== undefined && question.options[expectedIdx]) {
            isCorrect = question.options[expectedIdx].trim().toLowerCase() === normalizedRaw
          }
          const rawIdx = letterMap[normalizedRaw.replace(/^option\s*/, '')]
          if (rawIdx !== undefined && question.options[rawIdx]) {
            isCorrect = question.options[rawIdx].trim().toLowerCase() === normalizedExpected
          }
        }
      }

      const marks = isObj ? (isCorrect ? 2 : 0) : 0
      if (isObj) objectiveScore += marks

      return {
        questionId: question._id,
        questionText: question.questionText,
        type: qType,
        isObjective: isObj,
        options: isObj ? (question.options || []) : [],
        correctAnswer: isObj ? expected : '',
        internAnswer: rawAnswer,
        answerText: rawAnswer,
        marksAwarded: marks,
        maxMarks: isObj ? 2 : 5,
        feedback: isObj ? (isCorrect ? 'Correct Answer' : 'Wrong answer') : '',
      }
    })
    const totalScore = objectiveScore
    const percentage = Number(((totalScore / 35) * 100).toFixed(2))

    const submission = await TestSubmission.create({
      internId: registration?._id || null,
      testId: test._id,
      internName,
      email: email.toLowerCase(),
      technology,
      testName,
      assessmentNumber: test.assessmentNumber || assessmentNumber,
      syllabusDuration: test.syllabusDuration || 30,
      answers: processedAnswers,
      objectiveScore,
      descriptiveScore: 0,
      totalScore,
      totalMarksObtained: totalScore,
      percentage,
      status: 'Pending Evaluation',
      resultStatus: 'pending',
      isPublished: false,
      submittedAt: new Date(),
    })

    // Notify Admin via In-App Notification and Email Alert for Test Submission
    try {
      await Notification.create({
        recipientRole: 'admin',
        internName,
        internEmail: email.toLowerCase(),
        technology,
        title: `Test Submitted: ${internName} (${technology} Assessment #${test.assessmentNumber || assessmentNumber})`,
        message: `${internName} completed and submitted ${testName} (${technology} Assessment #${test.assessmentNumber || assessmentNumber}). Objective Score: ${objectiveScore}/10.`,
        type: 'test_submitted',
        referenceId: submission._id,
        meta: {
          testId: test._id,
          submissionId: submission._id,
          assessmentNumber: test.assessmentNumber || assessmentNumber,
          objectiveScore,
          technology,
        },
      })
    } catch (notifErr) {
      console.error('Failed to create admin test notification:', notifErr.message)
    }

    try {
      await sendAdminTestSubmissionEmail({
        internName,
        internEmail: email.toLowerCase(),
        technology,
        testName,
        assessmentNumber: test.assessmentNumber || assessmentNumber,
        objectiveScore,
        totalScore,
        submittedAt: new Date(),
      })
    } catch (emailErr) {
      console.error('Failed to send admin test email alert:', emailErr.message)
    }

    // ---------------- Course Completion Check ----------------
    // When the intern submits their final assessment for this technology track
    try {
      const currentAssNum = Number(test.assessmentNumber || assessmentNumber || 1)
      let durationDays = test.syllabusDuration || 30

      const regIds = registration?._id ? [registration._id] : []
      const allRegs = await Registration.find({ email: email.toLowerCase() })
      allRegs.forEach((r) => {
        if (!regIds.some((id) => String(id) === String(r._id))) regIds.push(r._id)
      })

      const assignment = await SyllabusAssignment.findOne({
        internId: { $in: regIds },
        technology: { $regex: new RegExp(`^${technology.trim()}$`, 'i') },
        status: 'Active',
      })

      if (assignment) {
        const syllabus = await Syllabus.findOne({
          technology: { $regex: new RegExp(`^${technology.trim()}$`, 'i') },
          syllabusName: { $regex: new RegExp(`^${assignment.syllabusName.trim()}$`, 'i') },
        }).lean()

        if (syllabus && syllabus.durationDays) {
          durationDays = syllabus.durationDays
        } else {
          const match = String(assignment.syllabusName || '').match(/(\d+)\s*day/i)
          if (match) durationDays = parseInt(match[1], 10)
        }
      }

      const totalAssessments = Math.max(1, Math.floor(durationDays / 5))
      const isFinalAssessment = currentAssNum >= totalAssessments

      if (isFinalAssessment) {
        // 1. Intern Portal In-App Notification
        try {
          await Notification.create({
            recipientId: registration?._id || null,
            recipientRole: 'intern',
            email: email.toLowerCase(),
            internName,
            technology,
            title: `Course Completed – ${technology}`,
            message: `Your ${technology} course has successfully completed and you will be assign for a final task.`,
            type: 'course_completed',
            referenceId: submission._id,
            meta: {
              technology,
              totalAssessments,
              durationDays,
              submissionId: submission._id,
              assessmentNumber: currentAssNum,
            },
          })
        } catch (internNotifErr) {
          console.error('Failed to create intern course completion notification:', internNotifErr.message)
        }

        // 2. Intern Email Notification
        try {
          await sendInternCourseCompletionEmail(email.toLowerCase(), {
            internName,
            technology,
          })
        } catch (internEmailErr) {
          console.error('Failed to send intern course completion email:', internEmailErr.message)
        }

        // 3. Admin Portal In-App Notification
        try {
          await Notification.create({
            recipientRole: 'admin',
            internName,
            internEmail: email.toLowerCase(),
            technology,
            title: `Course Completed: ${internName} (${technology})`,
            message: `Intern ${internName} has completed all assessments for ${technology} course and is ready for final task assignment.`,
            type: 'course_completed',
            referenceId: submission._id,
            meta: {
              internName,
              internEmail: email.toLowerCase(),
              technology,
              totalAssessments,
              durationDays,
              submissionId: submission._id,
              assessmentNumber: currentAssNum,
            },
          })
        } catch (adminNotifErr) {
          console.error('Failed to create admin course completion notification:', adminNotifErr.message)
        }

        // 4. Admin Email Notification
        try {
          await sendAdminCourseCompletionEmail({
            internName,
            internEmail: email.toLowerCase(),
            technology,
            completedDate: new Date(),
          })
        } catch (adminEmailErr) {
          console.error('Failed to send admin course completion email alert:', adminEmailErr.message)
        }
      }
    } catch (courseCompErr) {
      console.error('Course completion check error:', courseCompErr.message)
    }

    res.status(201).json({
      success: true,
      message: 'Test submitted successfully. Objective answers scored; descriptive answers pending admin evaluation.',
      data: submission,
    })
  } catch (error) {
    console.error('Submit test error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getByIntern = async (req, res) => {
  try {
    let email = (req.intern?.email || req.query.email || '').toLowerCase().trim()
    if (!email && req.headers.authorization) {
      try {
        const header = req.headers.authorization || ''
        const token = header.startsWith('Bearer ') ? header.slice(7) : null
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET)
          email = (decoded.email || '').toLowerCase().trim()
        }
      } catch (e) {}
    }

    let internName = req.query.internName
    if (email && !internName) {
      const reg = await Registration.findOne({ email })
      if (reg) internName = reg.name
    }

    const submissionFilter = email ? { email } : {}
    const evalFilter = internName
      ? { internName }
      : (email ? { internName: { $regex: new RegExp(`^${internName}$`, 'i') } } : {})

    const [testSubmissions, evaluations] = await Promise.all([
      TestSubmission.find(submissionFilter).sort({ submittedAt: -1, createdAt: -1 }),
      internName ? Evaluation.find(evalFilter).sort({ createdAt: -1 }) : Evaluation.find({}).sort({ createdAt: -1 }),
    ])

    // Format test submissions
    const normalizedSubmissions = testSubmissions.map((s) => {
      const doc = s.toObject()
      const totalScore = doc.totalScore ?? doc.totalMarksObtained ?? 0
      const percentage = doc.percentage ?? Number(((totalScore / 35) * 100).toFixed(1))
      const isPub = doc.isPublished === true || doc.status === 'Published'
      const isPass = totalScore >= 21
      return {
        ...doc,
        totalScore,
        totalMarksObtained: totalScore,
        percentage,
        isPublished: isPub,
        resultStatus: isPass ? 'passed' : 'failed',
        result: isPass ? 'Passed' : 'Failed',
        source: 'testSubmission',
      }
    })

    // If there are evaluations that don't match an existing testSubmission
    const existingKeys = new Set(
      normalizedSubmissions.map((s) => `${(s.technology || '').toLowerCase()}_${(s.testName || '').toLowerCase()}_${s.assessmentNumber || ''}`)
    )

    const normalizedEvaluations = evaluations
      .filter((e) => {
        const key = `${(e.technology || '').toLowerCase()}_${(e.testName || '').toLowerCase()}_`
        return !existingKeys.has(key)
      })
      .map((e) => {
        const doc = e.toObject()
        const totalScore = Number(doc.totalScore) || 0
        const percentage = Number(((totalScore / 35) * 100).toFixed(1))
        const isPub = doc.status === 'Published'
        const isPass = totalScore >= 21
        return {
          ...doc,
          totalScore,
          totalMarksObtained: totalScore,
          percentage,
          isPublished: isPub,
          status: doc.status || 'Pending Evaluation',
          resultStatus: isPass ? 'passed' : 'failed',
          result: isPass ? 'Passed' : 'Failed',
          source: 'evaluation',
        }
      })

    const combined = [...normalizedSubmissions, ...normalizedEvaluations].sort(
      (a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)
    )

    res.json({ success: true, data: combined })
  } catch (error) {
    console.error('getByIntern error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getAll = async (req, res) => {
  try {
    const { technology, assessmentNumber, status } = req.query
    const filter = {}
    if (technology) filter.technology = technology
    if (assessmentNumber) filter.assessmentNumber = Number(assessmentNumber)
    if (status) filter.status = status
    const submissions = await TestSubmission.find(filter).sort({ submittedAt: -1 })
    res.json({ success: true, data: submissions })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getById = async (req, res) => {
  try {
    const { id } = req.params
    const submission = await TestSubmission.findById(id).populate('testId')
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' })
    }

    // If intern is requesting, only return full answers if published or basic info
    if (req.intern && req.intern.email && submission.email !== req.intern.email) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' })
    }

    res.json({ success: true, data: submission })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}