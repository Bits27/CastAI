import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../../src/db/schema.js'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
export { schema }
export { sql as neonSql }
