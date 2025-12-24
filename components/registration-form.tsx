"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface RegistrationFormProps {
  onComplete: (cardNumber: string) => void
  telegramUserId: string
  isChangingCard?: boolean
}

export function RegistrationForm({ onComplete, telegramUserId, isChangingCard = false }: RegistrationFormProps) {
  const router = useRouter()
  const [cardNumber, setCardNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const formatCardNumber = (value: string) => {
    // Убираем все нецифровые символы
    const digits = value.replace(/\D/g, "")

    // Ограничиваем до 16 цифр
    const limited = digits.slice(0, 16)

    // Форматируем группами по 4 цифры
    const formatted = limited.match(/.{1,4}/g)?.join(" ") || limited

    return formatted
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setCardNumber(formatted)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanCardNumber = cardNumber.replace(/\s/g, "")

    // Валидация
    if (cleanCardNumber.length < 11) {
      setError("Номер карты должен содержать минимум 11 цифр")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegram_user_id: telegramUserId,
          card_number: cleanCardNumber,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (isChangingCard) {
          // Перенаправляем на главную страницу после смены карты
          router.push("/")
        } else {
          onComplete(cleanCardNumber)
        }
      } else {
        setError(data.error || "Произошла ошибка при регистрации")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("Ошибка соединения с сервером")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md overflow-hidden border border-border/50 bg-card shadow-lg">
        <div className="p-8">
          {isChangingCard && (
            <button
              onClick={() => router.push("/")}
              className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              Назад
            </button>
          )}
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center">
              <svg width="64" height="40" viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="8" y="30" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="currentColor" className="text-accent">
                  DNB
                </text>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isChangingCard ? "Смена номера карты" : "Добро пожаловать"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isChangingCard
                ? "Введите новый номер вашей банковской карты"
                : "Введите номер вашей банковской карты для начала работы"}
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
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cardNumber.replace(/\s/g, "").length < 11}
              className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Регистрация...
                </span>
              ) : (
                "Продолжить"
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
