const { Router } = require('express')
const { getProgress } = require('../Controllers/progressController')

const router = Router()

router.get('/', getProgress)

module.exports = router
