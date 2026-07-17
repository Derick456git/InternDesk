import { useState } from 'react'

const initialNotes = [
  { id: 1, name: 'Amal', technology: 'MERN Stack', day: 1, doc: 'Amal_MERN_Day1_Notes.docx', xlsx: 'Amal_MERN_Day1_Questions.xlsx' },
  { id: 2, name: 'Amal', technology: 'MERN Stack', day: 2, doc: 'Amal_MERN_Day2_Notes.docx', xlsx: 'Amal_MERN_Day2_Questions.xlsx' },
  { id: 3, name: 'Amal', technology: 'MERN Stack', day: 3, doc: 'Amal_MERN_Day3_Notes.docx', xlsx: 'Amal_MERN_Day3_Questions.xlsx' },
  { id: 4, name: 'Amal', technology: 'MERN Stack', day: 4, doc: 'Amal_MERN_Day4_Notes.docx', xlsx: 'Amal_MERN_Day4_Questions.xlsx' },
  { id: 5, name: 'Sarah', technology: 'MERN Stack', day: 1, doc: 'Sarah_MERN_Day1_Notes.docx', xlsx: 'Sarah_MERN_Day1_Questions.xlsx' },
  { id: 6, name: 'Sarah', technology: 'MERN Stack', day: 2, doc: 'Sarah_MERN_Day2_Notes.docx', xlsx: 'Sarah_MERN_Day2_Questions.xlsx' },
  { id: 7, name: 'Biju', technology: 'Python', day: 1, doc: 'Biju_Python_Day1_Notes.docx', xlsx: 'Biju_Python_Day1_Questions.xlsx' },
  { id: 8, name: 'Biju', technology: 'Python', day: 2, doc: 'Biju_Python_Day2_Notes.docx', xlsx: 'Biju_Python_Day2_Questions.xlsx' },
  { id: 9, name: 'Biju', technology: 'Python', day: 3, doc: 'Biju_Python_Day3_Notes.docx', xlsx: 'Biju_Python_Day3_Questions.xlsx' },
  { id: 10, name: 'Celina', technology: 'Flutter', day: 1, doc: 'Celina_Flutter_Day1_Notes.docx', xlsx: 'Celina_Flutter_Day1_Questions.xlsx' },
  { id: 11, name: 'Celina', technology: 'Flutter', day: 2, doc: 'Celina_Flutter_Day2_Notes.docx', xlsx: 'Celina_Flutter_Day2_Questions.xlsx' },
  { id: 12, name: 'Deepak', technology: 'Java', day: 1, doc: 'Deepak_Java_Day1_Notes.docx', xlsx: 'Deepak_Java_Day1_Questions.xlsx' },
  { id: 13, name: 'Deepak', technology: 'Java', day: 2, doc: 'Deepak_Java_Day2_Notes.docx', xlsx: 'Deepak_Java_Day2_Questions.xlsx' },
  { id: 14, name: 'Deepak', technology: 'Java', day: 3, doc: 'Deepak_Java_Day3_Notes.docx', xlsx: 'Deepak_Java_Day3_Questions.xlsx' },
  { id: 15, name: 'Esha', technology: 'MERN Stack', day: 1, doc: 'Esha_MERN_Day1_Notes.docx', xlsx: 'Esha_MERN_Day1_Questions.xlsx' },
]

export default function ListDailyNotes() {
  const [notes] = useState(initialNotes)
  const [category, setCategory] = useState('All')
  const [nameFilter, setNameFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')

  const names = [...new Set(notes.map((n) => n.name))].sort()
  const techs = [...new Set(notes.map((n) => n.technology))].sort()

  const filtered = notes.filter((n) => {
    if (category === 'MERN' && n.technology !== 'MERN Stack') return false
    if (nameFilter && n.name !== nameFilter) return false
    if (techFilter && n.technology !== techFilter) return false
    return true
  })

  const handleDownload = (filename) => {
    const blob = new Blob(['Simulated file content'], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">List Daily Notes</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {['All', 'MERN'].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                category === c
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c === 'All' ? 'All Categories' : 'MERN Stack only'}
            </button>
          ))}
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Intern Name</label>
            <select
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
            >
              <option value="">All Interns</option>
              {names.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Technology</label>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
            >
              <option value="">All Technologies</option>
              {techs.map((tech) => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Technology</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Day</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Download Document</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Download Spreadsheet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((note) => (
                <tr key={note.id} className="hover:bg-orange-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{note.name}</td>
                  <td className="px-5 py-3 text-gray-600">{note.technology}</td>
                  <td className="px-5 py-3">
                    <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 inline-flex items-center justify-center text-xs font-bold">
                      {note.day}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDownload(note.doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      .docx
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDownload(note.xlsx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      .xlsx
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-400">No daily notes found for the selected filters.</div>
        )}
      </div>
    </div>
  )
}
