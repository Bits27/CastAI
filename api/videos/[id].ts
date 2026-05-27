import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_lib/auth.js'
import { db, schema } from '../_lib/db.js'
import { eq, and } from 'drizzle-orm'
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

  if (req.method === 'POST') {
    const [video] = await db.select().from(schema.videos)
      .where(and(eq(schema.videos.id, id), eq(schema.videos.userId, userId)))
    if (!video) return res.status(404).json({ error: 'Not found' })
    if (!video.transcriptText) return res.status(422).json({ error: 'No transcript available' })

    const insightPrompt = `You are an AI assistant. Analyze the following transcript and return ONLY valid JSON with these keys:
- summary: string (2-3 sentence overview)
- speakers: string[] (detected speaker names or ["Unknown Speaker"] if none detected)
- key_claims: { claim: string, timestamp: number }[] (important claims with approximate timestamp in seconds)
- top_quotes: string[] (5 most memorable quotes)
- topics: string[] (main topics covered)

Transcript:
${video.transcriptText.slice(0, 50000)}

Return only valid JSON, no markdown.`

    let insights = { summary: '', speakers: [], key_claims: [], top_quotes: [], topics: [] }
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

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
