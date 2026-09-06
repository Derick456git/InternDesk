const { Router } = require('express')
const multer = require('multer')
const {
  upload,
  getDurations,
  getByTechnologyAndSyllabusName,
  assign,
  getAllSyllabi,
  deleteSyllabus,
} = require('../Controllers/syllabusController')

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = /\.(xlsx|xls)$/i
    if (allowed.test(file.originalname)) {
      cb(null, true)
    } else {
      const error = new Error('Only .xlsx or .xls files are allowed')
      error.code = 'INVALID_FILE_TYPE'
      cb(error)
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
})

const router = Router()

router.post('/upload', uploadMiddleware.single('file'), upload)
router.get('/durations', getDurations)
router.get('/all', getAllSyllabi)
router.get('/', getByTechnologyAndSyllabusName)
router.post('/assign', assign)
router.delete('/:id', deleteSyllabus)

router.use((err, req, res, next) => {
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ success: false, message: err.message })
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'The uploaded file is too large (max 10 MB).'
      : `Upload error: ${err.message}`
    return res.status(400).json({ success: false, message })
  }
  next(err)
})

module.exports = router