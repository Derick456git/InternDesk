const { Router } = require('express')
const { submit, getByIntern, getAll, getById } = require('../Controllers/testSubmissionController')

const router = Router()

router.post('/submit', submit)
router.get('/my', getByIntern)
router.get('/', getByIntern)
router.get('/all', getAll)
router.get('/:id', getById)

module.exports = router