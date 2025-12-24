// Маппинг типов транзакций DNB на русский язык
const transactionTypeMap: Record<string, string> = {
  'Varekjøp': 'Покупка товаров',
  'Nettgiro': 'Интернет-платеж',
  'Overføring': 'Перевод',
  'Minibank': 'Банкомат',
  'Kontantuttak': 'Снятие наличных',
  'Renter': 'Проценты',
  'Gebyr': 'Комиссия',
  'Lønn': 'Зарплата',
  'Pensjon': 'Пенсия',
  'Trygd': 'Пособие',
  'Refusjon': 'Возврат',
}

export function getTransactionDescription(transactionType?: string): string {
  if (!transactionType) {
    return 'Транзакция'
  }

  return transactionTypeMap[transactionType] || transactionType
}

export function formatTransactionAmount(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount))
}
