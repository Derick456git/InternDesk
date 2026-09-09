const Topic = require('../Models/topicModel')
const Question = require('../Models/questionModel')

exports.getAll = async (req, res) => {
  try {
    const { technology, search } = req.query
    const filter = {}
    if (technology) filter.technology = technology
    if (search) filter.name = { $regex: search, $options: 'i' }

    // Auto-sync legacy/existing topics from Question model if Topic collection is empty
    const count = await Topic.countDocuments()
    if (count === 0) {
      const distinctTopics = await Question.distinct('topic')
      for (const t of distinctTopics) {
        if (t && t.trim()) {
          await Topic.findOneAndUpdate(
            { name: t.trim() },
            { name: t.trim() },
            { upsert: true, new: true }
          )
        }
      }
    }

    const topics = await Topic.find(filter).sort({ name: 1 })
    res.json({ success: true, data: topics })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, technology } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Topic title is required' })
    }
    const trimmedName = name.trim()
    const existing = await Topic.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } })
    if (existing) {
      return res.status(400).json({ success: false, message: `Topic "${trimmedName}" already exists.` })
    }
    const topic = await Topic.create({
      name: trimmedName,
      technology: technology || '',
    })
    res.status(201).json({ success: true, data: topic })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const topic = await Topic.findByIdAndDelete(id)
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' })
    }
    res.json({ success: true, message: 'Topic deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
