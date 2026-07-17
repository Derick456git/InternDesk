import { useState } from 'react'

const technologies = ['MERN Stack', 'Python', 'Flutter', 'Java']

const initialSyllabus = {
  'MERN Stack': [
    { day: 1, chapter: 'HTML & CSS Basics', topics: 'HTML5 elements, CSS3 selectors, Flexbox, Grid' },
    { day: 2, chapter: 'JavaScript Fundamentals', topics: 'ES6+, DOM manipulation, Events' },
    { day: 3, chapter: 'React.js Core', topics: 'Components, Props, State, Hooks' },
    { day: 4, chapter: 'Node.js & Express', topics: 'REST APIs, Middleware, MongoDB' },
  ],
  Python: [
    { day: 1, chapter: 'Python Basics', topics: 'Variables, Data types, Loops, Functions' },
    { day: 2, chapter: 'OOP in Python', topics: 'Classes, Inheritance, Polymorphism' },
    { day: 3, chapter: 'Django Framework', topics: 'Models, Views, Templates, ORM' },
  ],
  Flutter: [
    { day: 1, chapter: 'Dart Basics', topics: 'Syntax, Null safety, Collections' },
    { day: 2, chapter: 'Flutter Widgets', topics: 'Stateless/Stateful widgets, Layouts' },
  ],
  Java: [
    { day: 1, chapter: 'Java Core', topics: 'OOP, Collections, Exception handling' },
    { day: 2, chapter: 'Spring Boot', topics: 'Dependency injection, REST controllers, JPA' },
    { day: 3, chapter: 'Microservices', topics: 'Eureka, API Gateway, Docker' },
  ],
}

const studyNotesTemplateUrl = '#'
const questionCollectionTemplateUrl = '#'

export default function Syllabus() {
  const [selectedTech, setSelectedTech] = useState('MERN Stack')
  const [syllabus, setSyllabus] = useState(initialSyllabus)
  const [showModal, setShowModal] = useState(false)
  const [newDay, setNewDay] = useState({ chapter: '', topics: '' })
  const [editingDayId, setEditingDayId] = useState(null)
  const [editValues, setEditValues] = useState({ chapter: '', topics: '' })

  const currentDays = syllabus[selectedTech] || []

  const handleAddDay = () => {
    if (!newDay.chapter.trim()) return
    const nextDay = currentDays.length + 1
    setSyllabus((prev) => ({
      ...prev,
      [selectedTech]: [
        ...(prev[selectedTech] || []),
        { day: nextDay, chapter: newDay.chapter.trim(), topics: newDay.topics.trim() },
      ],
    }))
    setNewDay({ chapter: '', topics: '' })
    setShowModal(false)
  }

  const handleEdit = (day) => {
    setEditingDayId(day.day)
    setEditValues({ chapter: day.chapter, topics: day.topics })
  }

  const handleEditSave = () => {
    if (!editValues.chapter.trim()) return
    setSyllabus((prev) => ({
      ...prev,
      [selectedTech]: (prev[selectedTech] || []).map((d) =>
        d.day === editingDayId
          ? { ...d, chapter: editValues.chapter.trim(), topics: editValues.topics.trim() }
          : d
      ),
    }))
    setEditingDayId(null)
  }

  const handleDocxUpload = (e) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.docx')) {
      alert(`Study notes "${file.name}" selected for upload.`)
    } else {
      alert('Please select a valid .docx file.')
    }
    e.target.value = ''
  }

  const handleXlsxUpload = (e) => {
    const file = e.target.files?.[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      alert(`Question collection "${file.name}" selected for upload.`)
    } else {
      alert('Please select a valid .xlsx file.')
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Manage Syllabus</h2>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Select Technology:</label>
        <select
          value={selectedTech}
          onChange={(e) => { setSelectedTech(e.target.value); setEditingDayId(null) }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
        >
          {technologies.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Technologies</h3>
            <div className="space-y-1">
              {technologies.map((t) => (
                <button
                  key={t}
                  onClick={() => { setSelectedTech(t); setEditingDayId(null) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTech === t
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                Course Timeline — {selectedTech}
              </h3>
              <button
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                + Add Day
              </button>
            </div>
            <div className="space-y-2">
              {currentDays.map((day) => (
                <div
                  key={day.day}
                  className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {editingDayId === day.day ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editValues.chapter}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, chapter: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="Chapter Name"
                      />
                      <textarea
                        value={editValues.topics}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, topics: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        rows={2}
                        placeholder="Topics"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleEditSave}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingDayId(null)}
                          className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {day.day}
                          </span>
                          <h4 className="font-medium text-gray-800">{day.chapter}</h4>
                        </div>
                        <p className="text-sm text-gray-500 ml-9 mt-1">{day.topics}</p>
                      </div>
                      <button
                        onClick={() => handleEdit(day)}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors flex-shrink-0"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {currentDays.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">No days added yet. Click "+ Add Day" to start building the syllabus.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Study Notes Template</h3>
          <p className="text-sm text-gray-500 mb-4">Download and upload study notes (.docx format)</p>
          <div className="flex gap-3">
            <a
              href={studyNotesTemplateUrl}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download blank template
            </a>
            <label className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 cursor-pointer transition-colors">
              Upload
              <input type="file" accept=".docx" className="hidden" onChange={handleDocxUpload} />
            </label>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Question Collection Template</h3>
          <p className="text-sm text-gray-500 mb-4">Download and upload question collection (.xlsx format)</p>
          <div className="flex gap-3">
            <a
              href={questionCollectionTemplateUrl}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Download blank template
            </a>
            <label className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 cursor-pointer transition-colors">
              Upload
              <input type="file" accept=".xlsx" className="hidden" onChange={handleXlsxUpload} />
            </label>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-5">Add Day</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Name</label>
                <input
                  type="text"
                  value={newDay.chapter}
                  onChange={(e) => setNewDay((prev) => ({ ...prev, chapter: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                  placeholder="e.g. React Hooks Deep Dive"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topics</label>
                <textarea
                  value={newDay.topics}
                  onChange={(e) => setNewDay((prev) => ({ ...prev, topics: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition resize-none"
                  rows={3}
                  placeholder="List of topics covered"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setNewDay({ chapter: '', topics: '' }) }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDay}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
