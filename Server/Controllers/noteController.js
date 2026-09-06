const Note = require('../Models/noteModel')

exports.create = async (req, res) => {
  try {
    const { internName, email, technology, dayNumber, chapter, topic, content } = req.body
    if (!internName || !email || !technology || !dayNumber) {
      return res.status(400).json({ success: false, message: 'Intern, email, technology, and day number are required' })
    }
    const note = await Note.create({
      internName,
      email: email.toLowerCase(),
      technology,
      dayNumber: Number(dayNumber),
      chapter: chapter || '',
      topic: topic || '',
      content: content || '',
    })
    res.status(201).json({ success: true, message: 'Notes uploaded successfully', data: note })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getByIntern = async (req, res) => {
  try {
    const { email, technology } = req.query
    const filter = {}
    if (email) filter.email = email.toLowerCase()
    if (technology) filter.technology = technology
    const notes = await Note.find(filter).sort({ technology: 1, dayNumber: 1, createdAt: -1 })
    res.json({ success: true, data: notes })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
