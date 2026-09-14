const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 120000,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      maxIdleTimeMS: 60000,
      retryWrites: true,
      retryReads: true,
    })
    console.log(`MongoDB Connected: ${conn.connection.host}`)

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting reconnection...')
    })

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected.')
    })

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection event error:', err.message)
    })
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB

