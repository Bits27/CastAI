import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_lib/auth.js'
import { db, schema } from '../_lib/db.js'
import { eq, and } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireAuth(req)
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query as { id: string }

  if (req.method === 'DELETE') {
    const deleted = await db
      .delete(schema.collections)
      .where(and(eq(schema.collections.id, id), eq(schema.collections.userId, userId)))
      .returning()

    if (deleted.length === 0) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ deleted: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
