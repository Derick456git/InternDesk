const { Router } = require('express')
const {
  getCompletedInterns,
  getInternSummary,
  issueCertificate,
  getAllCertificates,
} = require('../Controllers/certificateController')

const router = Router()

router.get('/completed-interns', getCompletedInterns)
router.get('/summary/:internId', getInternSummary)
router.post('/issue', issueCertificate)
router.get('/', getAllCertificates)

module.exports = router
