export default function AlertBanner({ type = 'error', message, onClose }) {
  if (!message) return null

  const colors =
    type === 'success'
      ? 'bg-green-50 border-green-300 text-green-800'
      : 'bg-red-50 border-red-300 text-red-800'

  const label = type === 'success' ? 'Success!' : 'Error!'

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