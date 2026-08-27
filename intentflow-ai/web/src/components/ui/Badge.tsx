// components/ui/Badge.tsx
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'violet'
  size?: 'sm' | 'md'
  className?: string
  pulse?: boolean
}

const variantStyles = {
  default: 'bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-300',
  success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  danger: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400',
  info: 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400',
  violet: 'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400',
}

export function Badge({ children, variant = 'default', size = 'sm', className, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' && 'px-2.5 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        variantStyles[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger' && 'bg-rose-400',
            variant === 'info' && 'bg-sky-400',
            variant === 'violet' && 'bg-violet-400',
            variant === 'default' && 'bg-slate-400',
          )} />
          <span className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger' && 'bg-rose-400',
            variant === 'info' && 'bg-sky-400',
            variant === 'violet' && 'bg-violet-400',
            variant === 'default' && 'bg-slate-400',
          )} />
        </span>
      )}
      {children}
    </span>
  )
}
