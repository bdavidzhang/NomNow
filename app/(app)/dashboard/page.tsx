import { createServiceClient } from '@/lib/supabase'
import { FoodEvent } from '@/lib/types'
import { EventCard } from '@/components/EventCard'
import { PostEventForm } from '@/components/PostEventForm'

export const dynamic = 'force-dynamic'

async function getEvents(): Promise<FoodEvent[]> {
  const db = createServiceClient()
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

  const { data, error } = await db
    .from('events')
    .select(`*, poster:users(name, avatar_url)`)
    .gte('start_time', threeHoursAgo)
    .order('start_time', { ascending: true })
    .limit(50)

  if (error) return []
  return data as FoodEvent[]
}

export default async function DashboardPage() {
  const events = await getEvents()

  const active = events.filter((e) => {
    const start = new Date(e.start_time).getTime()
    const end = e.end_time ? new Date(e.end_time).getTime() : start + 60 * 60 * 1000
    return Date.now() >= start && Date.now() <= end
  })
  const upcoming = events.filter((e) => new Date(e.start_time).getTime() > Date.now())
  const past = events.filter((e) => {
    const end = e.end_time
      ? new Date(e.end_time).getTime()
      : new Date(e.start_time).getTime() + 60 * 60 * 1000
    return Date.now() > end
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Free Food Today</h2>
          <p className="text-sm text-muted-foreground">
            {active.length} happening now · {upcoming.length} upcoming
          </p>
        </div>
        <PostEventForm />
      </div>

      {events.length === 0 && (
        <div className="rounded-xl border-2 border-dashed p-12 text-center text-muted-foreground">
          <p className="text-4xl">🍽️</p>
          <p className="mt-2 font-medium">No food events right now</p>
          <p className="text-sm">Be the first to post one!</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-green-700">
            Happening Now
          </h3>
          <div className="space-y-3">
            {active.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-700">
            Upcoming
          </h3>
          <div className="space-y-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Recently Ended
          </h3>
          <div className="space-y-3">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
