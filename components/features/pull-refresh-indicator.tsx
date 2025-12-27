'use client'

import { Loader2 } from 'lucide-react'
import { PULL_TO_REFRESH } from '@/constants'

interface PullRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
}

export function PullRefreshIndicator({
  pullDistance,
  isRefreshing,
}: PullRefreshIndicatorProps) {
  const shouldShow = pullDistance > 0 || isRefreshing

  if (!shouldShow) return null

  return (
    <div
      className="flex justify-center transition-all duration-200"
      style={{
        height: isRefreshing
          ? `${PULL_TO_REFRESH.INDICATOR_HEIGHT}px`
          : `${Math.min(pullDistance, PULL_TO_REFRESH.INDICATOR_HEIGHT)}px`,
        opacity: isRefreshing ? 1 : pullDistance / PULL_TO_REFRESH.THRESHOLD,
      }}
    >
      <Loader2 className={`h-6 w-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
    </div>
  )
}
