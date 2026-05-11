import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_lib/auth.js'
import { db, schema } from '../_lib/db.js'
import { eq } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireAuth(req)
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const collections = await db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.userId, userId))
    return res.status(200).json(collections)
  }

  if (req.method === 'POST') {
    const { name } = req.body as { name: string }
    if (!name) return res.status(400).json({ error: 'name is required' })
    const [collection] = await db.insert(schema.collections).values({ userId, name }).returning()
    return res.status(201).json(collection)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
