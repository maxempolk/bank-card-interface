# Changelog

## 2025-12-24 (v2 - Registration System)

### Добавлено
- ✅ Система регистрации пользователей
  - Форма регистрации при первом запуске
  - Валидация номера карты (11-16 цифр)
  - Автоформатирование ввода
  - Сохранение в MongoDB

- ✅ MongoDB интеграция
  - API для регистрации пользователей `/api/user/register`
  - API для получения данных пользователя `/api/user/[telegram_user_id]`
  - Автоматическое создание/обновление записей

- ✅ Telegram WebApp интеграция
  - Получение Telegram User ID
  - Автоматическая проверка регистрации
  - Режим тестирования без Telegram

### Компоненты
- `components/registration-form.tsx` - форма регистрации
- `lib/mongodb.ts` - подключение к БД
- `types/user.ts` - типы пользователя
- `types/telegram-webapp.d.ts` - типы Telegram

### API Routes
- `app/api/user/register/route.ts` - регистрация
- `app/api/user/[telegram_user_id]/route.ts` - получение данных

### Документация
- `README_REGISTRATION.md` - полная документация системы регистрации

---

## 2025-12-24 (v1 - DNB API Integration)

### Добавлено
- ✅ Интеграция с DNB API
  - API роут `/api/dnb/balance` для получения баланса
  - API роут `/api/dnb/transactions` для получения транзакций
  - Полная типизация TypeScript для DNB API

- ✅ Парсинг транзакций DNB
  - Поддержка формата DNB с вложенным объектом `amount`
  - Автоматический перевод типов транзакций на русский язык
  - Утилита `getTransactionDescription()` для локализации

- ✅ Обновление UI
  - Темная тема с настроенными цветами
  - Валюта изменена с RUB на NOK
  - Логотип DNB банка
  - Pull-to-refresh жест для обновления данных
  - Поддержка жестов мыши для desktop
  - Защита от стандартного pull-to-refresh браузера

### Файлы

**API:**
- `app/api/dnb/config.ts` - конфигурация API
- `app/api/dnb/balance/route.ts` - эндпоинт баланса
- `app/api/dnb/transactions/route.ts` - эндпоинт транзакций

**Типы:**
- `types/dnb.ts` - TypeScript типы для DNB API

**Утилиты:**
- `lib/transaction-utils.ts` - утилиты для работы с транзакциями
- `lib/dnb-parser.example.ts` - пример парсинга

**Компоненты:**
- `app/page.tsx` - главная страница с интеграцией API
- `components/balance-card.tsx` - карточка баланса с жестами

**Стили:**
- `app/globals.css` - темная тема и защита от pull-to-refresh

**Документация:**
- `README_API.md` - документация по API
- `.env.local.example` - пример конфигурации

### Формат данных DNB

**Транзакция:**
```json
{
  "amount": {
    "currency": "NOK",
    "amount": "-19.90"
  },
  "transactionDate": "2025-12-23",
  "transactionType": "Varekjøp"
}
```

**Поддерживаемые типы:**
- Varekjøp → Покупка товаров
- Nettgiro → Интернет-платеж
- Overføring → Перевод
- И другие...

### Настройка

1. Создать `.env.local` файл
2. Указать `DNB_API_URL`, `DNB_API_TRACE_ID`, `DNB_API_CHANNEL`
3. Запустить проект
