// components/layout/BottomNav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useHITLStore } from '@/store/hitlStore'

const navItems = [
  {
    name: 'Tasks',
    href: '/tasks',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    name: 'Review',
    href: '/review',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    badge: true,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const pendingCount = useHITLStore((s) => s.pendingCount)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 border-t border-slate-200/80 backdrop-blur-xl dark:bg-slate-950/90 dark:border-white/[0.06]">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200',
                isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-300'
              )}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.name}</span>
              {item.badge && pendingCount > 0 && (
                <span className="absolute -top-0.5 right-2 flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
              {isActive && (
                <span className="absolute -bottom-2 w-4 h-0.5 rounded-full bg-violet-600 dark:bg-violet-400" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
