export default function AlertBanner({ type = 'error', message, onClose }) {
  if (!message) return null

  let colors = 'bg-red-50 border-red-300 text-red-800'
  let label = 'Error!'

  if (type === 'success') {
    colors = 'bg-green-50 border-green-300 text-green-800'
    label = 'Success!'
  } else if (type === 'info') {
    colors = 'bg-blue-50 border-blue-300 text-blue-800'
    label = 'Info:'
  } else if (type === 'warning') {
    colors = 'bg-amber-50 border-amber-300 text-amber-800'
    label = 'Notice:'
  }

  return (
    <div className={`mb-4 px-4 py-3 rounded-lg border ${colors} flex items-start justify-between gap-2 text-sm`} role="alert">
      <div>
        <span className="font-bold">{label} </span>
        {message}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-current opacity-60 hover:opacity-100 flex-shrink-0 font-bold"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  )
}