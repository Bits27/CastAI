import { createClerkClient } from '@clerk/clerk-sdk-node'
import type { VercelRequest } from '@vercel/node'
import { db, schema } from './db.js'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function requireAuth(req: VercelRequest): Promise<string> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }
  const token = authHeader.slice(7)
  const payload = await clerk.verifyToken(token)
  const userId = payload.sub

  // Upsert user row so FK constraints never fail due to missed webhooks
  try {
    const clerkUser = await clerk.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
    await db.insert(schema.users).values({ id: userId, email }).onConflictDoNothing()
  } catch {
    // Non-fatal — proceed even if upsert fails
  }

  return userId
}
