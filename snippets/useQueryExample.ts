'use client'
/**
 * snippets/useQueryExample.ts
 *
 * THE data-fetching pattern: Component -> Hook (TanStack Query) -> api.ts -> Supabase.
 * Copy and rename "things" to your entity. Two files in one for illustration:
 *   features/things/api.ts   (the ONLY place that talks to Supabase for this feature)
 *   features/things/hooks.ts (hooks that components call)
 *
 * What TanStack Query gives you for free: caching, loading/error flags, de-duplication,
 * background refetch when data goes stale, retries, and one-line cache refresh after a mutation.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

// ----- schemas.ts : define the shape first (Layer 9) -------------------------
export const thingSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: z.enum(['draft', 'submitted', 'approved', 'declined', 'complete']),
  created_at: z.string(),
})
export type Thing = z.infer<typeof thingSchema>
export const newThingSchema = thingSchema.pick({ name: true })   // validate inputs at the boundary
export type NewThing = z.infer<typeof newThingSchema>

// ----- api.ts : functions THROW on failure; never return null as if it were success -----
async function listThings(): Promise<Thing[]> {
  const { data, error } = await supabase.from('things').select('id,name,status,created_at').order('created_at', { ascending: false })
  if (error) throw error
  return z.array(thingSchema).parse(data ?? [])          // validates what the database actually returned
}

async function createThing(input: NewThing): Promise<void> {
  const valid = newThingSchema.parse(input)
  const { error } = await supabase.from('things').insert(valid)
  if (error) throw error
}

// ----- hooks.ts : what components import -------------------------------------
/** Query keys in one place so invalidation never misses a typo. */
export const thingKeys = { all: ['things'] as const }

/** Read: components get { data, isPending, isError, error, refetch }. */
export function useThings() {
  return useQuery({ queryKey: thingKeys.all, queryFn: listThings })
}

/** Write: on success, mark the list stale so it refetches; on failure, log once. */
export function useCreateThing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createThing,
    onSuccess: () => {
      logger.info('data', 'thing created')
      return qc.invalidateQueries({ queryKey: thingKeys.all })
    },
    onError: (err) => logger.error('data', 'create thing failed', { message: err.message }),
  })
}

/*
 * In a component (the three states, Layer 5):
 *
 *   const { data, isPending, isError, error, refetch } = useThings()
 *   if (isPending) return <LoadingState />
 *   if (isError)   return <ErrorState error={error} onRetry={refetch} />
 *   if (!data.length) return <EmptyState message="Nothing here yet" />
 *   return <ThingList items={data} />
 *
 * Provider (once, at the root; client component):
 *   const [client] = useState(() => new QueryClient())
 *   <QueryClientProvider client={client}>...</QueryClientProvider>
 */
