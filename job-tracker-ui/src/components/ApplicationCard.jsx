import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { UPDATE_APPLICATION_STATUS, GET_APPLICATIONS } from '../graphql/operations'
import StatusBadge from './StatusBadge'

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

export default function ApplicationCard({ application }) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [updateStatus, { loading }] = useMutation(UPDATE_APPLICATION_STATUS, {
    refetchQueries: [{ query: GET_APPLICATIONS }],
  })

  async function handleStatusChange(status) {
    await updateStatus({ variables: { id: application.id, status } })
    setShowStatusMenu(false)
  }

  return (
    <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-zinc-100 font-semibold text-base truncate">
              {application.company}
            </h3>
            <StatusBadge status={application.status} />
          </div>
          <p className="text-zinc-400 text-sm mt-0.5 truncate">{application.role}</p>

          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            {application.dateApplied && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(application.dateApplied)}
              </span>
            )}
            {application.resume?.name && (
              <span className="flex items-center gap-1 truncate">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {application.resume.name}
              </span>
            )}
            {application.url && (
              <a
                href={application.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Job posting
              </a>
            )}
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowStatusMenu((v) => !v)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Updating
              </span>
            ) : (
              <>
                Update status
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>

          {showStatusMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-20 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-zinc-800 transition-colors ${
                      s === application.status ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-400'
                    }`}
                  >
                    <StatusBadge status={s} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
