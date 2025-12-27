'use client'

import { memo } from 'react'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface BalanceDisplayProps {
  balance: number
  lastUpdate: Date
}

export const BalanceDisplay = memo(function BalanceDisplay({
  balance,
  lastUpdate,
}: BalanceDisplayProps) {
  return (
    <>
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Текущий баланс
        </p>
        <p className="text-balance font-mono text-3xl font-bold tracking-tight">
          {formatCurrency(balance)}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <span>Обновлено: {formatDate(lastUpdate)}</span>
      </div>
    </>
  )
})
