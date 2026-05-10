import { createClerkClient } from '@clerk/clerk-sdk-node'
import type { VercelRequest } from '@vercel/node'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function requireAuth(req: VercelRequest): Promise<string> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }
  const token = authHeader.slice(7)
  const payload = await clerk.verifyToken(token)
  return payload.sub
}
