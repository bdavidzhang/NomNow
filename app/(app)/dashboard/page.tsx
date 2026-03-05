import { auth } from '@/lib/auth'
import { DashboardView } from './dashboard-view'

export default async function DashboardPage() {
  const session = await auth()
  return <DashboardView currentUserId={session?.user?.id ?? null} />
}
