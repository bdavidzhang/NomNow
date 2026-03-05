'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Plus } from 'lucide-react'

const FOOD_OPTIONS = [
  'Pizza', 'Sandwiches', 'Tacos', 'Sushi', 'Burritos',
  'Salad', 'Desserts', 'Drinks', 'Snacks', 'BBQ', 'Other',
]

export function PostEventForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState<string[]>([])
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)

    const payload = {
      title: data.get('title') as string,
      description: data.get('description') as string,
      food_type: selectedFood,
      location_name: data.get('location_name') as string,
      lat: parseFloat(data.get('lat') as string),
      lng: parseFloat(data.get('lng') as string),
      start_time: new Date(data.get('start_time') as string).toISOString(),
      end_time: data.get('end_time')
        ? new Date(data.get('end_time') as string).toISOString()
        : undefined,
      expected_people: data.get('expected_people')
        ? parseInt(data.get('expected_people') as string)
        : undefined,
    }

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (res.ok) {
      setOpen(false)
      setSelectedFood([])
      form.reset()
      router.refresh()
    } else {
      const err = await res.json()
      alert(err.error ?? 'Failed to post event')
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
            <Label htmlFor="location_name">Location *</Label>
            <Input
              id="location_name"
              name="location_name"
              placeholder="Doe Library, Room 180"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lat">Latitude *</Label>
              <Input
                id="lat"
                name="lat"
                type="number"
                step="any"
                placeholder="37.8724"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lng">Longitude *</Label>
              <Input
                id="lng"
                name="lng"
                type="number"
                step="any"
                placeholder="-122.2595"
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: right-click a location in Google Maps to copy coordinates.
          </p>

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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Posting…' : 'Post Event'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
