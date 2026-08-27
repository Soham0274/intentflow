// app/api/hitl/[id]/route.ts — Approve/reject HITL item
import { NextRequest } from 'next/server'
import { proxyToBackend, apiError } from '@/lib/api/handler'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await req.json()
    const { action, reason } = body

    let backendPath = ''
    let backendBody: Record<string, unknown> = {}

    if (action === 'approve') {
      backendPath = '/hitl/confirm'
      backendBody = { hitlId: id }
    } else if (action === 'reject') {
      backendPath = '/hitl/reject'
      backendBody = { hitlId: id, reason }
    } else {
      return apiError('Invalid action', 400)
    }

    const response = await proxyToBackend(backendPath, {
      method: 'POST',
      body: backendBody,
      token: (await supabase.auth.getSession()).data.session?.access_token,
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (err) {
    console.error('[API] HITL resolve error:', err)
    return apiError('Failed to resolve HITL item')
  }
}
