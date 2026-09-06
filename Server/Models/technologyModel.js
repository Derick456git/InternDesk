const mongoose = require('mongoose')

const technologySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  icon: { type: String, default: null },
  active: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Technology', technologySchema)
