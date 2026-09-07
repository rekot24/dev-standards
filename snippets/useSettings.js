/**
 * snippets/useSettings.js
 *
 * React settings store hook — web equivalent of settings_store.py
 *
 * Copy into src/hooks/useSettings.js in any new React + Supabase project.
 * Wrap your app root with <SettingsProvider> in src/App.jsx.
 *
 * Key behaviors:
 * - Fetches operator settings from Supabase on mount
 * - Stores settings in React Context — available to every component
 * - Updates Supabase + local context on every change (optimistic update)
 * - No restart required. No page reload. Changes are immediate.
 * - Creates a default settings row on first login if none exists
 */

import { useState, useEffect, useContext, createContext, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------------------
// Defaults — used when no operator_settings row exists yet
// ---------------------------------------------------------------------------

const SETTINGS_DEFAULTS = {
  // Tier 1: Operator preferences
  business_name:         null,
  labor_rate_default:    75.00,
  markup_default:        0.20,
  quote_followup_hrs:    24,
  quote_alert_hrs:       48,
  invoice_prefix:        'NXW',
  timezone:              'America/Denver',
  sms_template_quote:    null,
  sms_template_followup: null,
  sms_template_reminder: null,

  // Tier 2: Feature flags
  photos_enabled:          true,
  hd_sync_enabled:         false,
  parts_tracking_enabled:  false,
  sms_followup_enabled:    true,
  bank_link_enabled:       false,
  accounting_enabled:      true,
  debug_enabled:           false,

  // Debug sub-flags (only active when debug_enabled is true)
  debug_log_state_changes:  true,
  debug_log_api_calls:      false,
  debug_log_settings_reads: false,
  debug_log_render_cycles:  false,

  // Tier 3: Plan config
  plan_tier: 'solo',
}

// ---------------------------------------------------------------------------
// Context setup
// ---------------------------------------------------------------------------

const SettingsContext = createContext(null)

/**
 * SettingsProvider — wrap the app root with this.
 * All children can then call useSettings() to read and write settings.
 *
 * Usage in App.jsx:
 *   import { SettingsProvider } from './hooks/useSettings'
 *   <SettingsProvider><App /></SettingsProvider>
 *
 * @param {{ children: React.ReactNode }} props
 */
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [rowId, setRowId]       = useState(null)

  // ------------------------------------------------------------------
  // Load settings from Supabase on mount
  // ------------------------------------------------------------------

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          // Not logged in — keep defaults, auth redirect will handle it
          setLoading(false)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('operator_settings')
          .select('*')
          .eq('operator_id', user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = no rows found — that is expected on first login
          throw fetchError
        }

        if (data) {
          // Merge with defaults so new fields always have a fallback
          setSettings({ ...SETTINGS_DEFAULTS, ...data })
          setRowId(data.id)
        } else {
          // First login — create the settings row with defaults
          const { data: newRow, error: insertError } = await supabase
            .from('operator_settings')
            .insert({ operator_id: user.id, ...SETTINGS_DEFAULTS })
            .select()
            .single()

          if (insertError) throw insertError
          setSettings({ ...SETTINGS_DEFAULTS, ...newRow })
          setRowId(newRow.id)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // ------------------------------------------------------------------
  // Update a single setting
  // ------------------------------------------------------------------

  /**
   * Update one setting value.
   * Optimistic update: context changes immediately, Supabase write follows.
   * Rolls back if the write fails.
   *
   * @param {string} key - The operator_settings column name
   * @param {*} value - The new value
   */
  const updateSetting = useCallback(async (key, value) => {
    if (!rowId) return

    // Optimistic: update context first so UI responds instantly
    setSettings(prev => ({ ...prev, [key]: value }))

    const { error: updateError } = await supabase
      .from('operator_settings')
      .update({ [key]: value, updated_at: new Date().toISOString() })
      .eq('id', rowId)

    if (updateError) {
      // Rollback the optimistic update
      setSettings(prev => ({ ...prev, [key]: settings[key] }))
      console.error('[settings] Failed to save:', key, updateError.message)
    }
  }, [rowId, settings])

  // ------------------------------------------------------------------
  // Update multiple settings at once (single Supabase write)
  // ------------------------------------------------------------------

  /**
   * Update multiple settings in a single database write.
   * Use this when changing several related values at the same time.
   *
   * @param {Object} updates - { key: value } pairs to update
   */
  const updateSettings = useCallback(async (updates) => {
    if (!rowId) return

    const previousSettings = settings
    setSettings(current => ({ ...current, ...updates }))

    const { error: updateError } = await supabase
      .from('operator_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', rowId)

    if (updateError) {
      setSettings(previousSettings)
      console.error('[settings] Failed to save batch update:', updateError.message)
    }
  }, [rowId, settings])

  return (
    <SettingsContext.Provider value={{ settings, loading, error, updateSetting, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook — call this in any component to access the settings store
// ---------------------------------------------------------------------------

/**
 * useSettings — access the operator settings store from any component.
 *
 * Must be used inside a component wrapped by <SettingsProvider>.
 *
 * @returns {{
 *   settings: Object,
 *   loading: boolean,
 *   error: string|null,
 *   updateSetting: (key: string, value: any) => Promise<void>,
 *   updateSettings: (updates: Object) => Promise<void>
 * }}
 *
 * Usage:
 *   const { settings, updateSetting } = useSettings()
 *   const followUpHours = settings.quote_followup_hrs
 *   await updateSetting('quote_followup_hrs', 48)
 */
export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
