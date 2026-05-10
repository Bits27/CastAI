import { defineConfig } from 'drizzle-kit'
import { loadEnvFile } from 'node:process'

try { loadEnvFile('.env.local') } catch {}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
})
