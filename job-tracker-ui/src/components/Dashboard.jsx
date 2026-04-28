import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { GET_APPLICATIONS } from '../graphql/operations'
import ApplicationCard from './ApplicationCard'
import StatusBadge from './StatusBadge'

const STATUSES = ['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED']

const STATUS_ACCENT = {
  WISHLIST: 'text-zinc-400',
  APPLIED: 'text-blue-400',
  INTERVIEWING: 'text-amber-400',
  OFFERED: 'text-emerald-400',
  REJECTED: 'text-red-400',
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-1.5 ${accent ?? 'text-zinc-100'}`}>{value}</p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-zinc-700 rounded skeleton" />
          <div className="h-3 w-1/2 bg-zinc-800 rounded skeleton" />
          <div className="h-3 w-1/3 bg-zinc-800 rounded skeleton mt-3" />
        </div>
        <div className="h-8 w-28 bg-zinc-800 rounded-lg skeleton shrink-0" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [filter, setFilter] = useState('ALL')
  const { data, loading, error } = useQuery(GET_APPLICATIONS)

  const applications = data?.applications ?? []

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length
    return acc
  }, {})

  const filtered = filter === 'ALL'
    ? applications
    : applications.filter((a) => a.status === filter)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Track and manage your job applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={loading ? '—' : applications.length} />
        {STATUSES.map((s) => (
          <StatCard
            key={s}
            label={s.charAt(0) + s.slice(1).toLowerCase()}
            value={loading ? '—' : counts[s]}
            accent={STATUS_ACCENT[s]}
          />
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 overflow-x-auto">
        <button
          onClick={() => setFilter('ALL')}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'ALL'
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          All ({applications.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {/* Application list */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          Failed to load applications: {error.message}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-zinc-400 font-medium">No applications yet</p>
          <p className="text-zinc-600 text-sm mt-1">
            {filter === 'ALL' ? 'Add your first application to get started' : `No applications with status "${filter.toLowerCase()}"`}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  )
}
