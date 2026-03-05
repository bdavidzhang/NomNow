import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TabNav } from '@/components/TabNav'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-xl font-bold">🍕 NomNow</h1>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {session.user?.name ?? session.user?.email}
            </span>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </div>
        </form>
      </header>

      {/* Tab navigation */}
      <TabNav />

      {/* Page content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
