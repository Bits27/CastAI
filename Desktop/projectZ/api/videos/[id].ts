import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_lib/auth.js'
import { db, schema } from '../_lib/db.js'
import { eq, and, inArray } from 'drizzle-orm'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string
  try {
    userId = await requireAuth(req)
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query as { id: string }

  if (req.method === 'GET') {
    const chunks = await db
      .select({
        content: schema.chunks.content,
        startTimeSeconds: schema.chunks.startTimeSeconds,
        endTimeSeconds: schema.chunks.endTimeSeconds,
      })
      .from(schema.chunks)
      .where(eq(schema.chunks.videoId, id))
      .orderBy(schema.chunks.startTimeSeconds)
    return res.status(200).json(chunks)
  }

  if (req.method === 'DELETE') {
    const deleted = await db
      .delete(schema.videos)
      .where(and(eq(schema.videos.id, id), eq(schema.videos.userId, userId)))
      .returning()

    if (deleted.length === 0) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ deleted: true })
  }

  if (req.method === 'PATCH') {
    const { collectionIds } = req.body as { collectionIds: string[] }

    // Verify video belongs to user
    const [video] = await db.select({ id: schema.videos.id })
      .from(schema.videos)
      .where(and(eq(schema.videos.id, id), eq(schema.videos.userId, userId)))
    if (!video) return res.status(404).json({ error: 'Not found' })

    // Replace junction table rows for this video
    await db.delete(schema.videoCollections).where(eq(schema.videoCollections.videoId, id))
    if (collectionIds.length > 0) {
      await db.insert(schema.videoCollections).values(
        collectionIds.map((cid) => ({ videoId: id, collectionId: cid }))
      )
    }

    const vcRows = await db
      .select({ collectionId: schema.videoCollections.collectionId })
      .from(schema.videoCollections)
      .where(eq(schema.videoCollections.videoId, id))

    return res.status(200).json({ id, collectionIds: vcRows.map((r) => r.collectionId) })
  }

  if (req.method === 'POST') {
    const [video] = await db.select().from(schema.videos)
      .where(and(eq(schema.videos.id, id), eq(schema.videos.userId, userId)))
    if (!video) return res.status(404).json({ error: 'Not found' })
    if (!video.transcriptText) return res.status(422).json({ error: 'No transcript available' })

    const insightPrompt = `You are an AI assistant. Analyze the following video and return ONLY valid JSON with these keys:
- clean_title: string (4-7 word neutral descriptive title of what this video actually covers, no clickbait, no sensationalism)
- summary: string (2-3 sentence overview)
- speakers: string[] (names of people speaking or presenting — infer from: names mentioned in the transcript, the video title, or the channel name; if it's a podcast or interview also include the host; only use "Unknown Speaker" as a last resort if truly no name can be inferred)
- key_claims: { claim: string, timestamp: number }[] (important claims with approximate timestamp in seconds)
- top_quotes: string[] (5 most memorable quotes)
- topics: string[] (main topics covered)

Video title: ${video.title ?? ''}
Channel: ${video.channel ?? ''}

Transcript:
${video.transcriptText.slice(0, 50000)}

Return only valid JSON, no markdown.`

    let insights = { clean_title: '', summary: '', speakers: [], key_claims: [], top_quotes: [], topics: [] }
    try {
      const res2 = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: insightPrompt }],
      })
      const raw = (res2.choices[0]?.message?.content ?? '').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
      insights = JSON.parse(raw)
    } catch (err) {
      console.error('Re-extract insight error:', err)
      return res.status(500).json({ error: 'Insight extraction failed' })
    }

    await db.delete(schema.videoInsights).where(eq(schema.videoInsights.videoId, id))
    await db.insert(schema.videoInsights).values({
      videoId: id,
      summary: insights.summary,
      speakers: insights.speakers,
      keyClaims: insights.key_claims,
      topQuotes: insights.top_quotes,
      topics: insights.topics,
    })

    const cleanTitle = insights.clean_title?.trim()
    if (cleanTitle) {
      await db.update(schema.videos)
        .set({ title: cleanTitle })
        .where(eq(schema.videos.id, id))
    }

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
