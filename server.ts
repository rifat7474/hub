import express from 'express'
import path from 'path'
import { createServer as createViteServer } from 'vite'

const app = express()
const PORT = 3000

app.use(express.json({ limit: '15mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'firebase-firestore' })
})

app.get('/api/database/status', (_req, res) => {
  res.json({
    provider: 'firebase',
    database: 'firestore',
    databaseId: 'ai-studio-hub-7d97c2c0-9d76-4772-bc8e-531bf9ec477a',
    auth: 'active',
    storage: 'active',
    status: 'connected',
  })
})

// In-memory data store
interface Profile {
  id: number
  user_id: string
  email: string
  full_name: string
  avatar_url: string | null
  bio: string
  is_admin?: boolean
}

interface Post {
  id: number
  author_id: number
  content: string
  image_url: string | null
  created_at: string
}

interface Comment {
  id: number
  post_id: number
  profile_id: number
  content: string
  created_at: string
}

interface Like {
  post_id: number
  profile_id: number
}

interface Friendship {
  id: number
  requester_id: number
  recipient_id: number
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

interface Message {
  id: number
  sender_id: number
  recipient_id: number
  content: string
  created_at: string
  read_at: string | null
}

interface Call {
  id: number
  caller_id: number
  callee_id: number
  call_type: 'audio' | 'video'
  status: 'outgoing' | 'active' | 'ended' | 'declined'
  offer?: string
  answer?: string
  created_at: string
}

interface IceCandidate {
  id: number
  call_id: number
  sender_id: number
  candidate: any
  created_at: string
}

const profiles: Profile[] = [
  {
    id: 1,
    user_id: 'user_1',
    email: 'alex.rivera@example.com',
    full_name: 'Alex Rivera',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Product designer & engineer. Building next-gen social platforms.',
    is_admin: true,
  },
  {
    id: 2,
    user_id: 'user_2',
    email: 'sarah.chen@example.com',
    full_name: 'Sarah Chen',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    bio: 'Outdoor explorer, landscape photographer, and iOS developer.',
    is_admin: false,
  },
  {
    id: 3,
    user_id: 'user_3',
    email: 'marcus.t@example.com',
    full_name: 'Marcus Taylor',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Full-stack builder. Working on WebRTC & distributed systems.',
    is_admin: false,
  },
  {
    id: 4,
    user_id: 'user_4',
    email: 'priya.patel@example.com',
    full_name: 'Priya Patel',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    bio: 'AI researcher & community organizer.',
    is_admin: false,
  },
  {
    id: 5,
    user_id: 'user_5',
    email: 'jordan.lee@example.com',
    full_name: 'Jordan Lee',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Musician, creative coder, and generative art fan.',
    is_admin: false,
  },
]

const friendships: Friendship[] = [
  { id: 1, requester_id: 1, recipient_id: 2, status: 'accepted', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 2, requester_id: 1, recipient_id: 3, status: 'accepted', created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 3, requester_id: 4, recipient_id: 1, status: 'accepted', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 4, requester_id: 5, recipient_id: 1, status: 'pending', created_at: new Date(Date.now() - 3600000 * 4).toISOString() },
]

const posts: Post[] = [
  {
    id: 1,
    author_id: 2,
    content: 'Spent the weekend backpacking through Point Reyes! Nothing beats the morning fog clearing over the Pacific coastline. 🌲🌊',
    image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 2,
    author_id: 3,
    content: 'Just tested out peer-to-peer WebRTC video streaming over low-latency connections. The audio clarity is incredible! Check it out in the Messages tab.',
    image_url: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 3,
    author_id: 1,
    content: 'Welcome everyone to Hub! Designed for intentional conversations, rich photo sharing, and direct audio/video calls with friends. Let us know what you think!',
    image_url: null,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
]

const likes: Like[] = [
  { post_id: 1, profile_id: 1 },
  { post_id: 1, profile_id: 3 },
  { post_id: 1, profile_id: 4 },
  { post_id: 2, profile_id: 2 },
  { post_id: 2, profile_id: 4 },
  { post_id: 3, profile_id: 1 },
  { post_id: 3, profile_id: 2 },
  { post_id: 3, profile_id: 3 },
]

const comments: Comment[] = [
  {
    id: 1,
    post_id: 1,
    profile_id: 1,
    content: 'Stunning photography! Which trail did you take?',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    post_id: 1,
    profile_id: 3,
    content: 'The dynamic range in that shot is unreal!',
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 3,
    post_id: 2,
    profile_id: 4,
    content: 'Awesome progress! Are you using the Opus codec?',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 4,
    post_id: 3,
    profile_id: 2,
    content: 'Loving the clean typography and dark mode support.',
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
]

const messages: Message[] = [
  {
    id: 1,
    sender_id: 2,
    recipient_id: 1,
    content: 'Hey Alex! Are you joining the community demo later today?',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    read_at: new Date().toISOString(),
  },
  {
    id: 2,
    sender_id: 1,
    recipient_id: 2,
    content: 'Hey Sarah! Yes, just finishing up the latest release updates.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    read_at: new Date().toISOString(),
  },
  {
    id: 3,
    sender_id: 2,
    recipient_id: 1,
    content: 'Great, see you then! Feel free to jump on a quick call if you want to sync early.',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    read_at: null,
  },
  {
    id: 4,
    sender_id: 3,
    recipient_id: 1,
    content: 'Call features are looking great on both desktop and mobile views.',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    read_at: new Date().toISOString(),
  },
]

let calls: Call[] = []
let iceCandidates: IceCandidate[] = []

// Current logged in user (Alex Rivera)
const CURRENT_USER_ID = 1

function getCurrentProfile(): Profile {
  return profiles.find((p) => p.id === CURRENT_USER_ID) || profiles[0]
}

// ================= API ROUTES =================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// PROFILES
app.all('/api/profiles/ensureProfile', (_req, res) => {
  res.json(getCurrentProfile())
})

app.get('/api/profiles/searchProfiles', (req, res) => {
  const query = String(req.query.query || '').toLowerCase().trim()
  const myId = CURRENT_USER_ID

  const results = profiles
    .filter((p) => p.id !== myId && (p.full_name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query)))
    .map((p) => {
      let friendshipStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received' = 'none'
      const f = friendships.find(
        (f) =>
          (f.requester_id === myId && f.recipient_id === p.id) ||
          (f.requester_id === p.id && f.recipient_id === myId),
      )
      if (f) {
        if (f.status === 'accepted') friendshipStatus = 'friends'
        else if (f.requester_id === myId) friendshipStatus = 'pending_sent'
        else friendshipStatus = 'pending_received'
      }
      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        avatar_url: p.avatar_url,
        bio: p.bio,
        friendshipStatus,
      }
    })
  res.json(results)
})

app.post('/api/profiles/updateProfile', (req, res) => {
  const profile = getCurrentProfile()
  if (req.body.bio !== undefined) profile.bio = req.body.bio
  if (req.body.avatarUrl !== undefined) profile.avatar_url = req.body.avatarUrl
  res.json(profile)
})

// POSTS
app.get('/api/posts/getFeed', (_req, res) => {
  const myId = CURRENT_USER_ID
  const friendIds = friendships
    .filter((f) => f.status === 'accepted' && (f.requester_id === myId || f.recipient_id === myId))
    .map((f) => (f.requester_id === myId ? f.recipient_id : f.requester_id))
  const allowedAuthorIds = new Set([myId, ...friendIds])

  const feed = posts
    .filter((p) => allowedAuthorIds.has(p.author_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((p) => {
      const author = profiles.find((pr) => pr.id === p.author_id)
      const likeCount = likes.filter((l) => l.post_id === p.id).length
      const commentCount = comments.filter((c) => c.post_id === p.id).length
      const likedByMe = likes.some((l) => l.post_id === p.id && l.profile_id === myId)

      return {
        id: p.id,
        author_id: p.author_id,
        content: p.content,
        image_url: p.image_url,
        created_at: p.created_at,
        author_name: author?.full_name ?? 'Unknown',
        author_avatar: author?.avatar_url ?? null,
        like_count: likeCount,
        comment_count: commentCount,
        liked_by_me: likedByMe,
      }
    })
  res.json(feed)
})

app.post('/api/posts/createPost', (req, res) => {
  const { content, imageUrl } = req.body
  const myProfile = getCurrentProfile()
  const newPost: Post = {
    id: Date.now(),
    author_id: myProfile.id,
    content: (content || '').trim(),
    image_url: imageUrl || null,
    created_at: new Date().toISOString(),
  }
  posts.unshift(newPost)
  res.json({
    ...newPost,
    author_name: myProfile.full_name,
    author_avatar: myProfile.avatar_url,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
  })
})

app.post('/api/posts/deletePost', (req, res) => {
  const { postId } = req.body
  const idx = posts.findIndex((p) => p.id === Number(postId))
  if (idx !== -1) {
    posts.splice(idx, 1)
  }
  res.json({ success: true })
})

app.post('/api/posts/toggleLike', (req, res) => {
  const { postId } = req.body
  const myId = CURRENT_USER_ID
  const idx = likes.findIndex((l) => l.post_id === Number(postId) && l.profile_id === myId)
  let liked = false
  if (idx >= 0) {
    likes.splice(idx, 1)
    liked = false
  } else {
    likes.push({ post_id: Number(postId), profile_id: myId })
    liked = true
  }
  res.json({ liked })
})

app.get('/api/posts/getComments', (req, res) => {
  const postId = Number(req.query.postId)
  const postComments = comments
    .filter((c) => c.post_id === postId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((c) => {
      const author = profiles.find((p) => p.id === c.profile_id)
      return {
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        profile_id: c.profile_id,
        author_name: author?.full_name ?? 'Unknown',
        author_avatar: author?.avatar_url ?? null,
      }
    })
  res.json(postComments)
})

app.post('/api/posts/addComment', (req, res) => {
  const { postId, content } = req.body
  const myProfile = getCurrentProfile()
  const newComment: Comment = {
    id: Date.now(),
    post_id: Number(postId),
    profile_id: myProfile.id,
    content: (content || '').trim(),
    created_at: new Date().toISOString(),
  }
  comments.push(newComment)
  res.json({
    ...newComment,
    author_name: myProfile.full_name,
    author_avatar: myProfile.avatar_url,
  })
})

// FRIENDS
app.get('/api/friends/getFriends', (_req, res) => {
  const myId = CURRENT_USER_ID
  const friendIds = friendships
    .filter((f) => f.status === 'accepted' && (f.requester_id === myId || f.recipient_id === myId))
    .map((f) => (f.requester_id === myId ? f.recipient_id : f.requester_id))

  const friendProfiles = profiles.filter((p) => friendIds.includes(p.id))
  res.json(friendProfiles)
})

app.get('/api/friends/getFriendRequests', (_req, res) => {
  const myId = CURRENT_USER_ID
  const incoming = friendships
    .filter((f) => f.recipient_id === myId && f.status === 'pending')
    .map((f) => {
      const sender = profiles.find((p) => p.id === f.requester_id)
      return {
        friendship_id: f.id,
        id: sender?.id ?? f.requester_id,
        full_name: sender?.full_name ?? 'Unknown',
        email: sender?.email ?? '',
        avatar_url: sender?.avatar_url ?? null,
        created_at: f.created_at,
      }
    })

  const outgoing = friendships
    .filter((f) => f.requester_id === myId && f.status === 'pending')
    .map((f) => {
      const recipient = profiles.find((p) => p.id === f.recipient_id)
      return {
        friendship_id: f.id,
        id: recipient?.id ?? f.recipient_id,
        full_name: recipient?.full_name ?? 'Unknown',
        email: recipient?.email ?? '',
        avatar_url: recipient?.avatar_url ?? null,
        created_at: f.created_at,
      }
    })

  res.json({ incoming, outgoing })
})

app.post('/api/friends/sendFriendRequest', (req, res) => {
  const { recipientId } = req.body
  const myId = CURRENT_USER_ID
  const existing = friendships.find(
    (f) =>
      (f.requester_id === myId && f.recipient_id === Number(recipientId)) ||
      (f.requester_id === Number(recipientId) && f.recipient_id === myId),
  )
  if (!existing) {
    friendships.push({
      id: Date.now(),
      requester_id: myId,
      recipient_id: Number(recipientId),
      status: 'pending',
      created_at: new Date().toISOString(),
    })
  }
  res.json({ success: true })
})

app.post('/api/friends/respondFriendRequest', (req, res) => {
  const { friendshipId, accept } = req.body
  const f = friendships.find((fr) => fr.id === Number(friendshipId))
  if (f) {
    f.status = accept ? 'accepted' : 'declined'
  }
  res.json({ success: true })
})

app.post('/api/friends/removeFriend', (req, res) => {
  const { friendId } = req.body
  const myId = CURRENT_USER_ID
  const idx = friendships.findIndex(
    (f) =>
      (f.requester_id === myId && f.recipient_id === Number(friendId)) ||
      (f.requester_id === Number(friendId) && f.recipient_id === myId),
  )
  if (idx >= 0) {
    friendships.splice(idx, 1)
  }
  res.json({ success: true })
})

// MESSAGES
app.get('/api/messages/getConversations', (_req, res) => {
  const myId = CURRENT_USER_ID
  const friendIds = friendships
    .filter((f) => f.status === 'accepted' && (f.requester_id === myId || f.recipient_id === myId))
    .map((f) => (f.requester_id === myId ? f.recipient_id : f.requester_id))

  const convos = friendIds.map((fId) => {
    const friend = profiles.find((p) => p.id === fId)
    const thread = messages
      .filter(
        (m) =>
          (m.sender_id === myId && m.recipient_id === fId) ||
          (m.sender_id === fId && m.recipient_id === myId),
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const lastMsg = thread[0]
    const unreadCount = thread.filter((m) => m.sender_id === fId && !m.read_at).length

    return {
      friend_id: fId,
      full_name: friend?.full_name ?? 'Unknown',
      avatar_url: friend?.avatar_url ?? null,
      last_message: lastMsg?.content ?? null,
      last_message_at: lastMsg?.created_at ?? null,
      last_sender_id: lastMsg?.sender_id ?? null,
      unread_count: unreadCount,
    }
  })

  convos.sort((a, b) => {
    if (!a.last_message_at) return 1
    if (!b.last_message_at) return -1
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  })

  res.json(convos)
})

app.get('/api/messages/getMessages', (req, res) => {
  const friendId = Number(req.query.friendId)
  const myId = CURRENT_USER_ID
  const thread = messages
    .filter(
      (m) =>
        (m.sender_id === myId && m.recipient_id === friendId) ||
        (m.sender_id === friendId && m.recipient_id === myId),
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  res.json(thread)
})

app.post('/api/messages/sendMessage', (req, res) => {
  const { friendId, content } = req.body
  const myId = CURRENT_USER_ID
  const newMsg: Message = {
    id: Date.now(),
    sender_id: myId,
    recipient_id: Number(friendId),
    content: (content || '').trim(),
    created_at: new Date().toISOString(),
    read_at: null,
  }
  messages.push(newMsg)
  res.json(newMsg)
})

app.post('/api/messages/markRead', (req, res) => {
  const friendId = Number(req.body.friendId)
  const myId = CURRENT_USER_ID
  messages.forEach((m) => {
    if (m.sender_id === friendId && m.recipient_id === myId && !m.read_at) {
      m.read_at = new Date().toISOString()
    }
  })
  res.json({ success: true })
})

// STORAGE
app.post('/api/storage/uploadImage', (req, res) => {
  const { base64Data, mimeType } = req.body
  if (!base64Data) {
    return res.status(400).json({ error: 'No image data provided' })
  }
  const url = base64Data.startsWith('data:')
    ? base64Data
    : `data:${mimeType || 'image/png'};base64,${base64Data}`
  res.json({ url, id: `img_${Date.now()}` })
})

// CALLS
app.post('/api/calls/startCall', (req, res) => {
  const { peerId, calleeId, type, callType, offer } = req.body
  const targetId = Number(calleeId || peerId)
  const resolvedType = (callType || type || 'video') as 'audio' | 'video'
  const call: Call = {
    id: Date.now(),
    caller_id: CURRENT_USER_ID,
    callee_id: targetId,
    call_type: resolvedType,
    status: 'outgoing',
    offer,
    created_at: new Date().toISOString(),
  }
  calls.push(call)
  res.json(call)
})

app.get('/api/calls/getActiveCall', (_req, res) => {
  const myId = CURRENT_USER_ID
  const active = calls.find(
    (c) => (c.caller_id === myId || c.callee_id === myId) && (c.status === 'outgoing' || c.status === 'active'),
  )
  if (!active) return res.json(null)

  const otherId = active.caller_id === myId ? active.callee_id : active.caller_id
  const other = profiles.find((p) => p.id === otherId)
  res.json({
    ...active,
    peer_name: other?.full_name ?? 'Unknown',
    peer_avatar: other?.avatar_url ?? null,
    is_incoming: active.callee_id === myId && active.status === 'outgoing',
  })
})

app.post('/api/calls/answerCall', (req, res) => {
  const { callId, answer } = req.body
  const call = calls.find((c) => c.id === Number(callId))
  if (call) {
    call.status = 'active'
    call.answer = answer
  }
  res.json(call ?? { success: true })
})

app.post('/api/calls/declineCall', (req, res) => {
  const { callId } = req.body
  const call = calls.find((c) => c.id === Number(callId))
  if (call) call.status = 'declined'
  res.json({ success: true })
})

app.post('/api/calls/endCall', (req, res) => {
  const { callId } = req.body
  const call = calls.find((c) => c.id === Number(callId))
  if (call) call.status = 'ended'
  res.json({ success: true })
})

app.post('/api/calls/sendIceCandidate', (req, res) => {
  const { callId, candidate } = req.body
  iceCandidates.push({
    id: Date.now(),
    call_id: Number(callId),
    sender_id: CURRENT_USER_ID,
    candidate,
    created_at: new Date().toISOString(),
  })
  res.json({ success: true })
})

app.get('/api/calls/getIceCandidates', (req, res) => {
  const callId = Number(req.query.callId)
  const afterId = Number(req.query.afterId || 0)
  const myId = CURRENT_USER_ID

  const cands = iceCandidates.filter(
    (c) => c.call_id === callId && c.sender_id !== myId && c.id > afterId,
  )
  res.json(cands)
})

// ADMIN
app.get('/api/admin/getMyAdminStatus', (_req, res) => {
  res.json({ isAdmin: getCurrentProfile().is_admin ?? true })
})

app.get('/api/admin/getStats', (_req, res) => {
  res.json({
    totalUsers: profiles.length,
    totalPosts: posts.length,
    activeFriendships: friendships.filter((f) => f.status === 'accepted').length,
    activeCalls: calls.filter((c) => c.status === 'active').length,
    activityHistory: [
      { name: 'Mon', posts: 12, calls: 4, messages: 45 },
      { name: 'Tue', posts: 19, calls: 8, messages: 62 },
      { name: 'Wed', posts: 15, calls: 6, messages: 53 },
      { name: 'Thu', posts: 24, calls: 11, messages: 84 },
      { name: 'Fri', posts: 28, calls: 15, messages: 97 },
      { name: 'Sat', posts: 32, calls: 18, messages: 120 },
      { name: 'Sun', posts: 26, calls: 12, messages: 90 },
    ],
  })
})

app.get('/api/admin/getAllProfiles', (_req, res) => {
  res.json(profiles)
})

app.get('/api/admin/getAllPosts', (_req, res) => {
  const all = posts.map((p) => {
    const author = profiles.find((pr) => pr.id === p.author_id)
    return {
      id: p.id,
      content: p.content,
      image_url: p.image_url,
      created_at: p.created_at,
      author_id: p.author_id,
      author_name: author?.full_name ?? 'Unknown',
      author_avatar: author?.avatar_url ?? null,
      like_count: likes.filter((l) => l.post_id === p.id).length,
      comment_count: comments.filter((c) => c.post_id === p.id).length,
    }
  })
  res.json(all)
})

app.post('/api/admin/setAdminStatus', (req, res) => {
  const { profileId, isAdmin } = req.body
  const p = profiles.find((pr) => pr.id === Number(profileId))
  if (p) p.is_admin = Boolean(isAdmin)
  res.json({ success: true })
})

app.post('/api/admin/deletePostAdmin', (req, res) => {
  const { postId } = req.body
  const idx = posts.findIndex((p) => p.id === Number(postId))
  if (idx >= 0) posts.splice(idx, 1)
  res.json({ success: true })
})

// VITE MIDDLEWARE SETUP
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`)
  })
}

start()
