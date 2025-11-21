'use server'

import { put } from '@vercel/blob'

export async function uploadPaymentProof(formData: FormData) {
  try {
    const file = formData.get('file') as File
    
    if (!file) {
      return { error: 'No file provided' }
    }

    // Validate file type
    if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
      return { error: 'Only .jpg files are allowed' }
    }

    // Validate file size (1MB)
    if (file.size > 1048576) {
      return { error: 'File size must not exceed 1MB' }
    }

    const registrationId = formData.get('registrationId') as string
    
    // Upload to Vercel Blob using server-side token
    const blob = await put(
      `payment-proofs/${registrationId}-${Date.now()}.jpg`,
      file,
      {
        access: 'public',
      }
    )

    return { url: blob.url }
  } catch (error) {
    console.error('[v0] Error uploading payment proof:', error)
    return { error: 'Failed to upload payment proof' }
  }
}
