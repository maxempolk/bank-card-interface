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

  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MongoDB URI to .env.local')
  }

  const uri = process.env.MONGODB_URI

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
    return (promise as any)[prop]
  }
})

export default clientPromise
