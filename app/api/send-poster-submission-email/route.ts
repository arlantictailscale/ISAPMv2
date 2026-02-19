import { NextResponse } from 'next/server'
import { sendPosterSubmissionConfirmation } from '@/lib/email'

export async function POST(request: Request) {
  try {
    console.log('[v0] Poster submission email API called')
    const body = await request.json()
    console.log('[v0] Request body:', body)

    const { email, userName, posterTitle, topic } = body

    if (!email || !userName || !posterTitle || !topic) {
      console.log('[v0] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[v0] Calling sendPosterSubmissionConfirmation...')
    const result = await sendPosterSubmissionConfirmation({
      email,
      userName,
      posterTitle,
      topic,
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
    console.error('[v0] Error in poster submission email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
