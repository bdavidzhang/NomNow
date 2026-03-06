import { EventSeries } from '@/lib/types'

interface Occurrence {
  start_time: string // ISO string
  end_time: string | null
}

/**
 * Generate event occurrences for a series within a date range.
 * Returns array of { start_time, end_time } in ISO format.
 */
export function generateOccurrences(
  series: Pick<EventSeries, 'start_time_of_day' | 'duration_minutes' | 'frequency' | 'days_of_week' | 'days_of_month' | 'anchor_date'>,
  fromDate: Date,
  toDate: Date,
): Occurrence[] {
  const occurrences: Occurrence[] = []
  const [hours, minutes] = series.start_time_of_day.split(':').map(Number)

  // Iterate day by day from fromDate to toDate
  const current = new Date(fromDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(toDate)
  end.setHours(23, 59, 59, 999)

  while (current <= end) {
    if (matchesPattern(current, series)) {
      const start = new Date(current)
      start.setHours(hours, minutes, 0, 0)

      const endTime = series.duration_minutes
        ? new Date(start.getTime() + series.duration_minutes * 60 * 1000)
        : null

      occurrences.push({
        start_time: start.toISOString(),
        end_time: endTime?.toISOString() ?? null,
      })
    }
    current.setDate(current.getDate() + 1)
  }

  return occurrences
}

function matchesPattern(
  date: Date,
  series: Pick<EventSeries, 'frequency' | 'days_of_week' | 'days_of_month' | 'anchor_date'>,
): boolean {
  const dayOfWeek = date.getDay() // 0=Sun..6=Sat

  switch (series.frequency) {
    case 'weekly':
      return series.days_of_week.includes(dayOfWeek)

    case 'biweekly': {
      if (!series.days_of_week.includes(dayOfWeek)) return false
      // Check week parity relative to anchor date
      const anchor = new Date(series.anchor_date)
      anchor.setHours(0, 0, 0, 0)
      const diffMs = date.getTime() - anchor.getTime()
      const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
      return diffWeeks % 2 === 0
    }

    case 'monthly': {
      const dayOfMonth = date.getDate()
      return series.days_of_month.includes(dayOfMonth)
    }

    default:
      return false
  }
}
