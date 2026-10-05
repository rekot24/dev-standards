'use client'
/**
 * snippets/useSettings.tsx
 *
 * Settings store for React — web equivalent of settings_store.py.
 * Copy into src/context/SettingsContext.tsx (or src/hooks/useSettings.tsx).
 *
 * Needs:  @tanstack/react-query (QueryClientProvider must wrap this provider), the Supabase client,
 *         and generated database types (replace the local TenantSettings interface with the generated Row type).
 *
 * Behaviors
 * - Loads tenant_settings (preferences + flags + debug) and tenant_plans (read-only entitlements).
 * - Flags are merged over the registry defaults, so a new flag works instantly with no migration.
 * - updateSettings() is optimistic: the UI changes immediately and rolls back if the write fails.
 * - Keeps the logger pointed at the live debug settings (no window globals).
 * - Plan tier is READ-ONLY here by design: only the server (billing webhook/admin) may change it.
 */
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { FLAGS, PLAN_TIERS, type FlagKey, type PlanTier } from '@/constants'

/** Shape of the tenant_settings row. Replace with Database['public']['Tables']['tenant_settings']['Row']. */
export interface TenantSettings {
  id: string
  tenant_id: string
  display_name: string | null
  timezone: string
  default_rate_cents: number
  followup_hours: number
  flags: Partial<Record<FlagKey, boolean>>
  debug_enabled: boolean
  debug_categories: string[]
  updated_at: string
}
type SettingsPatch = Partial<Omit<TenantSettings, 'id' | 'tenant_id' | 'updated_at'>>

interface SettingsContextValue {
  settings: TenantSettings | undefined
  /** Registry defaults merged with the tenant's stored flags. */
  flags: Record<FlagKey, boolean>
  planTier: PlanTier
  isPending: boolean
  error: Error | null
  updateSettings: (patch: SettingsPatch) => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

/** Merge stored flags over registry defaults. Unknown stored keys are ignored. */
function resolveFlags(stored: TenantSettings['flags'] | undefined): Record<FlagKey, boolean> {
  const out = {} as Record<FlagKey, boolean>
  for (const key of Object.keys(FLAGS) as FlagKey[]) out[key] = stored?.[key] ?? FLAGS[key].default
  return out
}

export function SettingsProvider({ tenantId, children }: { tenantId: string; children: ReactNode }) {
  const qc = useQueryClient()
  const settingsKey = ['tenant_settings', tenantId] as const

  const settingsQ = useQuery({
    queryKey: settingsKey,
    queryFn: async (): Promise<TenantSettings> => {
      const { data, error } = await supabase.from('tenant_settings').select('*').eq('tenant_id', tenantId).maybeSingle()
      if (error) throw error
      if (data) return data as TenantSettings
      // First login: create the row. (A database trigger on tenant creation is even better.)
      const { data: created, error: insertError } = await supabase
        .from('tenant_settings').insert({ tenant_id: tenantId }).select('*').single()
      if (insertError) throw insertError
      return created as TenantSettings
    },
  })

  const planQ = useQuery({
    queryKey: ['tenant_plans', tenantId],
    queryFn: async (): Promise<PlanTier> => {
      const { data, error } = await supabase.from('tenant_plans').select('plan_tier').eq('tenant_id', tenantId).maybeSingle()
      if (error) throw error
      return (data?.plan_tier as PlanTier | undefined) ?? PLAN_TIERS.FREE
    },
  })

  const mutation = useMutation({
    mutationFn: async (patch: SettingsPatch) => {
      const { error } = await supabase
        .from('tenant_settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId)
      if (error) throw error
    },
    // Optimistic update with rollback
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: settingsKey })
      const previous = qc.getQueryData<TenantSettings>(settingsKey)
      if (previous) qc.setQueryData<TenantSettings>(settingsKey, { ...previous, ...patch })
      return { previous }
    },
    onError: (err, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(settingsKey, ctx.previous)
      logger.error('settings', 'save failed', { message: err.message })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: settingsKey }),
  })

  // Keep the logger reading the LIVE settings via a ref (no stale closure, no window global).
  const settingsRef = useRef(settingsQ.data)
  settingsRef.current = settingsQ.data
  useEffect(() => {
    logger.setSettingsSource(() => settingsRef.current)
    logger.setTenantId(tenantId)
  }, [tenantId])

  const value = useMemo<SettingsContextValue>(() => ({
    settings: settingsQ.data,
    flags: resolveFlags(settingsQ.data?.flags),
    planTier: planQ.data ?? PLAN_TIERS.FREE,
    isPending: settingsQ.isPending || planQ.isPending,
    error: (settingsQ.error ?? planQ.error) as Error | null,
    updateSettings: async (patch) => { await mutation.mutateAsync(patch) },
  }), [settingsQ.data, settingsQ.isPending, settingsQ.error, planQ.data, planQ.isPending, planQ.error, mutation])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

/**
 * useSettings — read and write the settings store from any component.
 * Must be used inside <SettingsProvider>.
 *
 *   const { settings, updateSettings } = useSettings()
 *   await updateSettings({ followup_hours: 48 })
 *
 * To toggle a flag, write the whole flags object:
 *   await updateSettings({ flags: { ...settings.flags, uploads: false } })
 */
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
