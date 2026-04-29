import { useRef, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { CREATE_APPLICATION, GET_APPLICATIONS, GET_RESUMES, UPLOAD_RESUME_FILE } from '../graphql/operations'

const STATUSES = ['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED']

const INITIAL = {
  company: '',
  role: '',
  url: '',
  description: '',
  status: 'APPLIED',
  resumeId: '',
}

function fileTypeFromFile(file) {
  return file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCX'
}

function ResumeSection({ value, onChange, resumes, resumesLoading }) {
  const fileInputRef = useRef(null)
  const [mode, setMode] = useState('existing') // 'existing' | 'new'
  const [newName, setNewName] = useState('')
  const [newFile, setNewFile] = useState(null)

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setNewFile(f)
    if (!newName) setNewName(f.name.replace(/\.(pdf|docx)$/i, ''))
    onChange({ resumeId: '', newFile: f, newName: newName || f.name.replace(/\.(pdf|docx)$/i, '') })
  }

  function handleNewNameChange(v) {
    setNewName(v)
    onChange({ resumeId: '', newFile, newName: v })
  }

  function switchMode(m) {
    setMode(m)
    if (m === 'existing') {
      onChange({ resumeId: value.resumeId, newFile: null, newName: '' })
    } else {
      onChange({ resumeId: '', newFile, newName })
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">Resume</label>

      {/* Toggle */}
      <div className="inline-flex rounded-lg bg-zinc-800 p-1 gap-1">
        <button
          type="button"
          onClick={() => switchMode('existing')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === 'existing'
              ? 'bg-zinc-700 text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Use existing
        </button>
        <button
          type="button"
          onClick={() => switchMode('new')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === 'new'
              ? 'bg-zinc-700 text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Upload new
        </button>
      </div>

      {mode === 'existing' && (
        <select
          value={value.resumeId}
          onChange={(e) => onChange({ resumeId: e.target.value, newFile: null, newName: '' })}
          disabled={resumesLoading}
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors disabled:opacity-50"
        >
          <option value="">No resume selected</option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      )}

      {mode === 'new' && (
        <div className="space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => handleNewNameChange(e.target.value)}
            placeholder="Resume name"
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
          />
          <label className="flex items-center gap-2 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm cursor-pointer hover:border-zinc-600 transition-colors">
            <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
            </svg>
            <span className={newFile ? 'text-zinc-200 truncate' : 'text-zinc-500 truncate'}>
              {newFile ? newFile.name : 'Choose .pdf or .docx…'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
      )}
    </div>
  )
}

export default function AddApplicationForm({ onSuccess }) {
  const [form, setForm] = useState(INITIAL)
  const [resumeState, setResumeState] = useState({ resumeId: '', newFile: null, newName: '' })
  const [errors, setErrors] = useState({})
  const { data: resumesData, loading: resumesLoading } = useQuery(GET_RESUMES)

  const [createApplication, { loading, error }] = useMutation(CREATE_APPLICATION, {
    refetchQueries: [{ query: GET_APPLICATIONS }],
  })

  const [uploadResumeFile, { loading: uploading }] = useMutation(UPLOAD_RESUME_FILE, {
    refetchQueries: [{ query: GET_RESUMES }],
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

    let resumeId = resumeState.resumeId || null

    if (resumeState.newFile) {
      const name = resumeState.newName.trim() || resumeState.newFile.name
      const { data } = await uploadResumeFile({
        variables: { name, file: resumeState.newFile, fileType: fileTypeFromFile(resumeState.newFile) },
      })
      resumeId = data.uploadResumeFile.id
    }

    await createApplication({
      variables: {
        company: form.company.trim(),
        role: form.role.trim(),
        status: form.status,
        url: form.url.trim() || null,
        description: form.description.trim() || null,
        resumeId,
      },
    })

    setForm(INITIAL)
    setResumeState({ resumeId: '', newFile: null, newName: '' })
    onSuccess?.()
  }

  const busy = loading || uploading

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

        <div className="border-t border-zinc-800 pt-5">
          <ResumeSection
            value={resumeState}
            onChange={setResumeState}
            resumes={resumesData?.resumes ?? []}
            resumesLoading={resumesLoading}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => { setForm(INITIAL); setResumeState({ resumeId: '', newFile: null, newName: '' }) }}
            className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {busy && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {uploading ? 'Uploading…' : loading ? 'Adding…' : 'Add Application'}
          </button>
        </div>
      </form>
    </div>
  )
}
