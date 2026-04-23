// app/api/tasks/route.ts — GET all tasks, POST new task
import { NextRequest } from 'next/server'
import { proxyToBackend, apiError } from '@/lib/api/handler'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const response = await proxyToBackend('/tasks', {
      token: (await supabase.auth.getSession()).data.session?.access_token,
    })
    const data = await response.json()
    return Response.json(data)
  } catch (err) {
    console.error('[API] Tasks GET error:', err)
    return apiError('Failed to fetch tasks')
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await req.json()
    const response = await proxyToBackend('/tasks', {
      method: 'POST',
      body,
      token: (await supabase.auth.getSession()).data.session?.access_token,
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (err) {
    console.error('[API] Tasks POST error:', err)
    return apiError('Failed to create task')
  }
}
