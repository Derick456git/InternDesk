const { Router } = require('express')
const { getAll, create, updateStatus, sendFeedback, submitLink } = require('../Controllers/taskController')

const router = Router()

router.get('/', getAll)
router.post('/', create)
router.patch('/:id/status', updateStatus)
router.post('/:id/submit-link', submitLink)
router.post('/:id/submit', submitLink)
router.post('/:id/upload-zip', submitLink)
router.post('/:id/feedback', sendFeedback)
router.put('/:id/feedback', sendFeedback)

module.exports = router
