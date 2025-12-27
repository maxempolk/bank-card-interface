export interface Transaction {
  id: string
  amount: number
  date: Date
  type: 'credit' | 'debit'
  description: string
}

export interface BankData {
  balance: number
  lastUpdate: Date
  transactions: Transaction[]
}
