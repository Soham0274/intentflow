// app/api/workflow/trigger/route.ts — Trigger n8n workflow
import { NextRequest } from 'next/server'
import { proxyToBackend, apiError } from '@/lib/api/handler'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await req.json()
    const response = await proxyToBackend('/automation/trigger', {
      method: 'POST',
      body: { ...body, payload: { ...body.payload, user_id: user.id } },
      token: (await supabase.auth.getSession()).data.session?.access_token,
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (err) {
    console.error('[API] Workflow trigger error:', err)
    return apiError('Failed to trigger workflow')
  }
}
