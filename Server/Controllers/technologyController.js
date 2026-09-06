const Technology = require('../Models/technologyModel')

exports.getAll = async (req, res) => {
  try {
    const technologies = await Technology.find().sort({ name: 1 })
    res.json({ success: true, data: technologies })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, icon } = req.body
    if (!name) {
      return res.status(400).json({ success: false, message: 'Technology name is required' })
    }
    const existing = await Technology.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
    if (existing) {
      return res.status(400).json({ success: false, message: 'Technology already exists' })
    }
    const technology = await Technology.create({ name, icon })
    res.status(201).json({ success: true, data: technology })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const { name, icon } = req.body
    const technology = await Technology.findByIdAndUpdate(id, { name, icon }, { new: true, runValidators: true })
    if (!technology) {
      return res.status(404).json({ success: false, message: 'Technology not found' })
    }
    res.json({ success: true, data: technology })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const technology = await Technology.findByIdAndDelete(id)
    if (!technology) {
      return res.status(404).json({ success: false, message: 'Technology not found' })
    }
    res.json({ success: true, message: 'Technology deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
