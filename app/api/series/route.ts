import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { CreateSeriesInput } from '@/lib/types'
import { rateLimit } from '@/lib/rate-limit'
import { generateOccurrences } from '@/lib/recurrence'

const MAX_TITLE_LENGTH = 150
const MAX_DESCRIPTION_LENGTH = 1000
const MAX_LOCATION_LENGTH = 200
const WINDOW_DAYS = 28

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: separate bucket for series (doesn't eat into single-event quota)
  if (!rateLimit(`series:${session.user.id}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many series created. Please wait before creating another.' }, { status: 429 })
  }

  const body: CreateSeriesInput = await req.json()

  // Validate required fields
  if (!body.title || !body.location_name || !body.lat || !body.lng || !body.start_time || !body.frequency) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const title = body.title.trim()
  const description = body.description?.trim() ?? null
  const locationName = body.location_name.trim()

  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: `Title must be 1-${MAX_TITLE_LENGTH} characters` }, { status: 400 })
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: `Description must be under ${MAX_DESCRIPTION_LENGTH} characters` }, { status: 400 })
  }
  if (locationName.length === 0 || locationName.length > MAX_LOCATION_LENGTH) {
    return NextResponse.json({ error: `Location must be 1-${MAX_LOCATION_LENGTH} characters` }, { status: 400 })
  }

  if (!['weekly', 'biweekly', 'monthly'].includes(body.frequency)) {
    return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 })
  }

  const daysOfWeek = body.days_of_week ?? []
  const daysOfMonth = body.days_of_month ?? []

  if ((body.frequency === 'weekly' || body.frequency === 'biweekly') && daysOfWeek.length === 0) {
    return NextResponse.json({ error: 'Select at least one day of the week' }, { status: 400 })
  }
  if (body.frequency === 'monthly' && daysOfMonth.length === 0) {
    return NextResponse.json({ error: 'Select at least one day of the month' }, { status: 400 })
  }

  // Extract time-of-day and duration from start/end times
  const startDate = new Date(body.start_time)
  const startTimeOfDay = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`

  let durationMinutes: number | null = null
  if (body.end_time) {
    const endDate = new Date(body.end_time)
    durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000)
    if (durationMinutes <= 0) durationMinutes = null
  }

  const anchorDate = startDate.toISOString().slice(0, 10)
  const now = new Date()
  const generatedUntil = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const generatedUntilStr = generatedUntil.toISOString().slice(0, 10)

  const db = createServiceClient()

  // Insert series
  const { data: series, error: seriesError } = await db
    .from('event_series')
    .insert({
      title,
      description,
      food_type: body.food_type ?? [],
      location_name: locationName,
      lat: body.lat,
      lng: body.lng,
      start_time_of_day: startTimeOfDay,
      duration_minutes: durationMinutes,
      frequency: body.frequency,
      days_of_week: daysOfWeek,
      days_of_month: daysOfMonth,
      anchor_date: anchorDate,
      generated_until: generatedUntilStr,
      expected_people: body.expected_people ?? null,
      is_anonymous: body.is_anonymous ?? false,
      posted_by: session.user.id,
      campus: session.user.campus ?? null,
    })
    .select()
    .single()

  if (seriesError) {
    return NextResponse.json({ error: seriesError.message }, { status: 500 })
  }

  // Generate initial instances
  const fromDate = now < startDate ? startDate : now
  const occurrences = generateOccurrences(series, fromDate, generatedUntil)

  if (occurrences.length > 0) {
    const rows = occurrences.map((occ) => ({
      title,
      description,
      food_type: body.food_type ?? [],
      location_name: locationName,
      lat: body.lat,
      lng: body.lng,
      start_time: occ.start_time,
      end_time: occ.end_time,
      expected_people: body.expected_people ?? null,
      is_anonymous: body.is_anonymous ?? false,
      posted_by: session.user.id,
      campus: session.user.campus ?? null,
      series_id: series.id,
    }))

    const { error: insertError } = await db.from('events').insert(rows)
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ series, instanceCount: occurrences.length }, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('event_series')
    .select('*')
    .eq('posted_by', session.user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
