import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from './_lib/auth.js'
import { db, schema } from './_lib/db.js'
import { eq, and, isNotNull } from 'drizzle-orm'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let userId: string
  try {
    userId = await requireAuth(req)
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get all done videos with insights
  const videos = await db
    .select({
      id: schema.videos.id,
      title: schema.videos.title,
      channel: schema.videos.channel,
      summary: schema.videoInsights.summary,
      topics: schema.videoInsights.topics,
    })
    .from(schema.videos)
    .innerJoin(schema.videoInsights, eq(schema.videoInsights.videoId, schema.videos.id))
    .where(and(eq(schema.videos.userId, userId), eq(schema.videos.status, 'done')))

  if (videos.length === 0) return res.status(200).json({ updated: 0 })

  const updated: { id: string; title: string }[] = []

  for (const video of videos) {
    const summary = (video.summary ?? '').slice(0, 300)
    const topics = Array.isArray(video.topics) ? (video.topics as string[]).join(', ') : ''
    if (!summary && !topics) continue

    try {
      const result = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'user',
          content: `Given this video info, write a clean 4-7 word descriptive title that describes what it actually covers. No clickbait, no sensationalism. Return ONLY the title text, nothing else.

Channel: ${video.channel ?? 'Unknown'}
Topics: ${topics}
Summary: ${summary}`,
        }],
        max_tokens: 30,
      })
      const cleanTitle = result.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '')
      if (cleanTitle && cleanTitle.length > 3) {
        await db.update(schema.videos)
          .set({ title: cleanTitle })
          .where(and(eq(schema.videos.id, video.id), eq(schema.videos.userId, userId)))
        updated.push({ id: video.id, title: cleanTitle })
      }
    } catch {
      // skip on error, continue to next video
    }
  }

  return res.status(200).json({ updated: updated.length, titles: updated })
}
