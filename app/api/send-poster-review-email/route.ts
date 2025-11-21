import { NextResponse } from 'next/server'
import { sendPosterReviewNotification } from '@/lib/email'

export async function POST(request: Request) {
  try {
    console.log('[v0] Poster review email API called')
    const body = await request.json()
    console.log('[v0] Request body:', body)

    const { email, userName, posterTitle, status, rejectionComment, canResubmit } = body

    if (!email || !userName || !posterTitle || !status) {
      console.log('[v0] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (status !== 'accepted' && status !== 'rejected') {
      console.log('[v0] Invalid status:', status)
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    console.log('[v0] Calling sendPosterReviewNotification...')
    const result = await sendPosterReviewNotification({
      email,
      userName,
      posterTitle,
      status,
      rejectionComment,
      canResubmit,
    })

    console.log('[v0] Email result:', result)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in poster review email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
