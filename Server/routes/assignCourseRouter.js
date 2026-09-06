const { Router } = require('express')
const { assignToCourse, getAssignableDurations, getAssessmentNumbers } = require('../Controllers/testController')
const { authIntern } = require('../middleware/auth')

const router = Router()

router.post('/assign-to-course', assignToCourse)
router.get('/assignable-durations', getAssignableDurations)
router.get('/assessment-numbers', getAssessmentNumbers)

module.exports = router