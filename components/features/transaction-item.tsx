'use client'

import { memo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { Transaction } from '@/types/transaction'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

interface TransactionItemProps {
  transaction: Transaction
  isLast?: boolean
}

export const TransactionItem = memo(function TransactionItem({
  transaction,
  isLast = false,
}: TransactionItemProps) {
  const isCredit = transaction.type === 'credit'

  return (
    <div
      className={`flex items-center justify-between rounded-md p-3 transition-colors hover:bg-muted/50 ${
        !isLast ? 'border-b border-border/30' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            isCredit ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'
          }`}
        >
          {isCredit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-sm font-medium leading-none">{transaction.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(transaction.date)}</p>
        </div>
      </div>
      <div
        className={`text-right font-mono text-sm font-semibold ${
          isCredit ? 'text-accent' : 'text-foreground'
        }`}
      >
        {isCredit ? '+' : '−'}
        {formatCurrency(Math.abs(transaction.amount))}
      </div>
    </div>
  )
})
