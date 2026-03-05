import { createServiceClient } from '@/lib/supabase'
import { FoodEvent } from '@/lib/types'
import { EventMap } from '@/components/EventMap'

export const dynamic = 'force-dynamic'

async function getEvents(): Promise<FoodEvent[]> {
  const db = createServiceClient()
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  const twentyFourHoursLater = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data } = await db
    .from('events')
    .select(`*, poster:users(name, avatar_url)`)
    .gte('start_time', threeHoursAgo)
    .lte('start_time', twentyFourHoursLater)
    .order('start_time', { ascending: true })

  return (data ?? []) as FoodEvent[]
}

export default async function MapPage() {
  const events = await getEvents()
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

  return (
    <div className="h-full">
      <EventMap events={events} token={token} />
    </div>
  )
}
