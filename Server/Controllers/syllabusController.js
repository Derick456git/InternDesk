const xlsx = require('xlsx')
const mongoose = require('mongoose')
const Syllabus = require('../Models/syllabusModel')
const SyllabusAssignment = require('../Models/syllabusAssignmentModel')
const Intern = require('../Models/internModel')
const Registration = require('../Models/registrationModel')
const { sendSyllabusAssignmentEmail } = require('../config/mailer')

const normalizeKey = (key) => String(key || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')

const parseRow = (raw, index, fallbackTechnology) => {
  const norm = {}
  Object.keys(raw || {}).forEach((key) => {
    norm[normalizeKey(key)] = raw[key]
  })

  // Technology
  const technology = String(
    norm['technology'] ||
    norm['tech'] ||
    norm['track'] ||
    norm['course'] ||
    fallbackTechnology ||
    ''
  ).trim()

  // Day number
  const rawDay = norm['day'] || norm['days'] || norm['daynumber'] || norm['dayno'] || norm['slno'] || norm['sno'] || norm['no'] || ''
  const dayMatch = String(rawDay).match(/\d+/)
  const day = dayMatch ? parseInt(dayMatch[0], 10) : (index + 1)

  // Week number
  const rawWeek = norm['week'] || norm['weeks'] || norm['weeknumber'] || norm['weekno'] || ''
  const weekMatch = String(rawWeek).match(/\d+/)
  const week = weekMatch ? parseInt(weekMatch[0], 10) : Math.max(1, Math.ceil(day / 7))

  // Chapter
  const chapter = String(
    norm['chapter'] ||
    norm['chaptername'] ||
    norm['chaptertitle'] ||
    norm['module'] ||
    norm['modulename'] ||
    norm['title'] ||
    norm['lesson'] ||
    norm['topic'] ||
    ''
  ).trim() || `Day ${day} Chapter`

  // Topics
  const topics = String(
    norm['topics'] ||
    norm['topic'] ||
    norm['description'] ||
    norm['contents'] ||
    norm['content'] ||
    norm['details'] ||
    norm['subtopics'] ||
    ''
  ).trim() || chapter

  // Syllabus Name (if explicitly provided in row)
  const syllabusName = String(
    norm['syllabusname'] ||
    norm['syllabus'] ||
    norm['name'] ||
    norm['duration'] ||
    ''
  ).trim()

  return { syllabusName, technology, week, day, chapter, topics }
}

exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please choose an Excel file (.xlsx / .xls) to upload.' })
    }

    const fallbackTechnology = String((req.body && req.body.technology) || '').trim()
    if (!fallbackTechnology) {
      return res.status(400).json({ success: false, message: 'Technology track is required for syllabus upload.' })
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return res.status(400).json({ success: false, message: 'The uploaded file has no worksheets.' })
    }

    const sheet = workbook.Sheets[sheetName]
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' })
    if (!rawRows.length) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded file is empty. Please add syllabus day rows and upload again.',
      })
    }

    const parsedRows = []
    let explicitSyllabusName = ''

    rawRows.forEach((raw, idx) => {
      // Ignore completely blank rows
      const hasContent = Object.values(raw).some((v) => String(v).trim().length > 0)
      if (!hasContent) return

      const mapped = parseRow(raw, parsedRows.length, fallbackTechnology)
      if (mapped) {
        if (!explicitSyllabusName && mapped.syllabusName) {
          explicitSyllabusName = mapped.syllabusName
        }
        parsedRows.push(mapped)
      }
    })

    if (!parsedRows.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid syllabus rows could be extracted from the Excel spreadsheet.',
      })
    }

    // Sort rows by day
    parsedRows.sort((a, b) => a.day - b.day)

    const maxDay = Math.max(...parsedRows.map((d) => d.day))
    const durationDays = maxDay || parsedRows.length
    const technology = fallbackTechnology

    // If no explicit syllabus name was found in the rows, name it e.g. "15 Day" (standard format matching Assign Syllabus dropdown)
    const finalSyllabusName = explicitSyllabusName || `${durationDays} Day`

    // Ensure all row objects carry the final syllabusName and technology
    const documents = parsedRows.map((row) => ({
      syllabusName: finalSyllabusName,
      technology,
      week: row.week,
      day: row.day,
      chapter: row.chapter,
      topics: row.topics,
    }))

    // Save or update syllabus for this technology
    await Syllabus.findOneAndUpdate(
      {
        technology: { $regex: new RegExp(`^${technology}$`, 'i') },
        syllabusName: finalSyllabusName,
      },
      {
        syllabusName: finalSyllabusName,
        technology,
        durationDays,
        rows: documents,
      },
      { upsert: true, new: true }
    )

    const count = await Syllabus.countDocuments()

    res.json({
      success: true,
      message: `Uploaded ${documents.length} syllabus days successfully for ${technology}. Syllabus "${finalSyllabusName}" (${durationDays} days) is now available in Assign Syllabus.`,
      data: {
        inserted: documents.length,
        totalRows: count,
        syllabusName: finalSyllabusName,
        technology,
        durationDays,
      },
    })
  } catch (error) {
    console.error('Syllabus upload error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error while uploading syllabus.' })
  }
}

exports.getDurations = async (req, res) => {
  try {
    const { technology } = req.query
    if (!technology) {
      return res.status(400).json({ success: false, message: 'Technology is required.' })
    }

    const syllabi = await Syllabus.find({
      technology: { $regex: new RegExp(`^${technology.trim()}$`, 'i') },
    }).lean()

    const namesMap = new Map()
    syllabi.forEach((s) => {
      const name = s.syllabusName || `${s.durationDays || 30} Day`
      const days = s.durationDays || (s.rows ? s.rows.length : 0)
      if (!namesMap.has(name)) {
        namesMap.set(name, days)
      }
    })

    const durations = Array.from(namesMap.entries()).map(([syllabusName, durationDays]) => ({
      syllabusName,
      durationDays,
    }))

    res.json({ success: true, data: durations })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getByTechnologyAndSyllabusName = async (req, res) => {
  try {
    const { technology, syllabusName } = req.query
    if (!technology) {
      return res.status(400).json({ success: false, message: 'Technology is required.' })
    }

    const filter = {
      technology: { $regex: new RegExp(`^${technology.trim()}$`, 'i') },
    }
    if (syllabusName) {
      filter.syllabusName = { $regex: new RegExp(`^${syllabusName.trim()}$`, 'i') }
    }

    const syllabi = await Syllabus.find(filter).lean()

    if (syllabusName) {
      if (!syllabi.length) {
        return res.json({ success: true, data: [] })
      }
      let allRows = []
      syllabi.forEach((s) => {
        if (Array.isArray(s.rows) && s.rows.length > 0) {
          allRows.push(...s.rows)
        } else if (s.day !== undefined) {
          allRows.push(s)
        }
      })
      allRows.sort((a, b) => (Number(a.day) || 0) - (Number(b.day) || 0))
      return res.json({ success: true, data: allRows })
    }

    const result = syllabi.map((s) => ({
      technology: s.technology,
      syllabusName: s.syllabusName,
      durationDays: s.durationDays,
      days: (s.rows || []).map((r) => ({ day: r.day, week: r.week, chapter: r.chapter, topics: r.topics })),
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.assign = async (req, res) => {
  try {
    const { internIds, internId, technology, syllabusName, startDate } = req.body
    const ids = Array.isArray(internIds) ? internIds : (internId ? [internId] : [])

    if (!ids.length || !technology || !syllabusName) {
      return res.status(400).json({ success: false, message: 'internIds, technology, and syllabusName are required' })
    }
    if (!startDate) {
      return res.status(400).json({ success: false, message: 'Start date is required' })
    }

    const start = new Date(startDate)
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start date' })
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (start < today) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past.' })
    }

    const registrations = await Registration.find({ _id: { $in: ids } })
    const internDocs = await Intern.find({ _id: { $in: ids } })
    const byId = (id) => String(id)

    const byIdMap = new Map()
    registrations.forEach((reg) => byIdMap.set(byId(reg._id), { name: reg.name, email: reg.email }))
    internDocs.forEach((intern) => {
      if (!byIdMap.has(byId(intern._id))) {
        byIdMap.set(byId(intern._id), { name: intern.name, email: intern.email })
      }
    })

    if (!byIdMap.size) {
      return res.status(404).json({ success: false, message: 'Intern not found' })
    }

    let assignedCount = 0
    for (const id of ids) {
      const target = byIdMap.get(byId(id))
      if (!target) continue

      await SyllabusAssignment.findOneAndUpdate(
        { internId: id, technology },
        {
          $set: {
            syllabusName,
            startDate: start,
            status: 'Active',
            assignedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      )
      assignedCount += 1

      try {
        await sendSyllabusAssignmentEmail(target.email, {
          internName: target.name,
          syllabusName,
          technology,
          startDate: start,
        })
      } catch (emailError) {
        console.error('Syllabus assignment email failed:', emailError.message)
      }
    }

    res.json({
      success: true,
      message: `Syllabus "${syllabusName}" for ${technology} assigned to ${assignedCount} intern(s).`,
      data: { internIds: ids, technology, syllabusName, startDate: start, assignedCount },
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This syllabus is already assigned to one of the selected interns.' })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getAllSyllabi = async (req, res) => {
  try {
    const { technology } = req.query
    const filter = {}
    if (technology && technology !== 'All') {
      filter.technology = { $regex: new RegExp(`^${technology.trim()}$`, 'i') }
    }

    const rawDocs = await Syllabus.find(filter).lean()

    // Group any legacy flat documents vs embedded rows documents
    const map = new Map()

    for (const doc of rawDocs) {
      const tech = (doc.technology || 'General').trim()
      const name = (doc.syllabusName || `${doc.durationDays || 30} Day`).trim()
      const key = `${tech.toLowerCase()}___${name.toLowerCase()}`

      if (!map.has(key)) {
        map.set(key, {
          _id: doc._id,
          ids: [doc._id],
          syllabusName: name,
          technology: tech,
          durationDays: doc.durationDays || 0,
          rows: [],
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        })
      }

      const entry = map.get(key)
      if (doc._id && !entry.ids.includes(doc._id)) {
        entry.ids.push(doc._id)
      }

      if (Array.isArray(doc.rows) && doc.rows.length > 0) {
        doc.rows.forEach((r) => {
          entry.rows.push({
            day: r.day,
            week: r.week || Math.max(1, Math.ceil((r.day || 1) / 7)),
            chapter: r.chapter || `Day ${r.day}`,
            topics: r.topics || '',
          })
        })
      } else if (doc.day !== undefined || doc.chapter !== undefined) {
        entry.rows.push({
          day: doc.day || (entry.rows.length + 1),
          week: doc.week || Math.max(1, Math.ceil((doc.day || 1) / 7)),
          chapter: doc.chapter || `Day ${doc.day || entry.rows.length + 1}`,
          topics: doc.topics || '',
        })
      }
    }

    // Deduplicate and sort rows inside each syllabus
    const result = Array.from(map.values()).map((s) => {
      const seenDays = new Set()
      const uniqueRows = []
      s.rows.sort((a, b) => (Number(a.day) || 0) - (Number(b.day) || 0))
      for (const r of s.rows) {
        if (!seenDays.has(r.day)) {
          seenDays.add(r.day)
          uniqueRows.push(r)
        }
      }
      const duration = s.durationDays || (uniqueRows.length > 0 ? Math.max(...uniqueRows.map((r) => r.day || 0)) : 0)

      return {
        _id: s._id,
        ids: s.ids,
        syllabusName: s.syllabusName,
        technology: s.technology,
        durationDays: duration,
        totalRows: uniqueRows.length,
        rows: uniqueRows,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }
    })

    result.sort((a, b) => a.technology.localeCompare(b.technology) || a.syllabusName.localeCompare(b.syllabusName))

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Get all syllabi error:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch syllabuses.' })
  }
}

exports.deleteSyllabus = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ success: false, message: 'Invalid syllabus ID.' })
    }

    let syllabus = null
    if (mongoose.Types.ObjectId.isValid(id)) {
      syllabus = await Syllabus.findById(id)
    }

    if (!syllabus) {
      return res.status(404).json({ success: false, message: 'Syllabus not found in database.' })
    }

    const tech = syllabus.technology
    const name = syllabus.syllabusName

    // Delete matching syllabus document(s)
    await Syllabus.deleteMany({
      technology: { $regex: new RegExp(`^${tech.trim()}$`, 'i') },
      syllabusName: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    })

    // Also delete by ID if still exists
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Syllabus.findByIdAndDelete(id)
    }

    // Remove any orphaned assignments associated with this deleted syllabus
    await SyllabusAssignment.deleteMany({
      technology: { $regex: new RegExp(`^${tech.trim()}$`, 'i') },
      syllabusName: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    })

    res.json({
      success: true,
      message: `Syllabus "${name}" for ${tech} has been deleted successfully from database.`,
      data: { id, syllabusName: name, technology: tech },
    })
  } catch (error) {
    console.error('Delete syllabus error:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to delete syllabus.' })
  }
}