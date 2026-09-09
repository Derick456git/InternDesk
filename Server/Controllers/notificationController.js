const Notification = require('../Models/notificationModel')

exports.getByEmail = async (req, res) => {
  try {
    const email = (req.intern?.email || req.query.email || '').toLowerCase().trim()
    const filter = email
      ? { email, recipientRole: 'intern' }
      : { recipientRole: 'intern' }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).lean()
    const mapped = notifications.map((n) => ({
      ...n,
      read: n.read || n.isRead,
      isRead: n.isRead || n.read,
    }))
    res.json({ success: true, data: mapped })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getAdminNotifications = async (req, res) => {
  try {
    const filter = {
      recipientRole: 'admin',
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100).lean()
    const mapped = notifications.map((n) => ({
      ...n,
      read: n.read || n.isRead || false,
      isRead: n.isRead || n.read || false,
    }))

    const unreadCount = mapped.filter((n) => !n.read).length

    res.json({
      success: true,
      unreadCount,
      data: mapped,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.markRead = async (req, res) => {
  try {
    const { id } = req.params
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true, isRead: true },
      { new: true }
    )
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' })
    }
    res.json({ success: true, data: notification })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.markAllAdminRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientRole: 'admin' },
      { $set: { read: true, isRead: true } }
    )

    res.json({ success: true, message: 'All admin notifications marked as read.' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.clearAdminNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      recipientRole: 'admin',
      read: true,
    })
    res.json({ success: true, message: 'Read admin notifications cleared.' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
