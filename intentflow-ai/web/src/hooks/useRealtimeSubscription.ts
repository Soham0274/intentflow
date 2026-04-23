// hooks/useRealtimeSubscription.ts
'use client'
import { useEffect, useRef } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onData: (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => void
  enabled?: boolean
}

export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  onData,
  enabled = true,
}: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!enabled) return

    const channel = supabase.channel(`realtime:${table}:${filter ?? 'all'}`)

    channel
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event, schema: 'public', table, filter },
        (payload: unknown) => {
          onData(payload as { new: Record<string, unknown>; old: Record<string, unknown> })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to ${table}`)
        }
        if (status === 'CLOSED') {
          console.warn(`[Realtime] Channel closed: ${table}`)
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, event, filter, enabled])
}
