'use client'

import { memo } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { TransactionItem } from './transaction-item'
import type { Transaction } from '@/types/transaction'

interface TransactionListProps {
  transactions: Transaction[]
  hasMore?: boolean
  isLoadingMore?: boolean
  totalCount?: number
  onLoadMore?: () => void
}

export const TransactionList = memo(function TransactionList({
  transactions,
  hasMore = false,
  isLoadingMore = false,
  totalCount,
  onLoadMore,
}: TransactionListProps) {
  return (
    <Card className="border border-border/50 bg-card shadow-sm">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-balance text-base font-semibold">
            История операций
            {totalCount !== undefined && totalCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({transactions.length} из {totalCount})
              </span>
            )}
          </h2>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Нет операций
          </div>
        ) : (
          <div className="space-y-0.5">
            {transactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                isLast={index === transactions.length - 1 && !hasMore}
              />
            ))}
          </div>
        )}

        {hasMore && onLoadMore && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="w-full"
            >
              {isLoadingMore ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Загрузка...
                </>
              ) : (
                'Показать еще'
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
})
