import { NextRequest, NextResponse } from 'next/server'
import type {
  PaginatedTransactionsResponse,
  StoredTransaction,
} from '@/types/stored-transaction'

export const dynamic = 'force-dynamic'

const DEFAULT_PAGE_SIZE = 10

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ telegram_user_id: string }> }
) {
  try {
    const { telegram_user_id } = await params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '0', 10)
    const pageSize = parseInt(
      searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE),
      10
    )

    if (!telegram_user_id) {
      return NextResponse.json(
        { error: 'Telegram user ID is required' },
        { status: 400 }
      )
    }

    const clientPromise = (await import('@/lib/mongodb')).default
    const client = await clientPromise
    const db = client.db('bank_card_app')
    const collection = db.collection<StoredTransaction>('transactions')

    const total = await collection.countDocuments({ telegram_user_id })

    const transactions = await collection
      .find({ telegram_user_id })
      .sort({ date: -1 })
      .skip(page * pageSize)
      .limit(pageSize)
      .toArray()

    const hasMore = (page + 1) * pageSize < total

    return NextResponse.json<PaginatedTransactionsResponse>({
      transactions,
      total,
      page,
      pageSize,
      hasMore,
    })
  } catch (error) {
    console.error('[transactions/get] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
