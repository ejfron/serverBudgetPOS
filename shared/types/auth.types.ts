import type { BusinessType } from './business.types'

export interface AuthUser {
  password: string
  id: string
  username: string
  role: 'admin' | 'front' | 'kitchen'
  branch_id: string
  branch_name: string
  business_type: BusinessType
  storage_mode: 'local' | 'server'
  full_name?: string
}

export interface LoginPayload {
  username: string
  password: string
}