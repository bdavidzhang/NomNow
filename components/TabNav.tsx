'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Map } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/map', label: 'Map', icon: Map },
]

export function TabNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background pb-[env(safe-area-inset-bottom)] sm:static sm:border-b sm:border-t-0 sm:pb-0">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors sm:flex-row sm:gap-2 sm:py-3 sm:text-sm',
              active
                ? 'text-primary sm:border-b-2 sm:border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
