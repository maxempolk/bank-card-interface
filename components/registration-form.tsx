'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { DNBLogo } from '@/components/ui/dnb-logo'
import { registerUser } from '@/services/api'
import { formatCardNumber, cleanCardNumber } from '@/utils/formatters'
import { CARD_NUMBER } from '@/constants'

interface RegistrationFormProps {
  onComplete: (cardNumber: string) => void
  telegramUserId: string
  isChangingCard?: boolean
}

export function RegistrationForm({
  onComplete,
  telegramUserId,
  isChangingCard = false,
}: RegistrationFormProps) {
  const router = useRouter()
  const [cardNumber, setCardNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setCardNumber(formatted)
    setError('')
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const cleanNumber = cleanCardNumber(cardNumber)

      if (cleanNumber.length < CARD_NUMBER.MIN_LENGTH) {
        setError(`Номер карты должен содержать минимум ${CARD_NUMBER.MIN_LENGTH} цифр`)
        return
      }

      setIsSubmitting(true)
      setError('')

      const result = await registerUser(telegramUserId, cleanNumber)

      if (result.success) {
        if (isChangingCard) {
          router.push('/')
        } else {
          onComplete(cleanNumber)
        }
      } else {
        setError(result.error || 'Произошла ошибка при регистрации')
      }

      setIsSubmitting(false)
    },
    [cardNumber, telegramUserId, isChangingCard, router, onComplete]
  )

  const cleanNumber = cleanCardNumber(cardNumber)
  const isValid = cleanNumber.length >= CARD_NUMBER.MIN_LENGTH

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md overflow-hidden border border-border/50 bg-card shadow-lg">
        <div className="p-8">
          {isChangingCard && (
            <button
              onClick={() => router.push('/')}
              className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              Назад
            </button>
          )}

          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center">
              <DNBLogo size="md" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isChangingCard ? 'Смена номера карты' : 'Добро пожаловать'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isChangingCard
                ? 'Введите новый номер вашей банковской карты'
                : 'Введите номер вашей банковской карты для начала работы'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="cardNumber" className="text-sm font-medium">
                Номер карты
              </label>
              <input
                id="cardNumber"
                type="text"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 font-mono text-lg tracking-wider transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Регистрация...
                </span>
              ) : (
                'Продолжить'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>Ваши данные защищены и не будут переданы третьим лицам</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
