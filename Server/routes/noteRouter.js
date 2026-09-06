const { Router } = require('express')
const { create, getByIntern } = require('../Controllers/noteController')

const router = Router()

router.post('/', create)
router.get('/', getByIntern)

module.exports = router