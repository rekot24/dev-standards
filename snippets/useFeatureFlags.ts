'use client'
/**
 * snippets/useFeatureFlags.ts
 *
 * Feature-flag and plan checks. Copy into src/hooks/useFeatureFlags.ts.
 * Requires <SettingsProvider> above it (see useSettings.tsx).
 *
 * IMPORTANT: these checks decide what the UI SHOWS. They are not security.
 * Paid or sensitive features must ALSO be enforced on the server (RLS policy / route handler).
 * See snippets/rls-tenant.sql for a plan-gated policy.
 *
 * - isEnabled(flag)             flag is on for this tenant
 * - isPlan(...tiers)            tenant's plan meets the LOWEST listed tier (higher tiers include lower)
 * - canAccess(flag, ...tiers)   both checks together
 */
import { useSettings } from '@/context/SettingsContext'
import { PLAN_RANK, type FlagKey, type PlanTier } from '@/constants'

export function useFeatureFlags() {
  const { flags, planTier } = useSettings()

  /** True if the flag is on. Types prevent asking about a flag that isn't in the registry. */
  const isEnabled = (flag: FlagKey): boolean => flags[flag]

  /** True if the current plan is at or above the lowest listed tier. isPlan('pro') passes for pro and team. */
  const isPlan = (...tiers: PlanTier[]): boolean => {
    const required = Math.min(...tiers.map((t) => PLAN_RANK[t] ?? Infinity))
    return (PLAN_RANK[planTier] ?? 0) >= required
  }

  /** Flag on AND plan sufficient. */
  const canAccess = (flag: FlagKey, ...tiers: PlanTier[]): boolean => isEnabled(flag) && isPlan(...tiers)

  return { isEnabled, isPlan, canAccess, currentPlan: planTier }
}
