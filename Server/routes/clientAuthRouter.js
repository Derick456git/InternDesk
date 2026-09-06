const { Router } = require('express')
const { clientLogin } = require('../Controllers/internAuthController')
const { forgotPassword, verifyOtp, resetPassword } = require('../Controllers/clientAuthController')
const { getAssignedSyllabuses, getSyllabusDetails } = require('../Controllers/clientSyllabusController')
const { authIntern } = require('../middleware/auth')

const router = Router()

router.post('/login', clientLogin)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)

router.get('/assigned-syllabuses', authIntern, getAssignedSyllabuses)
router.get('/syllabus-details', authIntern, getSyllabusDetails)

module.exports = router