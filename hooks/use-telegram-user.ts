import { useState, useEffect, useCallback } from 'react'
import { initializeTelegramWebApp } from '@/services/telegram'
import { fetchUser, registerUser } from '@/services/api'

interface UseTelegramUserResult {
  telegramUserId: string
  isRegistered: boolean
  isCheckingUser: boolean
  cardNumber: string
  handleRegistrationComplete: (cardNumber: string) => void
}

export function useTelegramUser(): UseTelegramUserResult {
  const [telegramUserId, setTelegramUserId] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [isCheckingUser, setIsCheckingUser] = useState(true)
  const [cardNumber, setCardNumber] = useState('')

  const checkUserRegistration = useCallback(async (userId: string) => {
    try {
      const user = await fetchUser(userId)
      if (user) {
        setCardNumber(user.card_number)
        setIsRegistered(true)
      } else {
        setIsRegistered(false)
      }
    } catch {
      setIsRegistered(false)
    } finally {
      setIsCheckingUser(false)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('dark')

    const { userId, isTestUser } = initializeTelegramWebApp()
    setTelegramUserId(userId)

    if (isTestUser) {
      setIsCheckingUser(false)
    } else {
      checkUserRegistration(userId)
    }
  }, [checkUserRegistration])

  const handleRegistrationComplete = useCallback((newCardNumber: string) => {
    setCardNumber(newCardNumber)
    setIsRegistered(true)
  }, [])

  return {
    telegramUserId,
    isRegistered,
    isCheckingUser,
    cardNumber,
    handleRegistrationComplete,
  }
}
