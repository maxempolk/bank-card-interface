import { useState, useCallback, useRef, useEffect } from 'react'
import type { Transaction } from '@/types/transaction'
import {
  fetchBankDataWithPersistence,
  fetchStoredTransactions,
  fetchBalance,
} from '@/services/api'

interface UseBankDataResult {
  balance: number
  lastUpdate: Date
  transactions: Transaction[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  totalTransactions: number
  refresh: (cardNumber?: string) => Promise<void>
  loadMore: () => Promise<void>
}

const PAGE_SIZE = 10

export function useBankData(
  initialCardNumber: string,
  telegramUserId: string
): UseBankDataResult {
  const [balance, setBalance] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)

  const abortControllerRef = useRef<AbortController | null>(null)
  const cardNumberRef = useRef(initialCardNumber)
  const userIdRef = useRef(telegramUserId)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    cardNumberRef.current = initialCardNumber
  }, [initialCardNumber])

  useEffect(() => {
    userIdRef.current = telegramUserId
  }, [telegramUserId])

  // Load transactions from MongoDB
  const loadFromDatabase = useCallback(async (page: number = 0) => {
    if (!userIdRef.current) return null

    const result = await fetchStoredTransactions(userIdRef.current, page, PAGE_SIZE)
    if (result) {
      const uiTransactions: Transaction[] = result.transactions.map((tx) => ({
        id: tx.transaction_hash || tx._id || String(Math.random()),
        amount: tx.amount,
        date: tx.date,
        type: tx.type,
        description: tx.description,
      }))

      return {
        transactions: uiTransactions,
        total: result.total,
        hasMore: result.hasMore,
      }
    }
    return null
  }, [])

  // Refresh: fetch from DNB API and save to MongoDB
  const refresh = useCallback(async (cardNumber?: string) => {
    const cardToUse = cardNumber || cardNumberRef.current
    const userId = userIdRef.current

    if (!cardToUse || cardToUse.trim().length === 0) return

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    try {
      // Fetch balance from DNB
      const balanceResult = await fetchBalance(
        cardToUse,
        abortControllerRef.current.signal
      )

      if (balanceResult !== null) {
        setBalance(balanceResult)
        setLastUpdate(new Date())
      }

      // Fetch transactions and save to DB
      if (userId) {
        await fetchBankDataWithPersistence(
          cardToUse,
          userId,
          abortControllerRef.current.signal
        )

        // Reload from DB after saving
        setTimeout(async () => {
          const dbResult = await loadFromDatabase(0)
          if (dbResult) {
            setTransactions(dbResult.transactions)
            setTotalTransactions(dbResult.total)
            setHasMore(dbResult.hasMore)
            setCurrentPage(0)
          }
        }, 100)
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [loadFromDatabase])

  // Load more transactions (pagination)
  const loadMore = useCallback(async () => {
    if (!userIdRef.current || !hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    const nextPage = currentPage + 1

    try {
      const result = await loadFromDatabase(nextPage)
      if (result) {
        setTransactions((prev) => [...prev, ...result.transactions])
        setCurrentPage(nextPage)
        setHasMore(result.hasMore)
        setTotalTransactions(result.total)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [currentPage, hasMore, isLoadingMore, loadFromDatabase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Initial load - runs only once
  useEffect(() => {
    if (hasInitializedRef.current) return
    if (!initialCardNumber || !telegramUserId) return

    hasInitializedRef.current = true

    const init = async () => {
      // First load from DB
      const dbResult = await loadFromDatabase(0)
      if (dbResult) {
        setTransactions(dbResult.transactions)
        setTotalTransactions(dbResult.total)
        setHasMore(dbResult.hasMore)
      }

      // Then refresh from DNB
      refresh(initialCardNumber)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCardNumber, telegramUserId])

  return {
    balance,
    lastUpdate,
    transactions,
    isLoading,
    isLoadingMore,
    hasMore,
    totalTransactions,
    refresh,
    loadMore,
  }
}
