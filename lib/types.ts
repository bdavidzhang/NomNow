export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  school: string | null
  created_at: string
}

export interface FoodEvent {
  id: string
  title: string
  description: string | null
  food_type: string[]
  location_name: string
  lat: number
  lng: number
  start_time: string
  end_time: string | null
  expected_people: number | null
  is_anonymous: boolean
  campus: string | null
  posted_by: string
  series_id: string | null
  created_at: string
  poster?: Pick<User, 'name' | 'avatar_url'>
}

export interface CreateEventInput {
  title: string
  description?: string
  food_type: string[]
  location_name: string
  lat: number
  lng: number
  start_time: string
  end_time?: string
  expected_people?: number
  is_anonymous?: boolean
}

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly'

export interface EventSeries {
  id: string
  title: string
  description: string | null
  food_type: string[]
  location_name: string
  lat: number
  lng: number
  start_time_of_day: string // "HH:MM"
  duration_minutes: number | null
  frequency: RecurrenceFrequency
  days_of_week: number[] // 0=Sun..6=Sat
  days_of_month: number[] // 1-31
  anchor_date: string
  generated_until: string
  is_active: boolean
  expected_people: number | null
  is_anonymous: boolean
  posted_by: string
  campus: string | null
  created_at: string
}

export interface CreateSeriesInput {
  title: string
  description?: string
  food_type: string[]
  location_name: string
  lat: number
  lng: number
  start_time: string // used to extract time-of-day
  end_time?: string // used to compute duration
  frequency: RecurrenceFrequency
  days_of_week?: number[]
  days_of_month?: number[]
  expected_people?: number
  is_anonymous?: boolean
}
