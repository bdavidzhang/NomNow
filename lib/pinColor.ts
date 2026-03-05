/**
 * Returns a hex color for a map pin based on how far in the past/future
 * the event's start_time is relative to now.
 *
 * Color scale:
 *   past ≥ 3h  →  #DC2626  (red)
 *   past 0h    →  #16A34A  (green)   ← happening now
 *   future 20m →  #0D9488  (teal)
 *   future 1h  →  #0284C7  (sky blue)
 *   future ≥ 3h→  #1D4ED8  (deep blue)
 */

interface ColorStop {
  minutes: number  // negative = past
  r: number
  g: number
  b: number
}

const STOPS: ColorStop[] = [
  { minutes: -180, r: 220, g:  38, b:  38 },  // deep red
  { minutes:  -60, r: 234, g:  88, b:  12 },  // orange
  { minutes:   -5, r:  22, g: 163, b:  74 },  // green (effectively "now")
  { minutes:    5, r:  22, g: 163, b:  74 },  // green (grace window)
  { minutes:   20, r:  13, g: 148, b: 136 },  // teal
  { minutes:   60, r:   2, g: 132, b: 199 },  // sky blue
  { minutes:  180, r:  29, g:  78, b: 216 },  // deep blue
]

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t)
}

function toHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function getPinColor(startTime: string): string {
  const now = Date.now()
  const start = new Date(startTime).getTime()
  const deltaMs = start - now
  const deltaMinutes = deltaMs / 60_000

  // Clamp to the outer stops
  if (deltaMinutes <= STOPS[0].minutes) {
    const s = STOPS[0]
    return toHex(s.r, s.g, s.b)
  }
  if (deltaMinutes >= STOPS[STOPS.length - 1].minutes) {
    const s = STOPS[STOPS.length - 1]
    return toHex(s.r, s.g, s.b)
  }

  // Find the two stops that bracket deltaMinutes
  for (let i = 0; i < STOPS.length - 1; i++) {
    const lo = STOPS[i]
    const hi = STOPS[i + 1]
    if (deltaMinutes >= lo.minutes && deltaMinutes <= hi.minutes) {
      const t = (deltaMinutes - lo.minutes) / (hi.minutes - lo.minutes)
      return toHex(lerp(lo.r, hi.r, t), lerp(lo.g, hi.g, t), lerp(lo.b, hi.b, t))
    }
  }

  return '#16A34A'
}

/** Returns a Tailwind-friendly label for the event's status */
export function getEventStatus(startTime: string, endTime?: string | null): 'past' | 'active' | 'soon' | 'upcoming' {
  const now = Date.now()
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : start + 60 * 60 * 1000

  if (now > end) return 'past'
  if (now >= start) return 'active'
  const minsUntil = (start - now) / 60_000
  if (minsUntil <= 30) return 'soon'
  return 'upcoming'
}
