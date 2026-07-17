import { useState } from 'react'

const initialTechnologies = [
  { id: 1, name: 'MERN Stack', icon: '🟢' },
  { id: 2, name: 'Python', icon: '🔵' },
  { id: 3, name: 'Flutter', icon: '🟦' },
  { id: 4, name: 'Java', icon: '🟠' },
  { id: 5, name: 'React Native', icon: '🟣' },
]

export default function Technology() {
  const [technologies, setTechnologies] = useState(initialTechnologies)
  const [showModal, setShowModal] = useState(false)
  const [newTech, setNewTech] = useState({ name: '', icon: null })
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const handleAdd = () => {
    if (!newTech.name.trim()) return
    const icon = newTech.icon || '🔹'
    setTechnologies((prev) => [...prev, { id: Date.now(), name: newTech.name.trim(), icon }])
    setNewTech({ name: '', icon: null })
    setShowModal(false)
  }

  const handleDelete = (id) => {
    setTechnologies((prev) => prev.filter((t) => t.id !== id))
  }

  const handleEditSave = (id) => {
    if (!editName.trim()) return
    setTechnologies((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: editName.trim() } : t))
    )
    setEditingId(null)
    setEditName('')
  }

  const handleIconUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setNewTech((prev) => ({ ...prev, icon: ev.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Manage Technology</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          + Add Technology
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {technologies.map((tech) => (
          <div
            key={tech.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{tech.icon}</span>
              {editingId === tech.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleEditSave(tech.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditSave(tech.id)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  autoFocus
                />
              ) : (
                <h3 className="font-semibold text-gray-800">{tech.name}</h3>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingId(tech.id)
                  setEditName(tech.name)
                }}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(tech.id)}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-5">Add Technology</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technology Name</label>
                <input
                  type="text"
                  value={newTech.name}
                  onChange={(e) => setNewTech((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                  placeholder="e.g. MERN Stack"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Icon</label>
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 transition-colors">
                  <span className="text-sm text-gray-500">
                    {newTech.icon ? 'Icon uploaded' : 'Click to upload icon'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setNewTech({ name: '', icon: null }) }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
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
