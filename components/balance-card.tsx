'use client'

import { useRef } from 'react'
import { Card } from '@/components/ui/card'
import { SettingsButton } from '@/components/features/settings-button'
import { CardNumberDisplay } from '@/components/features/card-number-display'
import { BalanceDisplay } from '@/components/features/balance-display'
import { TransactionList } from '@/components/features/transaction-list'
import { PullRefreshIndicator } from '@/components/features/pull-refresh-indicator'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import type { Transaction } from '@/types/transaction'

interface BalanceCardProps {
  balance: number
  lastUpdate: Date
  transactions: Transaction[]
  cardNumber: string
  onRefresh?: () => Promise<void>
  isRefreshing?: boolean
}

export function BalanceCard({
  balance,
  lastUpdate,
  transactions,
  cardNumber,
  onRefresh,
  isRefreshing = false,
}: BalanceCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { pullDistance, handlers } = usePullToRefresh({
    onRefresh: onRefresh || (async () => {}),
    isRefreshing,
    containerRef,
  })

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md space-y-4"
      {...handlers}
    >
      <SettingsButton />

      <PullRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

      <Card className="overflow-hidden border border-border/50 bg-card shadow-lg cursor-grab active:cursor-grabbing">
        <div className="relative p-6">
          <CardNumberDisplay cardNumber={cardNumber} />
          <BalanceDisplay balance={balance} lastUpdate={lastUpdate} />
        </div>
      </Card>

      <TransactionList transactions={transactions} />
    </div>
  )
}
