import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { GET_APPLICATIONS, GET_RESUMES, TAILOR_RESUME } from '../graphql/operations'

export default function TailorResume() {
  const [applicationId, setApplicationId] = useState('')
  const [resumeId, setResumeId] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const { data: appsData, loading: appsLoading } = useQuery(GET_APPLICATIONS)
  const { data: resumesData, loading: resumesLoading } = useQuery(GET_RESUMES)

  const [tailorResume, { loading, error }] = useMutation(TAILOR_RESUME)

  async function handleTailor() {
    if (!applicationId || !resumeId) return
    setResult(null)
    const { data } = await tailorResume({ variables: { applicationId, resumeId } })
    if (data?.tailorResume) setResult(data.tailorResume)
  }

  async function handleCopy() {
    if (!result?.suggestions) return
    await navigator.clipboard.writeText(result.suggestions)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <div className="h-5 w-40 bg-zinc-700 rounded skeleton" />
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`h-3 bg-zinc-800 rounded skeleton`} style={{ width: `${70 + Math.random() * 30}%` }} />
              ))}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
            <div className="h-5 w-36 bg-zinc-700 rounded skeleton" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-3 w-2/3 bg-zinc-800 rounded skeleton" />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {result.suggestions && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-zinc-100 font-semibold text-base">Suggestions</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    AI-generated advice to tailor your resume for this role
                  </p>
                </div>
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
              </div>
              <pre className="px-6 py-5 text-sm text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {result.suggestions}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
