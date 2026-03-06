import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  const { data, error } = await db
    .from('events')
    .select(`*, poster:users(name, avatar_url)`)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const { data: existing } = await db
    .from('events')
    .select('posted_by, series_id')
    .eq('id', id)
    .single()

  if (!existing || existing.posted_by !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (existing.series_id) {
    return NextResponse.json(
      { error: 'This event is part of a recurring series. Edit or delete the series instead via /api/series.' },
      { status: 400 },
    )
  }

  const body = await req.json()

  // Sanitize updatable text fields
  if (body.title !== undefined) {
    body.title = body.title.trim()
    if (body.title.length === 0 || body.title.length > 150) {
      return NextResponse.json({ error: 'Title must be 1-150 characters' }, { status: 400 })
    }
  }
  if (body.description !== undefined) {
    body.description = body.description.trim() || null
    if (body.description && body.description.length > 1000) {
      return NextResponse.json({ error: 'Description must be under 1000 characters' }, { status: 400 })
    }
  }
  if (body.location_name !== undefined) {
    body.location_name = body.location_name.trim()
    if (body.location_name.length === 0 || body.location_name.length > 200) {
      return NextResponse.json({ error: 'Location must be 1-200 characters' }, { status: 400 })
    }
  }

  // Prevent updating protected fields
  delete body.id
  delete body.posted_by
  delete body.campus
  delete body.created_at

  const { data, error } = await db
    .from('events')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const { data: existing } = await db
    .from('events')
    .select('posted_by, series_id')
    .eq('id', id)
    .single()

  if (!existing || existing.posted_by !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (existing.series_id) {
    return NextResponse.json(
      { error: 'This event is part of a recurring series. Delete the series instead via /api/series.' },
      { status: 400 },
    )
  }

  const { error } = await db.from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
