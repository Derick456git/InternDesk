const { Router } = require('express')
const { getAllDailyNotes, giveFeedback, updateStatus } = require('../Controllers/dailyNoteController')
const { authAdmin } = require('../middleware/auth')

const router = Router()

router.get('/', authAdmin, getAllDailyNotes)
router.put('/:id/feedback', authAdmin, giveFeedback)
router.patch('/:id/status', authAdmin, updateStatus)

module.exports = router