/**
 * snippets/useFeatureFlags.js
 *
 * Feature flag and plan tier hook — web equivalent of the feature_flags pattern.
 *
 * Copy into src/hooks/useFeatureFlags.js in any new React + Supabase project.
 * Requires useSettings to be available (SettingsProvider must wrap the app).
 *
 * Key behaviors:
 * - isEnabled(flag)          — returns true if the feature flag is on in operator settings
 * - isPlan(...tiers)         — returns true if operator's plan matches any listed tier
 * - canAccess(flag, ...tiers) — both checks combined; use for plan-gated features
 * - All checks are live — if settings change, these update immediately with no reload
 */

import { useSettings } from './useSettings'

// ---------------------------------------------------------------------------
// Plan tier constants
// Copy into src/constants/planTiers.js — imported here for reference
// ---------------------------------------------------------------------------

/**
 * Named plan tier constants.
 * Use these everywhere — never hardcode the string 'pro' in a component.
 */
export const PLAN_TIERS = {
  SOLO:      'solo',
  PRO:       'pro',
  CREW:      'crew',
  FRANCHISE: 'franchise',
}

/**
 * Numeric hierarchy for plan tier comparisons.
 * Higher number = more access.
 * A 'crew' operator automatically passes a 'pro' or 'solo' check.
 */
export const PLAN_HIERARCHY = {
  solo:      1,
  pro:       2,
  crew:      3,
  franchise: 4,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useFeatureFlags — check feature flags and plan tier from any component.
 *
 * Must be used inside a component wrapped by <SettingsProvider>.
 *
 * @returns {{
 *   isEnabled: (flag: string) => boolean,
 *   isPlan: (...tiers: string[]) => boolean,
 *   canAccess: (flag: string, ...requiredTiers: string[]) => boolean,
 *   currentPlan: string
 * }}
 *
 * Usage:
 *   const { isEnabled, isPlan, canAccess } = useFeatureFlags()
 *
 *   // Simple feature flag check:
 *   if (!isEnabled('photos_enabled')) return null
 *
 *   // Plan tier check only:
 *   if (!isPlan('pro', 'crew', 'franchise')) return <UpgradePrompt />
 *
 *   // Both combined (flag must be on AND plan tier must match):
 *   if (!canAccess('hd_sync_enabled', 'pro', 'crew', 'franchise')) return <UpgradePrompt />
 */
export const useFeatureFlags = () => {
  const { settings } = useSettings()

  /**
   * Check if a feature flag is enabled in operator settings.
   * Returns false if the flag does not exist in settings — safe by default.
   *
   * @param {string} flag - The operator_settings column name (e.g. 'photos_enabled')
   * @returns {boolean}
   */
  const isEnabled = (flag) => {
    if (!(flag in settings)) {
      // Flag does not exist — warn in dev, fail safely in production
      console.warn(`[featureFlags] Unknown flag checked: "${flag}" — returning false`)
      return false
    }
    return Boolean(settings[flag])
  }

  /**
   * Check if the operator's plan matches any of the listed tiers.
   * Uses hierarchy — higher plan tiers automatically include lower tier access.
   *
   * Hierarchy: solo(1) < pro(2) < crew(3) < franchise(4)
   * Example: isPlan('pro') returns true for pro, crew, and franchise operators.
   *
   * @param {...string} tiers - Plan tier names to check against
   * @returns {boolean}
   */
  const isPlan = (...tiers) => {
    const currentLevel = PLAN_HIERARCHY[settings.plan_tier] ?? 0
    // Pass if current level is >= the minimum required level
    const requiredLevel = Math.min(...tiers.map(t => PLAN_HIERARCHY[t] ?? 99))
    return currentLevel >= requiredLevel
  }

  /**
   * Combined check: feature flag must be on AND plan tier must match.
   * Use this for features that are both flag-gated and plan-gated.
   *
   * @param {string} flag - The feature flag to check
   * @param {...string} requiredTiers - Plan tier(s) that can access this feature
   * @returns {boolean}
   */
  const canAccess = (flag, ...requiredTiers) => {
    return isEnabled(flag) && isPlan(...requiredTiers)
  }

  return {
    isEnabled,
    isPlan,
    canAccess,
    currentPlan: settings.plan_tier,
  }
}
