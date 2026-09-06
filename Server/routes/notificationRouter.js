const { Router } = require('express')
const {
  getByEmail,
  getAdminNotifications,
  markRead,
  markAllAdminRead,
  clearAdminNotifications,
} = require('../Controllers/notificationController')

const router = Router()

// Admin Notification Routes
router.get('/admin', getAdminNotifications)
router.patch('/admin/read-all', markAllAdminRead)
router.delete('/admin/clear', clearAdminNotifications)
router.patch('/admin/:id/read', markRead)

// Intern Notification Routes
router.get('/', getByEmail)
router.patch('/:id/read', markRead)

module.exports = router