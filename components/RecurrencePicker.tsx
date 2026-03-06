'use client'

import { RecurrenceFrequency } from '@/lib/types'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface RecurrencePickerProps {
  enabled: boolean
  onEnabledChange: (v: boolean) => void
  frequency: RecurrenceFrequency
  onFrequencyChange: (f: RecurrenceFrequency) => void
  daysOfWeek: number[]
  onDaysOfWeekChange: (d: number[]) => void
  daysOfMonth: number[]
  onDaysOfMonthChange: (d: number[]) => void
}

export function RecurrencePicker({
  enabled,
  onEnabledChange,
  frequency,
  onFrequencyChange,
  daysOfWeek,
  onDaysOfWeekChange,
  daysOfMonth,
  onDaysOfMonthChange,
}: RecurrencePickerProps) {
  function toggleDay(day: number) {
    onDaysOfWeekChange(
      daysOfWeek.includes(day) ? daysOfWeek.filter((d) => d !== day) : [...daysOfWeek, day],
    )
  }

  function toggleDate(date: number) {
    onDaysOfMonthChange(
      daysOfMonth.includes(date) ? daysOfMonth.filter((d) => d !== date) : [...daysOfMonth, date],
    )
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <span className="text-sm font-medium">Recurring event</span>
      </label>

      {enabled && (
        <div className="space-y-3 rounded-lg border p-3 bg-secondary/30">
          {/* Frequency pills */}
          <div className="flex gap-2">
            {(['weekly', 'biweekly', 'monthly'] as RecurrenceFrequency[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFrequencyChange(f)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  frequency === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {f === 'weekly' ? 'Weekly' : f === 'biweekly' ? 'Bi-weekly' : 'Monthly'}
              </button>
            ))}
          </div>

          {/* Day-of-week selector (weekly/biweekly) */}
          {(frequency === 'weekly' || frequency === 'biweekly') && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Select days</p>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                      daysOfWeek.includes(i)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day-of-month selector (monthly) */}
          {frequency === 'monthly' && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Select dates</p>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDate(d)}
                    className={`h-7 rounded text-xs font-medium transition-colors ${
                      daysOfMonth.includes(d)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Events auto-generated 4 weeks ahead
          </p>
        </div>
      )}
    </div>
  )
}
