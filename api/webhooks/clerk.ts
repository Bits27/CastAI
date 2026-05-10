import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Webhook } from 'svix'
import { db, schema } from '../_lib/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) return res.status(500).json({ error: 'Webhook secret not configured' })

  const svixId = req.headers['svix-id'] as string
  const svixTimestamp = req.headers['svix-timestamp'] as string
  const svixSignature = req.headers['svix-signature'] as string

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ error: 'Missing svix headers' })
  }

  let payload: string
  if (typeof req.body === 'string') {
    payload = req.body
  } else {
    payload = JSON.stringify(req.body)
  }

  const wh = new Webhook(webhookSecret)
  let event: { type: string; data: { id: string; email_addresses: { email_address: string }[] } }

  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof event
  } catch {
    return res.status(400).json({ error: 'Invalid webhook signature' })
  }

  if (event.type === 'user.created') {
    const { id, email_addresses } = event.data
    const email = email_addresses[0]?.email_address ?? ''
    await db.insert(schema.users).values({ id, email }).onConflictDoNothing()
  }

  return res.status(200).json({ received: true })
}
