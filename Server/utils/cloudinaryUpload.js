const cloudinary = require('../config/cloudinary')
const path = require('path')
const { Readable } = require('stream')

/**
 * Uploads a file buffer directly to Cloudinary using upload_stream
 * @param {Buffer} buffer - In-memory file buffer from Multer memoryStorage
 * @param {Object} options - Upload options (folder, resource_type, filename, etc.)
 * @returns {Promise<{ secure_url: string, public_id: string, [key: string]: any }>}
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return reject(new Error('A valid file Buffer is required for Cloudinary upload.'))
    }

    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || '').trim()
    const apiKey = (process.env.CLOUDINARY_API_KEY || process.env.API_KEY || '').trim()
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET || '').trim()

    if (!cloudName || !apiKey || !apiSecret) {
      return reject(new Error('Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing from .env'))
    }

    // Preserve original extension for raw document files
    let publicId = options.public_id
    if (!publicId && options.originalname) {
      const ext = path.extname(options.originalname)
      const base = path.basename(options.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
      publicId = `${base}_${Date.now()}${ext}`
    }

    const uploadOptions = {
      resource_type: options.resource_type || 'raw',
      type: 'upload',
      access_mode: 'public',
      folder: options.folder || 'intern-desk',
      use_filename: true,
      unique_filename: true,
      ...options,
    }

    if (publicId) {
      uploadOptions.public_id = publicId
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary API response error:', error.message || error)
          if (error.http_code === 403 || String(error.message).includes('missing permissions') || String(error.message).includes('403')) {
            const permError = new Error(
              'Cloudinary rejected the upload (HTTP 403: missing "create" permission). ' +
              'Your Cloudinary API Key in .env lacks Upload permissions. ' +
              'Please copy the Master API Key & Secret from your Cloudinary Dashboard (Product Environment Credentials) or enable "Create / Upload" permission.'
            )
            permError.status = 403
            return reject(permError)
          }
          return reject(error)
        }

        resolve(result)
      }
    )

    const readable = Readable.from(buffer)
    readable.pipe(uploadStream)
  })
}

module.exports = {
  uploadToCloudinary,
}
