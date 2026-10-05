/**
 * snippets/money.ts
 *
 * Money is INTEGER CENTS. Never floats — 0.1 + 0.2 !== 0.3 in JavaScript.
 * Copy into src/lib/money.ts. Pure functions only, so they are trivial to unit test.
 */

/** Parse a user-entered dollar string ("12.34", "$1,200") to integer cents. Throws on garbage. */
export function dollarsToCents(input: string): number {
  const cleaned = input.replace(/[$,\s]/g, '')
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) throw new Error(`Invalid money amount: "${input}"`)
  return Math.round(parseFloat(cleaned) * 100)
}

/** Format integer cents for display, e.g. 123456 -> "$1,234.56". */
export function formatCents(cents: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100)
}

/** Sum a list of integer-cent amounts. */
export const sumCents = (amounts: readonly number[]): number => amounts.reduce((a, b) => a + b, 0)

/**
 * Apply a decimal rate (0.20 = 20%) and round ONCE, to the nearest cent.
 * Round at the last step only — rounding every line item compounds errors.
 */
export const applyRate = (cents: number, rate: number): number => Math.round(cents * rate)
