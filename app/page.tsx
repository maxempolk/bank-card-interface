'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BalanceCard } from '@/components/balance-card'
import { RegistrationForm } from '@/components/registration-form'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useTelegramUser } from '@/hooks/use-telegram-user'
import { useBankData } from '@/hooks/use-bank-data'

function HomeContent() {
  const searchParams = useSearchParams()
  const isChangingCard = searchParams.get('change-card') === 'true'

  const {
    telegramUserId,
    isRegistered,
    isCheckingUser,
    cardNumber,
    handleRegistrationComplete,
  } = useTelegramUser()

  const { balance, lastUpdate, transactions, isLoading, refresh } = useBankData(
    isRegistered ? cardNumber : ''
  )

  const handleComplete = (newCardNumber: string) => {
    handleRegistrationComplete(newCardNumber)
    refresh(newCardNumber)
  }

  if (isCheckingUser) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </main>
    )
  }

  if (!isRegistered || isChangingCard) {
    return (
      <RegistrationForm
        telegramUserId={telegramUserId}
        onComplete={handleComplete}
        isChangingCard={isChangingCard}
      />
    )
  }

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center">
        <BalanceCard
          balance={balance}
          lastUpdate={lastUpdate}
          transactions={transactions}
          cardNumber={cardNumber}
          onRefresh={refresh}
          isRefreshing={isLoading}
        />
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
