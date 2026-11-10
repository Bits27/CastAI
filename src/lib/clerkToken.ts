declare global {
  interface Window {
    __clerkGetToken?: () => Promise<string | null>
  }
}

// Clerk exposes the session token via a global helper set up in ClerkTokenBridge (App.tsx)
export async function getClerkToken(): Promise<string> {
  if (typeof window !== 'undefined' && window.__clerkGetToken) {
    return (await window.__clerkGetToken()) ?? ''
  }
  return ''
}
