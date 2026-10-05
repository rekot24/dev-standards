/**
 * snippets/env.ts
 *
 * Validate environment variables ONCE at startup with zod.
 * A missing variable fails immediately with a clear message — not at 2 a.m. in production.
 *
 * Copy into src/lib/env.ts.
 *
 * PREFIX RULE: anything named NEXT_PUBLIC_* is shipped to every visitor's browser.
 * Only publishable values belong there. Secrets go in the server-only block.
 */
import { z } from 'zod'

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),   // publishable key — safe for the browser
})

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),       // SERVER ONLY. Never import this file's server export in client code.
  // STRIPE_SECRET_KEY: z.string().min(1),
  // TWILIO_AUTH_TOKEN: z.string().min(1),
})

/** Safe in client and server code. */
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})

/** Call only in server-side code (route handlers, server actions). Throws if a secret is missing. */
export const getServerEnv = () => serverSchema.parse(process.env)
