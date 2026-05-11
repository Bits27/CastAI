import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_lib/auth'
import { db, schema } from '../_lib/db'
import { eq, desc } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  let userId: string
  try {
    userId = await requireAuth(req)
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const videos = await db
    .select()
    .from(schema.videos)
    .where(eq(schema.videos.userId, userId))
    .orderBy(desc(schema.videos.createdAt))

  // Attach insights
  const withInsights = await Promise.all(
    videos.map(async (video) => {
      const [insights] = await db
        .select()
        .from(schema.videoInsights)
        .where(eq(schema.videoInsights.videoId, video.id))
      return { ...video, insights: insights ?? null }
    })
  )

  return res.status(200).json(withInsights)
}
