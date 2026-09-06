const jwt = require('jsonwebtoken')

const authIntern = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.intern = { id: decoded.id, email: decoded.email, role: decoded.role || 'intern' }
    req.user = req.intern
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
  }
}

const authAdmin = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ success: false, message: 'Admin authentication required.' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = { id: decoded.id, email: decoded.email, role: decoded.role || 'admin' }
    req.user = req.admin
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' })
  }
}

module.exports = { authIntern, authAdmin }
