/**
 * Working days & Date utility functions for Intern Desk
 * Working days are defined as Monday through Friday (skipping Saturdays & Sundays).
 */

const isWeekend = (dateObj) => {
  if (!dateObj) return false
  const d = new Date(dateObj)
  if (isNaN(d.getTime())) return false
  const day = d.getDay()
  return day === 0 || day === 6 // 0 = Sunday, 6 = Saturday
}

/**
 * Calculates the exact working Date for a given Day number (1-indexed),
 * starting from startDate and skipping Saturdays and Sundays.
 * Day 1 = startDate (or next Monday if startDate was somehow a weekend).
 * Day 2 = next working day.
 */
const getWorkingDateForDay = (startDateStr, dayNumber) => {
  if (!startDateStr || !dayNumber) return null
  const start = new Date(startDateStr)
  if (isNaN(start.getTime())) return null
  start.setHours(0, 0, 0, 0)

  // If start falls on a weekend, advance to next Monday
  while (start.getDay() === 0 || start.getDay() === 6) {
    start.setDate(start.getDate() + 1)
  }

  const dayNum = Number(dayNumber)
  if (dayNum <= 1) return start

  let current = new Date(start)
  let workingDaysCount = 1

  while (workingDaysCount < dayNum) {
    current.setDate(current.getDate() + 1)
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDaysCount++
    }
  }

  return current
}

/**
 * Calculates the expected end Date of a syllabus with `totalWorkingDays`,
 * skipping all Saturdays and Sundays.
 */
const getWorkingEndDate = (startDateStr, totalWorkingDays) => {
  return getWorkingDateForDay(startDateStr, totalWorkingDays || 30)
}

/**
 * Formats a Date object as DD/MM/YYYY
 */
const formatDateGB = (dateObj) => {
  if (!dateObj) return ''
  const d = new Date(dateObj)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Formats a Date object with weekday e.g. "14/09/2026 (Mon)"
 */
const formatDateWithDay = (dateObj) => {
  if (!dateObj) return ''
  const d = new Date(dateObj)
  if (isNaN(d.getTime())) return ''
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const gb = formatDateGB(d)
  const dayName = weekdays[d.getDay()]
  return `${gb} (${dayName})`
}

module.exports = {
  isWeekend,
  getWorkingDateForDay,
  getWorkingEndDate,
  formatDateGB,
  formatDateWithDay,
}
