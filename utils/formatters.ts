import { CURRENCY_CONFIG, DATE_CONFIG } from '@/constants'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: 'currency',
    currency: CURRENCY_CONFIG.currency,
    minimumFractionDigits: CURRENCY_CONFIG.minimumFractionDigits,
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(DATE_CONFIG.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat(DATE_CONFIG.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  const limited = digits.slice(0, 16)
  return limited.match(/.{1,4}/g)?.join(' ') || limited
}

export function cleanCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\s/g, '')
}
