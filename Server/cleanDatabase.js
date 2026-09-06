require('node:dns').setServers(['1.1.1.1', '8.8.8.8'])
require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const mongoose = require('mongoose')
const seedAdmins = require('./seeders/adminSeeder')

const cleanDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const collections = await db.listCollections().toArray()

    console.log('\n--- Database Full Cleanup Started ---\n')

    for (const coll of collections) {
      const name = coll.name
      if (name === 'admins') {
        console.log(`✓ PRESERVED & SEEDED: ${name} (Admin Credentials)`)
        continue
      }

      try {
        const result = await db.collection(name).deleteMany({})
        console.log(`✗ CLEARED: ${name} - ${result.deletedCount} documents removed`)
      } catch (err) {
        console.log(`⚠ ERROR on ${name}: ${err.message}`)
      }
    }

    // Ensure admin seeder runs
    await seedAdmins()
    console.log('\n✓ Admin account ensured:')
    console.log('  - interndeskadmin@gmail.com / admin@1234')

    console.log('\n--- Database Cleanup Complete: All dummy data wiped, DB is clean --- \n')

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Cleanup failed:', error.message)
    process.exit(1)
  }
}

cleanDatabase()