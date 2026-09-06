const { Router } = require('express')
const { create, getAll, updateStatus, approve, reject, delete: deleteReg } = require('../Controllers/registrationController')

const router = Router()

router.post('/', create)
router.get('/', getAll)
router.patch('/:id/status', updateStatus)
router.put('/:id/approve', approve)
router.put('/:id/reject', reject)
router.delete('/:id', deleteReg)

module.exports = router
