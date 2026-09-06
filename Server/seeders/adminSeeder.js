require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Admin = require('../Models/adminModel')

const admins = [
  { email: 'interndeskadmin@gmail.com', password: 'admin@1234' },
]

const seedAdmins = async () => {
  const allowedEmails = admins.map((a) => a.email.toLowerCase())
  // Remove any old admin credentials not in the list
  await Admin.deleteMany({ email: { $nin: allowedEmails } })

  const salt = await bcrypt.genSalt(10)
  for (const adminData of admins) {
    const existing = await Admin.findOne({ email: adminData.email.toLowerCase() })
    const hashedPassword = await bcrypt.hash(adminData.password, salt)
    if (existing) {
      existing.password = hashedPassword
      await existing.save()
    } else {
      await Admin.create({ email: adminData.email.toLowerCase(), password: hashedPassword })
    }
  }
}

if (require.main === module) {
  ;(async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI)
      console.log('MongoDB connected for seeding...')
      await seedAdmins()
      console.log('Seeding complete.')
      console.log('  Admin: interndeskadmin@gmail.com / admin@1234')
      await mongoose.connection.close()
      process.exit(0)
    } catch (error) {
      console.error('Seeding failed:', error.message)
      process.exit(1)
    }
  })()
}

module.exports = seedAdmins
