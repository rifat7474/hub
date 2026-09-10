export interface FeedPost {
  id: number
  author_id: number
  content: string
  image_url: string | null
  created_at: string
  author_name: string
  author_avatar: string | null
  like_count: number | string
  comment_count: number | string
  liked_by_me: boolean
}

export interface PostComment {
  id: number
  content: string
  created_at: string
  profile_id: number
  author_name: string
  author_avatar: string | null
}

export interface FriendProfile {
  id: number
  full_name: string
  email: string
  avatar_url: string | null
  bio: string
}

export interface SearchResultProfile extends FriendProfile {
  friendshipStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received'
}

export interface FriendRequestRow {
  friendship_id: number
  id: number
  full_name: string
  email: string
  avatar_url: string | null
  created_at: string
}

export interface Conversation {
  friend_id: number
  full_name: string
  avatar_url: string | null
  last_message: string | null
  last_message_at: string | null
  last_sender_id: number | null
  unread_count: number | string
}

export interface ChatMessage {
  id: number
  sender_id: number
  recipient_id: number
  content: string
  created_at: string
  read_at: string | null
}
