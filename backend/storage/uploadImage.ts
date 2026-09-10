/**
 * Upload an image (avatar or post image) to Retool Storage and return its public URL.
 * Files are marked public so they can be rendered directly in <img> tags across the app.
 */

interface Params {
  fileName: string
  base64Data: string
  mimeType: string
}

const MAX_BYTES = 8 * 1024 * 1024 // 8MB

export default async function uploadImage(req: { params: Params; user: User }) {
  const { fileName, base64Data, mimeType } = req.params
  if (!base64Data) throw new Error('No file data provided.')
  if (!mimeType.startsWith('image/')) throw new Error('Only image uploads are allowed.')

  const approxBytes = Math.ceil((base64Data.length * 3) / 4)
  if (approxBytes > MAX_BYTES) throw new Error('Image too large (max 8MB).')

  const userId = String(req.user.id)
  const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const uniqueName = `${userId}-${Date.now()}-${safeName}`

  const uploaded = await retoolStorage.upload({
    fileName: uniqueName,
    data: base64Data,
    mimeType,
    isPublic: true,
  })
  return { url: uploaded.data.url, id: uploaded.data.id }
}
