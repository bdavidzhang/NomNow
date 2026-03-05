'use client'

import { useEvents } from '@/lib/hooks'
import { EventMap } from '@/components/EventMap'
import { Loader2 } from 'lucide-react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function MapPage() {
  const { events, loading } = useEvents()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full">
      <EventMap events={events} token={MAPBOX_TOKEN} center={[-88.2272, 40.1020]} zoom={15} />
    </div>
  )
}
