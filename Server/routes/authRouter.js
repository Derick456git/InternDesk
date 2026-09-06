const { Router } = require('express')
const { login, forgotPassword, verifyOtp, resetPassword } = require('../Controllers/authController')

const router = Router()

router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)

module.exports = router
