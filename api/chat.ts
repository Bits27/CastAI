import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from './_lib/auth.js'
import { db, schema, neonSql } from './_lib/db.js'
import { eq } from 'drizzle-orm'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'

const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

interface ChunkResult {
  id: string
  video_id: string
  content: string
  start_time_seconds: number
  end_time_seconds: number
  similarity: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let userId: string
  try {
    userId = await requireAuth(req)
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { query, videoIds = [], collectionId } = req.body as {
    query: string
    videoIds: string[]
    collectionId?: string
  }

  if (!query) return res.status(400).json({ error: 'query is required' })

  // Resolve collection -> video IDs
  let resolvedVideoIds = [...videoIds]
  if (collectionId) {
    const collVideos = await db
      .select({ id: schema.videos.id })
      .from(schema.videos)
      .where(eq(schema.videos.collectionId, collectionId))
    resolvedVideoIds = [...new Set([...resolvedVideoIds, ...collVideos.map((v) => v.id)])]
  }

  if (resolvedVideoIds.length === 0) {
    // Use all user videos
    const allVideos = await db
      .select({ id: schema.videos.id })
      .from(schema.videos)
      .where(eq(schema.videos.userId, userId))
    resolvedVideoIds = allVideos.map((v) => v.id)
  }

  if (resolvedVideoIds.length === 0) {
    return res.status(400).json({ error: 'No videos to search' })
  }

  // Embed query
  const embModel = genai.getGenerativeModel({ model: 'gemini-embedding-001' })
  const embRes = await embModel.embedContent({
    content: { parts: [{ text: query }], role: 'user' },
    outputDimensionality: 768,
  } as any)
  const queryEmbedding = embRes.embedding.values

  // Vector search — fetch more chunks to ensure coverage across multiple videos
  const chunks = await neonSql`
    SELECT * FROM match_chunks(
      ${JSON.stringify(queryEmbedding)}::vector,
      15,
      ${resolvedVideoIds}::uuid[]
    )
  ` as ChunkResult[]

  // Fetch video titles + insights for all resolved videos
  const videoInfoMap: Record<string, { title: string; insights: any }> = {}
  await Promise.all(resolvedVideoIds.map(async (vid) => {
    const [video] = await db
      .select({ title: schema.videos.title })
      .from(schema.videos)
      .where(eq(schema.videos.id, vid))
    const [insights] = await db
      .select()
      .from(schema.videoInsights)
      .where(eq(schema.videoInsights.videoId, vid))
    videoInfoMap[vid] = { title: video?.title ?? 'Unknown Video', insights: insights ?? null }
  }))

  // Build insights summary for all videos
  const insightsSummary = resolvedVideoIds
    .map(vid => {
      const info = videoInfoMap[vid]
      if (!info?.insights) return null
      const parts = [`Video: "${info.title}"`]
      if (info.insights.speakers?.length) parts.push(`Speakers: ${(info.insights.speakers as string[]).join(', ')}`)
      if (info.insights.summary) parts.push(`Summary: ${info.insights.summary}`)
      if (info.insights.topics?.length) parts.push(`Topics: ${(info.insights.topics as string[]).join(', ')}`)
      return parts.join('\n')
    })
    .filter(Boolean)
    .join('\n\n')

  // Build context blocks
  const contextBlocks = chunks.map((chunk, i) => {
    const title = videoInfoMap[chunk.video_id]?.title ?? 'Unknown Video'
    const ts = Math.round(chunk.start_time_seconds)
    return `[${i + 1}] From "${title}" at ${ts}s:\n${chunk.content}`
  }).join('\n\n')

  const systemPrompt = `You are CastAI, an AI assistant that helps users understand their video library.
Answer questions using ONLY the provided context. Be concise and insightful.
After each relevant sentence, include a citation in this exact format: [SOURCE:chunkId:videoTitle:startSeconds]
Replace chunkId, videoTitle, and startSeconds with the actual values from the context.
If the context doesn't contain enough information, say so clearly.`

  const userPrompt = `Video insights:\n\n${insightsSummary}\n\nRelevant transcript chunks:\n\n${contextBlocks}\n\nQuestion: ${query}`

  // Stream response
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
    })

    // Buffer to handle SOURCE citations that may span multiple chunks
    let buffer = ''
    for await (const chunk of stream) {
      buffer += chunk.choices[0]?.delta?.content ?? ''

      let processed = ''
      let remaining = buffer
      while (true) {
        const sourceIdx = remaining.indexOf('[SOURCE:')
        if (sourceIdx === -1) {
          processed += remaining
          remaining = ''
          break
        }
        processed += remaining.slice(0, sourceIdx)
        remaining = remaining.slice(sourceIdx)
        const closeIdx = remaining.indexOf(']')
        if (closeIdx === -1) break // incomplete citation — keep in buffer
        const pattern = remaining.slice(0, closeIdx + 1)
        processed += pattern.replace(
          /\[SOURCE:(\d+):([^:]+):(\d+)\]/g,
          (_, idx, title, ts) => {
            const c = chunks[parseInt(idx) - 1]
            return c ? `[SOURCE:${c.id}:${c.video_id}:${title}:${ts}]` : ''
          }
        )
        remaining = remaining.slice(closeIdx + 1)
      }
      buffer = remaining
      if (processed) res.write(`data: ${processed.replace(/\n/g, '\\n')}\n\n`)
    }

    if (buffer) res.write(`data: ${buffer.replace(/\n/g, '\\n')}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('Chat stream error:', err)
    res.write('data: [ERROR]\n\n')
    res.end()
  }
}
