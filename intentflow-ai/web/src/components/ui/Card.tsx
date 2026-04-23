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
        'rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-5',
        'transition-all duration-300',
        hoverable && 'hover:bg-white/[0.06] hover:border-white/[0.1] hover:shadow-lg hover:shadow-violet-500/5 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
