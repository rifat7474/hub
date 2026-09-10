import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage'
import firebaseConfig from '../../firebase-applet-config.json'

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Use the dedicated database ID if configured, otherwise fallback to '(default)'
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app)

export const storage = getStorage(app)

export interface ConnectionStatus {
  connected: boolean
  checking: boolean
  error: string | null
  databaseId: string
  projectId: string
}

let connectionCache: ConnectionStatus = {
  connected: false,
  checking: true,
  error: null,
  databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
  projectId: firebaseConfig.projectId,
}

const connectionListeners: Array<(status: ConnectionStatus) => void> = []

function notifyConnectionListeners() {
  connectionListeners.forEach((fn) => fn({ ...connectionCache }))
}

export function subscribeToConnectionStatus(callback: (status: ConnectionStatus) => void) {
  callback({ ...connectionCache })
  connectionListeners.push(callback)
  return () => {
    const idx = connectionListeners.indexOf(callback)
    if (idx !== -1) connectionListeners.splice(idx, 1)
  }
}

/**
 * Validates connection to Firestore from the server
 */
export async function testDatabaseConnection(): Promise<boolean> {
  connectionCache.checking = true
  connectionCache.error = null
  notifyConnectionListeners()

  try {
    // Attempt pinging Firestore server directly
    await getDocFromServer(doc(db, 'test', 'connection'))
    connectionCache.connected = true
    connectionCache.checking = false
    connectionCache.error = null
    notifyConnectionListeners()
    return true
  } catch (error: any) {
    // If permission or not-found, server responded (connected)
    if (
      error?.code === 'permission-denied' ||
      error?.code === 'not-found' ||
      !error?.message?.includes('the client is offline')
    ) {
      connectionCache.connected = true
      connectionCache.checking = false
      connectionCache.error = null
      notifyConnectionListeners()
      return true
    }

    console.warn('[Firebase] Database connection check notice:', error?.message)
    connectionCache.connected = false
    connectionCache.checking = false
    connectionCache.error = error?.message || 'Offline or configuration issue'
    notifyConnectionListeners()
    return false
  }
}

/**
 * Ensures anonymous authentication so security rules allow operations
 */
export async function ensureAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub()
      if (user) {
        resolve(user)
      } else {
        try {
          const cred = await signInAnonymously(auth)
          resolve(cred.user)
        } catch (err) {
          console.error('[Firebase Auth] Anonymous sign-in error:', err)
          resolve(null)
        }
      }
    })
  })
}

/**
 * Seed initial social network demo data to Firestore if not already present
 */
export async function seedInitialFirestoreData() {
  try {
    const snap = await getDocs(collection(db, 'profiles'))
    if (!snap.empty) {
      return // Already seeded
    }

    const batch = writeBatch(db)

    // Initial Profiles
    const initialProfiles = [
      {
        id: 1,
        user_id: 'user_1',
        email: 'alex.rivera@example.com',
        full_name: 'Alex Rivera',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bio: 'Product designer & engineer. Building next-gen social platforms on Firebase.',
        is_admin: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        user_id: 'user_2',
        email: 'sarah.chen@example.com',
        full_name: 'Sarah Chen',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        bio: 'Outdoor explorer, landscape photographer, and iOS developer.',
        is_admin: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        user_id: 'user_3',
        email: 'marcus.t@example.com',
        full_name: 'Marcus Taylor',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'Full-stack builder. Working on WebRTC & distributed systems.',
        is_admin: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 4,
        user_id: 'user_4',
        email: 'priya.patel@example.com',
        full_name: 'Priya Patel',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        bio: 'AI researcher & community organizer.',
        is_admin: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 5,
        user_id: 'user_5',
        email: 'jordan.lee@example.com',
        full_name: 'Jordan Lee',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        bio: 'Musician, creative coder, and generative art fan.',
        is_admin: false,
        created_at: new Date().toISOString(),
      },
    ]

    initialProfiles.forEach((p) => {
      batch.set(doc(db, 'profiles', String(p.id)), p)
    })

    // Friendships
    const initialFriendships = [
      { id: 1, requester_id: 1, recipient_id: 2, status: 'accepted', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: 2, requester_id: 1, recipient_id: 3, status: 'accepted', created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
      { id: 3, requester_id: 4, recipient_id: 1, status: 'accepted', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: 4, requester_id: 5, recipient_id: 1, status: 'pending', created_at: new Date(Date.now() - 3600000 * 4).toISOString() },
    ]
    initialFriendships.forEach((f) => {
      batch.set(doc(db, 'friendships', String(f.id)), f)
    })

    // Posts
    const initialPosts = [
      {
        id: 1,
        author_id: 2,
        content: 'Spent the weekend backpacking through Point Reyes! Nothing beats the morning fog clearing over the Pacific coastline. 🌲🌊',
        image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        author_name: 'Sarah Chen',
        author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      {
        id: 2,
        author_id: 3,
        content: 'Just tested out peer-to-peer WebRTC video streaming backed by Firebase Firestore signaling. The latency is practically zero! Check it out in the Messages tab.',
        image_url: null,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        author_name: 'Marcus Taylor',
        author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        id: 3,
        author_id: 1,
        content: 'Welcome everyone to Hub! Now fully migrated to Firebase Firestore, Authentication, and Storage. Real-time updates, security rules, and persistent cloud storage are active.',
        image_url: null,
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        author_name: 'Alex Rivera',
        author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    ]
    initialPosts.forEach((p) => {
      batch.set(doc(db, 'posts', String(p.id)), p)
    })

    // Likes
    const initialLikes = [
      { post_id: 1, profile_id: 1 },
      { post_id: 1, profile_id: 3 },
      { post_id: 1, profile_id: 4 },
      { post_id: 2, profile_id: 2 },
      { post_id: 2, profile_id: 4 },
      { post_id: 3, profile_id: 1 },
      { post_id: 3, profile_id: 2 },
      { post_id: 3, profile_id: 3 },
    ]
    initialLikes.forEach((l, i) => {
      batch.set(doc(db, 'likes', `${l.post_id}_${l.profile_id}`), l)
    })

    // Comments
    const initialComments = [
      {
        id: 1,
        post_id: 1,
        profile_id: 1,
        author_name: 'Alex Rivera',
        author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        content: 'Stunning photography! Which trail did you take?',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 2,
        post_id: 1,
        profile_id: 3,
        author_name: 'Marcus Taylor',
        author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        content: 'The dynamic range in that shot is unreal!',
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 3,
        post_id: 2,
        profile_id: 4,
        author_name: 'Priya Patel',
        author_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        content: 'Awesome progress! Are you using Firebase Firestore for the ICE signaling?',
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ]
    initialComments.forEach((c) => {
      batch.set(doc(db, 'comments', String(c.id)), c)
    })

    // Messages
    const initialMessages = [
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
        content: 'Hey Sarah! Yes, just finishing up the Firebase database migration.',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        read_at: new Date().toISOString(),
      },
      {
        id: 3,
        sender_id: 2,
        recipient_id: 1,
        content: 'Great, see you then! Feel free to jump on a quick call if you want to test WebRTC.',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        read_at: null,
      },
      {
        id: 4,
        sender_id: 3,
        recipient_id: 1,
        content: 'Call features and messaging are connected to Firestore.',
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        read_at: new Date().toISOString(),
      },
    ]
    initialMessages.forEach((m) => {
      batch.set(doc(db, 'messages', String(m.id)), m)
    })

    await batch.commit()
    console.log('[Firebase] Initial demo data seeded successfully into Firestore.')
  } catch (err) {
    console.warn('[Firebase] Notice during data seeding:', err)
  }
}

/**
 * Upload image to Firebase Storage or base64 fallback
 */
export async function uploadImageToStorage(
  fileName: string,
  base64Data: string,
  mimeType = 'image/jpeg',
): Promise<{ url: string; id: string }> {
  const fileId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  try {
    // Attempt Firebase Cloud Storage upload
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
    const fileRef = storageRef(storage, `uploads/${fileId}_${fileName}`)
    await uploadString(fileRef, cleanBase64, 'base64', { contentType: mimeType })
    const downloadUrl = await getDownloadURL(fileRef)
    return { url: downloadUrl, id: fileId }
  } catch (storageError) {
    console.warn('[Firebase Storage] Falling back to direct data URL:', storageError)
    const url = base64Data.startsWith('data:')
      ? base64Data
      : `data:${mimeType};base64,${base64Data}`
    return { url, id: fileId }
  }
}
