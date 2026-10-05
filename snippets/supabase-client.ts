/**
 * snippets/supabase-client.ts
 *
 * The ONE browser Supabase client. Import { supabase } everywhere; never call createClient again.
 * Copy into src/lib/supabase/client.ts.
 *
 * Needs:  npm i @supabase/supabase-js @supabase/ssr
 * Types:  npx supabase gen types typescript --project-id <id> > src/types/database.ts
 *
 * For server code (route handlers, server actions, server components) create a separate server client
 * following the current Supabase + Next.js docs — it reads the session from cookies. Verify against the
 * current docs when starting a project; the recommended helper package has changed over time.
 */
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { publicEnv } from '@/lib/env'

export const supabase = createBrowserClient<Database>(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)
