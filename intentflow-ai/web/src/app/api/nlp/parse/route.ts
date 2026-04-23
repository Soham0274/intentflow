// app/api/nlp/parse/route.ts — Parse natural language → structured task
import { NextRequest } from 'next/server'
import { proxyToBackend, apiError } from '@/lib/api/handler'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await req.json()
    const response = await proxyToBackend('/nlp/parse', {
      method: 'POST',
      body,
      token: (await supabase.auth.getSession()).data.session?.access_token,
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (err) {
    console.error('[API] NLP parse error:', err)
    return apiError('NLP parsing failed')
  }
}
