import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { useProfile } from '../hooks/useProfileContext'
import { useUpdateProfile } from '../hooks/backend/profiles'
import { useUploadImage } from '../hooks/backend/storage'
import { UserAvatar } from '../components/UserAvatar'
import { Textarea } from '../lib/shadcn/textarea'
import { Button } from '../lib/shadcn/button'
import { Skeleton } from '../lib/shadcn/skeleton'
import { toast } from '../lib/shadcn/sonner'
import { fileToBase64 } from '../utils/fileToBase64'

export default function Profile() {
  const { profile, refresh } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadImage = useUploadImage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bio, setBio] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (profile) setBio(profile.bio)
  }, [profile])

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64Data = await fileToBase64(file)
      const uploaded = await uploadImage.trigger({ fileName: file.name, base64Data, mimeType: file.type }).result
      await updateProfile.trigger({ avatarUrl: uploaded.url }).result
      refresh()
      toast.success('Profile photo updated.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update photo.')
    }
  }

  async function handleSaveBio(e: FormEvent) {
    e.preventDefault()
    try {
      await updateProfile.trigger({ bio }).result
      refresh()
      setDirty(false)
      toast.success('Bio updated.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update bio.')
    }
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto space-y-density-xl">
        <div className="flex flex-col items-center gap-density-sm">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-density-xl">
      <div className="flex flex-col items-center gap-density-sm pt-density-md">
        <div className="relative">
          <UserAvatar name={profile.full_name} avatarUrl={profile.avatar_url} size="xl" ring />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile photo"
            className="absolute bottom-0 right-0 rounded-full bg-primary text-primary-foreground p-1.5 shadow-retool-md hover:bg-primary/90 transition-colors"
          >
            {uploadImage.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{profile.full_name}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      <form onSubmit={handleSaveBio} className="rounded-2xl border border-border/70 bg-card p-density-lg space-y-density-sm shadow-retool-sm">
        <label htmlFor="bio" className="text-sm font-medium text-foreground">
          Bio
        </label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => {
            setBio(e.target.value)
            setDirty(true)
          }}
          placeholder="Tell your friends a bit about yourself..."
          className="min-h-[100px] resize-none border-transparent bg-muted/40 focus-visible:bg-background"
        />
        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-density-lg" disabled={!dirty || updateProfile.loading}>
            {updateProfile.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}
