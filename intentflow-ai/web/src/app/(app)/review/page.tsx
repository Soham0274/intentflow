// app/(app)/review/page.tsx — HITL review queue page
'use client'
import { HITLQueueItem } from '@/components/hitl/HITLQueueItem'
import { Spinner } from '@/components/ui/Spinner'
import { useHITLQueue } from '@/hooks/useHITL'

export default function ReviewPage() {
  const { data: items, isLoading, error } = useHITLQueue()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Review Queue</h1>
        <p className="text-sm text-slate-500 mt-1">
          AI actions that need your approval before proceeding
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-300">
          Failed to load review queue.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm font-medium">All clear!</p>
          <p className="text-slate-600 text-xs mt-1">No items need your review right now</p>
        </div>
      )}

      {/* Queue items */}
      {items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <HITLQueueItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
