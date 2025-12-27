// MongoDB document schema for stored transactions
export interface StoredTransaction {
  _id?: string
  transaction_hash: string
  telegram_user_id: string
  account_number: string
  amount: number
  date: Date
  type: 'credit' | 'debit'
  description: string
  original_type?: string
  created_at: Date
}

// API response for paginated transactions
export interface PaginatedTransactionsResponse {
  transactions: StoredTransaction[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Request body for saving transactions
export interface SaveTransactionsRequest {
  telegram_user_id: string
  account_number: string
  transactions: Array<{
    amount: number
    date: string
    type: 'credit' | 'debit'
    description: string
    original_type?: string
  }>
}

// Response from save endpoint
export interface SaveTransactionsResponse {
  success: boolean
  inserted: number
  duplicates: number
  error?: string
}
