/**
 * Cloudinary free upload utility
 * Free tier: 25 GB storage, 25 GB bandwidth/month - no credit card needed!
 *
 * Setup (one-time):
 * 1. Go to https://cloudinary.com and sign up free
 * 2. Dashboard → Settings → Upload → Add upload preset (mode: Unsigned)
 * 3. Copy your Cloud Name and Upload Preset name
 * 4. Add to .env.local:
 *    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''

/**
 * Upload a file to Cloudinary and return the secure URL.
 * Uses unsigned upload preset — no backend needed, 100% free.
 */
export async function uploadToCloudinary(file: File, folder = 'playerauctionhub'): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary not configured. Add env variables to .env.local.')
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  // 30 second timeout to prevent hanging
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = err.error?.message || 'Upload failed'
      // Common error: preset is Signed not Unsigned
      if (msg.includes('unsigned')) {
        throw new Error('Cloudinary upload preset must be set to "Unsigned". Go to Cloudinary → Settings → Upload → ml_default → change to Unsigned → Save.')
      }
      throw new Error(msg)
    }

    const data = await res.json()
    return data.secure_url as string
  } catch (e: any) {
    clearTimeout(timeout)
    if (e.name === 'AbortError') throw new Error('Upload timed out. Check your internet connection.')
    throw e
  }
}
