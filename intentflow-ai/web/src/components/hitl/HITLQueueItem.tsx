// components/hitl/HITLQueueItem.tsx
'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useResolveHITL } from '@/hooks/useHITL'
import { useHITLStore } from '@/store/hitlStore'
import { cn, capitalize, timeAgo, getPriorityColor } from '@/lib/utils'
import type { HITLItem } from '@/types/hitl'

interface HITLQueueItemProps {
  item: HITLItem
}

export function HITLQueueItem({ item }: HITLQueueItemProps) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const resolveHITL = useResolveHITL()
  const resolvePending = useHITLStore((s) => s.resolvePending)

  const handleApprove = async () => {
    await resolveHITL.mutateAsync({ id: item.id, action: 'approve' })
    resolvePending(item.id)
  }

  const handleReject = async () => {
    await resolveHITL.mutateAsync({
      id: item.id,
      action: 'reject',
      reason: rejectReason || undefined,
    })
    resolvePending(item.id)
  }

  const actionTypeLabels: Record<string, string> = {
    confirm_task_creation: 'New Task',
    confirm_task_update: 'Task Update',
    confirm_workflow_action: 'Workflow Action',
    review_nlp_result: 'NLP Review',
  }

  return (
    <Card className="border-amber-500/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="warning" pulse>
            {actionTypeLabels[item.action_type] || item.action_type}
          </Badge>
          {item.confidence != null && (
            <Badge variant={item.confidence > 0.7 ? 'info' : 'danger'} size="sm">
              {Math.round(item.confidence * 100)}%
            </Badge>
          )}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-600">{timeAgo(item.created_at)}</span>
      </div>

      {/* Proposed data */}
      {item.proposed_data && (
        <div className="rounded-xl bg-slate-100/50 border border-slate-200/80 dark:bg-white/[0.02] dark:border-white/[0.04] p-3 mb-3 space-y-1.5">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white">
            {item.proposed_data.title || 'Untitled'}
          </h4>
          {item.proposed_data.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400">{item.proposed_data.description}</p>
          )}
          <div className="flex gap-2">
            {item.proposed_data.priority && (
              <span className={cn(
                'px-2 py-0.5 rounded text-[10px] font-semibold border',
                getPriorityColor(item.proposed_data.priority)
              )}>
                {capitalize(item.proposed_data.priority)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* AI reasoning */}
      {item.ai_reasoning && (
        <div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-2.5 mb-3">
          <p className="text-xs text-violet-700 dark:text-violet-300">
            <span className="font-medium">AI reasoning:</span> {item.ai_reasoning}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {showRejectInput && (
          <input
            type="text"
            placeholder="Reason for rejection (optional)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-slate-500"
          />
        )}
        <div className="flex gap-2 justify-end">
          {!showRejectInput ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowRejectInput(true)}>
                Reject
              </Button>
              <Button size="sm" onClick={handleApprove} loading={resolveHITL.isPending}>
                Approve
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowRejectInput(false)}>
                Back
              </Button>
              <Button variant="danger" size="sm" onClick={handleReject} loading={resolveHITL.isPending}>
                Confirm Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
