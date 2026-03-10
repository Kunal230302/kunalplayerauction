/**
 * Image upload utility — uses ImgBB free API
 * Get your free API key at: https://api.imgbb.com  (no credit card, instant)
 * Add to .env.local: NEXT_PUBLIC_IMGBB_API_KEY=your_key_here
 *
 * Falls back to a placeholder if key is not set.
 */

const IMGBB_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || ''

/**
 * Upload a file to ImgBB and return the image URL.
 * Keeps the same signature so no other files need changes.
 */
export async function uploadToCloudinary(file: File, folder = 'playerauctionhub'): Promise<string> {
  // If no API key, return placeholder silently
  if (!IMGBB_KEY) {
    console.warn('ImgBB API key not set in .env.local (NEXT_PUBLIC_IMGBB_API_KEY). Skipping upload.')
    return ''
  }

  // Convert file to base64
  const base64 = await fileToBase64(file)

  const formData = new FormData()
  formData.append('key', IMGBB_KEY)
  formData.append('image', base64)
  formData.append('name', `${folder}_${Date.now()}`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `Upload failed (${res.status})`)
    }

    const data = await res.json()
    return data?.data?.url as string || ''
  } catch (e: any) {
    clearTimeout(timeout)
    if (e.name === 'AbortError') throw new Error('Upload timed out. Check your internet connection.')
    throw e
  }
}

/** Convert a File to a base64 string (without the data: prefix) */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the "data:image/...;base64," prefix
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
