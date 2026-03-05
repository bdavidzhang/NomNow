'use client'

import { useEvents } from '@/lib/hooks'
import { EventMap } from '@/components/EventMap'
import { Loader2 } from 'lucide-react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface MapViewProps {
  centerLng: number
  centerLat: number
  zoom: number
}

export function MapView({ centerLng, centerLat, zoom }: MapViewProps) {
  const { events, loading, error } = useEvents()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full relative">
      <EventMap events={events} token={MAPBOX_TOKEN} center={[centerLng, centerLat]} zoom={zoom} />
      {!loading && events.length === 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-xl bg-white/90 px-4 py-3 shadow text-center backdrop-blur text-sm">
          <p className="font-medium">No food events on campus right now</p>
          <p className="text-xs text-muted-foreground">Post one from the Dashboard tab!</p>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-xl bg-red-50 px-4 py-2 shadow text-center text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
