import { useState } from 'react'
import StatusBadge from './StatusBadge'
import ApplicationModal from './ApplicationModal'

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

export default function ApplicationCard({ application, onNavigate }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors cursor-pointer group"
      >
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
              {application.appliedAt && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(application.appliedAt)}
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

          <div className="shrink-0 text-zinc-700 group-hover:text-zinc-500 transition-colors mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </div>
      </div>

      {showModal && (
        <ApplicationModal
          application={application}
          onClose={() => setShowModal(false)}
          onTailor={(id) => onNavigate?.('tailor', id)}
        />
      )}
    </>
  )
}
