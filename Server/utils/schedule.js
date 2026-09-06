const ASSESSMENT_DAYS = [6, 12, 18]

function isSunday(date) {
  return date.getDay() === 0
}

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function startOfDay(date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function calculateWorkingDayInfo(startDate, currentDate = new Date()) {
  const start = startOfDay(new Date(startDate))
  const now = startOfDay(currentDate)

  if (now < start) {
    return {
      workingDay: 0,
      isAssessmentDay: false,
      assessmentNumber: 0,
      daysUntilNextAssessment: 6,
      schedule: [],
    }
  }

  let workingDay = 0
  let syllabusDay = 0
  const schedule = []
  let cursor = new Date(start)

  while (cursor <= now) {
    const isSun = isSunday(cursor)
    if (!isSun) {
      workingDay++
      if (syllabusDay < 15) {
        syllabusDay++
      }
    }

    const isAssessment = ASSESSMENT_DAYS.includes(workingDay)
    const assessmentNumber = isAssessment ? ASSESSMENT_DAYS.indexOf(workingDay) + 1 : 0

    schedule.push({
      date: new Date(cursor),
      workingDay,
      syllabusDay: isSun ? null : syllabusDay,
      isSunday: isSun,
      isAssessmentDay: isAssessment,
      assessmentNumber,
    })

    cursor = addDays(cursor, 1)
  }

  const todayEntry = schedule[schedule.length - 1] || {}
  const nextAssessmentDay = ASSESSMENT_DAYS.find((d) => d > workingDay) || 18
  const daysUntilNextAssessment = nextAssessmentDay - workingDay

  return {
    workingDay: todayEntry.workingDay || 0,
    syllabusDay: todayEntry.syllabusDay || 0,
    isSunday: todayEntry.isSunday || false,
    isAssessmentDay: todayEntry.isAssessmentDay || false,
    assessmentNumber: todayEntry.assessmentNumber || 0,
    daysUntilNextAssessment: Math.max(0, daysUntilNextAssessment),
    schedule,
  }
}

function getAssessmentUnlockDay(assessmentNumber) {
  return ASSESSMENT_DAYS[assessmentNumber - 1] || 0
}

function getAssessmentSchedule(startDate) {
  const start = startOfDay(new Date(startDate))
  const schedule = []
  let cursor = new Date(start)
  let workingDay = 0
  let syllabusDay = 0

  while (workingDay < 18) {
    const isSun = isSunday(cursor)
    if (!isSun) {
      workingDay++
      if (syllabusDay < 15) {
        syllabusDay++
      }
    }

    const isAssessment = ASSESSMENT_DAYS.includes(workingDay)
    const assessmentNumber = isAssessment ? ASSESSMENT_DAYS.indexOf(workingDay) + 1 : 0

    schedule.push({
      date: new Date(cursor),
      workingDay,
      syllabusDay: isSun ? null : syllabusDay,
      isSunday: isSun,
      isAssessmentDay: isAssessment,
      assessmentNumber,
    })

    cursor = addDays(cursor, 1)
  }

  return schedule
}

module.exports = {
  calculateWorkingDayInfo,
  getAssessmentUnlockDay,
  getAssessmentSchedule,
  ASSESSMENT_DAYS,
  isSunday,
  startOfDay,
}