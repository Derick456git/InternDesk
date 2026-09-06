const Question = require('../Models/questionModel')

exports.getAll = async (req, res) => {
  try {
    const { topic, difficulty, technology, type } = req.query
    const filter = {}
    if (topic) filter.topic = topic
    if (difficulty) filter.difficulty = difficulty
    if (technology) filter.technology = technology
    if (type) filter.type = type
    const questions = await Question.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: questions })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { topic, difficulty, type, questionText, options, correctAnswer, technology } = req.body
    if (!topic || !questionText || !type) {
      return res.status(400).json({ success: false, message: 'Topic, question text, and type are required' })
    }
    const defaultMarks = type === 'Objective' ? 2 : 5
    const question = await Question.create({
      technology: technology || '',
      topic,
      difficulty: difficulty || 'Easy',
      type,
      questionText,
      options: type === 'Objective' ? (options || []) : [],
      correctAnswer: type === 'Objective' ? (correctAnswer || (options && options[0]) || '') : '',
      defaultMarks,
    })
    res.status(201).json({ success: true, data: question })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body }
    if (updateData.type === 'Objective') {
      updateData.defaultMarks = 2
    } else if (updateData.type === 'Descriptive') {
      updateData.defaultMarks = 5
      updateData.options = []
      updateData.correctAnswer = ''
    }
    const question = await Question.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' })
    }
    res.json({ success: true, data: question })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const question = await Question.findByIdAndDelete(id)
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' })
    }
    res.json({ success: true, message: 'Question deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
