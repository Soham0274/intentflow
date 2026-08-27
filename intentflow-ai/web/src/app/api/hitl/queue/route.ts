// app/api/hitl/queue/route.ts — GET pending HITL items
import { proxyToBackend, apiError } from '@/lib/api/handler'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const response = await proxyToBackend('/hitl/pending', {
      token: (await supabase.auth.getSession()).data.session?.access_token,
    })
    const data = await response.json()
    return Response.json(data)
  } catch (err) {
    console.error('[API] HITL queue error:', err)
    return apiError('Failed to fetch HITL queue')
  }
}
