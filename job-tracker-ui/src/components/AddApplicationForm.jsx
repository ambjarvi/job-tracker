import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { CREATE_APPLICATION, GET_APPLICATIONS, GET_RESUMES } from '../graphql/operations'

const STATUSES = ['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED']

const INITIAL = {
  company: '',
  role: '',
  url: '',
  description: '',
  status: 'APPLIED',
  resumeId: '',
}

export default function AddApplicationForm({ onSuccess }) {
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const { data: resumesData, loading: resumesLoading } = useQuery(GET_RESUMES)

  const [createApplication, { loading, error }] = useMutation(CREATE_APPLICATION, {
    refetchQueries: [{ query: GET_APPLICATIONS }],
  })

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.company.trim()) errs.company = 'Company name is required'
    if (!form.role.trim()) errs.role = 'Role is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const input = {
      company: form.company.trim(),
      role: form.role.trim(),
      status: form.status,
      ...(form.url.trim() && { url: form.url.trim() }),
      ...(form.description.trim() && { description: form.description.trim() }),
      ...(form.resumeId && { resumeId: form.resumeId }),
    }

    await createApplication({ variables: { input } })
    setForm(INITIAL)
    onSuccess?.()
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Add Application</h1>
        <p className="text-zinc-500 text-sm mt-1">Track a new job application</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Company <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder="Acme Corp"
              className={`w-full bg-zinc-800 border ${errors.company ? 'border-red-500/60' : 'border-zinc-700'} text-zinc-100 placeholder-zinc-600 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors`}
            />
            {errors.company && <p className="text-red-400 text-xs mt-1">{errors.company}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Role <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              placeholder="Senior Engineer"
              className={`w-full bg-zinc-800 border ${errors.role ? 'border-red-500/60' : 'border-zinc-700'} text-zinc-100 placeholder-zinc-600 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors`}
            />
            {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Job URL</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="https://jobs.example.com/..."
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Job Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Paste the job description here..."
            rows={5}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Resume</label>
            <select
              value={form.resumeId}
              onChange={(e) => set('resumeId', e.target.value)}
              disabled={resumesLoading}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors disabled:opacity-50"
            >
              <option value="">No resume selected</option>
              {resumesData?.resumes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setForm(INITIAL)}
            className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {loading ? 'Adding...' : 'Add Application'}
          </button>
        </div>
      </form>
    </div>
  )
}
