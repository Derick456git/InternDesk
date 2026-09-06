const { v2: cloudinary } = require('cloudinary')

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || process.env.API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET || '').trim(),
  secure: true,
})

module.exports = cloudinary
