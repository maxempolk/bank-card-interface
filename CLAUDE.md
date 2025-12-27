# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude Code Configuration

**IMPORTANT**: All files related to Claude Code's work (plans, artifacts, notes, etc.) should be stored in the `.claude/` directory to keep the repository organized.

When creating files for task planning, documentation, or tracking work:
- Use `.claude/plans/` for implementation plans
- Use `.claude/notes/` for session notes and discoveries
- Use `.claude/artifacts/` for any generated artifacts or temporary files

Example:
```
.claude/
├── plans/
│   └── feature-xyz-plan.md
├── notes/
│   └── 2024-01-15-session.md
└── artifacts/
    └── api-response-examples.json
```

## Project Overview

This is a **Telegram Mini App** for DNB Bank integration - a mobile-first web application that runs inside Telegram and displays Norwegian bank account balances and transaction history. Users authenticate via Telegram WebApp API, register their bank card, and view real-time account data fetched from DNB's API.

**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, MongoDB, Tailwind CSS, Shadcn/UI

## Development Commands

```bash
npm run dev          # Start development server (default: localhost:3000)
npm run build        # Build for production
npm run start        # Start production server (port from $PORT env var or 3000)
npm run lint         # Run ESLint
```

## Architecture Overview

### Three-Layer Data Flow

```
Components/Hooks → API Service Layer → Backend API Routes → External APIs
                                                           ├─ MongoDB (user data)
                                                           ├─ DNB Bank API (balance/transactions)
                                                           └─ Telegram (authentication)
```

### Key Directories

- **`/app`** - Next.js App Router pages and API routes
  - `/api/user` - User registration and retrieval (MongoDB)
  - `/api/dnb` - DNB Bank API proxies (balance, transactions)
- **`/hooks`** - Custom React hooks for state and side effects
- **`/services`** - Client-side API service layer
- **`/components`** - React components (features + UI primitives)
- **`/lib`** - Utilities (MongoDB connection, formatters, etc.)
- **`/types`** - TypeScript type definitions

## Critical Architectural Patterns

### 1. Request Cancellation with AbortController

All bank data fetches use AbortController to cancel previous requests:

```typescript
// In hooks/use-bank-data.ts
abortControllerRef.current?.abort()  // Cancel previous request
abortControllerRef.current = new AbortController()
fetchBankData(cardNumber, abortControllerRef.current.signal)
```

**Why**: Prevents race conditions when users rapidly refresh or switch cards.

### 2. Card Number → Account Number Transformation

```typescript
// services/api.ts
function getAccountNumber(cardNumber: string): string {
  return cardNumber.slice(0, -1)  // Remove last digit (check digit)
}
```

Card numbers are stored with spaces in UI (`"1234 5678 9012 3456"`), cleaned before storage/API calls.

### 3. MongoDB Connection Pooling

```typescript
// lib/mongodb.ts uses global caching in development
if (process.env.NODE_ENV === 'development') {
  globalWithMongo._mongoClientPromise = client.connect()
} else {
  cachedPromise = client.connect()
}
```

**Connection is lazy** - only establishes when first accessed via Proxy pattern.

### 4. Force-Dynamic API Routes

All user-specific and DNB API routes use:
```typescript
export const dynamic = 'force-dynamic'
```
This prevents Next.js from caching responses that should be real-time.

### 5. Telegram WebApp Initialization

```typescript
// services/telegram.ts
const tg = window.Telegram?.WebApp
tg?.ready()
const userId = tg?.initDataUnsafe?.user?.id
```

Falls back to test user (`test_user_[timestamp]`) if not in Telegram environment.

### 6. Empty Request Body Validation

API routes must validate request body before parsing:

```typescript
// Prevent "Unexpected end of JSON input" errors
if (!cardToUse || cardToUse.trim().length === 0) return
```

This is critical in `hooks/use-bank-data.ts` to avoid sending requests with empty card numbers.

### 7. Hydration Mismatch Suppression

Telegram SDK adds CSS variables (`--tg-viewport-height`) to `<html>` on client only:

```typescript
// app/layout.tsx
<html lang="en" suppressHydrationWarning>
  <body suppressHydrationWarning>
```

## Data Flow Examples

### User Registration Flow

1. User enters card number in `RegistrationForm`
2. Form validates length (11-16 digits after removing spaces)
3. `registerUser()` → POST `/api/user/register`
4. MongoDB: `updateOne` if user exists, `insertOne` if new
5. `useTelegramUser` hook updates `isRegistered` state
6. UI switches from `RegistrationForm` to `BalanceCard`
7. `useBankData` auto-fetches balance/transactions

### Balance Refresh Flow

1. User pulls down on screen (mobile) or clicks refresh
2. `usePullToRefresh` detects gesture (> 80px threshold)
3. Calls `refresh()` from `useBankData` hook
4. Parallel `Promise.all()` fetches:
   - POST `/api/dnb/balance` with `{ accountNumber }`
   - POST `/api/dnb/transactions` with `{ accountNumber }`
5. Backend routes add DNB headers (`X-Dnbapi-Trace-Id`, `X-Dnbapi-Channel`)
6. 8-second timeout per request
7. Transform DNB response → app types
8. Update React state → UI re-renders

## Environment Variables

Required:
```
MONGODB_URI or MONGO_URL     # MongoDB connection string
DNB_API_URL                  # DNB Bank API endpoint
DNB_API_TRACE_ID             # Request tracing ID for DNB
DNB_API_CHANNEL              # API channel identifier (e.g., "web")
```

## Important Patterns & Gotchas

### MongoDB Database Structure

```javascript
Database: "bank_card_app"
Collections:
  users {
    telegram_user_id: string (unique, indexed)
    card_number: string
    created_at: Date
    updated_at: Date
  }
```

### DNB API Request Pattern

- **Account Number**: Card number with last digit removed (`slice(0, -1)`)
- **Timeout**: 8 seconds (configured in API routes)
- **Headers**: Must include `X-Dnbapi-Trace-Id` and `X-Dnbapi-Channel`
- **Response Format**: Flexible - transactions can be object with `.transactions` array or array directly

### Type Transformation: DNB → App

```typescript
// DNB format
interface DNBTransactionRaw {
  amount: { currency: string, amount: string }
  transactionDate: string
  transactionType?: string
}

// App format
interface Transaction {
  id: string
  amount: number  // parsed float
  date: Date
  type: 'credit' | 'debit'
  description: string
}
```

Transform happens in `services/api.ts:fetchTransactions()`.

### Pull-to-Refresh Mechanics

```typescript
// constants/pull-to-refresh.ts
PULL_TO_REFRESH_THRESHOLD = 80  // pixels
MAX_PULL_DISTANCE = 150         // pixels
```

Detects when user is at scroll top (scrollTop === 0) and pulls down. Uses touch events on mobile, mouse events on desktop.

### Telegram WebApp Script Loading

```typescript
// app/layout.tsx
<Script
  src="https://telegram.org/js/telegram-web-app.js"
  strategy="beforeInteractive"
/>
```

Must load **before** React hydration to avoid initialization issues.

## Common Development Tasks

### Adding a New API Endpoint

1. Create route in `/app/api/[name]/route.ts`
2. Add `export const dynamic = 'force-dynamic'` if user-specific
3. Add client function in `/services/api.ts`
4. Add TypeScript types in `/types/`
5. Call from component or custom hook

### Adding a New Hook

1. Create in `/hooks/use-[name].ts`
2. Follow naming: `use` prefix, camelCase
3. Use `useCallback` for functions returned in hook API
4. Use `useRef` for values that shouldn't trigger re-renders
5. Clean up side effects in `useEffect` return function

### Modifying DNB API Integration

- Config: `/app/api/dnb/config.ts`
- Balance route: `/app/api/dnb/balance/route.ts`
- Transactions route: `/app/api/dnb/transactions/route.ts`
- Types: `/types/dnb.ts`

Always maintain 8-second timeout and required headers.

### Working with MongoDB

```typescript
import { getDatabase } from '@/lib/mongodb'

const db = await getDatabase()
const users = db.collection('users')

// Find user
const user = await users.findOne({ telegram_user_id: userId })

// Update or insert
await users.updateOne(
  { telegram_user_id: userId },
  { $set: { card_number: cardNumber, updated_at: new Date() } },
  { upsert: true }
)
```

Connection is established lazily via Proxy - don't call `connectToDatabase()` directly.

## Testing in Development

### Without Telegram

The app creates a test user when not in Telegram environment:
- User ID: `test_user_[timestamp]`
- No authentication checks
- All features work normally

### With Telegram

1. Deploy to public URL (ngrok, Vercel preview, etc.)
2. Create bot with [@BotFather](https://t.me/botfather)
3. Set WebApp URL via BotFather
4. Open bot in Telegram
5. App loads in Telegram iframe with real user context

## Code Style & Conventions

- **Imports**: Use `@/` alias for absolute imports from root
- **Components**: PascalCase, one component per file
- **Hooks**: `use` prefix, camelCase
- **Types**: PascalCase for interfaces, located in `/types`
- **API Routes**: Export `POST`, `GET`, etc. as named async functions
- **Error Handling**: Log errors with prefixes like `[balance]`, `[API]`, `[MongoDB]`

## Performance Considerations

- **Memoization**: Large components use `React.memo()` (e.g., `TransactionList`)
- **Parallel Fetching**: Balance and transactions fetch concurrently
- **Request Cancellation**: Previous requests aborted on new fetch
- **Connection Pooling**: MongoDB connections reused in development
- **Dynamic Imports**: Not currently used, but consider for large dependencies

## Security Notes

- **No sensitive data in client**: Card numbers stored server-side only
- **Telegram auth**: Relies on Telegram's initData validation
- **MongoDB**: No exposed credentials (use env vars)
- **DNB API**: Proxied through Next.js API routes (never client-direct)
- **CORS**: Not needed - all external requests from server

## Debugging Tips

- Check browser console for `[API]`, `[balance]`, `[transactions]` prefixed logs
- MongoDB connection issues: Check `MONGODB_URI` env var
- DNB API timeouts: Look for 8-second aborts in network tab
- Hydration errors: Likely Telegram CSS variables - use `suppressHydrationWarning`
- Empty JSON errors: Validate card number is non-empty before API calls
