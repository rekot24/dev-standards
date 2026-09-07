/**
 * snippets/logger.js
 *
 * Unified debug + logging layer — web equivalent of logger.py
 *
 * Copy into src/lib/logger.js in any new React + Supabase project.
 * Import the singleton `logger` instance everywhere — never instantiate directly.
 *
 * Key behaviors:
 * - Debug output controlled by debug_enabled flag in operator settings
 * - Per-category debug toggles (state_changes, api_calls, etc.)
 * - INFO and above written persistently to Supabase app_logs table
 * - ERROR and CRITICAL always written to Supabase regardless of debug flag
 * - In production, DEBUG is off — nothing leaks to the console
 * - Queues log writes until operator is authenticated, then flushes
 */

import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// AppLogger class
// ---------------------------------------------------------------------------

class AppLogger {
  /**
   * @param {Function} getSettings - Returns current operator settings object.
   *   Wire this after SettingsContext is initialized.
   *   Default reads from window.__nexawyn_settings__ set by the app root.
   */
  constructor(getSettings) {
    this._getSettings  = getSettings
    this._operatorId   = null   // set after auth via setOperatorId()
    this._queue        = []     // buffer for writes before auth is ready
    this._flushing     = false
  }

  /**
   * Call this after the operator logs in.
   * Required before any logs write to Supabase.
   *
   * @param {string} operatorId - UUID from Supabase auth
   */
  setOperatorId(operatorId) {
    this._operatorId = operatorId
    this._flushQueue()
  }

  // ------------------------------------------------------------------
  // Public log methods — use these everywhere in the app
  // ------------------------------------------------------------------

  /**
   * Debug output for a specific category.
   * Only emits if debug_enabled AND that category's flag is on in settings.
   * Never writes to Supabase — console only.
   *
   * @param {string} category - e.g. 'state_changes', 'api_calls'
   * @param {string} msg
   * @param {Object} [metadata]
   */
  debug(category, msg, metadata = {}) {
    const settings = this._getSettings()
    if (!settings?.debug_enabled) return
    if (!settings?.[`debug_log_${category}`]) return
    console.debug(`[DEBUG:${category}]`, msg, Object.keys(metadata).length ? metadata : '')
  }

  /**
   * Normal operation milestone.
   * Written to Supabase app_logs.
   * Examples: job created, quote sent, payment received.
   *
   * @param {string} category - e.g. 'jobs', 'quotes', 'sms', 'photos'
   * @param {string} msg
   * @param {Object} [metadata]
   */
  info(category, msg, metadata = {}) {
    this._emit('INFO', category, msg, metadata)
  }

  /**
   * Unexpected but recoverable situation.
   * Written to Supabase app_logs.
   * Examples: SMS delivery failed and will retry; HD SKU not found in catalog.
   *
   * @param {string} category
   * @param {string} msg
   * @param {Object} [metadata]
   */
  warning(category, msg, metadata = {}) {
    console.warn(`[WARNING:${category}]`, msg)
    this._emit('WARNING', category, msg, metadata)
  }

  /**
   * Something failed that should not have.
   * Always written to Supabase and console, regardless of debug settings.
   * Examples: Stripe webhook missed, sync crashed, Supabase query failed.
   *
   * @param {string} category
   * @param {string} msg
   * @param {Object} [metadata]
   */
  error(category, msg, metadata = {}) {
    console.error(`[ERROR:${category}]`, msg, metadata)
    this._emit('ERROR', category, msg, metadata)
  }

  /**
   * App cannot continue for this operator.
   * Always written to Supabase and console.
   * Examples: auth session broken, database unreachable.
   *
   * @param {string} category
   * @param {string} msg
   * @param {Object} [metadata]
   */
  critical(category, msg, metadata = {}) {
    console.error(`[CRITICAL:${category}]`, msg, metadata)
    this._emit('CRITICAL', category, msg, metadata)
  }

  // ------------------------------------------------------------------
  // Internal
  // ------------------------------------------------------------------

  _emit(level, category, msg, metadata = {}, jobId = null) {
    const entry = {
      operator_id: this._operatorId,
      job_id:      jobId,
      level,
      category,
      message:     msg,
      metadata:    Object.keys(metadata).length ? metadata : null,
      created_at:  new Date().toISOString(),
    }

    if (!this._operatorId) {
      // Not authenticated yet — queue the write
      this._queue.push(entry)
      return
    }

    this._write(entry)
  }

  async _write(entry) {
    try {
      await supabase.from('app_logs').insert(entry)
    } catch (err) {
      // Logger errors never crash the app — silent fallback only
      console.error('[logger] Failed to write to Supabase:', err.message)
    }
  }

  async _flushQueue() {
    if (this._flushing || this._queue.length === 0) return
    this._flushing = true
    const pending = [...this._queue]
    this._queue = []
    for (const entry of pending) {
      entry.operator_id = this._operatorId
      await this._write(entry)
    }
    this._flushing = false
  }
}

// ---------------------------------------------------------------------------
// Singleton export — import this instance everywhere in the app
// ---------------------------------------------------------------------------

/**
 * Shared logger instance.
 * Import and use this directly — never instantiate AppLogger in a component.
 *
 * Setup in your app root (e.g. App.jsx or AuthContext):
 *   import { logger } from '../lib/logger'
 *   logger.setOperatorId(user.id)   // call this after login
 *
 * Wire settings after SettingsContext initializes:
 *   window.__app_settings__ = settings  // set this in SettingsProvider
 *
 * Usage anywhere:
 *   import { logger } from '../lib/logger'
 *   logger.info('jobs', 'Job created', { jobId: newJob.id })
 *   logger.error('sms', 'Failed to send quote SMS', { error: err.message })
 *   logger.debug('state_changes', `Status changed to ${newStatus}`)
 */
export const logger = new AppLogger(() => {
  // Reads live settings from window — replace with your context access pattern.
  // In the SettingsProvider, add: window.__app_settings__ = settings
  try {
    return window.__app_settings__ ?? {}
  } catch {
    return {}
  }
})
