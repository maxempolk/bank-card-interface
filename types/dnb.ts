export interface DNBBalanceResponse {
  balance: number | null
}

export interface DNBTransactionAmount {
  currency: string
  amount: string
}

export interface DNBTransactionRaw {
  amount: DNBTransactionAmount
  transactionDate: string
  transactionType?: string
}

export interface DNBTransaction {
  id?: string
  amount: number
  date: string
  description?: string
  type?: 'credit' | 'debit'
}

export interface DNBTransactionsResponse {
  transactions: DNBTransactionRaw[]
}

export interface DNBApiRequest {
  accountNumber: string
}
