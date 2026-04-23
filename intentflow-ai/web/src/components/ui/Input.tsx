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
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300 ml-1">
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
              'w-full h-12 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white',
              'placeholder:text-slate-500 leading-normal hover:bg-white/[0.06]',
              'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 focus:bg-white/[0.08]',
              'transition-all duration-200',
              icon ? 'pl-11 pr-4' : 'px-4',
              error ? 'border-rose-500/50 focus:ring-rose-500/50' : '',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-400 ml-1 mt-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
