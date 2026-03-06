import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { generateOccurrences } from '@/lib/recurrence'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const { data: existing } = await db
    .from('event_series')
    .select('*')
    .eq('id', id)
    .single()

  if (!existing || existing.posted_by !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  // Prevent updating protected fields
  delete body.id
  delete body.posted_by
  delete body.campus
  delete body.created_at
  delete body.generated_until
  delete body.anchor_date

  const { data: updated, error } = await db
    .from('event_series')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Delete future instances and regenerate
  const now = new Date()
  await db
    .from('events')
    .delete()
    .eq('series_id', id)
    .gte('start_time', now.toISOString())

  const generatedUntil = new Date(updated.generated_until)
  const occurrences = generateOccurrences(updated, now, generatedUntil)

  if (occurrences.length > 0) {
    const rows = occurrences.map((occ) => ({
      title: updated.title,
      description: updated.description,
      food_type: updated.food_type,
      location_name: updated.location_name,
      lat: updated.lat,
      lng: updated.lng,
      start_time: occ.start_time,
      end_time: occ.end_time,
      expected_people: updated.expected_people,
      is_anonymous: updated.is_anonymous,
      posted_by: updated.posted_by,
      campus: updated.campus,
      series_id: id,
    }))

    await db.from('events').insert(rows)
  }

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const { data: existing } = await db
    .from('event_series')
    .select('posted_by')
    .eq('id', id)
    .single()

  if (!existing || existing.posted_by !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Cascade delete removes all event instances
  const { error } = await db.from('event_series').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
