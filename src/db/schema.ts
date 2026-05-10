import { pgTable, text, uuid, timestamp, integer, jsonb, doublePrecision } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: text('id').primaryKey(), // clerk_user_id
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const videos = pgTable('videos', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'set null' }),
  youtubeId: text('youtube_id').notNull(),
  title: text('title'),
  channel: text('channel'),
  thumbnailUrl: text('thumbnail_url'),
  durationSeconds: integer('duration_seconds'),
  transcriptText: text('transcript_text'),
  status: text('status').default('queued'), // queued | processing | done | failed
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const chunks = pgTable('chunks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  // embedding stored as text in drizzle, actual vector type lives in DB
  startTimeSeconds: doublePrecision('start_time_seconds'),
  endTimeSeconds: doublePrecision('end_time_seconds'),
})

export const videoInsights = pgTable('video_insights', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }),
  summary: text('summary'),
  speakers: jsonb('speakers'),
  keyClaims: jsonb('key_claims'),
  topQuotes: jsonb('top_quotes'),
  topics: jsonb('topics'),
})

export type User = typeof users.$inferSelect
export type Collection = typeof collections.$inferSelect
export type Video = typeof videos.$inferSelect
export type Chunk = typeof chunks.$inferSelect
export type VideoInsights = typeof videoInsights.$inferSelect
