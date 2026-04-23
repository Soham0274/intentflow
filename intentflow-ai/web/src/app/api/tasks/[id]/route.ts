// app/api/tasks/[id]/route.ts — GET, PATCH, DELETE single task
import { NextRequest } from 'next/server'
import { proxyToBackend, apiError } from '@/lib/api/handler'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const response = await proxyToBackend(`/tasks/${id}`, {
      token: (await supabase.auth.getSession()).data.session?.access_token,
    })
    const data = await response.json()
    return Response.json(data)
  } catch (err) {
    console.error('[API] Task GET error:', err)
    return apiError('Failed to fetch task')
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await req.json()
    const response = await proxyToBackend(`/tasks/${id}`, {
      method: 'PATCH',
      body,
      token: (await supabase.auth.getSession()).data.session?.access_token,
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (err) {
    console.error('[API] Task PATCH error:', err)
    return apiError('Failed to update task')
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const response = await proxyToBackend(`/tasks/${id}`, {
      method: 'DELETE',
      token: (await supabase.auth.getSession()).data.session?.access_token,
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (err) {
    console.error('[API] Task DELETE error:', err)
    return apiError('Failed to delete task')
  }
}
