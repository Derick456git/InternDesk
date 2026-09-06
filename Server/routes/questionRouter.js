const { Router } = require('express')
const { getAll, create, update, delete: deleteQ } = require('../Controllers/questionController')

const router = Router()

router.get('/', getAll)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', deleteQ)

module.exports = router
