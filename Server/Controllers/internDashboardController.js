const Intern = require('../Models/internModel')
const Registration = require('../Models/registrationModel')
const Syllabus = require('../Models/syllabusModel')
const SyllabusAssignment = require('../Models/syllabusAssignmentModel')
const DailyNote = require('../Models/dailyNoteModel')
const Task = require('../Models/taskModel')
const TestSubmission = require('../Models/testSubmissionModel')

const TEST_INTERVAL_DAYS = 5

exports.getDashboard = async (req, res) => {
  try {
    const email = (req.intern?.email || req.query?.email || '').trim().toLowerCase()
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    const registration = await Registration.findOne({ email }).sort({ createdAt: -1 })
    const intern = (await Intern.findOne({ email })) || registration

    if (!registration && !intern) {
      return res.status(404).json({ success: false, message: 'Intern not found' })
    }

    const status = registration?.status || 'Approved'
    const statusMessage =
      status === 'Approved'
        ? 'Approved as intern. Welcome to your learning portal!'
        : status === 'Rejected'
          ? 'Sorry, you are not approved as an intern.'
          : 'Please wait.. the approval will be done shortly.'

    const regId = registration?._id
    const internIds = [regId, intern?._id].filter(Boolean)

    // Find active assignments
    const assignments = regId ? await SyllabusAssignment.find({ internId: { $in: internIds }, status: 'Active' }) : []
    const assignedTechs = assignments.map(a => a.technology)

    let technologies = []
    if (assignments.length > 0) {
      technologies = [...new Set(assignments.map(a => a.technology))]
    } else if (intern?.technologies?.length > 0) {
      technologies = intern.technologies
    } else if (intern?.technology) {
      technologies = [intern.technology]
    } else if (registration?.technologies?.length > 0) {
      technologies = registration.technologies
    } else if (registration?.technology) {
      technologies = [registration.technology]
    } else {
      technologies = assignedTechs.length ? assignedTechs : ['General']
    }

    const technologyCards = []
    let totalUploadedNotes = 0
    let totalRequiredDays = 0
    let totalTests = 0
    let totalCompletedTests = 0
    let totalPendingAssessments = 0

    for (const technology of technologies) {
      const assignment = assignments.find(a => a.technology === technology)
      let durationDays = 30

      if (assignment) {
        const syllabus = await Syllabus.findOne({ technology, syllabusName: assignment.syllabusName })
        if (syllabus && syllabus.durationDays) {
          durationDays = syllabus.durationDays
        } else {
          const match = String(assignment.syllabusName || '').match(/(\d+)\s*day/i)
          if (match) durationDays = parseInt(match[1], 10)
        }
      } else {
        const syllabus = await Syllabus.findOne({ technology }).sort({ durationDays: -1 })
        if (syllabus && syllabus.durationDays) durationDays = syllabus.durationDays
      }

      const requiredDays = durationDays || 30

      // Count uploaded daily notes for this technology
      const techNotes = await DailyNote.find({
        internId: { $in: internIds },
        technology,
      }).lean()

      const uploadedDayNumbers = [...new Set(techNotes.map(n => n.dayNumber))]
      const uploadedNotesCount = uploadedDayNumbers.length

      const progress = requiredDays > 0 ? Number(((uploadedNotesCount / requiredDays) * 100).toFixed(2)) : 0

      // Count tests and pending unlocked assessments for this course
      const techTotalTests = requiredDays > 0 ? Math.max(1, Math.floor(requiredDays / TEST_INTERVAL_DAYS)) : 0
      const techSubmissions = await TestSubmission.find({
        email,
        technology,
      }).lean()

      let techPendingAssessments = 0
      for (let k = 1; k <= techTotalTests; k++) {
        const startDay = (k - 1) * 5 + 1
        const endDay = k * 5
        const mDays = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)
        const allNotesUploaded = mDays.every(d => uploadedDayNumbers.includes(d))

        const hasSubmitted = techSubmissions.some(
          ts => ts.assessmentNumber === k || (ts.testName && new RegExp(`Assessment\\s*${k}`, 'i').test(ts.testName))
        )

        if (allNotesUploaded && !hasSubmitted) {
          techPendingAssessments++
        }
      }

      totalUploadedNotes += uploadedNotesCount
      totalRequiredDays += requiredDays
      totalTests += techTotalTests
      totalCompletedTests += techSubmissions.length
      totalPendingAssessments += techPendingAssessments

      technologyCards.push({
        technology,
        requiredDays,
        uploadedNotes: uploadedNotesCount,
        approvedNotes: uploadedNotesCount,
        progress,
        totalTests: techTotalTests,
        completedTests: techSubmissions.length,
        pendingAssessments: techPendingAssessments,
      })
    }

    // Pending tasks count: tasks assigned to intern that have not been submitted
    const internFilter = []
    if (regId) internFilter.push({ assignedInternId: regId })
    if (intern?._id) internFilter.push({ assignedInternId: intern._id })
    if (email) internFilter.push({ internEmail: email })
    const internName = intern?.name || registration?.name
    if (internName) internFilter.push({ intern: internName })

    const tasksDue = await Task.countDocuments({
      $or: internFilter.length ? internFilter : [{ internEmail: email }],
      submissionStatus: { $nin: ['submitted', 'reviewed'] },
      $and: [
        { zipFileUrl: { $in: ['', null] } },
        { zipFile: { $in: ['', null] } },
      ],
    })

    const overallProgress = totalRequiredDays > 0
      ? Number(((totalUploadedNotes / totalRequiredDays) * 100).toFixed(2))
      : 0

    res.json({
      success: true,
      data: {
        name: intern?.name || registration?.name || 'Intern',
        email: intern?.email || registration?.email || email,
        status,
        statusMessage,
        technologies,
        technologyCards,
        overallProgress,
        totalUploadedNotes,
        totalApprovedNotes: totalUploadedNotes,
        totalRequiredDays,
        tasksDue,
        pendingAssessments: totalPendingAssessments,
        totalTests,
        totalCompletedTests,
        upcomingTests: totalPendingAssessments,
      },
    })
  } catch (error) {
    console.error('Get dashboard error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
