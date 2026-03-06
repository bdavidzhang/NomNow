'use client'

import { FoodEvent } from '@/lib/types'
import { getPinColor, getEventStatus } from '@/lib/pinColor'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Users, CalendarDays, Trash2 } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const STATUS_LABELS = {
  active: 'Happening now',
  soon: 'Starting soon',
  today: 'Later today',
  upcoming: 'Upcoming',
  past: 'Ended',
}

interface EventDetailModalProps {
  event: FoodEvent | null
  onClose: () => void
  isOwner?: boolean
  onDelete?: () => void
}

export function EventDetailModal({ event, onClose, isOwner, onDelete }: EventDetailModalProps) {
  if (!event) return null

  const status = getEventStatus(event.start_time, event.end_time)
  const color = getPinColor(event.start_time)
  const startDate = new Date(event.start_time)

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs font-medium" style={{ color }}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <DialogTitle className="text-xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {event.food_type.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.food_type.map((type) => (
                <Badge key={type} variant="secondary">{type}</Badge>
              ))}
            </div>
          )}

          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{event.location_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {format(startDate, 'h:mm a')}
                {event.end_time && ` – ${format(new Date(event.end_time), 'h:mm a')}`}
                {' · '}
                {formatDistanceToNow(startDate, { addSuffix: true })}
              </span>
            </div>
            {event.expected_people && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>~{event.expected_people} people expected</span>
              </div>
            )}
          </div>

          {event.is_anonymous ? (
            <p className="text-xs text-muted-foreground border-t pt-3">
              Posted anonymously
            </p>
          ) : event.poster?.name ? (
            <p className="text-xs text-muted-foreground border-t pt-3">
              Posted by {event.poster.name}
            </p>
          ) : null}

          {isOwner && onDelete && (
            <div className="border-t pt-3">
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete Event
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
