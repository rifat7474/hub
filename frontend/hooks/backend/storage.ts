import { createFirestoreHook } from './client'
import { uploadImageToStorage } from '../../lib/firebase'

export const useUploadImage = createFirestoreHook<
  { fileName: string; base64Data: string; mimeType: string },
  { url: string; id: string }
>(async ({ fileName, base64Data, mimeType }) => {
  return await uploadImageToStorage(fileName, base64Data, mimeType)
})
