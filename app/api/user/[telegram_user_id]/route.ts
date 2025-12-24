import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import type { User } from '@/types/user'

export async function GET(
  request: NextRequest,
  { params }: { params: { telegram_user_id: string } }
) {
  try {
    const { telegram_user_id } = params

    if (!telegram_user_id) {
      return NextResponse.json(
        { error: 'Telegram user ID is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('bank_card_app')
    const users = db.collection('users')

    const user = await users.findOne({ telegram_user_id })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json<User>({
      telegram_user_id: user.telegram_user_id,
      card_number: user.card_number,
      created_at: user.created_at,
      updated_at: user.updated_at,
    })
  } catch (error) {
    console.error('[user/get] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
