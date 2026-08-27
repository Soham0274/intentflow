// components/nlp/NLPInput.tsx
'use client'
import { useState } from 'react'
import { useNLPStream } from '@/hooks/useNLP'
import { useCreateTask } from '@/hooks/useTasks'
import { NLPStreamDisplay } from './NLPStreamDisplay'
import { Button } from '@/components/ui/Button'

export function NLPInput() {
  const [input, setInput] = useState('')
  const { parseInput, streaming, output, done, error, parsedResult, reset } = useNLPStream()
  const createTask = useCreateTask()

  const handleSubmit = async () => {
    if (!input.trim() || streaming) return
    await parseInput(input)
  }

  const handleConfirmTask = () => {
    if (parsedResult) {
      createTask.mutate({
        title: parsedResult.title,
        description: parsedResult.description,
        due_date: parsedResult.due_date,
        priority: parsedResult.priority || 'medium',
        nlp_raw_input: input,
      })
      setInput('')
      reset()
    }
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
      {/* Input area */}
      <div className="flex gap-2 p-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-3 text-violet-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What do you need to do? e.g. 'remind me to submit report by Friday'"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-slate-500 resize-none transition-all"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={streaming || !input.trim()}
          loading={streaming}
          size="md"
          className="self-end shrink-0"
        >
          {streaming ? 'Parsing...' : 'Parse'}
        </Button>
      </div>

      {/* Stream / Result display */}
      {(streaming || done) && (
        <NLPStreamDisplay
          output={output}
          done={done}
          error={error}
          parsedResult={parsedResult}
          onConfirm={handleConfirmTask}
          onDismiss={reset}
          confirming={createTask.isPending}
        />
      )}
    </div>
  )
}
