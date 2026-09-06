require('node:dns').setServers(['1.1.1.1', '8.8.8.8'])
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const connectDB = require('./config/db')
const seedAdmins = require('./seeders/adminSeeder')
const routes = require('./routes/index')
const { startAssessmentNotifier } = require('./jobs/assessmentNotifier')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const start = async () => {
  await connectDB()
  await seedAdmins()
  console.log('Admin account seeded.')
  startAssessmentNotifier()
}

start()

app.use('/api', routes)

app.get('/', (req, res) => {
  res.json({ message: 'Intern Desk API is running' })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: 'Server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
