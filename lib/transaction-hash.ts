import crypto from 'crypto'

/**
 * Normalizes date to YYYY-MM-DD format for consistent hashing.
 * This ensures the same transaction always produces the same hash
 * regardless of timezone or time component.
 */
function normalizeDateForHash(date: Date | string): string {
  if (typeof date === 'string') {
    // If already a date string like "2024-01-15", extract just the date part
    const dateOnly = date.split('T')[0]
    return dateOnly
  }
  // For Date objects, extract YYYY-MM-DD in UTC
  return date.toISOString().split('T')[0]
}

/**
 * Generates a unique hash for a transaction based on its properties.
 * Used to detect duplicate transactions since DNB doesn't provide unique IDs.
 *
 * Uses only date (not time) to avoid timezone-related duplicates.
 * Includes telegram_user_id to ensure uniqueness per user.
 */
export function generateTransactionHash(
  telegramUserId: string,
  date: Date | string,
  amount: number,
  type: 'credit' | 'debit',
  description: string
): string {
  const dateStr = normalizeDateForHash(date)
  const normalized = `${telegramUserId}|${dateStr}|${amount.toFixed(2)}|${type}|${description}`

  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex')
}
