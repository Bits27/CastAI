import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_lib/auth'
import { db, schema } from '../_lib/db'
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
      .delete(schema.videos)
      .where(and(eq(schema.videos.id, id), eq(schema.videos.userId, userId)))
      .returning()

    if (deleted.length === 0) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ deleted: true })
  }

  if (req.method === 'PATCH') {
    const { collectionId } = req.body as { collectionId: string | null }
    const updated = await db
      .update(schema.videos)
      .set({ collectionId: collectionId ?? null })
      .where(and(eq(schema.videos.id, id), eq(schema.videos.userId, userId)))
      .returning()

    if (updated.length === 0) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(updated[0])
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
