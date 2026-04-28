const STATUS_STYLES = {
  WISHLIST: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50',
  APPLIED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  INTERVIEWING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  OFFERED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const STATUS_LABELS = {
  WISHLIST: 'Wishlist',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFERED: 'Offered',
  REJECTED: 'Rejected',
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export { STATUS_STYLES, STATUS_LABELS }
