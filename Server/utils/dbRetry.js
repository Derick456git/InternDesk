const mongoose = require('mongoose')

/**
 * Executes a MongoDB operation with automatic retry on transient network errors (e.g. ECONNRESET, MongoNetworkError, socket drops)
 * @param {Function} operation - Async function performing MongoDB queries or updates
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} delayMs - Delay in ms before retrying (default: 500ms)
 * @returns {Promise<any>}
 */
const withRetry = async (operation, maxRetries = 3, delayMs = 500) => {
  let lastError
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure mongoose is connected
      if (mongoose.connection.readyState !== 1) {
        if (process.env.MONGO_URI) {
          await mongoose.connect(process.env.MONGO_URI).catch(() => {})
        }
      }
      return await operation()
    } catch (err) {
      lastError = err
      const isNetworkError =
        err.name === 'MongoNetworkError' ||
        err.name === 'MongoServerSelectionError' ||
        err.name === 'MongoTopologyClosedError' ||
        err.code === 'ECONNRESET' ||
        err.message?.includes('ECONNRESET') ||
        err.message?.includes('socket') ||
        err.message?.includes('closed') ||
        err.message?.includes('timed out')

      if (isNetworkError && attempt < maxRetries) {
        console.warn(`[DB Retry] Transient MongoDB network error (${err.message}). Retrying attempt ${attempt + 1}/${maxRetries} in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
      } else {
        throw err
      }
    }
  }
  throw lastError
}

module.exports = {
  withRetry,
}
