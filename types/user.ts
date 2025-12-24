export interface User {
  telegram_user_id: string
  card_number: string
  created_at?: Date
  updated_at?: Date
}

export interface UserRegistrationRequest {
  telegram_user_id: string
  card_number: string
}

export interface UserRegistrationResponse {
  success: boolean
  user?: User
  error?: string
}
