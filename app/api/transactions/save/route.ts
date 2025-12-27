import { NextRequest, NextResponse } from 'next/server'
import { generateTransactionHash } from '@/lib/transaction-hash'
import type {
  SaveTransactionsRequest,
  SaveTransactionsResponse,
  StoredTransaction,
} from '@/types/stored-transaction'

export const dynamic = 'force-dynamic'

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

    // Ensure indexes exist (idempotent)
    await collection.createIndex({ telegram_user_id: 1, date: -1 })
    await collection.createIndex({ transaction_hash: 1 }, { unique: true })

    const now = new Date()
    let inserted = 0
    let duplicates = 0

    for (const tx of transactions) {
      const txDate = new Date(tx.date)
      const hash = generateTransactionHash(txDate, tx.amount, tx.type, tx.description)

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

      try {
        await collection.insertOne(doc)
        inserted++
      } catch (error: unknown) {
        // Duplicate key error (E11000) means transaction already exists
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
          duplicates++
        } else {
          throw error
        }
      }
    }

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
