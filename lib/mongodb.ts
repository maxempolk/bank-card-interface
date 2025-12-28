import { StoredTransaction } from '@/types/stored-transaction'
import { MongoClient } from 'mongodb'

const options = {}

let cachedPromise: Promise<MongoClient> | null = null

const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

async function ensureIndexes() {
  const clientPromise = (await import('@/lib/mongodb')).default
  const client = await clientPromise
  const db = client.db('bank_card_app')
  const collection = await db.collection<StoredTransaction>('transactions')

  try {
    await collection.createIndex(
      { telegram_user_id: 1, date: -1 },
      { background: true, name: 'user_date_idx' }
    )
    await collection.createIndex(
      { transaction_hash: 1 },
      { unique: true, background: true, name: 'transaction_hash_unique' }
    )
    console.log('[transactions/save] Indexes created successfully')
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

function getClientPromise(): Promise<MongoClient> {
  ensureIndexes()
  if (cachedPromise) {
    return cachedPromise
  }

  // Railway может использовать MONGO_URL, а не MONGODB_URI
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL

  console.log('All env variables:', Object.keys(process.env));
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
  console.log('MONGO_URL:', process.env.MONGO_URL);

  if (!uri) {
    throw new Error('MONGODB_URI or MONGO_URL is not defined in environment variables')
  }

  if (process.env.NODE_ENV === 'development') {
    // В режиме разработки используем глобальную переменную для сохранения соединения
    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    cachedPromise = globalWithMongo._mongoClientPromise
  } else {
    // В production создаем новое соединение
    const client = new MongoClient(uri, options)
    cachedPromise = client.connect()
  }

  return cachedPromise
}

// Создаем promise при первом доступе, а не при импорте модуля
const clientPromise = new Proxy({} as Promise<MongoClient>, {
  get(target, prop) {
    const promise = getClientPromise()
    const value = (promise as any)[prop]
    // Bind methods to the actual promise to maintain the correct 'this' context
    if (typeof value === 'function') {
      return value.bind(promise)
    }
    return value
  }
})

export default clientPromise
