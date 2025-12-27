import { NextRequest, NextResponse } from 'next/server'
import { generateTransactionHash } from '@/lib/transaction-hash'
import type {
  SaveTransactionsRequest,
  SaveTransactionsResponse,
  StoredTransaction,
} from '@/types/stored-transaction'

export const dynamic = 'force-dynamic'

// Track if indexes have been created (per process)
let indexesCreated = false

async function ensureIndexes(collection: import('mongodb').Collection<StoredTransaction>) {
  if (indexesCreated) return

  try {
    await collection.createIndex(
      { telegram_user_id: 1, date: -1 },
      { background: true, name: 'user_date_idx' }
    )
    await collection.createIndex(
      { transaction_hash: 1 },
      { unique: true, background: true, name: 'transaction_hash_unique' }
    )
    indexesCreated = true
  } catch (indexError: unknown) {
    const errorMessage = indexError instanceof Error ? indexError.message : String(indexError)
    if (errorMessage.includes('duplicate key') || errorMessage.includes('E11000')) {
      console.error('[transactions/save] Cannot create unique index - duplicates exist in database:', errorMessage)
    } else if (!errorMessage.includes('already exists')) {
      console.log('[transactions/save] Index creation note:', errorMessage)
    }
    // Mark as created even if it already exists
    indexesCreated = true
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      telegram_user_id,
      account_number,
      transactions,
    }: SaveTransactionsRequest = await request.json()

    if (!telegram_user_id || !account_number || !transactions?.length) {
      return NextResponse.json<SaveTransactionsResponse>(
        { success: false, inserted: 0, duplicates: 0, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const clientPromise = (await import('@/lib/mongodb')).default
    const client = await clientPromise
    const db = client.db('bank_card_app')
    const collection = db.collection<StoredTransaction>('transactions')

    // Ensure indexes exist before any write operations
    await ensureIndexes(collection)

    const now = new Date()

    // Prepare bulk operations for efficient batch insert
    const bulkOps = transactions.map((tx) => {
      const txDate = new Date(tx.date)
      const hash = generateTransactionHash(telegram_user_id, txDate, tx.amount, tx.type, tx.description)

      const doc: StoredTransaction = {
        transaction_hash: hash,
        telegram_user_id,
        account_number,
        amount: tx.amount,
        date: txDate,
        type: tx.type,
        description: tx.description,
        original_type: tx.original_type,
        created_at: now,
      }

      return {
        insertOne: {
          document: doc,
        },
      }
    })

    // Use bulkWrite with ordered: false to continue on duplicate key errors
    const result = await collection.bulkWrite(bulkOps, { ordered: false })

    const inserted = result.insertedCount
    const duplicates = transactions.length - inserted

    console.log(
      `[transactions/save] Saved ${inserted} new, ${duplicates} duplicates for user ${telegram_user_id}`
    )

    return NextResponse.json<SaveTransactionsResponse>({
      success: true,
      inserted,
      duplicates,
    })
  } catch (error) {
    console.error('[transactions/save] Error:', error)
    return NextResponse.json<SaveTransactionsResponse>(
      { success: false, inserted: 0, duplicates: 0, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
