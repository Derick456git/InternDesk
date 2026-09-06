const { Router } = require('express')
const { getAll, getById, saveMarks, publish, getProgress } = require('../Controllers/evaluationController')

const router = Router()

router.get('/', getAll)
router.get('/progress', getProgress)
router.get('/:id', getById)
router.put('/:id/marks', saveMarks)
router.patch('/:id/publish', publish)

module.exports = router
