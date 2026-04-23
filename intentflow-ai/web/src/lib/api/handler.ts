// lib/api/handler.ts — Centralized API error/response handler
import { NextResponse } from 'next/server'

export function apiError(
  message: string,
  status: number = 500,
  code?: string
): NextResponse {
  console.error(`[API Error] ${status} — ${message}`)
  return NextResponse.json({ error: message, code }, { status })
}

export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ data, error: null }, { status })
}

// Proxy helper: forward requests to Express backend
export async function proxyToBackend(
  path: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    token?: string
  } = {}
): Promise<Response> {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'
  const url = `${backendUrl}/api${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  return fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}
