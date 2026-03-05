'use client'

import { useState, useEffect, useCallback } from 'react'
import { FoodEvent } from './types'

const REFRESH_INTERVAL = 2 * 60 * 1000 // 2 minutes

export function useEvents() {
  const [events, setEvents] = useState<FoodEvent[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/events')
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch {
      // silently retry on next interval
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [refresh])

  return { events, loading, refresh }
}
