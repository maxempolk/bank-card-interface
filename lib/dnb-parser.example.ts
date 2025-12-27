// Пример парсинга ответа DNB API

import type { DNBTransactionRaw } from '@/types/dnb'
import { getTransactionDescription } from './transaction-utils'
// Функция парсинга транзакций
export function parseDNBTransactions(rawTransactions: DNBTransactionRaw[]) {
  return rawTransactions.map((tx, index) => {
    const amount = parseFloat(tx.amount.amount)

    return {
      id: String(index + 1),
      amount: amount,
      date: new Date(tx.transactionDate),
      type: (amount >= 0 ? 'credit' : 'debit') as const,
      description: getTransactionDescription(tx.transactionType),
    }
  })
}