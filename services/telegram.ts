declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

interface TelegramWebApp {
  ready: () => void
  initDataUnsafe?: {
    user?: {
      id?: number
    }
  }
  initData?: string
}

export interface TelegramUserResult {
  userId: string
  isTestUser: boolean
}

export function initializeTelegramWebApp(): TelegramUserResult {
  if (typeof window === 'undefined') {
    return createTestUser()
  }

  const tg = window.Telegram?.WebApp

  if (!tg) {
    console.warn('[TelegramService] WebApp not detected, creating test user')
    return createTestUser()
  }

  tg.ready()

  const userId = tg.initDataUnsafe?.user?.id?.toString()

  if (!userId) {
    console.warn('[TelegramService] No userId in initDataUnsafe, creating test user')
    return createTestUser()
  }

  console.log('[TelegramService] Using Telegram user ID:', userId)
  return { userId, isTestUser: false }
}

function createTestUser(): TelegramUserResult {
  const testUserId = `test_user_${Date.now()}`
  console.log('[TelegramService] Created test user ID:', testUserId)
  return { userId: testUserId, isTestUser: true }
}
