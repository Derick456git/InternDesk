const { Router } = require('express')
const { login, status, forgotPassword, verifyOtp, resetPassword } = require('../Controllers/internAuthController')

const router = Router()

router.post('/login', login)
router.get('/status', status)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)

module.exports = router