// app/api/nlp/stream/route.ts — Stream NLP response via SSE
import { NextRequest } from 'next/server'
import { apiError } from '@/lib/api/handler'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await req.json()
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'
    const token = (await supabase.auth.getSession()).data.session?.access_token

    const upstream = await fetch(`${backendUrl}/api/nlp/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })

    if (!upstream.ok) {
      return apiError(`NLP streaming failed: ${upstream.status}`, upstream.status)
    }

    // Proxy the stream directly to client
    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('[API] NLP stream error:', err)
    return apiError('NLP streaming failed')
  }
}
