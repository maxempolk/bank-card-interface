export const CURRENCY_CONFIG = {
  locale: 'nb-NO',
  currency: 'NOK',
  minimumFractionDigits: 2,
} as const

export const DATE_CONFIG = {
  locale: 'ru-RU',
} as const

export const CARD_NUMBER = {
  MIN_LENGTH: 11,
  MAX_LENGTH: 16,
  GROUP_SIZE: 4,
} as const

export const PULL_TO_REFRESH = {
  THRESHOLD: 80,
  MAX_DISTANCE: 150,
  INDICATOR_HEIGHT: 40,
} as const

export const API_TIMEOUT = 8000
