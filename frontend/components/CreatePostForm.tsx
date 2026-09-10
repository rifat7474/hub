import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Image as ImageIcon, X, Loader2, Send } from 'lucide-react'
import { Textarea } from '../lib/shadcn/textarea'
import { Button } from '../lib/shadcn/button'
import { UserAvatar } from './UserAvatar'
import { useProfile } from '../hooks/useProfileContext'
import { useCreatePost } from '../hooks/backend/posts'
import { useUploadImage } from '../hooks/backend/storage'
import { fileToBase64 } from '../utils/fileToBase64'
import { toast } from '../lib/shadcn/sonner'

export function CreatePostForm({ onPosted }: { onPosted: () => void }) {
  const { profile } = useProfile()
  const [content, setContent] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createPost = useCreatePost()
  const uploadImage = useUploadImage()
  const submitting = createPost.loading || uploadImage.loading

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim() && !imageFile) return
    try {
      let imageUrl: string | undefined
      if (imageFile) {
        const base64Data = await fileToBase64(imageFile)
        const uploaded = await uploadImage.trigger({
          fileName: imageFile.name,
          base64Data,
          mimeType: imageFile.type,
        }).result
        imageUrl = uploaded.url
      }
      await createPost.trigger({ content: content.trim(), ...(imageUrl ? { imageUrl } : {}) }).result
      setContent('')
      clearImage()
      onPosted()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create post.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border/70 bg-card text-card-foreground shadow-retool-sm p-density-lg space-y-density-sm"
    >
      <div className="flex gap-density-sm">
        {profile && <UserAvatar name={profile.full_name} avatarUrl={profile.avatar_url} className="mt-1 shrink-0" />}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something with your friends..."
          className="min-h-[64px] resize-none border-transparent bg-muted/40 focus-visible:bg-background focus-visible:ring-1"
        />
      </div>

      {imagePreview && (
        <div className="relative inline-block ml-[52px]">
          <img src={imagePreview} alt="Selected upload" className="max-h-48 rounded-xl border border-border/60" />
          <button
            type="button"
            onClick={clearImage}
            aria-label="Remove image"
            className="absolute -top-2 -right-2 rounded-full bg-background border border-border p-1 text-muted-foreground hover:text-foreground shadow-retool-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between ml-[52px]">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Add image"
          className="text-muted-foreground hover:text-foreground rounded-full"
        >
          <ImageIcon className="w-5 h-5" />
        </Button>
        <Button type="submit" className="rounded-full px-density-lg" disabled={submitting || (!content.trim() && !imageFile)}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Post
        </Button>
      </div>
    </form>
  )
}
