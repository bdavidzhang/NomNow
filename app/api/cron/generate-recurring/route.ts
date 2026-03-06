import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateOccurrences } from '@/lib/recurrence'

const WINDOW_DAYS = 28

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const targetDate = new Date(Date.now() + WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const targetDateStr = targetDate.toISOString().slice(0, 10)

  // Find active series that need extending
  const { data: seriesList, error } = await db
    .from('event_series')
    .select('*')
    .eq('is_active', true)
    .lt('generated_until', targetDateStr)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let totalGenerated = 0

  for (const series of seriesList ?? []) {
    const fromDate = new Date(series.generated_until)
    fromDate.setDate(fromDate.getDate() + 1) // day after last generated
    const occurrences = generateOccurrences(series, fromDate, targetDate)

    if (occurrences.length > 0) {
      const rows = occurrences.map((occ) => ({
        title: series.title,
        description: series.description,
        food_type: series.food_type,
        location_name: series.location_name,
        lat: series.lat,
        lng: series.lng,
        start_time: occ.start_time,
        end_time: occ.end_time,
        expected_people: series.expected_people,
        is_anonymous: series.is_anonymous,
        posted_by: series.posted_by,
        campus: series.campus,
        series_id: series.id,
      }))

      await db.from('events').insert(rows)
      totalGenerated += occurrences.length
    }

    // Update generated_until
    await db
      .from('event_series')
      .update({ generated_until: targetDateStr })
      .eq('id', series.id)
  }

  return NextResponse.json({
    ok: true,
    seriesProcessed: seriesList?.length ?? 0,
    eventsGenerated: totalGenerated,
  })
}
