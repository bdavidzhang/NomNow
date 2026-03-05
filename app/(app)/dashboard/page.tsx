'use client'

import { useState, useMemo } from 'react'
import { FoodEvent } from '@/lib/types'
import { useEvents } from '@/lib/hooks'
import { getEventStatus } from '@/lib/pinColor'
import { EventCard } from '@/components/EventCard'
import { EventDetailModal } from '@/components/EventDetailModal'
import { PostEventForm } from '@/components/PostEventForm'
import { Loader2 } from 'lucide-react'

const FOOD_FILTERS = ['Pizza', 'Sandwiches', 'Tacos', 'Sushi', 'Burritos', 'Salad', 'Desserts', 'Drinks', 'Snacks', 'BBQ', 'Other']
const TIME_FILTERS = ['all', 'active', 'upcoming', 'past'] as const
type TimeFilter = typeof TIME_FILTERS[number]

const TIME_LABELS: Record<TimeFilter, string> = {
  all: 'All',
  active: 'Now',
  upcoming: 'Upcoming',
  past: 'Ended',
}

export default function DashboardPage() {
  const { events, loading, refresh } = useEvents()
  const [selectedFoods, setSelectedFoods] = useState<string[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [selectedEvent, setSelectedEvent] = useState<FoodEvent | null>(null)

  const filtered = useMemo(() => {
    return events.filter((e) => {
      // Food filter
      if (selectedFoods.length > 0 && !e.food_type.some((f) => selectedFoods.includes(f))) {
        return false
      }
      // Time filter
      if (timeFilter !== 'all') {
        const status = getEventStatus(e.start_time, e.end_time)
        if (timeFilter === 'active' && status !== 'active') return false
        if (timeFilter === 'upcoming' && status !== 'upcoming' && status !== 'soon') return false
        if (timeFilter === 'past' && status !== 'past') return false
      }
      return true
    })
  }, [events, selectedFoods, timeFilter])

  const active = filtered.filter((e) => {
    const s = getEventStatus(e.start_time, e.end_time)
    return s === 'active'
  })
  const upcoming = filtered.filter((e) => {
    const s = getEventStatus(e.start_time, e.end_time)
    return s === 'upcoming' || s === 'soon'
  })
  const past = filtered.filter((e) => {
    const s = getEventStatus(e.start_time, e.end_time)
    return s === 'past'
  })

  function toggleFood(type: string) {
    setSelectedFoods((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Free Food Today</h2>
          <p className="text-sm text-muted-foreground">
            {active.length} happening now · {upcoming.length} upcoming
          </p>
        </div>
        <PostEventForm onCreated={refresh} />
      </div>

      {/* Time filter */}
      <div className="mb-3 flex gap-2">
        {TIME_FILTERS.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeFilter(tf)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              timeFilter === tf
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {TIME_LABELS[tf]}
          </button>
        ))}
      </div>

      {/* Food type filter */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {FOOD_FILTERS.map((type) => (
          <button
            key={type}
            onClick={() => toggleFood(type)}
            className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
              selectedFoods.includes(type)
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border-2 border-dashed p-12 text-center text-muted-foreground">
          <p className="text-4xl">🍽️</p>
          <p className="mt-2 font-medium">No food events match your filters</p>
          <p className="text-sm">Try changing your filters or post one!</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-green-700">
            Happening Now
          </h3>
          <div className="space-y-3">
            {active.map((event) => (
              <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
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
              <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
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
              <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
            ))}
          </div>
        </section>
      )}

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  )
}
