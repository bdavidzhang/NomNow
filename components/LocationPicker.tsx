'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, MapPin } from 'lucide-react'

interface LocationPickerProps {
  token: string
  onLocationChange: (location: { lat: number; lng: number; name: string }) => void
  /** Default center [lng, lat] — UIUC campus */
  center?: [number, number]
}

interface GeocodingResult {
  place_name: string
  center: [number, number] // [lng, lat]
}

export function LocationPicker({
  token,
  onLocationChange,
  center = [-88.2272, 40.1020],
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [pinPlaced, setPinPlaced] = useState(false)

  // Initialize mini map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapboxgl.accessToken = token
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 15,
      interactive: true,
    })

    // Click to place/move pin
    mapRef.current.on('click', (e) => {
      placePin(e.lngLat.lng, e.lngLat.lat)
      reverseGeocode(e.lngLat.lng, e.lngLat.lat)
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const placePin = useCallback((lng: number, lat: number) => {
    const map = mapRef.current
    if (!map) return

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
    } else {
      markerRef.current = new mapboxgl.Marker({ color: '#16A34A', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map)

      markerRef.current.on('dragend', () => {
        const lngLat = markerRef.current!.getLngLat()
        reverseGeocode(lngLat.lng, lngLat.lat)
      })
    }

    setPinPlaced(true)
    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 17) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function reverseGeocode(lng: number, lat: number) {
    try {
      const res = await fetch(
        `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&access_token=${token}`
      )
      const data = await res.json()
      const name = data.features?.[0]?.properties?.full_address ?? data.features?.[0]?.properties?.name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setQuery(name)
      onLocationChange({ lat, lng, name })
    } catch {
      const name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setQuery(name)
      onLocationChange({ lat, lng, name })
    }
  }

  async function searchLocation(searchQuery: string) {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const proximity = center.join(',')
      const res = await fetch(
        `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(searchQuery)}&proximity=${proximity}&limit=5&access_token=${token}`
      )
      const data = await res.json()
      const mapped: GeocodingResult[] = (data.features ?? []).map((f: Record<string, unknown>) => ({
        place_name: (f.properties as Record<string, string>)?.full_address ?? (f.properties as Record<string, string>)?.name ?? '',
        center: (f.geometry as Record<string, unknown>)?.coordinates as [number, number],
      }))
      setResults(mapped)
      setShowResults(true)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  function selectResult(result: GeocodingResult) {
    const [lng, lat] = result.center
    setQuery(result.place_name)
    setShowResults(false)
    placePin(lng, lat)
    onLocationChange({ lat, lng, name: result.place_name })
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowResults(false)
            }}
            placeholder="Search for a building, e.g. Siebel Center"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                searchLocation(query)
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => searchLocation(query)}
            disabled={searching}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Search results dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-secondary/50 first:rounded-t-lg last:rounded-b-lg"
                onClick={() => selectResult(r)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{r.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mini map */}
      <div
        ref={containerRef}
        className="h-48 w-full rounded-lg border overflow-hidden"
      />

      <p className="text-xs text-muted-foreground">
        {pinPlaced
          ? 'Drag the pin to adjust. Or search again.'
          : 'Search for a location or click the map to drop a pin.'}
      </p>
    </div>
  )
}
