/**
 * snippets/logger.ts
 *
 * Unified debug + logging layer. Web equivalent of logger.py.
 * Copy into src/lib/logger.ts. Import the singleton `logger` everywhere.
 *
 * Behaviors
 * - debug():   console only, and only if debug_enabled AND the category is listed in debug_categories.
 * - info()+:   written to the app_logs table (persistent).
 * - error()/critical(): also always go to the console.
 * - Writes queue until a tenant id is known (before login), then flush.
 * - Metadata is redacted: keys that look like secrets are masked before anything is stored or printed.
 * - The logger NEVER throws. A logging failure must not crash the app.
 *
 * Wiring (no window globals):
 *   SettingsProvider calls  logger.setSettingsSource(() => settings)
 *   Auth/tenant bootstrap calls  logger.setTenantId(tenantId)
 *
 * Crash reporting is a separate tool (e.g. Sentry) — a crashed app cannot write to its own log table.
 */
import { supabase } from '@/lib/supabase/client'
import type { LogCategory } from '@/constants'

type Level = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
type Meta = Record<string, unknown>
interface DebugSettings { debug_enabled: boolean; debug_categories: string[] }
interface LogRow {
  tenant_id: string | null; level: Level; category: string
  message: string; metadata: Meta | null; created_at: string
}

/** Keys whose values are masked in logs. Extend as needed. */
const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|api[_-]?key|cookie|ssn|card/i

/** Return a copy of `meta` with sensitive values masked (shallow + one level of nesting). */
function redact(meta: Meta): Meta {
  const out: Meta = {}
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEY.test(k)) out[k] = '[redacted]'
    else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = redact(v as Meta)
    else out[k] = v
  }
  return out
}

class AppLogger {
  private getSettings: () => DebugSettings | undefined = () => undefined
  private tenantId: string | null = null
  private queue: LogRow[] = []

  /** Provide a function that returns the live settings. Called by SettingsProvider. */
  setSettingsSource(fn: () => DebugSettings | undefined) { this.getSettings = fn }

  /** Call after login. Flushes anything queued before the tenant was known. */
  setTenantId(id: string | null) {
    this.tenantId = id
    if (id) void this.flush()
  }

  /** Debug output — console only, flag-controlled, zero cost when off. */
  debug(category: LogCategory | string, msg: string, meta: Meta = {}) {
    const s = this.getSettings()
    if (!s?.debug_enabled || !s.debug_categories.includes(category)) return
    console.debug(`[DEBUG:${category}]`, msg, Object.keys(meta).length ? redact(meta) : '') // eslint-disable-line no-console
  }

  /** Normal milestone (record created, payment received). Persisted. */
  info(category: LogCategory | string, msg: string, meta: Meta = {}) { this.emit('INFO', category, msg, meta) }

  /** Unexpected but recoverable. Persisted. */
  warning(category: LogCategory | string, msg: string, meta: Meta = {}) {
    console.warn(`[WARNING:${category}]`, msg) // eslint-disable-line no-console
    this.emit('WARNING', category, msg, meta)
  }

  /** Something failed that should not have. Always persisted + console. */
  error(category: LogCategory | string, msg: string, meta: Meta = {}) {
    console.error(`[ERROR:${category}]`, msg, redact(meta)) // eslint-disable-line no-console
    this.emit('ERROR', category, msg, meta)
  }

  /** App cannot continue for this tenant. Always persisted + console. */
  critical(category: LogCategory | string, msg: string, meta: Meta = {}) {
    console.error(`[CRITICAL:${category}]`, msg, redact(meta)) // eslint-disable-line no-console
    this.emit('CRITICAL', category, msg, meta)
  }

  private emit(level: Level, category: string, message: string, meta: Meta) {
    const row: LogRow = {
      tenant_id: this.tenantId, level, category, message,
      metadata: Object.keys(meta).length ? redact(meta) : null,
      created_at: new Date().toISOString(),
    }
    if (!this.tenantId) { this.queue.push(row); return }
    void this.write(row)
  }

  private async write(row: LogRow) {
    try {
      await supabase.from('app_logs').insert(row)
    } catch (err) {
      // Logger failures never crash the app — console fallback only.
      console.error('[logger] write failed:', err instanceof Error ? err.message : err) // eslint-disable-line no-console
    }
  }

  private async flush() {
    const pending = this.queue.splice(0)
    for (const row of pending) await this.write({ ...row, tenant_id: this.tenantId })
  }
}

/** Shared logger. Never instantiate AppLogger in a component. */
export const logger = new AppLogger()
