import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid userIds' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user emails using admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('[v0] Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Create map of userId -> email
    const emailMap: Record<string, string> = {}
    users?.forEach(user => {
      if (userIds.includes(user.id)) {
        emailMap[user.id] = user.email || ''
      }
    })

    return NextResponse.json(emailMap)
  } catch (error) {
    console.error('[v0] Error in get-user-emails:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
