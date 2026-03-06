'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, ChevronDown } from 'lucide-react'
import { LocationPicker } from '@/components/LocationPicker'
import { RecurrencePicker } from '@/components/RecurrencePicker'
import { RecurrenceFrequency } from '@/lib/types'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const FOOD_OPTIONS = [
  'Pizza', 'Sandwiches', 'Tacos', 'Sushi', 'Burritos',
  'Salad', 'Desserts', 'Drinks', 'Snacks', 'BBQ', 'Other',
]

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Halal', 'Kosher']

export function PostEventForm({ onCreated }: { onCreated?: () => void } = {}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState<string[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [showManualCoords, setShowManualCoords] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [recurring, setRecurring] = useState(false)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>([])
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)

    // Use location picker values if available, fall back to manual fields
    const lat = location?.lat ?? parseFloat(data.get('lat') as string)
    const lng = location?.lng ?? parseFloat(data.get('lng') as string)
    const locationName = location?.name ?? (data.get('location_name') as string)

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      setFeedback({ type: 'error', message: 'Please select a location on the map or enter coordinates manually.' })
      setLoading(false)
      return
    }

    const payload = {
      title: data.get('title') as string,
      description: data.get('description') as string,
      food_type: selectedFood,
      location_name: locationName,
      lat,
      lng,
      start_time: new Date(data.get('start_time') as string).toISOString(),
      end_time: data.get('end_time')
        ? new Date(data.get('end_time') as string).toISOString()
        : undefined,
      expected_people: data.get('expected_people')
        ? parseInt(data.get('expected_people') as string)
        : undefined,
      is_anonymous: anonymous,
    }

    const endpoint = recurring ? '/api/series' : '/api/events'
    const body = recurring
      ? {
          ...payload,
          frequency,
          days_of_week: frequency !== 'monthly' ? daysOfWeek : undefined,
          days_of_month: frequency === 'monthly' ? daysOfMonth : undefined,
        }
      : payload

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)

    if (res.ok) {
      setFeedback({ type: 'success', message: 'Event posted!' })
      setSelectedFood([])
      setLocation(null)
      setShowManualCoords(false)
      setAnonymous(false)
      setRecurring(false)
      setDaysOfWeek([])
      setDaysOfMonth([])
      form.reset()
      onCreated?.()
      setTimeout(() => { setOpen(false); setFeedback(null) }, 1200)
    } else {
      const err = await res.json()
      setFeedback({ type: 'error', message: err.error ?? 'Failed to post event' })
    }
  }

  function toggleFood(type: string) {
    setSelectedFood((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // Default start time = now rounded to next 15 min
  const defaultStart = (() => {
    const d = new Date()
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
    return d.toISOString().slice(0, 16)
  })()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Post Food Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a Free Food Event</DialogTitle>
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
            <Label htmlFor="title">Event title *</Label>
            <Input id="title" name="title" placeholder="Free pizza after seminar!" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Extra details, dietary info, etc."
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

          {/* Location picker with mini map */}
          <div className="space-y-1.5">
            <Label>Location *</Label>
            <LocationPicker
              token={MAPBOX_TOKEN}
              onLocationChange={setLocation}
            />
            {location && (
              <p className="text-xs text-green-600 font-medium">
                Pin set at {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            )}
          </div>

          {/* Collapsible manual coordinate entry */}
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
                <Label htmlFor="location_name">Location name</Label>
                <Input
                  id="location_name"
                  name="location_name"
                  placeholder="Siebel Center, Room 1404"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    name="lat"
                    type="number"
                    step="any"
                    placeholder="40.1020"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    name="lng"
                    type="number"
                    step="any"
                    placeholder="-88.2272"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_time">Start time *</Label>
              <Input
                id="start_time"
                name="start_time"
                type="datetime-local"
                defaultValue={defaultStart}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">End time</Label>
              <Input id="end_time" name="end_time" type="datetime-local" />
            </div>
          </div>

          <RecurrencePicker
            enabled={recurring}
            onEnabledChange={setRecurring}
            frequency={frequency}
            onFrequencyChange={setFrequency}
            daysOfWeek={daysOfWeek}
            onDaysOfWeekChange={setDaysOfWeek}
            daysOfMonth={daysOfMonth}
            onDaysOfMonthChange={setDaysOfMonth}
          />

          <div className="space-y-1.5">
            <Label htmlFor="expected_people">Expected people</Label>
            <Input
              id="expected_people"
              name="expected_people"
              type="number"
              min={1}
              placeholder="50"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">Post anonymously</span>
          </label>

          <Button type="submit" className="w-full" disabled={loading || (!location && !showManualCoords)}>
            {loading ? 'Posting…' : 'Post Event'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
