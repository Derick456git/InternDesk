const express = require('express')
const { getAll, create, delete: deleteChapter } = require('../Controllers/chapterController')

const router = express.Router()

router.get('/', getAll)
router.post('/', create)
router.delete('/:id', deleteChapter)

module.exports = router
