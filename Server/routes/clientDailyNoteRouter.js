const { Router } = require('express')
const { uploadDailyNotes } = require('../config/multer')
const { createDailyNote, getMyDailyNotes } = require('../Controllers/dailyNoteController')
const { authIntern } = require('../middleware/auth')
const multer = require('multer')

const router = Router()

router.get('/', authIntern, getMyDailyNotes)
router.post('/', authIntern, (req, res) => {
  uploadDailyNotes(req, res, (err) => {
    if (err) {
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ success: false, message: err.message })
      }
      if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large. Maximum allowed size is 15 MB.'
          : `Upload error: ${err.message}`
        return res.status(400).json({ success: false, message })
      }
      return res.status(500).json({ success: false, message: err.message })
    }
    createDailyNote(req, res)
  })
})

module.exports = router