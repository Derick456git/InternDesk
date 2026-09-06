const multer = require('multer')
const path = require('path')

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const ZIP_MIME = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream']

// Use MemoryStorage so files are not saved permanently to local disk
const storage = multer.memoryStorage()

const dailyNoteFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (file.fieldname === 'note') {
    if (ext === '.docx' || ext === '.doc' || ext === '.pdf' || file.mimetype === DOCX_MIME) {
      return cb(null, true)
    }
    const error = new Error('Invalid note file type. Must be .docx, .doc, or .pdf.')
    error.code = 'INVALID_FILE_TYPE'
    return cb(error)
  }
  if (file.fieldname === 'book') {
    if (ext === '.xlsx' || ext === '.xls' || file.mimetype === XLSX_MIME) {
      return cb(null, true)
    }
    const error = new Error('Invalid book file type. Must be .xlsx or .xls.')
    error.code = 'INVALID_FILE_TYPE'
    return cb(error)
  }
  const error = new Error('Invalid upload field.')
  error.code = 'INVALID_FILE_TYPE'
  cb(error)
}

const taskZipFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (ext === '.zip' || ZIP_MIME.includes(file.mimetype)) {
    return cb(null, true)
  }
  const error = new Error('Invalid file type. Practical task must be a .zip file.')
  error.code = 'INVALID_FILE_TYPE'
  cb(error)
}

const uploadDailyNotes = multer({
  storage,
  fileFilter: dailyNoteFileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
}).fields([
  { name: 'note', maxCount: 1 },
  { name: 'book', maxCount: 1 },
])

const uploadTaskZip = multer({
  storage,
  fileFilter: taskZipFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
}).single('zipFile')

const uploadSyllabusFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file')

module.exports = {
  uploadDailyNotes,
  uploadTaskZip,
  uploadSyllabusFile,
  DOCX_MIME,
  XLSX_MIME,
}