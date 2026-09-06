const Evaluation = require('../Models/evaluationModel')
const TestSubmission = require('../Models/testSubmissionModel')
const Question = require('../Models/questionModel')
const Registration = require('../Models/registrationModel')
const Notification = require('../Models/notificationModel')
const { sendResultPublishedEmail } = require('../config/mailer')

exports.getAll = async (req, res) => {
  try {
    const { test, technology, internName, assessmentNumber } = req.query
    const filter = {}
    if (test) filter.testName = test
    if (technology) filter.technology = technology
    if (internName) filter.internName = internName
    if (assessmentNumber) filter.assessmentNumber = Number(assessmentNumber)

    const [evaluations, testSubmissions] = await Promise.all([
      Evaluation.find(filter).sort({ createdAt: -1 }),
      TestSubmission.find(filter).sort({ submittedAt: -1 }),
    ])

    const combined = [
      ...evaluations.map((e) => ({ ...e.toObject(), source: 'evaluation' })),
      ...testSubmissions.map((t) => ({ ...t.toObject(), source: 'testSubmission' })),
    ].sort((a, b) => new Date(b.createdAt || b.submittedAt) - new Date(a.createdAt || a.submittedAt))

    res.json({ success: true, data: combined })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getById = async (req, res) => {
  try {
    const { id } = req.params
    let doc = await TestSubmission.findById(id).populate('testId')
    if (!doc) {
      doc = await Evaluation.findById(id)
    }
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Evaluation/Submission not found' })
    }

    const docObj = doc.toObject()
    if (docObj.answers && docObj.answers.length > 0) {
      const qIds = docObj.answers.map(a => a.questionId).filter(Boolean)
      const questions = await Question.find({ _id: { $in: qIds } }).lean()
      const questionMap = new Map(questions.map(q => [q._id.toString(), q]))

      docObj.answers = docObj.answers.map(ans => {
        const q = questionMap.get(String(ans.questionId))
        const isObj = ans.isObjective || ans.type === 'Objective' || q?.type === 'Objective'
        const expected = (ans.correctAnswer || q?.correctAnswer || (q?.options && q?.options[0]) || '').trim()
        const rawAnswer = (ans.internAnswer || ans.answerText || ans.answer || '').trim()

        let isCorrect = false
        if (isObj && expected) {
          const normExp = expected.toLowerCase().trim()
          const normRaw = rawAnswer.toLowerCase().trim()
          isCorrect = normExp === normRaw
          if (!isCorrect && q?.options && q.options.length > 0) {
            const letterMap = { a: 0, b: 1, c: 2, d: 3 }
            const expectedIdx = letterMap[normExp.replace(/^option\s*/, '')]
            if (expectedIdx !== undefined && q.options[expectedIdx]) {
              isCorrect = q.options[expectedIdx].trim().toLowerCase() === normRaw
            }
            const rawIdx = letterMap[normRaw.replace(/^option\s*/, '')]
            if (rawIdx !== undefined && q.options[rawIdx]) {
              isCorrect = q.options[rawIdx].trim().toLowerCase() === normExp
            }
          }
        }

        const autoMark = isObj ? (isCorrect ? 2 : 0) : (ans.marksAwarded ?? 0)
        const feedback = isObj ? (isCorrect ? 'Correct Answer' : 'Wrong answer') : (ans.feedback || '')

        return {
          ...ans,
          type: isObj ? 'Objective' : 'Descriptive',
          isObjective: isObj,
          options: ans.options?.length ? ans.options : (q?.options || []),
          correctAnswer: expected,
          marksAwarded: ans.marksAwarded !== undefined && ans.marksAwarded !== null ? ans.marksAwarded : autoMark,
          maxMarks: isObj ? 2 : 5,
          feedback: ans.feedback || feedback,
        }
      })
    }

    res.json({ success: true, data: { ...docObj, source: doc.answers ? 'testSubmission' : 'evaluation' } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.saveMarks = async (req, res) => {
  try {
    const { id } = req.params
    const { marks } = req.body
    if (!marks || !Array.isArray(marks)) {
      return res.status(400).json({ success: false, message: 'Marks array is required' })
    }

    const total = marks.reduce((sum, m) => sum + (Number(m.marksAwarded) || 0), 0)
    const percentage = Number(((total / 35) * 100).toFixed(2))
    const resultStatus = total >= 21 ? 'passed' : 'failed'

    let doc = await TestSubmission.findById(id)
    if (doc) {
      const updatedAnswers = doc.answers.map((ans) => {
        const evalAns = marks.find((m) => String(m.questionId) === String(ans.questionId))
        if (evalAns && evalAns.marksAwarded !== undefined) {
          return {
            ...ans.toObject(),
            marksAwarded: Number(evalAns.marksAwarded) || 0,
            maxMarks: evalAns.maxMarks || ans.maxMarks,
            feedback: evalAns.feedback || ans.feedback || '',
          }
        }
        return ans
      })

      const objectiveScore = updatedAnswers.filter((a) => a.isObjective || a.type === 'Objective').reduce((s, a) => s + (a.marksAwarded || 0), 0)
      const descriptiveScore = updatedAnswers.filter((a) => !a.isObjective && a.type !== 'Objective').reduce((s, a) => s + (a.marksAwarded || 0), 0)

      const updated = await TestSubmission.findByIdAndUpdate(
        id,
        {
          answers: updatedAnswers,
          objectiveScore,
          descriptiveScore,
          totalScore: total,
          totalMarksObtained: total,
          percentage,
          resultStatus,
          status: 'Completed',
          evaluatedAt: new Date(),
        },
        { new: true }
      )
      return res.json({ success: true, data: { ...updated.toObject(), source: 'testSubmission' } })
    }

    doc = await Evaluation.findById(id)
    if (doc) {
      const updated = await Evaluation.findByIdAndUpdate(
        id,
        { marks, totalScore: total, status: 'Not Published' },
        { new: true }
      )
      return res.json({ success: true, data: { ...updated.toObject(), source: 'evaluation' } })
    }

    return res.status(404).json({ success: false, message: 'Submission not found' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.publish = async (req, res) => {
  try {
    const { id } = req.params

    let doc = await TestSubmission.findById(id)
    if (doc) {
      const total = doc.totalScore || doc.totalMarksObtained || 0
      const percentage = doc.percentage || Number(((total / 35) * 100).toFixed(2))
      const resultStatus = total >= 21 ? 'passed' : 'failed'

      doc.isPublished = true
      doc.status = 'Published'
      doc.resultStatus = resultStatus
      doc.evaluatedAt = doc.evaluatedAt || new Date()
      await doc.save()

      const reg = await Registration.findOne({ email: doc.email.toLowerCase() })
      if (reg) {
        try {
          await sendResultPublishedEmail(reg.email, {
            internName: reg.name,
            testName: doc.testName,
            totalScore: total,
            percentage,
            resultStatus,
            technology: doc.technology,
            assessmentNumber: doc.assessmentNumber,
          })
        } catch (emailError) {
          console.error('Result published email failed:', emailError.message)
        }

        try {
          await Notification.create({
            recipientId: reg._id,
            email: reg.email,
            internName: reg.name,
            title: `Assessment Result Published: ${doc.testName}`,
            message: `Your result for ${doc.testName} (${doc.technology}) has been published: ${total}/35 (${percentage}% - ${resultStatus.toUpperCase()}).`,
            type: 'result_published',
          })
        } catch (notifError) {
          console.error('Notification create failed:', notifError.message)
        }
      }

      return res.json({
        success: true,
        message: 'Assessment result evaluated and published successfully.',
        data: { ...doc.toObject(), source: 'testSubmission' },
      })
    }

    doc = await Evaluation.findByIdAndUpdate(id, { status: 'Published' }, { new: true })
    if (doc) {
      return res.json({ success: true, message: 'Evaluated and published successfully', data: { ...doc.toObject(), source: 'evaluation' } })
    }

    return res.status(404).json({ success: false, message: 'Submission not found' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getProgress = async (req, res) => {
  try {
    const { internName, technology, result } = req.query
    const filter = { isPublished: true }
    if (internName) filter.internName = internName
    if (technology) filter.technology = technology

    const [evaluations, testSubmissions] = await Promise.all([
      Evaluation.find({ status: 'Published', ...(technology ? { technology } : {}), ...(internName ? { internName } : {}) }).sort({ createdAt: -1 }),
      TestSubmission.find(filter).sort({ submittedAt: -1 }),
    ])

    const combined = [
      ...testSubmissions.map((t) => {
        const score = t.totalScore ?? t.totalMarksObtained ?? 0
        const percentage = t.percentage || Number(((score / 35) * 100).toFixed(1))
        const resStatus = score >= 21 ? 'Passed' : 'Failed'
        return {
          ...t.toObject(),
          totalScore: score,
          percentage,
          result: resStatus,
          resultStatus: resStatus.toLowerCase(),
          source: 'testSubmission',
        }
      }),
      ...evaluations.map((e) => {
        const score = e.totalScore || 0
        const percentage = ((score / 35) * 100).toFixed(1)
        return {
          ...e.toObject(),
          totalScore: score,
          percentage,
          result: score >= 21 ? 'Passed' : 'Failed',
          resultStatus: score >= 21 ? 'passed' : 'failed',
          source: 'evaluation',
        }
      }),
    ].sort((a, b) => new Date(b.createdAt || b.submittedAt) - new Date(a.createdAt || a.submittedAt))

    const filtered = result && result !== 'All' ? combined.filter((e) => e.result === result) : combined
    res.json({ success: true, data: filtered })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}