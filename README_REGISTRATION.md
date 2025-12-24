# Система регистрации пользователей

## Обзор

Приложение теперь включает систему регистрации пользователей с сохранением данных в MongoDB. При первом запуске пользователь должен ввести номер своей банковской карты.

## Архитектура

### База данных

**MongoDB**: `bank_card_app`

**Коллекция**: `users`

**Структура документа**:
```json
{
  "telegram_user_id": "123456789",
  "card_number": "56063346018",
  "created_at": "2025-12-24T10:30:00.000Z",
  "updated_at": "2025-12-24T10:30:00.000Z"
}
```

### API Endpoints

#### 1. Регистрация пользователя
**POST** `/api/user/register`

**Request:**
```json
{
  "telegram_user_id": "123456789",
  "card_number": "5606334601812"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "telegram_user_id": "123456789",
    "card_number": "56063346018",
    "created_at": "2025-12-24T10:30:00.000Z",
    "updated_at": "2025-12-24T10:30:00.000Z"
  }
}
```

#### 2. Получение данных пользователя
**GET** `/api/user/[telegram_user_id]`

**Response:**
```json
{
  "telegram_user_id": "123456789",
  "card_number": "56063346018",
  "created_at": "2025-12-24T10:30:00.000Z",
  "updated_at": "2025-12-24T10:30:00.000Z"
}
```

## Установка и настройка

### 1. Установка MongoDB

**Локально (macOS)**:
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Локально (Ubuntu/Debian)**:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Или используйте MongoDB Atlas** (облачный сервис):
1. Создайте бесплатный кластер на https://www.mongodb.com/cloud/atlas
2. Получите строку подключения
3. Добавьте в `.env.local`

### 2. Настройка переменных окружения

Добавьте в `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/bank_card_app

# Для MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bank_card_app?retryWrites=true&w=majority
```

### 3. Установка зависимостей

```bash
npm install mongodb
```

## Использование

### Процесс регистрации

1. **Первый запуск**: Пользователь видит форму регистрации
2. **Ввод номера карты**: Пользователь вводит номер карты (11-16 цифр)
3. **Валидация**: Номер проверяется на корректность
4. **Сохранение**: Данные сохраняются в MongoDB
5. **Переход к приложению**: После успешной регистрации показывается основной интерфейс

### Повторные запуски

1. **Проверка регистрации**: При загрузке проверяется наличие пользователя в БД
2. **Автоматический вход**: Если пользователь найден, сразу загружаются его данные
3. **Загрузка баланса**: Автоматически запрашиваются баланс и транзакции

## Интеграция с Telegram WebApp

### Получение Telegram User ID

```typescript
const tg = window.Telegram.WebApp
tg.ready()
const userId = tg.initDataUnsafe?.user?.id?.toString()
```

### Тестирование без Telegram

Для тестирования вне Telegram используется временный ID:
```typescript
const testUserId = "test_user_" + Date.now()
```

## Безопасность

1. **Валидация номера карты**: Базовая проверка формата (11-16 цифр)
2. **Уникальность пользователей**: По `telegram_user_id`
3. **Обновление данных**: При повторной регистрации данные обновляются
4. **Защита данных**: Номера карт хранятся без пробелов и специальных символов

## Компоненты

### RegistrationForm
Компонент формы регистрации с:
- Автоформатированием ввода (группы по 4 цифры)
- Валидацией в реальном времени
- Защитой от повторных отправок
- Индикатором загрузки

### Типы
- `User` - тип данных пользователя
- `UserRegistrationRequest` - запрос регистрации
- `UserRegistrationResponse` - ответ регистрации

## Примеры использования

### Регистрация нового пользователя
```typescript
const response = await fetch("/api/user/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    telegram_user_id: "123456789",
    card_number: "5606334601812"
  })
})
```

### Проверка регистрации
```typescript
const response = await fetch(`/api/user/123456789`)
if (response.ok) {
  const userData = await response.json()
  console.log(userData.card_number)
}
```

## Структура файлов

```
app/
├── api/
│   └── user/
│       ├── register/
│       │   └── route.ts          # Регистрация пользователя
│       └── [telegram_user_id]/
│           └── route.ts           # Получение данных пользователя
components/
└── registration-form.tsx          # Форма регистрации
lib/
└── mongodb.ts                     # Подключение к MongoDB
types/
├── user.ts                        # Типы пользователя
└── telegram-webapp.d.ts           # Типы Telegram WebApp
```

## Отладка

Проверить подключение к MongoDB:
```bash
mongosh
use bank_card_app
db.users.find()
```

Просмотр логов API:
```bash
# В консоли браузера при регистрации
```

## Будущие улучшения

- [ ] Шифрование номеров карт
- [ ] История изменений карт
- [ ] Проверка Telegram initData для безопасности
- [ ] Возможность привязки нескольких карт
- [ ] Экспорт данных пользователя
