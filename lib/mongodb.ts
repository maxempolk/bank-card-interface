import { MongoClient } from 'mongodb'

const options = {}

let cachedPromise: Promise<MongoClient> | null = null

const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

function getClientPromise(): Promise<MongoClient> {
  if (cachedPromise) {
    return cachedPromise
  }

  // Railway может использовать MONGO_URL, а не MONGODB_URI
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL

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
