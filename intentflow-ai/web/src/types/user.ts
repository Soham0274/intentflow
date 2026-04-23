// types/user.ts — User and profile types

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

export interface UserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}
