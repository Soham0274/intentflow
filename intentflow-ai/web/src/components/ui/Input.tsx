// components/ui/Input.tsx
'use client'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-12 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900',
              'placeholder:text-slate-400 leading-normal hover:bg-slate-200/50 focus:bg-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50',
              'dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder:text-slate-500 dark:hover:bg-white/[0.06] dark:focus:bg-white/[0.08]',
              'transition-all duration-200',
              icon ? 'pl-11 pr-4' : 'px-4',
              error ? 'border-rose-500/50 focus:ring-rose-500/50' : '',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-500 ml-1 mt-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
