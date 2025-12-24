import { NextRequest, NextResponse } from 'next/server'
import { API_URL, API_TRACE_ID, API_CHANNEL } from '../config'
import type { DNBApiRequest, DNBBalanceResponse } from '@/types/dnb'

export async function POST(request: NextRequest) {
  try {
    const { accountNumber }: DNBApiRequest = await request.json()

    if (!accountNumber) {
      return NextResponse.json(
        { error: 'Account number is required' },
        { status: 400 }
      )
    }

    const headers = {
      'X-Dnbapi-Trace-Id': API_TRACE_ID,
      'X-Dnbapi-Channel': API_CHANNEL,
      'Content-Type': 'application/json',
    }

    const body = {
      accountNumber,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 200) {
        const data = await response.json()
        const balance = data.balance

        if (balance === undefined || balance === null) {
          console.log(
            `[balance] API returned 200, but without balance field. account=${accountNumber}, body_keys=${Object.keys(data)}`
          )
        }

        return NextResponse.json<DNBBalanceResponse>({ balance })
      }

      const errorBody = await response.text()
      console.log(
        `[balance] API response ${response.status} for account=${accountNumber}. Body: ${errorBody.substring(0, 500)}`
      )

      return NextResponse.json(
        { error: 'Failed to fetch balance', status: response.status },
        { status: response.status }
      )
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error('[balance] Error requesting API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
