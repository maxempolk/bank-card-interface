/**
 * Script to remove duplicate transactions and create unique index.
 * Run once to fix existing duplicates in the database.
 *
 * Usage: npx ts-node scripts/fix-duplicate-transactions.ts
 * Or: npx tsx scripts/fix-duplicate-transactions.ts
 */

import { MongoClient } from 'mongodb'
import crypto from 'crypto'

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI or MONGO_URL environment variable')
  process.exit(1)
}

function normalizeDateForHash(date: Date | string): string {
  if (typeof date === 'string') {
    return date.split('T')[0]
  }
  return date.toISOString().split('T')[0]
}

function generateTransactionHash(
  telegramUserId: string,
  date: Date | string,
  amount: number,
  type: string,
  description: string
): string {
  const dateStr = normalizeDateForHash(date)
  const normalized = `${telegramUserId}|${dateStr}|${amount.toFixed(2)}|${type}|${description}`
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

async function main() {
  const client = new MongoClient(MONGODB_URI!)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db('bank_card_app')
    const collection = db.collection('transactions')

    // Get all transactions
    const allTransactions = await collection.find({}).toArray()
    console.log(`Found ${allTransactions.length} total transactions`)

    // Group by new hash (with telegram_user_id)
    const hashGroups = new Map<string, typeof allTransactions>()

    for (const tx of allTransactions) {
      const newHash = generateTransactionHash(
        tx.telegram_user_id,
        tx.date,
        tx.amount,
        tx.type,
        tx.description
      )

      if (!hashGroups.has(newHash)) {
        hashGroups.set(newHash, [])
      }
      hashGroups.get(newHash)!.push(tx)
    }

    // Find and remove duplicates (keep the oldest one)
    let duplicatesRemoved = 0
    const idsToRemove: string[] = []

    for (const [hash, transactions] of hashGroups) {
      if (transactions.length > 1) {
        // Sort by created_at, keep the oldest
        transactions.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        // Mark all but the first for removal
        for (let i = 1; i < transactions.length; i++) {
          idsToRemove.push(transactions[i]._id.toString())
          duplicatesRemoved++
        }

        // Update the kept transaction with new hash
        await collection.updateOne(
          { _id: transactions[0]._id },
          { $set: { transaction_hash: hash } }
        )
      } else {
        // Update single transaction with new hash
        await collection.updateOne(
          { _id: transactions[0]._id },
          { $set: { transaction_hash: hash } }
        )
      }
    }

    // Remove duplicates
    if (idsToRemove.length > 0) {
      const { ObjectId } = await import('mongodb')
      const result = await collection.deleteMany({
        _id: { $in: idsToRemove.map(id => new ObjectId(id)) }
      })
      console.log(`Removed ${result.deletedCount} duplicate transactions`)
    } else {
      console.log('No duplicates found')
    }

    // Drop old index if exists
    try {
      await collection.dropIndex('transaction_hash_unique')
      console.log('Dropped old transaction_hash_unique index')
    } catch {
      console.log('No existing transaction_hash_unique index to drop')
    }

    // Create new unique index
    await collection.createIndex(
      { transaction_hash: 1 },
      { unique: true, background: true, name: 'transaction_hash_unique' }
    )
    console.log('Created unique index on transaction_hash')

    // Verify
    const indexes = await collection.indexes()
    console.log('Current indexes:', indexes.map(i => i.name))

    const remainingCount = await collection.countDocuments()
    console.log(`Final transaction count: ${remainingCount}`)

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('Done')
  }
}

main()
