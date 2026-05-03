import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')

  if (!code || !stateRaw) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
  }

  let user_id: string
  let redirect_to: string
  try {
    const parsed = JSON.parse(stateRaw)
    user_id = parsed.user_id
    redirect_to = parsed.redirect_to ?? '/perfil'
  } catch {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`
  )

  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)

  // Busca o email da conta Google
  let googleEmail: string | undefined
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data } = await oauth2.userinfo.get()
    googleEmail = data.email ?? undefined
  } catch {
    // email opcional — não bloqueia o fluxo
  }

  // Salva refresh_token no Supabase via service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  await supabase
    .from('users')
    .update({
      google_refresh_token: tokens.refresh_token,
      google_email: googleEmail ?? null,
    })
    .eq('id', user_id)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return NextResponse.redirect(`${appUrl}${redirect_to}?google_connected=1`)
}
