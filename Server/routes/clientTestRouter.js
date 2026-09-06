const { Router } = require('express')
const { getAvailableTests, getById } = require('../Controllers/testController')
const { submit, getByIntern } = require('../Controllers/testSubmissionController')
const { authIntern } = require('../middleware/auth')

const router = Router()

router.get('/available-tests', authIntern, getAvailableTests)
router.get('/tests/:id', authIntern, getById)
router.post('/submit-test', authIntern, submit)
router.get('/test-submissions', authIntern, getByIntern)
router.get('/test-submissions/my', authIntern, getByIntern)

module.exports = router