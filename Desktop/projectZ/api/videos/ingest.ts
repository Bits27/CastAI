import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_lib/auth.js'
import { db, schema, neonSql } from '../_lib/db.js'
import { eq } from 'drizzle-orm'
import { google } from 'googleapis'
import { Resend } from 'resend'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function fetchYouTubeTranscript(videoId: string): Promise<{ text: string; offset: number; duration: number }[]> {
  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) throw new Error('SUPADATA_API_KEY is not set')

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=false`,
    { headers: { 'x-api-key': apiKey } }
  )
  if (!res.ok) throw new Error(`Supadata API failed: ${res.status}`)

  const data = await res.json() as {
    content?: { text: string; offset: number; duration: number }[]
  }

  if (!data.content?.length) throw new Error('No transcript content returned')

  return data.content.map(s => ({
    text: s.text,
    offset: s.offset,
    duration: s.duration,
  }))
}

const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)
const youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY })

function extractYoutubeId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  throw new Error('Invalid YouTube URL')
}

function chunkTranscript(entries: { text: string; offset: number; duration: number }[]): {
  content: string
  startTimeSeconds: number
  endTimeSeconds: number
}[] {
  const TARGET_TOKENS = 500
  const APPROX_CHARS_PER_TOKEN = 4
  const TARGET_CHARS = TARGET_TOKENS * APPROX_CHARS_PER_TOKEN

  const chunks: { content: string; startTimeSeconds: number; endTimeSeconds: number }[] = []
  let buffer = ''
  let chunkStart = entries[0]?.offset ?? 0
  let lastEntry = entries[0]

  for (const entry of entries) {
    buffer += (buffer ? ' ' : '') + entry.text
    lastEntry = entry
    if (buffer.length >= TARGET_CHARS) {
      chunks.push({
        content: buffer,
        startTimeSeconds: chunkStart / 1000,
        endTimeSeconds: (entry.offset + entry.duration) / 1000,
      })
      buffer = ''
      chunkStart = entry.offset + entry.duration
    }
  }

  if (buffer) {
    chunks.push({
      content: buffer,
      startTimeSeconds: chunkStart / 1000,
      endTimeSeconds: lastEntry ? (lastEntry.offset + lastEntry.duration) / 1000 : chunkStart / 1000,
    })
  }

  return chunks
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 20
  const model = genai.getGenerativeModel({ model: 'gemini-embedding-001' })
  const embeddings: number[][] = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map(text =>
        model.embedContent({
          content: { parts: [{ text }], role: 'user' },
          outputDimensionality: 768,
        } as any)
      )
    )
    embeddings.push(...results.map(r => r.embedding.values ?? []))
  }
  return embeddings
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let userId: string
  try {
    userId = await requireAuth(req)
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { url } = req.body as { url: string }
  if (!url) return res.status(400).json({ error: 'url is required' })

  let youtubeId: string
  try {
    youtubeId = extractYoutubeId(url)
  } catch {
    return res.status(400).json({ error: 'Invalid YouTube URL' })
  }

  // Fetch video metadata
  let title = '', channel = '', thumbnailUrl = '', durationSeconds = 0
  try {
    const ytRes = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: [youtubeId],
    })
    const item = ytRes.data.items?.[0]
    if (item) {
      title = item.snippet?.title ?? ''
      channel = item.snippet?.channelTitle ?? ''
      thumbnailUrl = item.snippet?.thumbnails?.medium?.url ?? ''
      const iso = item.contentDetails?.duration ?? 'PT0S'
      const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (m) {
        durationSeconds = (parseInt(m[1] ?? '0') * 3600) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0')
      }
    }
  } catch (err) {
    console.error('YouTube metadata error:', err)
  }

  // Insert video row with status=processing
  const [video] = await db.insert(schema.videos).values({
    userId,
    youtubeId,
    title,
    channel,
    thumbnailUrl,
    durationSeconds,
    status: 'processing',
  }).returning()

  try {
    // Fetch transcript
    let transcriptEntries: { text: string; offset: number; duration: number }[] = []
    try {
      transcriptEntries = await fetchYouTubeTranscript(youtubeId)
    } catch (err) {
      console.error('Transcript fetch failed:', err)
    }

    if (transcriptEntries.length === 0) {
      await db.update(schema.videos).set({ status: 'failed' }).where(eq(schema.videos.id, video.id))
      return res.status(422).json({ error: 'Could not obtain transcript for this video' })
    }

    const transcriptText = transcriptEntries.map((e) => e.text).join(' ')

    // Update transcript text
    await db.update(schema.videos)
      .set({ transcriptText })
      .where(eq(schema.videos.id, video.id))

    // Chunk transcript
    const rawChunks = chunkTranscript(transcriptEntries)

    // Embed chunks
    const embeddings = await embedTexts(rawChunks.map((c) => c.content))

    // Bulk insert chunks with embeddings using raw SQL for vector type
    for (let i = 0; i < rawChunks.length; i++) {
      const chunk = rawChunks[i]
      const embedding = embeddings[i]
      await neonSql`
        INSERT INTO chunks (video_id, content, embedding, start_time_seconds, end_time_seconds)
        VALUES (
          ${video.id}::uuid,
          ${chunk.content},
          ${JSON.stringify(embedding)}::vector,
          ${chunk.startTimeSeconds},
          ${chunk.endTimeSeconds}
        )
      `
    }

    // Extract insights via Claude
    const insightPrompt = `You are an AI assistant. Analyze the following transcript and return ONLY valid JSON with these keys:
- summary: string (2-3 sentence overview)
- speakers: string[] (detected speaker names or ["Unknown Speaker"] if none detected)
- key_claims: { claim: string, timestamp: number }[] (important claims with approximate timestamp in seconds)
- top_quotes: string[] (5 most memorable quotes)
- topics: string[] (main topics covered)

Transcript:
${transcriptText.slice(0, 50000)}

Return only valid JSON, no markdown.`

    let insights = { summary: '', speakers: [], key_claims: [], top_quotes: [], topics: [] }
    try {
      const insightModel = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const insightRes = await insightModel.generateContent(insightPrompt)
      const raw = insightRes.response.text().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
      insights = JSON.parse(raw)
    } catch (err) {
      console.error('Insight extraction error:', err)
    }

    // Insert insights
    await db.insert(schema.videoInsights).values({
      videoId: video.id,
      summary: insights.summary,
      speakers: insights.speakers,
      keyClaims: insights.key_claims,
      topQuotes: insights.top_quotes,
      topics: insights.topics,
    })

    // Mark done
    await db.update(schema.videos).set({ status: 'done' }).where(eq(schema.videos.id, video.id))

    // Send digest email (fire-and-forget)
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId))
      if (user?.email) {
        await resend.emails.send({
          from: 'CastAI <noreply@castai.app>',
          to: user.email,
          subject: `"${title}" is ready in CastAI`,
          html: `<h2>Your video is ready!</h2>
<p><strong>${title}</strong> by ${channel} has been transcribed and indexed.</p>
<p><strong>Summary:</strong> ${insights.summary}</p>
<p><strong>Topics:</strong> ${Array.isArray(insights.topics) ? insights.topics.join(', ') : ''}</p>
<p><a href="https://castai.app/dashboard/video/${video.id}">View in CastAI →</a></p>`,
        })
      }
    } catch (emailErr) {
      console.error('Email send error:', emailErr)
    }

    const [done] = await db.select().from(schema.videos).where(eq(schema.videos.id, video.id))
    return res.status(200).json({
      ...done,
      insights: {
        summary: insights.summary,
        speakers: insights.speakers,
        keyClaims: insights.key_claims,
        topQuotes: insights.top_quotes,
        topics: insights.topics,
      },
    })
  } catch (err) {
    console.error('Ingest error:', err)
    await db.update(schema.videos).set({ status: 'failed' }).where(eq(schema.videos.id, video.id))
    return res.status(500).json({ error: 'Processing failed', details: String(err) })
  }
}
