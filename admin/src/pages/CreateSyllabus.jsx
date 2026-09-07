import { useState, useEffect } from 'react'
import { api } from '../api'
import AlertBanner from '../components/AlertBanner'

export default function CreateSyllabus({ onNavigate }) {
  const [technologies, setTechnologies] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [hoveredTech, setHoveredTech] = useState(null)
  const [modalTech, setModalTech] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')
  const [modalAlert, setModalAlert] = useState({ type: 'error', message: '' })

  useEffect(() => {
    const fetchTech = async () => {
      try {
        const res = await api.get('/technologies')
        const active = (res.data || []).filter((t) => t.active !== false)
        setTechnologies(active)
      } catch (err) {
        setFetchError(err.message || 'Unable to load technologies.')
      } finally {
        setLoading(false)
      }
    }
    fetchTech()
  }, [])

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0] || null
    setModalAlert({ type: 'error', message: '' })
    setUploadProgress(0)
    setUploadStage('')

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setModalAlert({ type: 'error', message: 'Invalid file format. Only .xlsx or .xls files are allowed.' })
      setSelectedFile(null)
      e.target.value = ''
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    setModalAlert({ type: 'error', message: '' })
    if (!selectedFile) {
      setModalAlert({ type: 'error', message: 'Please choose an Excel file (.xlsx / .xls) to upload.' })
      return
    }

    setUploading(true)
    setUploadProgress(10)
    setUploadStage('Uploading spreadsheet file to server...')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('technology', modalTech)

      const res = await api.uploadWithProgress('/syllabus/upload', formData, (percent) => {
        // When client upload reaches 100%, server is processing the spreadsheet chapters
        if (percent < 90) {
          setUploadProgress(percent)
          setUploadStage(`Uploading spreadsheet... ${percent}%`)
        } else {
          setUploadProgress(90)
          setUploadStage('Parsing syllabus chapters, days, and topics...')
        }
      })

      setUploadProgress(100)
      setUploadStage('Syllabus processed and saved successfully!')
      setModalAlert({ type: 'success', message: res.message || 'Syllabus uploaded and parsed successfully.' })
      setSelectedFile(null)
    } catch (err) {
      setUploadProgress(0)
      setUploadStage('')
      setModalAlert({ type: 'error', message: err.message || 'Upload failed. Please verify the Excel structure and try again.' })
    } finally {
      setUploading(false)
    }
  }

  const closeModal = () => {
    setModalTech(null)
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadStage('')
    setModalAlert({ type: 'error', message: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Create Syllabus</h2>
          <p className="text-sm text-gray-500 mt-1">Upload a syllabus in bulk using the Excel spreadsheet template.</p>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('syllabus', 'view')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>📚</span>
            <span>View All Syllabuses →</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-800 text-base">Standard Syllabus Template</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Download the pre-formatted Excel spreadsheet template to organize chapters, days, and topics.
          </p>
        </div>
        <a
          href="/templates/syllabus_template.xlsx"
          download
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          Download Blank Template
        </a>
      </div>

      {fetchError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <AlertBanner type="error" message={fetchError} onClose={() => setFetchError('')} />
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-800 mb-4">Select a Technology to Upload Syllabus</h3>
        {loading && <p className="text-sm text-gray-400">Loading technologies...</p>}
        {!loading && technologies.length === 0 && (
          <p className="text-sm text-gray-400">No technologies available. Please add a technology first.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {technologies.map((tech) => (
            <div
              key={tech._id}
              onClick={() => {
                setModalTech(tech.name)
                setSelectedFile(null)
                setUploadProgress(0)
                setUploadStage('')
              }}
              onMouseEnter={() => setHoveredTech(tech._id)}
              onMouseLeave={() => setHoveredTech(null)}
              className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[7.5rem] overflow-hidden transition-all hover:shadow-md cursor-pointer group"
            >
              <div className="text-center">
                <span className="text-3xl block transition-transform group-hover:scale-110">{tech.icon || '🔹'}</span>
                <h4 className="font-semibold text-gray-800 mt-2 text-sm sm:text-base">{tech.name}</h4>
                <span className="text-xs text-orange-500 font-medium mt-1 sm:hidden inline-block">Tap to Upload →</span>
              </div>
              {hoveredTech === tech._id && (
                <div className="hidden sm:flex absolute inset-0 bg-black/40 backdrop-blur-[1px] items-center justify-center animate-fadeIn">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setModalTech(tech.name)
                      setSelectedFile(null)
                      setUploadProgress(0)
                      setUploadStage('')
                    }}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-md"
                  >
                    Add Syllabus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Syllabus Modal */}
      {modalTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4 relative animate-scaleUp">
            <button
              type="button"
              onClick={closeModal}
              disabled={uploading}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-lg font-bold">
                📊
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Upload Syllabus</h3>
                <p className="text-xs text-gray-500">Track: <span className="font-semibold text-orange-600">{modalTech}</span></p>
              </div>
            </div>

            <div className="space-y-4">
              <AlertBanner
                type={modalAlert.type}
                message={modalAlert.message}
                onClose={() => setModalAlert({ type: 'error', message: '' })}
              />

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Excel Spreadsheet File (.xlsx, .xls)
                </label>
                <label className={`flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-orange-400 bg-orange-50/30'
                    : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
                }`}>
                  <div className="text-center space-y-1.5">
                    <span className="text-3xl block">📁</span>
                    <span className="text-sm font-medium text-gray-700 block">
                      {selectedFile ? selectedFile.name : 'Click to browse or drop your Excel file here'}
                    </span>
                    <span className="text-xs text-gray-400 block">
                      {selectedFile ? `Size: ${formatFileSize(selectedFile.size)}` : 'Supports Microsoft Excel .xlsx and .xls formats'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {/* Progressing Bar */}
              {(uploading || uploadProgress > 0) && (
                <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-orange-900 flex items-center gap-1.5">
                      {uploadProgress < 100 ? (
                        <svg className="animate-spin h-3.5 w-3.5 text-orange-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <span className="text-green-600 text-sm">✓</span>
                      )}
                      {uploadStage || 'Uploading syllabus spreadsheet...'}
                    </span>
                    <span className="text-orange-700 font-bold">{uploadProgress}%</span>
                  </div>

                  {/* Progress Track */}
                  <div className="w-full bg-orange-200/80 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        uploadProgress === 100
                          ? 'bg-green-500'
                          : 'bg-gradient-to-r from-orange-500 to-amber-500'
                      }`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {modalAlert.type === 'success' ? 'Close' : 'Cancel'}
              </button>
              {modalAlert.type === 'success' && onNavigate ? (
                <button
                  type="button"
                  onClick={() => {
                    closeModal()
                    onNavigate('syllabus', 'view')
                  }}
                  className="px-5 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>Go to View Syllabus →</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload Syllabus'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}