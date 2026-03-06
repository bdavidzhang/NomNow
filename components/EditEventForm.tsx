'use client'

import { useState } from 'react'
import { FoodEvent } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronDown } from 'lucide-react'
import { LocationPicker } from '@/components/LocationPicker'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const FOOD_OPTIONS = [
  'Pizza', 'Sandwiches', 'Tacos', 'Sushi', 'Burritos',
  'Salad', 'Desserts', 'Drinks', 'Snacks', 'BBQ', 'Other',
]

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Halal', 'Kosher']

interface EditEventFormProps {
  event: FoodEvent
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

export function EditEventForm({ event, open, onOpenChange, onUpdated }: EditEventFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState<string[]>(event.food_type)
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>({
    lat: event.lat,
    lng: event.lng,
    name: event.location_name,
  })
  const [showManualCoords, setShowManualCoords] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)

    const lat = location?.lat ?? parseFloat(data.get('lat') as string)
    const lng = location?.lng ?? parseFloat(data.get('lng') as string)
    const locationName = location?.name ?? (data.get('location_name') as string)

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      setFeedback({ type: 'error', message: 'Please select a location on the map or enter coordinates manually.' })
      setLoading(false)
      return
    }

    const payload: Record<string, unknown> = {
      title: data.get('title') as string,
      description: data.get('description') as string,
      food_type: selectedFood,
      location_name: locationName,
      lat,
      lng,
      start_time: new Date(data.get('start_time') as string).toISOString(),
      end_time: data.get('end_time')
        ? new Date(data.get('end_time') as string).toISOString()
        : null,
      expected_people: data.get('expected_people')
        ? parseInt(data.get('expected_people') as string)
        : null,
    }

    const res = await fetch(`/api/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (res.ok) {
      setFeedback({ type: 'success', message: 'Event updated!' })
      setTimeout(() => {
        onUpdated?.()
        onOpenChange(false)
        setFeedback(null)
      }, 1200)
    } else {
      const err = await res.json()
      setFeedback({ type: 'error', message: err.error ?? 'Failed to update event' })
    }
  }

  function toggleFood(type: string) {
    setSelectedFood((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // Format datetime for input[type=datetime-local]
  function toLocalDatetime(iso: string) {
    const d = new Date(iso)
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - offset * 60000)
    return local.toISOString().slice(0, 16)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        {feedback && (
          <div className={`rounded-lg px-3 py-2 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {feedback.message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Event title *</Label>
            <Input id="edit-title" name="title" defaultValue={event.title} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={event.description ?? ''}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Food type</Label>
            <div className="flex flex-wrap gap-2">
              {FOOD_OPTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleFood(type)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedFood.includes(type)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Dietary options available</Label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleFood(type)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedFood.includes(type)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Location *</Label>
            <LocationPicker
              token={MAPBOX_TOKEN}
              onLocationChange={setLocation}
              center={[event.lng, event.lat]}
            />
            {location && (
              <p className="text-xs text-green-600 font-medium">
                Pin set at {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowManualCoords(!showManualCoords)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${showManualCoords ? 'rotate-180' : ''}`} />
            Enter coordinates manually
          </button>

          {showManualCoords && (
            <div className="space-y-3 rounded-lg border p-3 bg-secondary/30">
              <div className="space-y-1.5">
                <Label htmlFor="edit-location_name">Location name</Label>
                <Input
                  id="edit-location_name"
                  name="location_name"
                  defaultValue={event.location_name}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-lat">Latitude</Label>
                  <Input
                    id="edit-lat"
                    name="lat"
                    type="number"
                    step="any"
                    defaultValue={event.lat}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-lng">Longitude</Label>
                  <Input
                    id="edit-lng"
                    name="lng"
                    type="number"
                    step="any"
                    defaultValue={event.lng}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-start_time">Start time *</Label>
              <Input
                id="edit-start_time"
                name="start_time"
                type="datetime-local"
                defaultValue={toLocalDatetime(event.start_time)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-end_time">End time</Label>
              <Input
                id="edit-end_time"
                name="end_time"
                type="datetime-local"
                defaultValue={event.end_time ? toLocalDatetime(event.end_time) : ''}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-expected_people">Expected people</Label>
            <Input
              id="edit-expected_people"
              name="expected_people"
              type="number"
              min={1}
              defaultValue={event.expected_people ?? ''}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || (!location && !showManualCoords)}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
