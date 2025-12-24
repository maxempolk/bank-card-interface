// Пример парсинга ответа DNB API

import type { DNBTransactionRaw } from '@/types/dnb'
import { getTransactionDescription } from './transaction-utils'

// Пример ответа от DNB API
const exampleResponse = {
  transactions: [
    {
      amount: {
        currency: 'NOK',
        amount: '-19.90',
      },
      transactionDate: '2025-12-23',
    },
    {
      amount: {
        currency: 'NOK',
        amount: '-455.17',
      },
      transactionDate: '2025-12-23',
      transactionType: 'Varekjøp',
    },
    {
      amount: {
        currency: 'NOK',
        amount: '-48.00',
      },
      transactionDate: '2025-12-23',
      transactionType: 'Varekjøp',
    },
    {
      amount: {
        currency: 'NOK',
        amount: '-298.78',
      },
      transactionDate: '2025-12-23',
      transactionType: 'Varekjøp',
    },
    {
      amount: {
        currency: 'NOK',
        amount: '-49.90',
      },
      transactionDate: '2025-12-23',
      transactionType: 'Varekjøp',
    },
  ],
}

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

// Пример использования
const parsedTransactions = parseDNBTransactions(exampleResponse.transactions)
console.log(parsedTransactions)

/* Результат:
[
  {
    id: '1',
    amount: -19.9,
    date: 2025-12-23T00:00:00.000Z,
    type: 'debit',
    description: 'Транзакция'
  },
  {
    id: '2',
    amount: -455.17,
    date: 2025-12-23T00:00:00.000Z,
    type: 'debit',
    description: 'Покупка товаров'
  },
  {
    id: '3',
    amount: -48.0,
    date: 2025-12-23T00:00:00.000Z,
    type: 'debit',
    description: 'Покупка товаров'
  },
  {
    id: '4',
    amount: -298.78,
    date: 2025-12-23T00:00:00.000Z,
    type: 'debit',
    description: 'Покупка товаров'
  },
  {
    id: '5',
    amount: -49.9,
    date: 2025-12-23T00:00:00.000Z,
    type: 'debit',
    description: 'Покупка товаров'
  }
]
*/
