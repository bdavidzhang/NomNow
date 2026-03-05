'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { FoodEvent } from '@/lib/types'
import { getPinColor, getEventStatus } from '@/lib/pinColor'
import { format } from 'date-fns'

interface EventMapProps {
  events: FoodEvent[]
  token: string
  /** Center of campus [lng, lat] */
  center?: [number, number]
  zoom?: number
}

export function EventMap({ events, token, center = [-88.2272, 40.1020], zoom = 15 }: EventMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [selectedEvent, setSelectedEvent] = useState<FoodEvent | null>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom,
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    })
    map.addControl(geolocate, 'top-right')

    // Trigger geolocation after the map is idle and control is ready
    map.once('idle', () => {
      // Small delay to ensure the geolocate control is fully mounted
      setTimeout(() => {
        geolocate.trigger()
      }, 500)
    })

    // Center map on user when position is found
    geolocate.on('geolocate', (e: GeolocationPosition) => {
      map.flyTo({
        center: [e.coords.longitude, e.coords.latitude],
        zoom: 16,
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Sync markers whenever events change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    events.forEach((event) => {
      const color = getPinColor(event.start_time)

      // Wrapper div — Mapbox positions this. Don't put transforms on it.
      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'cursor: pointer;'

      // Inner pin shape — all visual transforms happen here
      const pin = document.createElement('div')
      pin.style.cssText = `
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${color};
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transition: transform 0.15s;
      `
      wrapper.appendChild(pin)
      wrapper.title = event.title

      wrapper.addEventListener('mouseenter', () => {
        pin.style.transform = 'rotate(-45deg) scale(1.2)'
      })
      wrapper.addEventListener('mouseleave', () => {
        pin.style.transform = 'rotate(-45deg)'
      })

      const marker = new mapboxgl.Marker({ element: wrapper, anchor: 'bottom' })
        .setLngLat([event.lng, event.lat])
        .addTo(map)

      wrapper.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedEvent(event)
        map.flyTo({ center: [event.lng, event.lat], zoom: Math.max(map.getZoom(), 16) })
      })

      markersRef.current.push(marker)
    })
  }, [events])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Map legend */}
      <div className="absolute bottom-8 left-3 rounded-xl bg-white/90 px-3 py-2 shadow text-xs space-y-1 backdrop-blur">
        <p className="font-semibold text-xs mb-1">Pin color</p>
        {[
          { color: '#DC2626', label: 'Ended (3h+ ago)' },
          { color: '#16A34A', label: 'Happening now' },
          { color: '#0D9488', label: 'Starting soon' },
          { color: '#1D4ED8', label: 'Later today' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ background: color }} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Event popup */}
      {selectedEvent && (
        <EventPopup event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  )
}

function EventPopup({ event, onClose }: { event: FoodEvent; onClose: () => void }) {
  const status = getEventStatus(event.start_time, event.end_time)
  const statusLabel = { active: 'Happening now', soon: 'Starting soon', upcoming: 'Upcoming', past: 'Ended' }[status]

  return (
    <div className="absolute bottom-8 right-3 w-72 rounded-xl bg-white shadow-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-snug">{event.title}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 text-lg leading-none">&times;</button>
      </div>
      <p className="text-xs font-medium" style={{ color: getPinColor(event.start_time) }}>
        {statusLabel}
      </p>
      {event.description && (
        <p className="text-xs text-muted-foreground">{event.description}</p>
      )}
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>📍 {event.location_name}</p>
        <p>🕐 {format(new Date(event.start_time), 'EEE, MMM d · h:mm a')}</p>
        {event.expected_people && <p>👥 ~{event.expected_people} expected</p>}
        {event.food_type.length > 0 && <p>🍽️ {event.food_type.join(', ')}</p>}
      </div>
    </div>
  )
}
