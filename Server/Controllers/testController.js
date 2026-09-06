const Test = require('../Models/testModel')
const Question = require('../Models/questionModel')
const Syllabus = require('../Models/syllabusModel')
const SyllabusAssignment = require('../Models/syllabusAssignmentModel')
const Registration = require('../Models/registrationModel')
const DailyNote = require('../Models/dailyNoteModel')
const TestSubmission = require('../Models/testSubmissionModel')
const { sendAssessmentReadyEmail } = require('../config/mailer')

exports.getAll = async (req, res) => {
  try {
    const { technology, assessmentNumber, syllabusDuration, isPublished, isAssigned } = req.query
    const filter = {}
    if (technology) filter.technology = technology
    if (assessmentNumber) filter.assessmentNumber = Number(assessmentNumber)
    if (syllabusDuration) filter.syllabusDuration = Number(syllabusDuration)
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true'
    if (isAssigned !== undefined) filter.isAssigned = isAssigned === 'true'
    const tests = await Test.find(filter).sort({ createdAt: -1 }).populate('questions')
    res.json({ success: true, data: tests })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getById = async (req, res) => {
  try {
    const { id } = req.params
    const test = await Test.findById(id).populate('questions')
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' })
    }

    // If request comes from an intern, verify the test is unlocked for them
    if (req.intern && req.intern.email) {
      const registrations = await Registration.find({ email: req.intern.email.toLowerCase() })
      const registrationIds = registrations.map((r) => r._id)
      if (registrationIds.length > 0) {
        const assessmentNum = test.assessmentNumber || 1
        const startDay = (assessmentNum - 1) * 5 + 1
        const endDay = assessmentNum * 5
        const requiredDays = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)

        const uploadedNotes = await DailyNote.find({
          internId: { $in: registrationIds },
          technology: test.technology,
          dayNumber: { $in: requiredDays },
        })

        const uploadedDayNumbers = uploadedNotes.map((n) => n.dayNumber)
        const allUploaded = requiredDays.every((d) => uploadedDayNumbers.includes(d))

        if (!allUploaded) {
          return res.status(403).json({
            success: false,
            message: `This assessment is locked. All 5 daily notes for Days ${startDay}–${endDay} must be uploaded first.`,
          })
        }
      }

      // Sanitize questions so correctAnswer is not visible to intern
      const testObj = test.toObject()
      if (testObj.questions && Array.isArray(testObj.questions)) {
        testObj.questions = testObj.questions.map((q) => {
          const { correctAnswer, ...rest } = q
          return rest
        })
      }
      return res.json({ success: true, data: testObj })
    }

    res.json({ success: true, data: test })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, testName, technology, syllabusDuration, assessmentNumber } = req.body
    if (!name) {
      return res.status(400).json({ success: false, message: 'Assessment name is required' })
    }
    const test = await Test.create({
      name,
      testName: testName || name,
      technology: technology || '',
      syllabusDuration: syllabusDuration ? Number(syllabusDuration) : 0,
      assessmentNumber: assessmentNumber ? Number(assessmentNumber) : undefined,
      totalMarks: 35,
      durationMinutes: 25,
    })
    res.status(201).json({ success: true, data: test })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An assessment with this technology, duration, and number already exists.' })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const { name, testName, technology, syllabusDuration, assessmentNumber } = req.body
    const updateData = {}
    if (name) updateData.name = name
    if (testName) updateData.testName = testName
    if (technology) updateData.technology = technology
    if (syllabusDuration) updateData.syllabusDuration = Number(syllabusDuration)
    if (assessmentNumber) updateData.assessmentNumber = Number(assessmentNumber)
    const test = await Test.findByIdAndUpdate(id, updateData, { new: true }).populate('questions')
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' })
    }
    res.json({ success: true, data: test })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An assessment with this technology, duration, and number already exists.' })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.selectQuestions = async (req, res) => {
  try {
    const { id } = req.params
    const { questionIds } = req.body
    if (!questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ success: false, message: 'Question IDs array is required' })
    }
    if (questionIds.length !== 10) {
      return res.status(400).json({ success: false, message: 'Exactly 10 questions are required (5 Objective + 5 Descriptive)' })
    }
    const questions = await Question.find({ _id: { $in: questionIds } })
    if (questions.length !== 10) {
      return res.status(400).json({ success: false, message: 'Some selected questions not found' })
    }
    const objectiveCount = questions.filter((q) => q.type === 'Objective').length
    const descriptiveCount = questions.filter((q) => q.type === 'Descriptive').length
    if (objectiveCount !== 5 || descriptiveCount !== 5) {
      return res.status(400).json({ success: false, message: 'Must select exactly 5 Objective and 5 Descriptive questions' })
    }

    // Check if any of these questions are already assigned in other assessments
    const conflictingTest = await Test.findOne({
      _id: { $ne: id },
      questions: { $in: questionIds },
    })
    if (conflictingTest) {
      return res.status(400).json({
        success: false,
        message: `One or more selected questions are already used in "${conflictingTest.testName || conflictingTest.name}". Please select unused questions.`,
      })
    }

    const topics = [...new Set(questions.map((q) => q.topic))]
    const test = await Test.findByIdAndUpdate(
      id,
      { questions: questionIds, topics, questionCount: 10, totalMarks: 35, durationMinutes: 25 },
      { new: true }
    ).populate('questions')
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' })
    }
    res.json({ success: true, data: test })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.assignToCourse = async (req, res) => {
  try {
    const { testId, technology, syllabusDuration, assessmentNumber } = req.body
    const id = testId
    if (!technology || !syllabusDuration || !assessmentNumber) {
      return res.status(400).json({ success: false, message: 'Technology, syllabus duration, and assessment number are required' })
    }
    const duration = Number(syllabusDuration)
    if (!duration || duration < 5 || duration % 5 !== 0) {
      return res.status(400).json({ success: false, message: 'Invalid syllabus duration. Must be a positive multiple of 5.' })
    }
    const maxAssessments = duration / 5
    if (Number(assessmentNumber) < 1 || Number(assessmentNumber) > maxAssessments) {
      return res.status(400).json({ success: false, message: `Assessment number must be between 1 and ${maxAssessments} for ${duration}-day syllabus` })
    }

    const existingAssignment = await Test.findOne({
      _id: { $ne: id },
      technology,
      syllabusDuration: duration,
      assessmentNumber: Number(assessmentNumber),
      isAssigned: true,
    })
    if (existingAssignment) {
      return res.status(400).json({ success: false, message: `Assessment ${assessmentNumber} for ${technology} (${duration}-day) is already assigned to another test.` })
    }

    const existingTest = await Test.findById(id)
    if (!existingTest) {
      return res.status(404).json({ success: false, message: 'Test not found' })
    }
    if (!existingTest.questions || existingTest.questions.length === 0) {
      return res.status(400).json({ success: false, message: 'First select questions from question bank' })
    }

    const test = await Test.findByIdAndUpdate(
      id,
      {
        technology,
        syllabusDuration: duration,
        assessmentNumber: Number(assessmentNumber),
        testName: existingTest.testName || `${technology} Assessment ${assessmentNumber}`,
        isAssigned: true,
      },
      { new: true }
    ).populate('questions')

    res.json({
      success: true,
      message: `Successfully assigned ${test.testName} to ${technology} (${duration}-day) as Assessment ${assessmentNumber}.`,
      data: test,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An assessment with this technology, duration, and number already exists.' })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getAssignableDurations = async (req, res) => {
  try {
    const { technology } = req.query
    if (!technology) {
      return res.status(400).json({ success: false, message: 'Technology is required' })
    }
    const syllabi = await Syllabus.find({ technology }).select('syllabusName durationDays')
    const durations = syllabi.map(s => ({ syllabusName: s.syllabusName, durationDays: s.durationDays }))
    res.json({ success: true, data: durations })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getAssessmentNumbers = async (req, res) => {
  try {
    const { technology, syllabusDuration } = req.query
    if (!technology || !syllabusDuration) {
      return res.status(400).json({ success: false, message: 'Technology and syllabus duration are required' })
    }
    const duration = Number(syllabusDuration)
    if (!duration || duration < 5 || duration % 5 !== 0) {
      return res.status(400).json({ success: false, message: 'Invalid syllabus duration' })
    }
    const maxAssessments = duration / 5
    const assignedTests = await Test.find({
      technology,
      syllabusDuration: duration,
      isAssigned: true,
    }).select('assessmentNumber')
    const usedNumbers = assignedTests.map(t => t.assessmentNumber)
    const available = Array.from({ length: maxAssessments }, (_, i) => i + 1)
      .filter(n => !usedNumbers.includes(n))
    res.json({ success: true, data: { maxAssessments, available, used: usedNumbers } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.publish = async (req, res) => {
  try {
    const { id } = req.params
    const { isPublished } = req.body
    const publishState = isPublished !== undefined ? Boolean(isPublished) : true
    const test = await Test.findByIdAndUpdate(
      id,
      { isPublished: publishState, publishedAt: publishState ? new Date() : null },
      { new: true }
    ).populate('questions')
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' })
    }
    res.json({ success: true, message: publishState ? 'Assessment published successfully' : 'Assessment unpublished', data: test })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const test = await Test.findByIdAndDelete(id)
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' })
    }
    res.json({ success: true, message: 'Test deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getAvailableTests = async (req, res) => {
  try {
    const email = req.intern?.email
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    const registrations = await Registration.find({ email: email.toLowerCase() })
    if (!registrations || registrations.length === 0) {
      return res.status(404).json({ success: false, message: 'Intern not found' })
    }

    const registrationIds = registrations.map((r) => r._id)

    // Find all active syllabus assignments for this intern
    const assignments = await SyllabusAssignment.find({
      internId: { $in: registrationIds },
      status: 'Active',
    }).lean()

    if (!assignments || assignments.length === 0) {
      return res.json({ success: true, data: [], message: 'No active syllabus assignment found' })
    }

    const categories = []

    for (const assignment of assignments) {
      let durationDays = 15
      const syllabus = await Syllabus.findOne({
        technology: assignment.technology,
        syllabusName: assignment.syllabusName,
      }).lean()

      if (syllabus && syllabus.durationDays) {
        durationDays = syllabus.durationDays
      } else {
        const match = String(assignment.syllabusName || '').match(/(\d+)\s*day/i)
        if (match) {
          durationDays = parseInt(match[1], 10)
        }
      }

      const totalAssessments = Math.max(1, Math.floor(durationDays / 5))

      // Fetch uploaded daily notes for this intern and this technology
      const uploadedNotes = await DailyNote.find({
        internId: { $in: registrationIds },
        technology: assignment.technology,
      }).lean()

      const uploadedDayNumbers = uploadedNotes.map((n) => n.dayNumber)

      // Fetch existing test submissions for this intern and technology
      const submissions = await TestSubmission.find({
        email: email.toLowerCase(),
        technology: assignment.technology,
      }).lean()

      const assessmentBlocks = []

      for (let k = 1; k <= totalAssessments; k++) {
        const startDay = (k - 1) * 5 + 1
        const endDay = k * 5
        const requiredDays = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)
        const uploadedCount = requiredDays.filter((d) => uploadedDayNumbers.includes(d)).length
        const isUnlocked = uploadedCount === 5

        // Find assigned test created and assigned by admin
        const assignedTest = await Test.findOne({
          technology: assignment.technology,
          syllabusDuration: durationDays,
          assessmentNumber: k,
          isAssigned: true,
        }).populate('questions').lean()

        const sub = submissions.find(
          (s) => s.assessmentNumber === k || (assignedTest && s.testName === (assignedTest.testName || assignedTest.name))
        )

        const sanitizedQuestions = (assignedTest?.questions || []).map((q) => {
          const { correctAnswer, ...rest } = q
          return rest
        })

        assessmentBlocks.push({
          assessmentNumber: k,
          name: assignedTest?.name || `${assignment.technology} Assessment ${k}`,
          testName: assignedTest?.testName || assignedTest?.name || `${assignment.technology} Assessment ${k}`,
          technology: assignment.technology,
          syllabusDuration: durationDays,
          startDay,
          endDay,
          isAssignedByAdmin: Boolean(assignedTest),
          testId: assignedTest?._id || null,
          questionCount: assignedTest?.questions?.length || assignedTest?.questionCount || 0,
          questions: sanitizedQuestions,
          isUnlocked,
          uploadedDaysCount: uploadedCount,
          requiredDaysCount: 5,
          hasSubmitted: Boolean(sub),
          submissionStatus: sub ? sub.status : null,
          submissionScore: sub ? sub.totalScore : null,
          isPublished: sub ? sub.isPublished : false,
        })
      }

      categories.push({
        technology: assignment.technology,
        syllabusName: assignment.syllabusName,
        durationDays,
        totalAssessments,
        uploadedDayNumbers,
        assessments: assessmentBlocks,
      })
    }

    res.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('getAvailableTests error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}