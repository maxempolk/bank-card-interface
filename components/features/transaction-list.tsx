'use client'

import { memo } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { TransactionItem } from './transaction-item'
import type { Transaction } from '@/types/transaction'

interface TransactionListProps {
  transactions: Transaction[]
}

export const TransactionList = memo(function TransactionList({
  transactions,
}: TransactionListProps) {
  return (
    <Card className="border border-border/50 bg-card shadow-sm">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-balance text-base font-semibold">История операций</h2>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="space-y-0.5">
          {transactions.map((transaction, index) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              isLast={index === transactions.length - 1}
            />
          ))}
        </div>
      </div>
    </Card>
  )
})
