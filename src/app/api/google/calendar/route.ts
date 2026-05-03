import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { user_id, lead_id, lead_nome, lead_email, data_reuniao, hora_reuniao } = await req.json()

  if (!user_id || !lead_id || !data_reuniao) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: userData } = await supabase
    .from('users')
    .select('google_refresh_token')
    .eq('id', user_id)
    .maybeSingle()

  const refreshToken = (userData as Record<string, unknown> | null)?.google_refresh_token as string | undefined

  if (!refreshToken) {
    return NextResponse.json({ error: 'Google not connected' }, { status: 403 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`
  )
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const hora = hora_reuniao ?? '09:00'
  const startDateTime = new Date(`${data_reuniao}T${hora}:00`)
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)

  const toISO = (d: Date) => d.toISOString()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: `Reunião com ${lead_nome}`,
      description: `Lead no CRM: ${appUrl}/leads/${lead_id}`,
      start: { dateTime: toISO(startDateTime), timeZone: 'America/Sao_Paulo' },
      end:   { dateTime: toISO(endDateTime),   timeZone: 'America/Sao_Paulo' },
      conferenceData: {
        createRequest: { requestId: lead_id, conferenceSolutionKey: { type: 'hangoutsMeet' } },
      },
      ...(lead_email ? { attendees: [{ email: lead_email }] } : {}),
    },
  })

  const meetLink = event.data.hangoutLink ?? undefined
  const eventId  = event.data.id ?? undefined
  const eventUrl = event.data.htmlLink ?? undefined

  return NextResponse.json({ eventId, meetLink, eventUrl })
}
