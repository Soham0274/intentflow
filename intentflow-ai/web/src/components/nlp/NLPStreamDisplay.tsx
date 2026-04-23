// components/nlp/NLPStreamDisplay.tsx
'use client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { NLPParseResult } from '@/types/nlp'
import { cn, capitalize, getPriorityColor, formatDate } from '@/lib/utils'

interface NLPStreamDisplayProps {
  output: string
  done: boolean
  error: string | null
  parsedResult: NLPParseResult | null
  onConfirm: () => void
  onDismiss: () => void
  confirming?: boolean
}

export function NLPStreamDisplay({
  output,
  done,
  error,
  parsedResult,
  onConfirm,
  onDismiss,
  confirming,
}: NLPStreamDisplayProps) {
  if (error) {
    return (
      <div className="px-4 pb-4">
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
          <p className="text-sm text-rose-300">{error}</p>
          <button onClick={onDismiss} className="ml-auto text-rose-400 hover:text-rose-300 text-xs">
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-white/[0.04] px-4 py-3 bg-violet-500/[0.02]">
      {/* Streaming indicator */}
      {!done && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-violet-400">AI is analyzing...</span>
        </div>
      )}

      {/* Parsed result card */}
      {done && parsedResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-xs font-medium text-emerald-400">Task extracted</span>
            {parsedResult.confidence != null && (
              <Badge variant={parsedResult.confidence > 0.8 ? 'success' : 'warning'} size="sm">
                {Math.round(parsedResult.confidence * 100)}% confidence
              </Badge>
            )}
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-2">
            <h4 className="text-sm font-medium text-white">{parsedResult.title}</h4>
            {parsedResult.description && (
              <p className="text-xs text-slate-400">{parsedResult.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {parsedResult.priority && (
                <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold border', getPriorityColor(parsedResult.priority))}>
                  {capitalize(parsedResult.priority)}
                </span>
              )}
              {parsedResult.due_date && (
                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                  📅 {formatDate(parsedResult.due_date)}
                </span>
              )}
              <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                {parsedResult.intent}
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Cancel
            </Button>
            <Button size="sm" onClick={onConfirm} loading={confirming}>
              Create Task
            </Button>
          </div>
        </div>
      )}

      {/* Raw streaming output */}
      {!parsedResult && output && (
        <p className="text-sm text-slate-300 font-mono">{output}</p>
      )}
    </div>
  )
}
