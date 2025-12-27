declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  initDataUnsafe?: {
    user?: {
      id?: number
      first_name?: string
      last_name?: string
      username?: string
    }
    auth_date?: number
    hash?: string
  }
  initData?: string
}

export interface TelegramUserResult {
  userId: string
  isTestUser: boolean
}

const STORAGE_KEY = 'telegram_user_id'

export function initializeTelegramWebApp(): TelegramUserResult {
  if (typeof window === 'undefined') {
    return createTestUser()
  }

  const tg = window.Telegram?.WebApp

  if (!tg) {
    console.warn('[TelegramService] WebApp not detected')
    return getOrCreateTestUser()
  }

  tg.ready()
  tg.expand()

  const userId = tg.initDataUnsafe?.user?.id?.toString()

  if (userId) {
    // Сохраняем реальный ID в localStorage для надёжности
    try {
      localStorage.setItem(STORAGE_KEY, userId)
    } catch {
      // localStorage может быть недоступен
    }
    console.log('[TelegramService] Using Telegram user ID:', userId)
    return { userId, isTestUser: false }
  }

  // initDataUnsafe пуст — пробуем получить сохранённый ID
  const savedUserId = getSavedUserId()
  if (savedUserId && !savedUserId.startsWith('test_user_')) {
    console.log('[TelegramService] Using saved Telegram user ID:', savedUserId)
    return { userId: savedUserId, isTestUser: false }
  }

  console.warn('[TelegramService] No userId in initDataUnsafe')
  return getOrCreateTestUser()
}

function getSavedUserId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function getOrCreateTestUser(): TelegramUserResult {
  // Проверяем, есть ли сохранённый тестовый ID
  const savedUserId = getSavedUserId()
  if (savedUserId) {
    console.log('[TelegramService] Using saved user ID:', savedUserId)
    return { userId: savedUserId, isTestUser: savedUserId.startsWith('test_user_') }
  }

  return createTestUser()
}

function createTestUser(): TelegramUserResult {
  const testUserId = `test_user_${Date.now()}`

  try {
    localStorage.setItem(STORAGE_KEY, testUserId)
  } catch {
    // localStorage может быть недоступен
  }

  console.log('[TelegramService] Created test user ID:', testUserId)
  return { userId: testUserId, isTestUser: true }
}
