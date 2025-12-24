# DNB API Integration

## Настройка

### 1. Создайте файл `.env.local` в корне проекта:

```bash
cp .env.local.example .env.local
```

### 2. Заполните переменные окружения:

```env
DNB_API_URL=https://api.dnb.no/v1/accounts
DNB_API_TRACE_ID=ваш-trace-id
DNB_API_CHANNEL=web
```

### 3. Структура API

#### Запрос баланса

**Endpoint:** `/api/dnb/balance`

**Метод:** `POST`

**Request Body:**
```json
{
  "accountNumber": "1234567890124532"
}
```

**Response:**
```json
{
  "balance": 125430.5
}
```

#### Запрос транзакций

**Endpoint:** `/api/dnb/transactions`

**Метод:** `POST`

**Request Body:**
```json
{
  "accountNumber": "1234567890124532"
}
```

**Response (формат DNB):**
```json
{
  "transactions": [
    {
      "amount": {
        "currency": "NOK",
        "amount": "-19.90"
      },
      "transactionDate": "2025-12-23",
      "transactionType": "Varekjøp"
    }
  ]
}
```

### Поддерживаемые типы транзакций

API автоматически переводит типы транзакций DNB на русский язык:

- `Varekjøp` → Покупка товаров
- `Nettgiro` → Интернет-платеж
- `Overføring` → Перевод
- `Minibank` → Банкомат
- `Kontantuttak` → Снятие наличных
- `Renter` → Проценты
- `Gebyr` → Комиссия
- `Lønn` → Зарплата
- `Pensjon` → Пенсия
- `Trygd` → Пособие
- `Refusjon` → Возврат

## Использование

Компонент `BalanceCard` автоматически обновляет данные при:
- Загрузке страницы
- Жесте pull-to-refresh (свайп вниз)
- Жесте прокрутки на macOS

Данные запрашиваются с сервера DNB через Next.js API routes.

## Типы

Все типы определены в `/types/dnb.ts`:

- `DNBApiRequest` - запрос к API
- `DNBBalanceResponse` - ответ с балансом
- `DNBTransaction` - транзакция
- `DNBTransactionsResponse` - ответ со списком транзакций
