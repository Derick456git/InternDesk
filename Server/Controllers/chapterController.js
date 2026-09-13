const Chapter = require('../Models/chapterModel')
const Question = require('../Models/questionModel')

exports.getAll = async (req, res) => {
  try {
    const { technology, search } = req.query
    const filter = {}
    if (technology) filter.technology = technology
    if (search) filter.name = { $regex: search, $options: 'i' }

    // Auto-sync legacy/existing chapters from Question model if Chapter collection is empty
    const count = await Chapter.countDocuments()
    if (count === 0) {
      const distinctChapters = await Question.distinct('topic')
      for (const t of distinctChapters) {
        if (t && t.trim()) {
          await Chapter.findOneAndUpdate(
            { name: t.trim() },
            { name: t.trim() },
            { upsert: true, new: true }
          )
        }
      }
    }

    const chapters = await Chapter.find(filter).sort({ name: 1 })
    res.json({ success: true, data: chapters })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, technology } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Chapter title is required' })
    }
    const trimmedName = name.trim()
    const existing = await Chapter.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } })
    if (existing) {
      return res.status(400).json({ success: false, message: `Chapter "${trimmedName}" already exists.` })
    }
    const chapter = await Chapter.create({
      name: trimmedName,
      technology: technology || '',
    })
    res.status(201).json({ success: true, data: chapter })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const chapter = await Chapter.findByIdAndDelete(id)
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found' })
    }
    res.json({ success: true, message: 'Chapter deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
