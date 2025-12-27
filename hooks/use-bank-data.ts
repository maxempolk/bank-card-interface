import { useState, useCallback, useRef, useEffect } from 'react'
import type { Transaction } from '@/types/transaction'
import { fetchBankData } from '@/services/api'

interface UseBankDataResult {
  balance: number
  lastUpdate: Date
  transactions: Transaction[]
  isLoading: boolean
  refresh: (cardNumber?: string) => Promise<void>
}

export function useBankData(initialCardNumber: string): UseBankDataResult {
  const [balance, setBalance] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const cardNumberRef = useRef(initialCardNumber)

  useEffect(() => {
    cardNumberRef.current = initialCardNumber
  }, [initialCardNumber])

  const refresh = useCallback(async (cardNumber?: string) => {
    const cardToUse = cardNumber || cardNumberRef.current
    if (!cardToUse || cardToUse.trim().length === 0) return

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    try {
      const { balance: newBalance, transactions: newTransactions } = await fetchBankData(
        cardToUse,
        abortControllerRef.current.signal
      )

      if (newBalance !== null) {
        setBalance(newBalance)
        setLastUpdate(new Date())
      }

      if (newTransactions.length > 0) {
        setTransactions(newTransactions)
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Initial fetch when card number is set
  useEffect(() => {
    if (initialCardNumber) {
      refresh(initialCardNumber)
    }
  }, [initialCardNumber, refresh])

  return {
    balance,
    lastUpdate,
    transactions,
    isLoading,
    refresh,
  }
}
