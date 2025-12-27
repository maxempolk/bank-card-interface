import { useState, useRef, useCallback, useEffect } from 'react'
import type { RefObject } from 'react'
import { PULL_TO_REFRESH } from '@/constants'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  isRefreshing?: boolean
  containerRef: RefObject<HTMLElement | null>
}

interface UsePullToRefreshResult {
  pullDistance: number
  isPulling: boolean
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
    onWheel: (e: React.WheelEvent) => void
  }
}

export function usePullToRefresh({
  onRefresh,
  isRefreshing = false,
  containerRef,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const isPulling = useRef(false)

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return
    await onRefresh()
  }, [onRefresh, isRefreshing])

  // Prevent default browser pull-to-refresh
  useEffect(() => {
    const preventPullToRefresh = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (containerRef.current?.contains(target)) {
        const scrollTop = containerRef.current?.scrollTop ?? 0
        if (scrollTop === 0 && e.touches[0].clientY > startY.current) {
          e.preventDefault()
        }
      }
    }

    document.addEventListener('touchmove', preventPullToRefresh, { passive: false })
    return () => document.removeEventListener('touchmove', preventPullToRefresh)
  }, [containerRef])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
      e.stopPropagation()
    }
  }, [containerRef])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    if (distance > 0 && distance < PULL_TO_REFRESH.MAX_DISTANCE) {
      setPullDistance(distance)
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > PULL_TO_REFRESH.THRESHOLD) {
      triggerRefresh()
    }
    setPullDistance(0)
    isPulling.current = false
  }, [pullDistance, triggerRefresh])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const scrollTop = containerRef.current?.scrollTop ?? 0
    if (scrollTop === 0) {
      startY.current = e.clientY
      isPulling.current = true
      e.preventDefault()
    }
  }, [containerRef])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPulling.current) return

    const distance = e.clientY - startY.current

    if (distance > 0 && distance < PULL_TO_REFRESH.MAX_DISTANCE) {
      setPullDistance(distance)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (pullDistance > PULL_TO_REFRESH.THRESHOLD) {
      triggerRefresh()
    }
    setPullDistance(0)
    isPulling.current = false
  }, [pullDistance, triggerRefresh])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY < -50 && !isRefreshing) {
      triggerRefresh()
    }
  }, [isRefreshing, triggerRefresh])

  return {
    pullDistance,
    isPulling: isPulling.current,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onWheel: handleWheel,
    },
  }
}
