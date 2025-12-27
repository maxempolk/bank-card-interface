import type { User } from '@/types/user'
import type { Transaction } from '@/types/transaction'
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
