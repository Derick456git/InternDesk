const Registration = require('../Models/registrationModel')
const Intern = require('../Models/internModel')
const Notification = require('../Models/notificationModel')
const bcrypt = require('bcryptjs')
const { sendStatusEmail } = require('../config/mailer')

const syncInternAccount = async (registration) => {
  const hashedPassword = registration.password || (await bcrypt.hash('intern123', 10))
  const existing = await Intern.findOne({ email: registration.email.toLowerCase() })
  if (existing) {
    existing.name = registration.name
    existing.password = hashedPassword
    existing.technologies = registration.technologies?.length ? registration.technologies : (registration.technology ? [registration.technology] : [])
    existing.technology = registration.technologies?.[0] || registration.technology || ''
    await existing.save()
  } else {
    await Intern.create({
      name: registration.name,
      email: registration.email,
      password: hashedPassword,
      technologies: registration.technologies?.length ? registration.technologies : (registration.technology ? [registration.technology] : []),
      technology: registration.technologies?.[0] || registration.technology || '',
    })
  }
}

exports.create = async (req, res) => {
  try {
    const {
      name, email, password, phone, gender, age, location, address, pincode,
      qualification, technologies, technology, collegeName, universityName,
      internshipPeriod, classMode,
    } = req.body

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required' })
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const techs = Array.isArray(technologies) && technologies.length > 0
      ? technologies
      : (technology ? [technology] : [])

    const registration = await Registration.create({
      name, email, password: hashedPassword, phone, gender, age, location, address, pincode,
      qualification: qualification || universityName || '',
      technologies: techs,
      technology: techs[0] || '',
      collegeName, universityName, internshipPeriod,
      classMode: classMode || 'Online',
      status: 'Pending',
    })

    const existingIntern = await Intern.findOne({ email: email.toLowerCase() })
    if (existingIntern) {
      existingIntern.name = name
      existingIntern.password = hashedPassword
      existingIntern.technologies = techs
      existingIntern.technology = techs[0] || ''
      await existingIntern.save()
    } else {
      await Intern.create({
        name,
        email,
        password: hashedPassword,
        technologies: techs,
        technology: techs[0] || '',
      })
    }

    res.status(201).json({
      success: true,
      message: 'Please wait.. the approval will be done shortly',
      data: registration,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getAll = async (req, res) => {
  try {
    const { status, technology } = req.query
    const filter = {}
    if (status && status !== 'All') filter.status = status
    if (technology) {
      filter.$or = [{ technology }, { technologies: technology }]
    }
    const registrations = await Registration.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: registrations })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }
    const registration = await Registration.findByIdAndUpdate(id, { status }, { new: true })
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' })
    }

    if (status === 'Approved') {
      await syncInternAccount(registration)
    }

    try {
      await sendStatusEmail(registration.email, { status })
    } catch (emailError) {
      console.error('Status email failed:', emailError.message)
    }

    try {
      const message = status === 'Approved'
        ? 'Approved as intern, Now login to your portal. Thank you'
        : 'Sorry you are not approved as an intern'
      await Notification.create({
        email: registration.email,
        internName: registration.name,
        title: status === 'Approved' ? 'Internship Approved' : 'Internship Rejected',
        message,
      })
    } catch (notifError) {
      console.error('Notification create failed:', notifError.message)
    }

    res.json({ success: true, message: `Registration ${status.toLowerCase()}`, data: registration })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.approve = async (req, res) => {
  try {
    const { id } = req.params
    const registration = await Registration.findByIdAndUpdate(id, { status: 'Approved' }, { new: true })
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' })
    }

    await syncInternAccount(registration)

    try {
      await sendStatusEmail(registration.email, { status: 'Approved' })
    } catch (emailError) {
      console.error('Approval email failed:', emailError.message)
    }

    try {
      await Notification.create({
        email: registration.email,
        internName: registration.name,
        title: 'Internship Approved',
        message: 'Approved as intern, Now login to your portal. Thank you',
      })
    } catch (notifError) {
      console.error('Notification create failed:', notifError.message)
    }

    res.json({ success: true, message: 'Registration approved', data: registration })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.reject = async (req, res) => {
  try {
    const { id } = req.params
    const registration = await Registration.findByIdAndUpdate(id, { status: 'Rejected' }, { new: true })
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' })
    }

    try {
      await sendStatusEmail(registration.email, { status: 'Rejected' })
    } catch (emailError) {
      console.error('Rejection email failed:', emailError.message)
    }

    try {
      await Notification.create({
        email: registration.email,
        internName: registration.name,
        title: 'Internship Rejected',
        message: 'Sorry you are not approved as an intern',
      })
    } catch (notifError) {
      console.error('Notification create failed:', notifError.message)
    }

    res.json({ success: true, message: 'Registration rejected', data: registration })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const registration = await Registration.findByIdAndDelete(id)
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' })
    }
    res.json({ success: true, message: 'Registration deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
