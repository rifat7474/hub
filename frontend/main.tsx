import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { testDatabaseConnection, ensureAuth, seedInitialFirestoreData } from './lib/firebase'
import './theme.css'
import './index.css'

// Verify and initialize Firebase Firestore connection on boot
testDatabaseConnection().then(async (connected) => {
  if (connected) {
    console.log('[Firebase] Firestore database connected properly.')
    await ensureAuth()
    await seedInitialFirestoreData()
  } else {
    console.warn('[Firebase] Initial connection check pending or offline.')
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
