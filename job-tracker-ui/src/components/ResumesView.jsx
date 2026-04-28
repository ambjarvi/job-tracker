import { useQuery } from '@apollo/client/react'
import { GET_RESUMES } from '../graphql/operations'

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

const TYPE_STYLES = {
  PDF: 'bg-red-500/15 text-red-400 border-red-500/30',
  DOCX: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  DOC: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  TXT: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50',
}

function ResumeCard({ resume }) {
  const typeStyle = TYPE_STYLES[resume.fileType?.toUpperCase()] ?? 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-zinc-100 font-medium text-sm truncate">{resume.name}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${typeStyle}`}>
              {resume.fileType}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Uploaded {formatDate(resume.uploadedAt)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {resume.applications?.length ?? 0} application{resume.applications?.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-zinc-800 rounded-lg skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 bg-zinc-700 rounded skeleton" />
          <div className="h-3 w-1/3 bg-zinc-800 rounded skeleton" />
        </div>
      </div>
    </div>
  )
}

export default function ResumesView() {
  const { data, loading, error } = useQuery(GET_RESUMES)
  const resumes = data?.resumes ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Resumes</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {loading ? '...' : `${resumes.length} resume${resumes.length !== 1 ? 's' : ''} uploaded`}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          Failed to load resumes: {error.message}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !error && resumes.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-zinc-400 font-medium">No resumes uploaded</p>
          <p className="text-zinc-600 text-sm mt-1">Upload resumes through the API to see them here</p>
        </div>
      )}

      {!loading && !error && resumes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes.map((r) => <ResumeCard key={r.id} resume={r} />)}
        </div>
      )}
    </div>
  )
}
