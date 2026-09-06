const { Router } = require('express')
const { getAll, create, update, selectQuestions, publish, delete: deleteTest } = require('../Controllers/testController')

const router = Router()

router.get('/', getAll)
router.post('/', create)
router.put('/:id', update)
router.put('/:id/questions', selectQuestions)
router.post('/:id/publish', publish)
router.delete('/:id', deleteTest)

module.exports = router
