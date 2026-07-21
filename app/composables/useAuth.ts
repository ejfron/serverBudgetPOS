// composables/useAuth.ts
import type { AuthUser, LoginPayload } from '@shared/types/auth.types'
import { useServerConfig } from './useServerConfig'

const AUTH_KEY = 'tapsilogan_user'

export function useAuth() {
  const { serverUrl } = useServerConfig()

  const user = useState<AuthUser | null>('auth-user', () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(AUTH_KEY)
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  async function login(payload: LoginPayload): Promise<{ ok: boolean; message?: string }> {
    try {
      const res = await $fetch<{ success: boolean; user?: AuthUser; message?: string }>(
        `${serverUrl.value}/api/auth/login`,
        { method: 'POST' as const, body: payload },
      )
      if (res.success && res.user) {
        user.value = res.user
        localStorage.setItem(AUTH_KEY, JSON.stringify(res.user))
        return { ok: true }
      }
      return { ok: false, message: res.message || 'Login failed' }
    } catch (err: any) {
      console.error('Login error:', err)
      return { ok: false, message: err?.data?.message || 'Cannot connect to server' }
    }
  }

  // Called after setup.vue locks in the chosen business type,
  // so the app reflects it immediately without requiring a re-login.
  function updateBusinessType(businessType: AuthUser['business_type']) {
    if (!user.value) return
    user.value = { ...user.value, business_type: businessType }
    localStorage.setItem(AUTH_KEY, JSON.stringify(user.value))
  }

  function logout() {
    user.value = null
    localStorage.removeItem(AUTH_KEY)
    navigateTo('/login')
  }

  const isLoggedIn = computed(() => !!user.value)
  const isFront = computed(() => user.value?.role === 'front')
  const isKitchen = computed(() => user.value?.role === 'kitchen')

  return { user, isLoggedIn, isFront, isKitchen, login, logout, updateBusinessType }
}