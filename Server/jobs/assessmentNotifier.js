const cron = require('node-cron')
const SyllabusAssignment = require('../Models/syllabusAssignmentModel')
const Registration = require('../Models/registrationModel')
const Test = require('../Models/testModel')
const { calculateWorkingDayInfo, ASSESSMENT_DAYS } = require('../utils/schedule')
const { sendAssessmentReadyEmail } = require('../config/mailer')

async function checkAndNotifyAssessments() {
  try {
    const assignments = await SyllabusAssignment.find({ status: 'Active' }).lean()
    const now = new Date()

    for (const assignment of assignments) {
      const info = calculateWorkingDayInfo(assignment.startDate, now)

      if (!info.isAssessmentDay) continue

      const assessmentNumber = info.assessmentNumber
      if (!ASSESSMENT_DAYS.includes(info.workingDay)) continue

      const test = await Test.findOne({
        technology: assignment.technology,
        assessmentNumber,
        isPublished: true,
      }).lean()

      if (!test) continue

      const registration = await Registration.findById(assignment.internId).lean()
      if (!registration) continue

      try {
        await sendAssessmentReadyEmail(registration.email, {
          internName: registration.name,
          technology: assignment.technology,
          assessmentNumber,
          testName: test.name,
        })
        console.log(`Assessment ${assessmentNumber} email sent to ${registration.email} for ${assignment.technology}`)
      } catch (emailError) {
        console.error(`Failed to send assessment email to ${registration.email}:`, emailError.message)
      }
    }
  } catch (error) {
    console.error('Assessment notifier error:', error.message)
  }
}

function startAssessmentNotifier() {
  cron.schedule('0 0 * * *', () => {
    console.log('Running assessment notifier cron job...')
    checkAndNotifyAssessments()
  })
  console.log('Assessment notifier cron job scheduled (runs daily at midnight)')
}

module.exports = { startAssessmentNotifier, checkAndNotifyAssessments }