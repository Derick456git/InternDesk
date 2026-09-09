const { Router } = require('express')
const { getAll, create, delete: deleteTopic } = require('../Controllers/topicController')

const router = Router()

router.get('/', getAll)
router.post('/', create)
router.delete('/:id', deleteTopic)

module.exports = router
