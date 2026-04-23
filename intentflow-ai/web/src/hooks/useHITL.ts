// hooks/useHITL.ts
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { HITLItem, HITLResolveInput } from '@/types/hitl'

async function fetchHITLQueue(): Promise<HITLItem[]> {
  const res = await fetch('/api/hitl/queue')
  if (!res.ok) throw new Error('Failed to fetch HITL queue')
  const json = await res.json()
  return json.data || []
}

async function resolveHITL({
  id,
  ...input
}: HITLResolveInput & { id: string }): Promise<void> {
  const res = await fetch(`/api/hitl/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to resolve HITL item')
}

export function useHITLQueue() {
  return useQuery({
    queryKey: ['hitl-queue'],
    queryFn: fetchHITLQueue,
    refetchInterval: 30000, // Poll every 30s as fallback to real-time
  })
}

export function useResolveHITL() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resolveHITL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hitl-queue'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
