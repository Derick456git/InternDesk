const Evaluation = require('../Models/evaluationModel')

exports.getProgress = async (req, res) => {
  try {
    const { internName, technology, result } = req.query
    const filter = { status: 'Published' }
    if (internName) filter.internName = internName
    if (technology) filter.technology = technology
    const evaluations = await Evaluation.find(filter).sort({ createdAt: -1 })
    const enriched = evaluations.map((e) => {
      const score = e.totalScore ? parseInt(e.totalScore.split('/')[0]) : 0
      const percentage = ((score / 35) * 100).toFixed(1)
      return { ...e.toObject(), percentage, result: score >= 21 ? 'Passed' : 'Failed' }
    })
    const filtered = result && result !== 'All' ? enriched.filter((e) => e.result === result) : enriched
    res.json({ success: true, data: filtered })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
