import crypto from 'crypto'

/**
 * Generates a unique hash for a transaction based on its properties.
 * Used to detect duplicate transactions since DNB doesn't provide unique IDs.
 */
export function generateTransactionHash(
  date: Date | string,
  amount: number,
  type: 'credit' | 'debit',
  description: string
): string {
  const dateStr = date instanceof Date ? date.toISOString() : date
  const normalized = `${dateStr}|${amount.toFixed(2)}|${type}|${description}`

  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex')
}
