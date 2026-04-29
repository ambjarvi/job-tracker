import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { GET_APPLICATIONS, GET_RESUMES, TAILOR_RESUME } from '../graphql/operations'

function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = getText()
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

function toLines(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return value
    .split('\n')
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
}

export default function TailorResume() {
  const [applicationId, setApplicationId] = useState('')
  const [resumeId, setResumeId] = useState('')
  const [result, setResult] = useState(null)

  const { data: appsData, loading: appsLoading } = useQuery(GET_APPLICATIONS)
  const { data: resumesData, loading: resumesLoading } = useQuery(GET_RESUMES)

  const [tailorResume, { loading, error }] = useMutation(TAILOR_RESUME)

  async function handleTailor() {
    if (!applicationId || !resumeId) return
    setResult(null)
    const { data } = await tailorResume({ variables: { applicationId, resumeId } })
    if (data?.tailorResume) setResult(data.tailorResume)
  }

  const canTailor = applicationId && resumeId && !loading

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Tailor Resume</h1>
        <p className="text-zinc-500 text-sm mt-1">
          AI-powered resume tailoring to match a specific job posting
        </p>
      </div>

      {/* Selectors */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Select Application
            </label>
            <select
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              disabled={appsLoading}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors disabled:opacity-50"
            >
              <option value="">Choose an application...</option>
              {appsData?.applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company} — {a.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Select Resume
            </label>
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              disabled={resumesLoading}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-colors disabled:opacity-50"
            >
              <option value="">Choose a resume...</option>
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

        <div className="flex items-center justify-end">
          <button
            onClick={handleTailor}
            disabled={!canTailor}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Tailoring resume...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Tailor Resume
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
            <div className="h-5 w-44 bg-zinc-700 rounded skeleton" />
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-3 bg-zinc-800 rounded skeleton" style={{ width: `${60 + (i * 7) % 40}%` }} />
              ))}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
            <div className="h-5 w-36 bg-zinc-700 rounded skeleton" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-3 bg-zinc-800 rounded skeleton" style={{ width: `${50 + (i * 11) % 35}%` }} />
            ))}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
            <div className="h-5 w-52 bg-zinc-700 rounded skeleton" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 bg-zinc-800 rounded skeleton" style={{ width: `${55 + (i * 13) % 30}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">

          {/* Panel 1 — Tailored Resume */}
          {result.tailoredResume && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-zinc-100 font-semibold text-base">Tailored Resume</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">Full rewritten resume optimized for this role</p>
                </div>
                <CopyButton getText={() => result.tailoredResume} />
              </div>
              <pre className="px-6 py-5 text-sm text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[28rem] overflow-y-auto">
                {result.tailoredResume}
              </pre>
            </div>
          )}

          {/* Panel 2 — What Changed */}
          {result.changes && toLines(result.changes).length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800">
                <h2 className="text-zinc-100 font-semibold text-base">What Changed</h2>
                <p className="text-zinc-500 text-xs mt-0.5">Edits made to better align your resume with the job</p>
              </div>
              <ul className="px-6 py-5 space-y-2.5">
                {toLines(result.changes).map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Panel 3 — Skill Gaps & Suggestions */}
          {result.suggestions && toLines(result.suggestions).length > 0 && (
            <div className="bg-zinc-900 border border-amber-500/20 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-500/20 bg-amber-500/5">
                <h2 className="text-amber-300 font-semibold text-base">Skill Gaps &amp; Suggestions</h2>
                <p className="text-amber-500/70 text-xs mt-0.5">
                  Topics the job mentions that aren't on your resume — consider adding where genuine
                </p>
              </div>
              <ul className="px-6 py-5 space-y-2.5">
                {toLines(result.suggestions).map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-amber-200/80">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
