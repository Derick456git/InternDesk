const { Router } = require('express')
const { getAll, create, updateStatus, sendFeedback, submitZip, downloadZip } = require('../Controllers/taskController')
const { uploadTaskZip } = require('../config/multer')

const router = Router()

router.get('/', getAll)
router.post('/', create)
router.get('/:id/download-zip', downloadZip)
router.patch('/:id/status', updateStatus)
router.post('/:id/feedback', sendFeedback)
router.post('/:id/upload-zip', uploadTaskZip, submitZip)

module.exports = router
