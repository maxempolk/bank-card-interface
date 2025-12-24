import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import type { UserRegistrationRequest, UserRegistrationResponse } from '@/types/user'

export async function POST(request: NextRequest) {
  try {
    const { telegram_user_id, card_number }: UserRegistrationRequest = await request.json()

    if (!telegram_user_id || !card_number) {
      return NextResponse.json<UserRegistrationResponse>(
        { success: false, error: 'Telegram user ID and card number are required' },
        { status: 400 }
      )
    }

    // Валидация номера карты (базовая проверка)
    const cardNumberClean = card_number.replace(/\s/g, '')
    if (!/^\d{11,16}$/.test(cardNumberClean)) {
      return NextResponse.json<UserRegistrationResponse>(
        { success: false, error: 'Invalid card number format' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('bank_card_app')
    const users = db.collection('users')

    // Проверяем, существует ли пользователь
    const existingUser = await users.findOne({ telegram_user_id })

    const now = new Date()

    if (existingUser) {
      // Обновляем существующего пользователя
      await users.updateOne(
        { telegram_user_id },
        {
          $set: {
            card_number: cardNumberClean,
            updated_at: now,
          },
        }
      )

      return NextResponse.json<UserRegistrationResponse>({
        success: true,
        user: {
          telegram_user_id,
          card_number: cardNumberClean,
          updated_at: now,
        },
      })
    } else {
      // Создаем нового пользователя
      await users.insertOne({
        telegram_user_id,
        card_number: cardNumberClean,
        created_at: now,
        updated_at: now,
      })

      return NextResponse.json<UserRegistrationResponse>({
        success: true,
        user: {
          telegram_user_id,
          card_number: cardNumberClean,
          created_at: now,
          updated_at: now,
        },
      })
    }
  } catch (error) {
    console.error('[user/register] Error:', error)
    return NextResponse.json<UserRegistrationResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
