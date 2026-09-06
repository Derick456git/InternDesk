const Registration = require('../Models/registrationModel')
const SyllabusAssignment = require('../Models/syllabusAssignmentModel')
const Syllabus = require('../Models/syllabusModel')

const resolveRegistrationIds = async (email) => {
  const registrations = await Registration.find({ email: email.toLowerCase() }).select('_id')
  return registrations.map((reg) => reg._id)
}

exports.getAssignedSyllabuses = async (req, res) => {
  try {
    const registrationIds = await resolveRegistrationIds(req.intern.email)
    const assignments = await SyllabusAssignment.find({ internId: { $in: registrationIds } })
      .sort({ assignedAt: -1 })
      .lean()

    res.json({ success: true, data: assignments })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getSyllabusDetails = async (req, res) => {
  try {
    const { technology, syllabusName } = req.query
    if (!technology || !syllabusName) {
      return res.status(400).json({ success: false, message: 'technology and syllabusName are required' })
    }

    const registrationIds = await resolveRegistrationIds(req.intern.email)
    const assignment = await SyllabusAssignment.findOne({
      internId: { $in: registrationIds },
      technology,
      syllabusName,
      status: 'Active',
    })

    if (!assignment) {
      return res.status(403).json({ success: false, message: 'You do not have an active assignment for this syllabus.' })
    }

    const syllabusDoc = await Syllabus.findOne({ technology, syllabusName }).lean()
    let extractedRows = []
    let totalDays = 0

    if (syllabusDoc && Array.isArray(syllabusDoc.rows) && syllabusDoc.rows.length > 0) {
      extractedRows = syllabusDoc.rows.sort((a, b) => (a.day || 0) - (b.day || 0))
      totalDays = syllabusDoc.durationDays || extractedRows.length
    } else {
      // Fallback if multiple docs were stored per row
      const rows = await Syllabus.find({ technology, syllabusName }).sort({ day: 1, week: 1 }).lean()
      extractedRows = rows
      totalDays = rows.length
    }

    res.json({
      success: true,
      data: {
        technology,
        syllabusName,
        startDate: assignment.startDate,
        totalDays,
        rows: extractedRows,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}