import { Routes, Route } from 'react-router-dom'
import { ProfileProvider } from './hooks/useProfileContext'
import { CallProvider } from './hooks/useCallManager'
import { Layout } from './components/Layout'
import { CallOverlay } from './components/CallOverlay'
import { Toaster } from './lib/shadcn/sonner'
import Feed from './pages/Feed'
import Friends from './pages/Friends'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

export default function App() {
  return (
    <ProfileProvider>
      <CallProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:friendId" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
        <CallOverlay />
        <Toaster />
      </CallProvider>
    </ProfileProvider>
  )
}
