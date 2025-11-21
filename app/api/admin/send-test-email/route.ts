import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get email from request body
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name required' }, { status: 400 })
    }

    // Send test email
    const result = await sendWelcomeEmail(email, name)

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully!' 
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to send email',
        details: result.error 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in send-test-email API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
