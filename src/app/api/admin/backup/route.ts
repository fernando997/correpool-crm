import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-admin-key')
  if (!key || key !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.from('leads').select('*')
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const json = JSON.stringify(data, null, 2)
  const date = new Date().toISOString().split('T')[0]

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="backup-leads-${date}.json"`,
    },
  })
}
