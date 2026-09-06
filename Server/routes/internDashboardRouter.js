const { Router } = require('express')
const { getDashboard } = require('../Controllers/internDashboardController')

const router = Router()

router.get('/', getDashboard)

module.exports = router