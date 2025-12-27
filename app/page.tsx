"use client"

import { BalanceCard } from "@/components/balance-card"
import { RegistrationForm } from "@/components/registration-form"
import { useEffect, useState, Suspense } from "react"
import { getTransactionDescription } from "@/lib/transaction-utils"
import { useSearchParams } from "next/navigation"

function HomeContent() {
  const searchParams = useSearchParams()
  const isChangingCard = searchParams.get("change-card") === "true"

  const [isRegistered, setIsRegistered] = useState(false)
  const [isCheckingUser, setIsCheckingUser] = useState(true)
  const [telegramUserId, setTelegramUserId] = useState("")
  const [accountNumber, setAccountNumber] = useState("")

  const [currentBalance, setCurrentBalance] = useState(0.0)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [transactions, setTransactions] = useState([
    {
      id: "1",
      amount: 5000,
      date: new Date(2025, 11, 24, 14, 30),
      type: "credit" as const,
      description: "Пополнение счета",
    },
    {
      id: "2",
      amount: -1250.5,
      date: new Date(2025, 11, 23, 18, 45),
      type: "debit" as const,
      description: "Покупка в магазине",
    },
    {
      id: "3",
      amount: 12000,
      date: new Date(2025, 11, 22, 10, 15),
      type: "credit" as const,
      description: "Зачисление зарплаты",
    },
    {
      id: "4",
      amount: -2500,
      date: new Date(2025, 11, 21, 16, 20),
      type: "debit" as const,
      description: "Оплата коммунальных услуг",
    },
    {
      id: "5",
      amount: -890.75,
      date: new Date(2025, 11, 20, 12, 30),
      type: "debit" as const,
      description: "Ресторан",
    },
  ])

  const [isLoading, setIsLoading] = useState(false)

  // function getCardNumberByAccountNumber(){
  //   return accountNumber.slice(0, -1)
  // }

  // Получаем Telegram User ID из WebApp
  useEffect(() => {
    document.documentElement.classList.add("dark")

    console.log('[DEBUG] Starting Telegram WebApp initialization...')
    console.log('[DEBUG] window type:', typeof window)
    console.log('[DEBUG] window.Telegram exists:', typeof window !== 'undefined' ? !!window.Telegram : 'N/A')
    console.log('[DEBUG] window.Telegram?.WebApp exists:', typeof window !== 'undefined' && window.Telegram ? !!window.Telegram.WebApp : 'N/A')

    // Проверяем, запущено ли приложение в Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      console.log('[DEBUG] Telegram WebApp detected!')
      console.log('[DEBUG] WebApp object:', tg)
      console.log('[DEBUG] initDataUnsafe:', tg.initDataUnsafe)
      console.log('[DEBUG] initData:', tg.initData)

      tg.ready()

      const userId = tg.initDataUnsafe?.user?.id?.toString() || ""
      console.log('[DEBUG] Extracted userId:', userId)
      console.log('[DEBUG] User object:', tg.initDataUnsafe?.user)

      if (userId) {
        console.log('[DEBUG] Using REAL Telegram user ID:', userId)
        setTelegramUserId(userId)
        checkUserRegistration(userId)
      } else {
        // Для тестирования без Telegram
        console.warn('[WARNING] No userId found in initDataUnsafe, creating TEST user')
        const testUserId = "test_user_" + Date.now()
        console.log('[DEBUG] Created TEST user ID:', testUserId)
        setTelegramUserId(testUserId)
        setIsCheckingUser(false)
      }
    } else {
      // Для тестирования без Telegram
      console.warn('[WARNING] Telegram WebApp not detected, creating TEST user')
      const testUserId = "test_user_" + Date.now()
      console.log('[DEBUG] Created TEST user ID:', testUserId)
      setTelegramUserId(testUserId)
      setIsCheckingUser(false)
    }
  }, [])

  // Проверяем, зарегистрирован ли пользователь
  const checkUserRegistration = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/${userId}`)

      if (response.ok) {
        const userData = await response.json()
        setAccountNumber(userData.card_number)
        setIsRegistered(true)
        // Загружаем данные сразу после проверки регистрации
        fetchBalanceAndTransactions(userData.card_number)
      } else {
        setIsRegistered(false)
      }
    } catch (error) {
      console.error("Error checking user registration:", error)
      setIsRegistered(false)
    } finally {
      setIsCheckingUser(false)
    }
  }

  const handleRegistrationComplete = (cardNumber: string) => {
    setAccountNumber(cardNumber)
    setIsRegistered(true)
    fetchBalanceAndTransactions(cardNumber)
  }

  const fetchBalanceAndTransactions = async (cardNum?: string) => {
    const cardToUse = cardNum || accountNumber
    if (!cardToUse) return

    setIsLoading(true)
    try {
      // Выполняем оба запроса параллельно
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetch("/api/dnb/balance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accountNumber: cardToUse.slice(0, -1) }),
        }),
        fetch("/api/dnb/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accountNumber: cardToUse.slice(0, -1) }),
        }),
      ])

      // Обрабатываем баланс
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        if (balanceData.balance !== null && balanceData.balance !== undefined) {
          setCurrentBalance(balanceData.balance)
          setLastUpdate(new Date())
        }
      }

      // Обрабатываем транзакции
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        if (transactionsData.transactions && transactionsData.transactions.length > 0) {
          const formattedTransactions = transactionsData.transactions.map((tx: any, index: number) => {
            // Парсим сумму из строки в число
            const amount = parseFloat(tx.amount?.amount || "0")

            return {
              id: String(index + 1),
              amount: amount,
              date: tx.transactionDate ? new Date(tx.transactionDate) : new Date(),
              type: (amount >= 0 ? "credit" : "debit") as const,
              description: getTransactionDescription(tx.transactionType),
            }
          })
          setTransactions(formattedTransactions)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingUser) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </main>
    )
  }

  if (!isRegistered || isChangingCard) {
    return (
      <RegistrationForm
        telegramUserId={telegramUserId}
        onComplete={handleRegistrationComplete}
        isChangingCard={isChangingCard}
      />
    )
  }

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center">
        <BalanceCard
          balance={currentBalance}
          lastUpdate={lastUpdate}
          transactions={transactions}
          cardNumber={accountNumber}
          onRefresh={() => fetchBalanceAndTransactions()}
          isRefreshing={isLoading}
        />
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}
