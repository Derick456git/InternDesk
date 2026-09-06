const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, ''),
  },
})

const getInternLoginUrl = () => {
  return process.env.CLIENT_URL || 'http://localhost:5173/login'
}

const renderInternLoginButtonHtml = (label = 'Login to Intern Portal →') => {
  const loginUrl = getInternLoginUrl()
  return `
    <div style="text-align: center; margin: 22px 0 14px;">
      <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.25);">
        ${label}
      </a>
    </div>
  `
}

exports.sendOtpEmail = async (to, otp) => {
  const loginUrl = getInternLoginUrl()
  const mailOptions = {
    from: `"Intern Desk" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your OTP for Password Reset - Intern Desk',
    text: `Your 4-digit OTP for password reset is: ${otp}\n\nThis OTP is valid for 30 seconds.\n\nLogin Page: ${loginUrl}\n\nIf you did not request this, please ignore this email.\n\n- Intern Desk Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk</h1>
          <p style="color: #8899aa; margin: 4px 0 0; font-size: 12px;">Security Verification</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #1f2937;">Password Reset OTP</h2>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">Use the following OTP to reset your password. This code is valid for <strong>30 seconds</strong>.</p>
          <div style="text-align: center; padding: 16px; background-color: #f3f4f6; border-radius: 8px; margin-bottom: 16px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0f1a2e;">${otp}</span>
          </div>
          ${renderInternLoginButtonHtml('Back to Login Page →')}
          <p style="font-size: 13px; color: #6b7280; margin: 12px 0 0; text-align: center;">If you did not request this password reset, please ignore this email.</p>
        </div>
        <div style="padding: 16px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Intern Desk. All rights reserved.</p>
        </div>
      </div>
    `,
  }
  await transporter.sendMail(mailOptions)
}

exports.sendSyllabusAssignmentEmail = async (to, { internName, syllabusName, technology, startDate }) => {
  const assignedDate = startDate ? new Date(startDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')
  const subject = `Syllabus Assignment Notification – ${syllabusName} ${technology}`
  const loginUrl = getInternLoginUrl()

  const text = `Dear ${internName},\n\nYour ${syllabusName} ${technology} syllabus has been successfully assigned to you. Please log in to your intern portal to view the full syllabus details.\n\nSyllabus Start Date: ${assignedDate}\n\nStrictly Follow the Below Instructions:\n1. Start Date: You must start studying the assigned syllabus from the date on which the syllabus is assigned to you.\n2. End-of-Day Notes: You must complete the topics assigned for each day and strictly submit your End-of-Day Notes after completing the day's topics.\n3. Assessment Schedule: After completing the first five days of the assigned syllabus, an assessment will be conducted on the 6th day. The assessment will include both Descriptive and Objective questions. The same assessment pattern will continue at every 5-day interval.\n4. Test Attendance and Notes Submission: If you fail to attend the assessment scheduled for the 6th day, you will not be allowed to upload your notes on the 7th day.\n\nLogin to Intern Portal: ${loginUrl}\n\nBest of luck!\n- Intern Desk Team`

  const mailOptions = {
    from: `"Intern Desk Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk</h1>
          <p style="color: #8899aa; margin: 4px 0 0; font-size: 12px;">Syllabus Assignment</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #1f2937;">${subject}</h2>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 10px;">Dear ${internName},</p>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 10px;">Your <strong>${syllabusName}</strong> (<strong>${technology}</strong>) syllabus has been assigned to you.</p>
          <div style="text-align: center; padding: 12px; background-color: #f3f4f6; border-radius: 8px; margin-bottom: 14px;">
            <span style="font-size: 14px; font-weight: 600; color: #0f1a2e;">Syllabus Start Date: ${assignedDate}</span>
          </div>
          <p style="font-size: 13px; font-weight: 600; color: #1f2937; margin: 0 0 6px;">Important Instructions:</p>
          <ol style="font-size: 13px; color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.7;">
            <li>Study topics day-by-day and submit your daily notes for approval.</li>
            <li>Each 5 approved daily notes will unlock your test.</li>
            <li>Attend tests on time to progress smoothly.</li>
          </ol>
          ${renderInternLoginButtonHtml('Login to Intern Portal →')}
          <p style="font-size: 14px; color: #1f2937; margin: 14px 0 0; font-weight: 600;">Best of luck!</p>
        </div>
        <div style="padding: 16px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Intern Desk. All rights reserved.</p>
        </div>
      </div>
    `,
  }
  await transporter.sendMail(mailOptions)
}

exports.sendDailyNotesFeedbackEmail = async (to, { internName, technology, dayNumber, status, score, feedback }) => {
  const isApproved = status === 'Approved'
  const subject = `Daily Notes ${status || 'Reviewed'} – ${technology} Day ${dayNumber}`
  const accentColor = isApproved ? '#16a34a' : '#dc2626'
  const loginUrl = getInternLoginUrl()

  const mailOptions = {
    from: `"Intern Desk Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: `Dear ${internName},\n\nYour Day ${dayNumber} notes for ${technology} have been ${status}.\n${score ? `Score: ${score}/10\n` : ''}${feedback ? `Feedback: ${feedback}\n` : ''}\nLogin to Intern Portal: ${loginUrl}\n\nPlease check your Intern Portal for details.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk</h1>
          <p style="color: #8899aa; margin: 4px 0 0; font-size: 12px;">Daily Notes Review</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #1f2937;">${subject}</h2>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 14px;">Dear ${internName},</p>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 14px;">Your <strong>Day ${dayNumber}</strong> notes for <strong>${technology}</strong> have been reviewed by the admin.</p>
          <div style="padding: 16px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid ${accentColor}; margin-bottom: 14px;">
            <p style="margin: 0; font-size: 16px; font-weight: 700; color: ${accentColor};">Status: ${status}</p>
            ${score !== undefined && score !== null ? `<p style="margin: 6px 0 0; font-size: 14px; color: #1f2937;">Score: <strong>${score}/10</strong></p>` : ''}
            ${feedback ? `<p style="margin: 6px 0 0; font-size: 13px; color: #4b5563;">Feedback: ${feedback}</p>` : ''}
          </div>
          ${renderInternLoginButtonHtml('Login to Intern Portal →')}
          <p style="font-size: 13px; color: #4b5563; margin: 10px 0 0; text-align: center;">Log in to your Intern Portal to check your progress.</p>
        </div>
        <div style="padding: 16px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Intern Desk. All rights reserved.</p>
        </div>
      </div>
    `,
  }
  await transporter.sendMail(mailOptions)
}

exports.sendAssessmentReadyEmail = async (to, { internName, technology, assessmentNumber, testName }) => {
  const subject = `Your Assessment is Ready! – ${technology} Assessment ${assessmentNumber}`
  const loginUrl = getInternLoginUrl()

  const mailOptions = {
    from: `"Intern Desk Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: `Dear ${internName},\n\nYour ${technology} Assessment #${assessmentNumber} (${testName}) has been unlocked. Please log in to your Intern Portal to attend the test.\n\nLogin to Intern Portal: ${loginUrl}\n\n- Intern Desk Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk</h1>
          <p style="color: #8899aa; margin: 4px 0 0; font-size: 12px;">Assessment Unlocked</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #1f2937;">${subject}</h2>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 10px;">Dear ${internName},</p>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 14px;">You have completed the required 5 daily notes! Your <strong>${technology} Assessment #${assessmentNumber}</strong> is now unlocked.</p>
          <div style="text-align: center; padding: 16px; background-color: #f3f4f6; border-radius: 8px; margin-bottom: 14px;">
            <span style="font-size: 16px; font-weight: 600; color: #0f1a2e;">${testName}</span>
            <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">Duration: 25 Minutes · Max Marks: 35 · Pass: 21 Marks (60%)</p>
          </div>
          ${renderInternLoginButtonHtml('Login & Attend Assessment →')}
          <p style="font-size: 13px; color: #4b5563; margin: 10px 0 0; text-align: center;">Please log in to your portal when you are ready to take the assessment.</p>
        </div>
        <div style="padding: 16px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Intern Desk. All rights reserved.</p>
        </div>
      </div>
    `,
  }
  await transporter.sendMail(mailOptions)
}

exports.sendResultPublishedEmail = async (to, { internName, testName, totalScore, percentage, resultStatus, technology, assessmentNumber }) => {
  const isPassed = String(resultStatus).toLowerCase() === 'passed' || Number(totalScore) >= 21
  const resultText = isPassed ? 'PASSED' : 'FAILED'
  const accentColor = isPassed ? '#16a34a' : '#dc2626'
  const subject = `Assessment Result Published – ${testName} (${resultText})`
  const loginUrl = getInternLoginUrl()

  const mailOptions = {
    from: `"Intern Desk Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: `Dear ${internName},\n\nYour result for ${testName} (${technology} Assessment ${assessmentNumber}) has been published.\n\nTotal Score: ${totalScore}/35\nPercentage: ${percentage}%\nResult: ${resultText}\n\nLogin to Intern Portal: ${loginUrl}\n\nPlease check your Intern Portal for the question-by-question breakdown.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk</h1>
          <p style="color: #8899aa; margin: 4px 0 0; font-size: 12px;">Assessment Result</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #1f2937;">${subject}</h2>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 10px;">Dear ${internName},</p>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 14px;">Your evaluation for <strong>${testName}</strong> is complete.</p>
          <div style="text-align: center; padding: 16px; background-color: #f3f4f6; border-radius: 8px; margin-bottom: 14px;">
            <span style="font-size: 26px; font-weight: 700; color: #0f1a2e;">${totalScore} / 35</span>
            <p style="font-size: 14px; color: #4b5563; margin: 4px 0 0;">Percentage: <strong>${percentage}%</strong></p>
            <span style="display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; color: #ffffff; background-color: ${accentColor};">
              ${resultText}
            </span>
          </div>
          ${renderInternLoginButtonHtml('Login to View Result Sheet →')}
          <p style="font-size: 13px; color: #4b5563; margin: 10px 0 0; text-align: center;">Log in to your Intern Portal to inspect the full graded answer sheet.</p>
        </div>
        <div style="padding: 16px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Intern Desk. All rights reserved.</p>
        </div>
      </div>
    `,
  }
  await transporter.sendMail(mailOptions)
}

exports.sendTaskAssignedEmail = async (to, { internName, taskName, technology, dueDate, taskDescription }) => {
  const due = dueDate ? new Date(dueDate).toLocaleDateString('en-GB') : '—'
  const subject = `New Practical Task Assigned – ${taskName}`
  const loginUrl = getInternLoginUrl()

  const mailOptions = {
    from: `"Intern Desk Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: `Dear ${internName},\n\nA new practical task "${taskName}" for ${technology} has been assigned to you.\nDue Date: ${due}\n\nDescription: ${taskDescription}\n\nLogin to Intern Portal: ${loginUrl}\n\nPlease submit your completed project as a .zip file through the Intern Portal.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk</h1>
          <p style="color: #8899aa; margin: 4px 0 0; font-size: 12px;">Practical Task Assignment</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #1f2937;">${subject}</h2>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 10px;">Dear ${internName},</p>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 14px;">A new practical task has been assigned to your profile:</p>
          <div style="padding: 16px; background-color: #f3f4f6; border-radius: 8px; margin-bottom: 14px;">
            <p style="margin: 0; font-size: 15px; font-weight: 700; color: #0f1a2e;">${taskName} (${technology})</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Due Date: <strong>${due}</strong></p>
            ${taskDescription ? `<p style="margin: 8px 0 0; font-size: 13px; color: #4b5563;">${taskDescription}</p>` : ''}
          </div>
          ${renderInternLoginButtonHtml('Login to View Task →')}
          <p style="font-size: 13px; color: #4b5563; margin: 10px 0 0; text-align: center;">Complete your project and upload the .zip archive on your Intern Portal before the deadline.</p>
        </div>
        <div style="padding: 16px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Intern Desk. All rights reserved.</p>
        </div>
      </div>
    `,
  }
  await transporter.sendMail(mailOptions)
}

exports.sendTaskReviewedEmail = async (to, { internName, taskName, marks, feedback, technology }) => {
  const subject = `Practical Task Review Published – ${taskName}`
  const loginUrl = getInternLoginUrl()

  const mailOptions = {
    from: `"Intern Desk Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: `Dear ${internName},\n\nYour task "${taskName}" for ${technology} has been evaluated.\nMarks: ${marks || '—'}\nFeedback: ${feedback || '—'}\n\nLogin to Intern Portal: ${loginUrl}\n\nPlease check your Intern Portal for details.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk</h1>
          <p style="color: #8899aa; margin: 4px 0 0; font-size: 12px;">Task Evaluation</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #1f2937;">${subject}</h2>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 10px;">Dear ${internName},</p>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 14px;">Your submission for <strong>${taskName}</strong> has been evaluated by the admin.</p>
          <div style="padding: 16px; background-color: #f3f4f6; border-radius: 8px; margin-bottom: 14px;">
            ${marks !== undefined && marks !== null ? `<p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f1a2e;">Marks: ${marks}</p>` : ''}
            ${feedback ? `<p style="margin: 6px 0 0; font-size: 14px; color: #4b5563;">Feedback: ${feedback}</p>` : ''}
          </div>
          ${renderInternLoginButtonHtml('Login to View Feedback →')}
          <p style="font-size: 13px; color: #4b5563; margin: 10px 0 0; text-align: center;">Log in to your Intern Portal to check the full details.</p>
        </div>
        <div style="padding: 16px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Intern Desk. All rights reserved.</p>
        </div>
      </div>
    `,
  }
  await transporter.sendMail(mailOptions)
}

exports.sendStatusEmail = async (to, { status }) => {
  const isApproved = status === 'Approved'
  const message = isApproved
    ? 'Approved as intern, Now login to your portal using your registered email and password. Thank you'
    : 'Sorry you are not approved as an intern'
  const subject = isApproved ? 'Internship Approved - Intern Desk' : 'Internship Status Update - Intern Desk'
  const accentColor = isApproved ? '#16a34a' : '#dc2626'
  const loginUrl = getInternLoginUrl()

  const mailOptions = {
    from: `"Intern Desk Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: isApproved ? `${message}\n\nLogin to Intern Portal: ${loginUrl}` : message,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk</h1>
          <p style="color: #8899aa; margin: 4px 0 0; font-size: 12px;">Intern Portal</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #1f2937;">${subject}</h2>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">${message}</p>
          <div style="text-align: center; padding: 16px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid ${accentColor};">
            <span style="font-size: 16px; font-weight: 600; color: ${accentColor};">${message}</span>
          </div>
          ${isApproved ? renderInternLoginButtonHtml('Login to Intern Portal →') : ''}
        </div>
        <div style="padding: 16px; text-align: center; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Intern Desk. All rights reserved.</p>
        </div>
      </div>
    `,
  }
  await transporter.sendMail(mailOptions)
}

// ---------------- Admin Email Alerts ----------------

const getAdminRecipientEmail = async () => {
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.trim()) {
    return process.env.ADMIN_EMAIL.trim()
  }
  try {
    const Admin = require('../Models/adminModel')
    const adminDocs = await Admin.find().select('email').lean()
    if (adminDocs && adminDocs.length > 0) {
      const validEmails = adminDocs.map((a) => a.email).filter(Boolean)
      if (validEmails.length > 0) return validEmails.join(', ')
    }
  } catch (err) {
    console.error('Failed to resolve admin email from DB:', err.message)
  }
  return 'interndeskadmin@gmail.com'
}

exports.sendAdminNotesSubmissionEmail = async ({ internName, internEmail, technology, dayNumber, submissionDate }) => {
  const adminEmail = await getAdminRecipientEmail()
  if (!adminEmail) return
  const dateStr = submissionDate ? new Date(submissionDate).toLocaleString('en-GB') : new Date().toLocaleString('en-GB')
  const subject = `[New Submission] Daily Notes – ${internName} (${technology} Day ${dayNumber})`

  const mailOptions = {
    from: `"Intern Desk Alerts" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject,
    text: `Admin Alert:\n\nIntern ${internName} (${internEmail}) has uploaded their Day ${dayNumber} Daily Notes and Book for ${technology}.\n\nSubmitted at: ${dateStr}\n\nPlease log in to the Admin Portal (List Daily Notes) to review and grade this submission.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk · Admin Alert</h1>
          <p style="color: #f97316; margin: 4px 0 0; font-size: 13px; font-weight: bold;">📝 Daily Notes Submission</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <h2 style="margin: 0 0 14px; font-size: 16px; color: #111827;">New Daily Notes Uploaded</h2>
          <div style="padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #f97316; margin-bottom: 16px; font-size: 14px; color: #334155; line-height: 1.6;">
            <p style="margin: 0;"><strong>Intern:</strong> ${internName} (${internEmail})</p>
            <p style="margin: 4px 0 0;"><strong>Technology:</strong> ${technology}</p>
            <p style="margin: 4px 0 0;"><strong>Day Number:</strong> Day ${dayNumber}</p>
            <p style="margin: 4px 0 0;"><strong>Submitted:</strong> ${dateStr}</p>
          </div>
          <p style="font-size: 13px; color: #64748b; margin: 0;">Log in to the Admin Portal to review the uploaded .docx notes and .xlsx book files and provide feedback.</p>
        </div>
        <div style="padding: 14px; text-align: center; background-color: #f1f5f9; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">Intern Desk Admin Notification System</p>
        </div>
      </div>
    `,
  }
  try {
    await transporter.sendMail(mailOptions)
  } catch (err) {
    console.error('Failed to send admin notes email alert:', err.message)
  }
}

exports.sendAdminTestSubmissionEmail = async ({ internName, internEmail, technology, testName, assessmentNumber, objectiveScore, totalScore, submittedAt }) => {
  const adminEmail = await getAdminRecipientEmail()
  if (!adminEmail) return
  const dateStr = submittedAt ? new Date(submittedAt).toLocaleString('en-GB') : new Date().toLocaleString('en-GB')
  const subject = `[New Submission] Assessment Test – ${internName} (${technology} Assessment #${assessmentNumber})`

  const mailOptions = {
    from: `"Intern Desk Alerts" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject,
    text: `Admin Alert:\n\nIntern ${internName} (${internEmail}) has completed and submitted ${testName} (${technology} Assessment #${assessmentNumber}).\nObjective Score: ${objectiveScore ?? 0}/10\nSubmitted at: ${dateStr}\n\nPlease log in to the Admin Portal (Evaluation & Result) to evaluate descriptive answers and publish the official result.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk · Admin Alert</h1>
          <p style="color: #8b5cf6; margin: 4px 0 0; font-size: 13px; font-weight: bold;">✍️ Test Completed</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <h2 style="margin: 0 0 14px; font-size: 16px; color: #111827;">New Assessment Test Submitted</h2>
          <div style="padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #8b5cf6; margin-bottom: 16px; font-size: 14px; color: #334155; line-height: 1.6;">
            <p style="margin: 0;"><strong>Intern:</strong> ${internName} (${internEmail})</p>
            <p style="margin: 4px 0 0;"><strong>Assessment:</strong> ${testName}</p>
            <p style="margin: 4px 0 0;"><strong>Track:</strong> ${technology} (Test #${assessmentNumber})</p>
            <p style="margin: 4px 0 0;"><strong>Auto-Scored Objective:</strong> ${objectiveScore ?? 0} / 10 Marks</p>
            <p style="margin: 4px 0 0;"><strong>Submitted:</strong> ${dateStr}</p>
          </div>
          <p style="font-size: 13px; color: #64748b; margin: 0;">Log in to the Admin Portal under <strong>Evaluation & Result</strong> to grade the 5 descriptive questions (25M) and publish the result.</p>
        </div>
        <div style="padding: 14px; text-align: center; background-color: #f1f5f9; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">Intern Desk Admin Notification System</p>
        </div>
      </div>
    `,
  }
  try {
    await transporter.sendMail(mailOptions)
  } catch (err) {
    console.error('Failed to send admin test email alert:', err.message)
  }
}

exports.sendAdminTaskSubmissionEmail = async ({ internName, internEmail, technology, taskName, submittedAt }) => {
  const adminEmail = await getAdminRecipientEmail()
  if (!adminEmail) return
  const dateStr = submittedAt ? new Date(submittedAt).toLocaleString('en-GB') : new Date().toLocaleString('en-GB')
  const subject = `[New Submission] Practical Task – ${internName} (${taskName})`

  const mailOptions = {
    from: `"Intern Desk Alerts" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject,
    text: `Admin Alert:\n\nIntern ${internName} (${internEmail}) has submitted their completed project archive (.zip) for practical task "${taskName}" (${technology}).\nSubmitted at: ${dateStr}\n\nPlease log in to the Admin Portal (Task Management) to download the ZIP, grade, and review.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk · Admin Alert</h1>
          <p style="color: #0284c7; margin: 4px 0 0; font-size: 13px; font-weight: bold;">📁 Practical Task ZIP Uploaded</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <h2 style="margin: 0 0 14px; font-size: 16px; color: #111827;">New Practical Task Submitted</h2>
          <div style="padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #0284c7; margin-bottom: 16px; font-size: 14px; color: #334155; line-height: 1.6;">
            <p style="margin: 0;"><strong>Intern:</strong> ${internName} (${internEmail})</p>
            <p style="margin: 4px 0 0;"><strong>Task Name:</strong> ${taskName}</p>
            <p style="margin: 4px 0 0;"><strong>Technology:</strong> ${technology}</p>
            <p style="margin: 4px 0 0;"><strong>Submitted:</strong> ${dateStr}</p>
          </div>
          <p style="font-size: 13px; color: #64748b; margin: 0;">Log in to the Admin Portal under <strong>Task Management</strong> to download the submitted project ZIP and provide grading/feedback.</p>
        </div>
        <div style="padding: 14px; text-align: center; background-color: #f1f5f9; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">Intern Desk Admin Notification System</p>
        </div>
      </div>
    `,
  }
  try {
    await transporter.sendMail(mailOptions)
  } catch (err) {
    console.error('Failed to send admin task email alert:', err.message)
  }
}

exports.sendInternCourseCompletionEmail = async (to, { internName, technology }) => {
  const subject = `Course Completed – ${technology} | Final Task Assignment`
  const loginUrl = getInternLoginUrl()

  const mailOptions = {
    from: `"Intern Desk Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: `Dear ${internName},\n\nYour ${technology} course has successfully completed and you will be assign for a final task.\n\nCongratulations on attending and completing all the daily notes and assessments for the ${technology} track. Please stay tuned as your administrator will assign your final practical project task shortly.\n\nLogin to Intern Portal: ${loginUrl}\n\n- Intern Desk Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f1a2e; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Intern Desk</h1>
          <p style="color: #10b981; margin: 6px 0 0; font-size: 14px; font-weight: 700;">🎓 Course Successfully Completed</p>
        </div>
        <div style="padding: 26px; background-color: #ffffff;">
          <h2 style="margin: 0 0 12px; font-size: 17px; color: #111827;">Congratulations, ${internName}! 🎉</h2>
          <div style="padding: 16px; background-color: #ecfdf5; border-radius: 10px; border-left: 4px solid #10b981; margin-bottom: 18px;">
            <p style="margin: 0; font-size: 15px; font-weight: 700; color: #065f46;">
              Your ${technology} course has successfully completed and you will be assign for a final task.
            </p>
          </div>
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 14px;">
            You have diligently uploaded all required daily notes and attended all assessments for <strong>${technology}</strong>.
          </p>
          <p style="font-size: 13px; color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
            Your mentor/administrator has been notified and will review your progress to assign your final practical project task in your portal.
          </p>
          ${renderInternLoginButtonHtml('Login to Intern Portal →')}
          <p style="font-size: 12px; color: #6b7280; margin: 12px 0 0; text-align: center;">Keep an eye on your portal notifications and email for final project task details.</p>
        </div>
        <div style="padding: 16px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Intern Desk. All rights reserved.</p>
        </div>
      </div>
    `,
  }
  try {
    await transporter.sendMail(mailOptions)
  } catch (err) {
    console.error('Failed to send intern course completion email:', err.message)
  }
}

exports.sendAdminCourseCompletionEmail = async ({ internName, internEmail, technology, completedDate }) => {
  const adminEmail = await getAdminRecipientEmail()
  if (!adminEmail) return
  const dateStr = completedDate ? new Date(completedDate).toLocaleString('en-GB') : new Date().toLocaleString('en-GB')
  const subject = `[Course Completed] ${internName} – ${technology} Course Successfully Completed`

  const mailOptions = {
    from: `"Intern Desk Alerts" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject,
    text: `Admin Alert:\n\nIntern ${internName} (${internEmail}) has completed their final assessment and successfully finished the ${technology} course.\n\nCompletion Time: ${dateStr}\n\nPlease log in to the Admin Portal (Task Management) to assign their final practical task project.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Intern Desk · Admin Alert</h1>
          <p style="color: #10b981; margin: 4px 0 0; font-size: 13px; font-weight: bold;">🎓 Course Completed by Intern</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <h2 style="margin: 0 0 14px; font-size: 16px; color: #111827;">Final Assessment Submitted · Course Completed</h2>
          <div style="padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 16px; font-size: 14px; color: #334155; line-height: 1.6;">
            <p style="margin: 0;"><strong>Intern:</strong> ${internName} (${internEmail})</p>
            <p style="margin: 4px 0 0;"><strong>Technology:</strong> ${technology}</p>
            <p style="margin: 4px 0 0;"><strong>Status:</strong> All daily notes & assessments completed</p>
            <p style="margin: 4px 0 0;"><strong>Completed On:</strong> ${dateStr}</p>
          </div>
          <p style="font-size: 13px; color: #64748b; margin: 0 0 8px;">
            The intern has been notified: <em>"Your ${technology} course has successfully completed and you will be assign for a final task."</em>
          </p>
          <p style="font-size: 13px; color: #334155; font-weight: 600; margin: 0;">
            Please log in to the Admin Portal under <strong>Task Management</strong> &gt; <strong>Assign Task</strong> to assign their final practical project task.
          </p>
        </div>
        <div style="padding: 14px; text-align: center; background-color: #f1f5f9; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">Intern Desk Admin Notification System</p>
        </div>
      </div>
    `,
  }
  try {
    await transporter.sendMail(mailOptions)
  } catch (err) {
    console.error('Failed to send admin course completion email alert:', err.message)
  }
}

