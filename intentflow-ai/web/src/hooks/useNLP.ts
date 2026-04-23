// hooks/useNLP.ts
'use client'
import { useState, useCallback } from 'react'
import type { NLPParseResult } from '@/types/nlp'

export function useNLPStream() {
  const [streaming, setStreaming] = useState(false)
  const [output, setOutput] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedResult, setParsedResult] = useState<NLPParseResult | null>(null)

  const parseInput = useCallback(async (input: string) => {
    setStreaming(true)
    setOutput('')
    setDone(false)
    setError(null)
    setParsedResult(null)

    try {
      // First, try parsing to structured data
      const parseRes = await fetch('/api/nlp/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })

      if (parseRes.ok) {
        const data = await parseRes.json()
        setParsedResult(data.parsed || data.data)
        setOutput(data.parsed?.title || data.data?.title || input)
        setDone(true)
        setStreaming(false)
        return data.parsed || data.data
      }

      // Fallback: use streaming endpoint
      const response = await fetch('/api/nlp/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })

      if (!response.ok) throw new Error(`Server error: ${response.status}`)

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const data = JSON.parse(line.replace('data: ', ''))
            if (data.token) setOutput((prev) => prev + data.token)
            if (data.done) {
              setDone(true)
              setStreaming(false)
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI processing failed')
      setStreaming(false)
      setDone(true)
    }
  }, [])

  const reset = useCallback(() => {
    setStreaming(false)
    setOutput('')
    setDone(false)
    setError(null)
    setParsedResult(null)
  }, [])

  return { parseInput, streaming, output, done, error, parsedResult, reset }
}
