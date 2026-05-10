import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { Provider } from 'react-redux'
import { store } from './store'
import Landing from './pages/Landing'
import Dashboard from './pages/dashboard'
import Library from './pages/dashboard/Library'
import Chat from './pages/dashboard/Chat'
import VideoDetail from './pages/dashboard/VideoDetail'
import { useEffect } from 'react'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function ClerkTokenBridge() {
  const { getToken } = useAuth()
  useEffect(() => {
    ;(window as any).__clerkGetToken = () => getToken()
  }, [getToken])
  return null
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/" replace />
      </SignedOut>
    </>
  )
}

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <Provider store={store}>
        <BrowserRouter>
          <ClerkTokenBridge />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="library" replace />} />
              <Route path="library" element={<Library />} />
              <Route path="chat" element={<Chat />} />
              <Route path="video/:id" element={<VideoDetail />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    </ClerkProvider>
  )
}
