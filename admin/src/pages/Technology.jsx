import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function Technology() {
  const [technologies, setTechnologies] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newTech, setNewTech] = useState({ name: '', icon: null })
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // technology object to delete
  const [deleting, setDeleting] = useState(false)
  const [alert, setAlert] = useState({ type: 'error', message: '' })

  useEffect(() => { fetchTech() }, [])

  const fetchTech = async () => {
    try {
      const res = await api.get('/technologies')
      setTechnologies(res.data || [])
    } catch (err) {
      console.error('Fetch technologies error:', err)
      setAlert({ type: 'error', message: err.message || 'Failed to fetch technologies.' })
    }
  }

  const handleAdd = async () => {
    if (!newTech.name.trim()) {
      setAlert({ type: 'error', message: 'Technology name is required.' })
      return
    }
    try {
      await api.post('/technologies', { name: newTech.name.trim(), icon: newTech.icon })
      setNewTech({ name: '', icon: null })
      setShowModal(false)
      setAlert({ type: 'success', message: `Technology "${newTech.name.trim()}" added successfully.` })
      fetchTech()
    } catch (err) {
      console.error('Add technology error:', err)
      setAlert({ type: 'error', message: err.message || 'Failed to add technology.' })
    }
  }

  const executeDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await api.delete(`/technologies/${deleteConfirm._id}`)
      setAlert({ type: 'success', message: `Technology "${deleteConfirm.name}" deleted successfully.` })
      setDeleteConfirm(null)
      fetchTech()
    } catch (err) {
      console.error('Delete technology error:', err)
      setAlert({ type: 'error', message: err.message || 'Failed to delete technology.' })
    } finally {
      setDeleting(false)
    }
  }

  const handleEditSave = async (id) => {
    if (!editName.trim()) {
      setAlert({ type: 'error', message: 'Technology name cannot be empty.' })
      return
    }
    setSavingEdit(true)
    try {
      await api.put(`/technologies/${id}`, { name: editName.trim() })
      setAlert({ type: 'success', message: `Technology updated to "${editName.trim()}" successfully.` })
      setEditingId(null)
      setEditName('')
      fetchTech()
    } catch (err) {
      console.error('Edit technology error:', err)
      setAlert({ type: 'error', message: err.message || 'Failed to update technology name.' })
    } finally {
      setSavingEdit(false)
    }
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
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manage Technology</h2>
          <p className="text-sm text-gray-500 mt-0.5">Add, edit, and manage technology tracks for courses and syllabuses.</p>
        </div>
        <button
          onClick={() => {
            setAlert({ type: 'error', message: '' })
            setShowModal(true)
          }}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          + Add Technology
        </button>
      </div>

      <AlertBanner
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: 'error', message: '' })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {technologies.map((tech) => (
          <div
            key={tech._id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl flex-shrink-0">{tech.icon || '🔹'}</span>
              {editingId === tech._id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSave(tech._id)
                    if (e.key === 'Escape') {
                      setEditingId(null)
                      setEditName('')
                    }
                  }}
                  className="flex-1 border-2 border-orange-400 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-orange-200"
                  autoFocus
                />
              ) : (
                <h3 className="font-semibold text-gray-800 text-base">{tech.name}</h3>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {editingId === tech._id ? (
                <>
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={() => handleEditSave(tech._id)}
                    className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {savingEdit ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={() => {
                      setEditingId(null)
                      setEditName('')
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(tech._id)
                      setEditName(tech.name)
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors shadow-xs cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(tech)}
                    className="px-3.5 py-2 text-xs font-bold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors shadow-xs cursor-pointer"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Technology Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp">
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
                  autoFocus
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
                type="button"
                onClick={() => { setShowModal(false); setNewTech({ name: '', icon: null }) }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="px-4 py-2 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors cursor-pointer shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 animate-scaleUp space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Technology Deletion</h3>
                <p className="text-xs text-gray-500">Action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete the technology track <strong className="text-gray-900">"{deleteConfirm.name}"</strong>?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDelete}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Technology'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
