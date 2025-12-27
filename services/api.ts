import type { User } from '@/types/user'
import type { Transaction } from '@/types/transaction'
import type {
  PaginatedTransactionsResponse,
  SaveTransactionsResponse,
} from '@/types/stored-transaction'
import { getTransactionDescription } from '@/lib/transaction-utils'

interface BalanceResponse {
  balance: number | null
}

interface TransactionRaw {
  amount?: { amount?: string }
  transactionDate?: string
  transactionType?: string
}

interface TransactionsResponse {
  transactions?: TransactionRaw[]
}

export async function fetchUser(telegramUserId: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/user/${telegramUserId}`)
    if (!response.ok) return null
    return response.json()
  } catch (error) {
    console.error('[API] Error fetching user:', error)
    return null
  }
}

export async function registerUser(
  telegramUserId: string,
  cardNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_user_id: telegramUserId,
        card_number: cardNumber,
      }),
    })
    return response.json()
  } catch (error) {
    console.error('[API] Registration error:', error)
    return { success: false, error: 'Ошибка соединения с сервером' }
  }
}

function getAccountNumber(cardNumber: string): string {
  return cardNumber.slice(0, -1)
}

export async function fetchBalance(
  cardNumber: string,
  signal?: AbortSignal
): Promise<number | null> {
  try {
    const response = await fetch('/api/dnb/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumber: getAccountNumber(cardNumber) }),
      signal,
    })

    if (!response.ok) return null

    const data: BalanceResponse = await response.json()
    return data.balance
  } catch (error) {
    if ((error as Error).name === 'AbortError') return null
    console.error('[API] Error fetching balance:', error)
    return null
  }
}

export async function fetchTransactions(
  cardNumber: string,
  signal?: AbortSignal
): Promise<Transaction[]> {
  try {
    const response = await fetch('/api/dnb/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumber: getAccountNumber(cardNumber) }),
      signal,
    })

    if (!response.ok) return []

    const data: TransactionsResponse = await response.json()

    if (!data.transactions?.length) return []

    return data.transactions.map((tx, index) => {
      const amount = parseFloat(tx.amount?.amount || '0')
      return {
        id: String(index + 1),
        amount,
        date: tx.transactionDate ? new Date(tx.transactionDate) : new Date(),
        type: amount >= 0 ? 'credit' : 'debit',
        description: getTransactionDescription(tx.transactionType),
      } as Transaction
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') return []
    console.error('[API] Error fetching transactions:', error)
    return []
  }
}

export async function fetchBankData(
  cardNumber: string,
  signal?: AbortSignal
): Promise<{ balance: number | null; transactions: Transaction[] }> {
  const [balance, transactions] = await Promise.all([
    fetchBalance(cardNumber, signal),
    fetchTransactions(cardNumber, signal),
  ])
  return { balance, transactions }
}

/**
 * Save transactions to MongoDB for persistence
 */
export async function saveTransactions(
  telegramUserId: string,
  accountNumber: string,
  transactions: Transaction[]
): Promise<SaveTransactionsResponse> {
  try {
    const response = await fetch('/api/transactions/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_user_id: telegramUserId,
        account_number: accountNumber,
        transactions: transactions.map((tx) => ({
          amount: tx.amount,
          date: tx.date instanceof Date ? tx.date.toISOString() : tx.date,
          type: tx.type,
          description: tx.description,
        })),
      }),
    })

    if (!response.ok) {
      return { success: false, inserted: 0, duplicates: 0, error: 'Failed to save' }
    }

    return response.json()
  } catch (error) {
    console.error('[API] Error saving transactions:', error)
    return { success: false, inserted: 0, duplicates: 0, error: 'Network error' }
  }
}

/**
 * Fetch paginated transactions from MongoDB
 */
export async function fetchStoredTransactions(
  telegramUserId: string,
  page: number = 0,
  pageSize: number = 10,
  signal?: AbortSignal
): Promise<PaginatedTransactionsResponse | null> {
  try {
    const url = `/api/transactions/${telegramUserId}?page=${page}&pageSize=${pageSize}`
    const response = await fetch(url, { signal })

    if (!response.ok) return null

    const data: PaginatedTransactionsResponse = await response.json()

    // Convert date strings back to Date objects
    data.transactions = data.transactions.map((tx) => ({
      ...tx,
      date: new Date(tx.date),
    }))

    return data
  } catch (error) {
    if ((error as Error).name === 'AbortError') return null
    console.error('[API] Error fetching stored transactions:', error)
    return null
  }
}

/**
 * Fetch bank data and save transactions to MongoDB
 */
export async function fetchBankDataWithPersistence(
  cardNumber: string,
  telegramUserId: string,
  signal?: AbortSignal
): Promise<{ balance: number | null; transactions: Transaction[] }> {
  const [balance, transactions] = await Promise.all([
    fetchBalance(cardNumber, signal),
    fetchTransactions(cardNumber, signal),
  ])

  // Save fetched transactions to MongoDB (fire-and-forget)
  if (transactions.length > 0 && telegramUserId) {
    const accountNumber = getAccountNumber(cardNumber)
    saveTransactions(telegramUserId, accountNumber, transactions)
      .then((result) => {
        if (result.success) {
          console.log(
            `[API] Saved ${result.inserted} transactions, ${result.duplicates} duplicates`
          )
        }
      })
      .catch((err) => console.error('[API] Failed to save transactions:', err))
  }

  return { balance, transactions }
}
