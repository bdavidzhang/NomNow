'use client'

import { FoodEvent } from '@/lib/types'
import { getEventStatus } from '@/lib/pinColor'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Users, Trash2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-800',
  soon: 'bg-teal-100 text-teal-800',
  upcoming: 'bg-blue-100 text-blue-800',
  past: 'bg-red-100 text-red-700 opacity-60',
}

const STATUS_LABELS = {
  active: 'Happening now',
  soon: 'Starting soon',
  upcoming: 'Upcoming',
  past: 'Ended',
}

interface EventCardProps {
  event: FoodEvent
  onClick?: () => void
  isOwner?: boolean
  onDelete?: () => void
}

export function EventCard({ event, onClick, isOwner, onDelete }: EventCardProps) {
  const status = getEventStatus(event.start_time, event.end_time)
  const startDate = new Date(event.start_time)

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md ${status === 'past' ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{event.title}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {event.food_type.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {type}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{event.location_name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>
            {status === 'past' || status === 'active'
              ? formatDistanceToNow(startDate, { addSuffix: true })
              : format(startDate, 'EEE, MMM d · h:mm a')}
          </span>
        </div>
        {event.expected_people && (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>~{event.expected_people} people expected</span>
          </div>
        )}
        {event.poster?.name && (
          <p className="pt-1 text-xs">Posted by {event.poster.name}</p>
        )}
        {isOwner && onDelete && (
          <div className="flex justify-end pt-2">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
