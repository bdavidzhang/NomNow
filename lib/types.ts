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
