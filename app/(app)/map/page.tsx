'use client'

import { useSession } from 'next-auth/react'
import { useEvents } from '@/lib/hooks'
import { EventMap } from '@/components/EventMap'
import { getCampusById } from '@/lib/campuses'
import { Loader2 } from 'lucide-react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const DEFAULT_CENTER: [number, number] = [-88.2272, 40.102]
const DEFAULT_ZOOM = 15

export default function MapPage() {
  const { events, loading } = useEvents()
  const { data: session } = useSession()

  const campus = session?.user?.campus ? getCampusById(session.user.campus) : undefined
  const center: [number, number] = campus ? [campus.lng, campus.lat] : DEFAULT_CENTER
  const zoom = campus?.zoom ?? DEFAULT_ZOOM

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full">
      <EventMap events={events} token={MAPBOX_TOKEN} center={center} zoom={zoom} />
    </div>
  )
}
