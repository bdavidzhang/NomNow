import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { CreateEventInput } from '@/lib/types'
import { rateLimit } from '@/lib/rate-limit'

const MAX_TITLE_LENGTH = 150
const MAX_DESCRIPTION_LENGTH = 1000
const MAX_LOCATION_LENGTH = 200

export async function GET(req: NextRequest) {
  const session = await auth()
  const db = createServiceClient()
  const { searchParams } = req.nextUrl

  let query = db
    .from('events')
    .select(`*, poster:users(name, avatar_url)`)
    .order('start_time', { ascending: true })

  // Scope to user's campus (if logged in and has one)
  if (session?.user?.campus) {
    query = query.eq('campus', session.user.campus)
  }

  // Optional time filters
  const after = searchParams.get('after')
  const before = searchParams.get('before')
  if (after) query = query.gte('start_time', after)
  if (before) query = query.lte('start_time', before)

  // Default: show events from 3 hours ago onward (hide events older than 24h regardless)
  if (!after) {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    query = query.gte('start_time', threeHoursAgo)
  }
  // Hard cutoff: never show events with start_time older than 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  query = query.gte('start_time', twentyFourHoursAgo)

  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 5 posts per hour per user
  if (!rateLimit(`post:${session.user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many posts. Please wait before posting again.' }, { status: 429 })
  }

  const body: CreateEventInput = await req.json()

  if (!body.title || !body.location_name || !body.lat || !body.lng || !body.start_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Input validation
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

  const db = createServiceClient()
  const { data, error } = await db
    .from('events')
    .insert({
      title,
      description,
      food_type: body.food_type ?? [],
      location_name: locationName,
      lat: body.lat,
      lng: body.lng,
      start_time: body.start_time,
      end_time: body.end_time ?? null,
      expected_people: body.expected_people ?? null,
      is_anonymous: body.is_anonymous ?? false,
      posted_by: session.user.id,
      campus: session.user.campus ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
