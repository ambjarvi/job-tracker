import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { UPDATE_APPLICATION, DELETE_APPLICATION, GET_APPLICATIONS, GET_RESUMES } from '../graphql/operations'

const STATUSES = ['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function ApplicationModal({ application, onClose, onTailor }) {
  const [fields, setFields] = useState({
    company: application.company,
    role: application.role,
    url: application.url ?? '',
    description: application.description ?? '',
    status: application.status,
    resumeId: application.resume?.id ?? '',
  })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [visible, setVisible] = useState(false)

  const { data: resumesData } = useQuery(GET_RESUMES)

  const refetchOpts = { refetchQueries: [{ query: GET_APPLICATIONS }] }
  const [updateApplication, { loading: saving }] = useMutation(UPDATE_APPLICATION, refetchOpts)
  const [deleteApplication, { loading: deleting }] = useMutation(DELETE_APPLICATION, refetchOpts)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) handleClose()
  }

  async function handleSave() {
    await updateApplication({
      variables: {
        id: application.id,
        company: fields.company,
        role: fields.role,
        url: fields.url || null,
        description: fields.description || null,
        status: fields.status,
        resumeId: fields.resumeId || null,
      },
    })
    handleClose()
  }

  async function handleDelete() {
    await deleteApplication({ variables: { id: application.id } })
    onClose()
  }

  const inputClass =
    'w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors placeholder-zinc-600'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200 ${
        visible ? 'bg-black/70' : 'bg-black/0'
      }`}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div>
            <h2 className="text-zinc-100 font-semibold">{application.company}</h2>
            <p className="text-zinc-500 text-xs mt-0.5">{application.role}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Applied at (read only) */}
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Applied {formatDate(application.appliedAt)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Company</label>
              <input
                type="text"
                value={fields.company}
                onChange={(e) => setFields((f) => ({ ...f, company: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Role</label>
              <input
                type="text"
                value={fields.role}
                onChange={(e) => setFields((f) => ({ ...f, role: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Job URL</label>
            <input
              type="url"
              value={fields.url}
              onChange={(e) => setFields((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Status</label>
              <select
                value={fields.status}
                onChange={(e) => setFields((f) => ({ ...f, status: e.target.value }))}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Resume</label>
              <select
                value={fields.resumeId}
                onChange={(e) => setFields((f) => ({ ...f, resumeId: e.target.value }))}
                className={inputClass}
              >
                <option value="">No resume</option>
                {resumesData?.resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Job Description</label>
            <textarea
              value={fields.description}
              onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
              rows={5}
              placeholder="Paste the job description here..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-800 sticky bottom-0 bg-zinc-900">
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-zinc-400 text-xs">Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTailor(application.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Tailor Resume
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !fields.company.trim() || !fields.role.trim()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
