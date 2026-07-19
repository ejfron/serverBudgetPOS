import type { BusinessType } from './business.types'

export interface AuthUser {
  id: string
  username: string
  role: 'admin' | 'front' | 'kitchen'
  branch_id: string
  branch_name: string
  business_type: BusinessType
  full_name?: string
}

export interface LoginPayload {
  username: string
  password: string
}