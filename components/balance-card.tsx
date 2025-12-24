"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { ArrowUpRight, TrendingUp, TrendingDown, Loader2, Copy, Check, Settings } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Transaction {
  id: string
  amount: number
  date: Date
  type: "credit" | "debit"
  description: string
}

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
  isRefreshing: externalIsRefreshing = false
}: BalanceCardProps) {
  const router = useRouter()
  const [internalIsRefreshing, setInternalIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const isRefreshing = externalIsRefreshing || internalIsRefreshing
  const [isCopied, setIsCopied] = useState(false)
  const startY = useRef(0)
  const isPulling = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Глобальный обработчик для предотвращения pull-to-refresh
    const preventPullToRefresh = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      // Проверяем, находится ли элемент внутри нашего контейнера
      if (containerRef.current?.contains(target) || cardRef.current?.contains(target)) {
        const touch = e.touches[0]
        const scrollTop = containerRef.current?.scrollTop ?? 0

        if (scrollTop === 0 && touch.clientY > (startY.current || 0)) {
          e.preventDefault()
        }
      }
    }

    // Добавляем обработчик с { passive: false } для возможности preventDefault
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false })

    return () => {
      document.removeEventListener('touchmove', preventPullToRefresh)
    }
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
      e.stopPropagation()
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    if (distance > 0 && distance < 150) {
      setPullDistance(distance)
      // Предотвращаем стандартное pull-to-refresh поведение браузера
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      triggerRefresh()
    }
    setPullDistance(0)
    isPulling.current = false
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const scrollTop = containerRef.current?.scrollTop ?? 0
    if (scrollTop === 0) {
      startY.current = e.clientY
      isPulling.current = true
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPulling.current) return

    const currentY = e.clientY
    const distance = currentY - startY.current

    if (distance > 0 && distance < 150) {
      setPullDistance(distance)
    }
  }

  const handleMouseUp = () => {
    if (pullDistance > 80) {
      triggerRefresh()
    }
    setPullDistance(0)
    isPulling.current = false
  }

  const handleCardMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY
    isPulling.current = true
  }

  const handleCardMouseMove = (e: React.MouseEvent) => {
    if (!isPulling.current) return

    const currentY = e.clientY
    const distance = currentY - startY.current

    if (distance > 0 && distance < 150) {
      setPullDistance(distance)
    }
  }

  const handleCardMouseUp = () => {
    if (pullDistance > 80) {
      triggerRefresh()
    }
    setPullDistance(0)
    isPulling.current = false
  }

  const handleCardTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    isPulling.current = true
    // Предотвращаем любое стандартное поведение
    e.stopPropagation()
  }

  const handleCardTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    if (distance > 0 && distance < 150) {
      setPullDistance(distance)
      // Предотвращаем стандартное pull-to-refresh поведение браузера
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const handleCardTouchEnd = () => {
    if (pullDistance > 80) {
      triggerRefresh()
    }
    setPullDistance(0)
    isPulling.current = false
  }

  const handleWheel = (e: React.WheelEvent) => {
    // Определяем прокрутку вниз (bounce effect на macOS)
    if (e.deltaY < -50 && !isRefreshing) {
      triggerRefresh()
    }
  }

  const triggerRefresh = async () => {
    if (isRefreshing) return

    if (onRefresh) {
      // Используем внешний onRefresh, если он предоставлен
      await onRefresh()
    } else {
      // Иначе просто симулируем обновление
      setInternalIsRefreshing(true)
      setTimeout(() => {
        setInternalIsRefreshing(false)
      }, 2000)
    }
  }

  const handleCopyCardNumber = async () => {
    if (isCopied) return // Предотвращаем повторное копирование во время анимации

    try {
      await navigator.clipboard.writeText(cardNumber)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: "NOK",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md space-y-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex justify-end mb-2">
        <button
          onClick={() => router.push("/settings")}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Настройки
        </button>
      </div>

      <div
        className="flex justify-center transition-all duration-200"
        style={{
          height: isRefreshing ? "40px" : `${Math.min(pullDistance, 40)}px`,
          opacity: isRefreshing ? 1 : pullDistance / 80,
        }}
      >
        {(pullDistance > 0 || isRefreshing) && (
          <Loader2 className={`h-6 w-6 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
        )}
      </div>

      {/* Main Balance Card */}
      <Card
        ref={cardRef}
        className="overflow-hidden border border-border/50 bg-card shadow-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleCardMouseDown}
        onMouseMove={handleCardMouseMove}
        onMouseUp={handleCardMouseUp}
        onMouseLeave={handleCardMouseUp}
        onTouchStart={handleCardTouchStart}
        onTouchMove={handleCardTouchMove}
        onTouchEnd={handleCardTouchEnd}
        onWheel={handleWheel}
      >
        <div className="relative p-6">
          {/* Card Number */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={handleCopyCardNumber}
              className="group flex items-center gap-2 rounded-md transition-all hover:bg-muted/50 px-2 py-1 -mx-2"
            >
              <span className="font-mono text-sm tracking-wider text-foreground">{cardNumber}</span>
              <div className="relative">
                <Copy
                  className={`h-3.5 w-3.5 text-muted-foreground transition-all ${
                    isCopied ? "scale-0 opacity-0" : "scale-100 opacity-100 group-hover:text-foreground"
                  }`}
                />
                <Check
                  className={`absolute inset-0 h-3.5 w-3.5 text-accent transition-all ${
                    isCopied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                />
              </div>
            </button>
            <div className="flex items-center gap-1">
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="2" y="18" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="currentColor" className="text-accent">
                  DNB
                </text>
              </svg>
            </div>
          </div>

          {/* Balance */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{"Текущий баланс"}</p>
            <p className="text-balance font-mono text-3xl font-bold tracking-tight">{formatCurrency(balance)}</p>
          </div>

          {/* Last Update */}
          <div className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>
              {"Обновлено"}: {formatDate(lastUpdate)}
            </span>
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="border border-border/50 bg-card shadow-sm">
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-balance text-base font-semibold">{"История операций"}</h2>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-0.5">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between rounded-md p-3 transition-colors hover:bg-muted/50 ${
                  index !== transactions.length - 1 ? "border-b border-border/30" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      transaction.type === "credit" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {transaction.type === "credit" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{transaction.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(transaction.date)}</p>
                  </div>
                </div>
                <div
                  className={`text-right font-mono text-sm font-semibold ${
                    transaction.type === "credit" ? "text-accent" : "text-foreground"
                  }`}
                >
                  {transaction.type === "credit" ? "+" : "−"}
                  {formatCurrency(Math.abs(transaction.amount))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
