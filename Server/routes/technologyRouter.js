const { Router } = require('express')
const { getAll, create, update, delete: deleteTech } = require('../Controllers/technologyController')

const router = Router()

router.get('/', getAll)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', deleteTech)

module.exports = router
