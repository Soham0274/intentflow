// components/ui/Card.tsx
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
}

export function Card({ children, className, hoverable, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl bg-white/80 border border-slate-200/85 shadow-sm dark:bg-white/[0.03] dark:border-white/[0.06] dark:shadow-none backdrop-blur-xl p-5',
        'transition-all duration-300',
        hoverable && 'hover:bg-white hover:border-slate-300 hover:shadow-md dark:hover:bg-white/[0.06] dark:hover:border-white/[0.1] dark:hover:shadow-lg dark:hover:shadow-violet-500/5 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
