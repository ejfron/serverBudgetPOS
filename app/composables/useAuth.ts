import type { AuthUser, LoginPayload } from '@shared/types/auth.types'
import { useServerConfig } from './useServerConfig'

const AUTH_KEY = 'tapsilogan_user'

function isNativeApp(): boolean {
  try {
    return import.meta.client && !!(window as any).Capacitor?.isNativePlatform?.()
  } catch {
    return false
  }
}

export function useAuth() {
  const { serverUrl } = useServerConfig()

  const user = useState<AuthUser | null>('auth-user', () => {
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(AUTH_KEY)
        return stored ? JSON.parse(stored) : null
      } catch { return null }
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
      return {
        ok: false,
        message: err?.data?.message
          || `Cannot connect to server at ${serverUrl.value}. Check your internet connection.`,
      }
    }
  }

  async function signup(data: {
    businessName: string
    username: string
    password: string
  }): Promise<{ ok: boolean; message?: string }> {
    try {
      const res = await $fetch<{ success: boolean; user?: AuthUser; message?: string }>(
        `${serverUrl.value}/api/setup/complete`,
        {
          method: 'POST' as const,
          body: {
            businessName: data.businessName,
            username: data.username,
            password: data.password,
          },
        },
      )

      if (!res.success || !res.user) {
        return { ok: false, message: res.message || 'Signup failed' }
      }

      user.value = res.user
      localStorage.setItem(AUTH_KEY, JSON.stringify(res.user))
      return { ok: true }
    } catch (err: any) {
      console.error('Signup error:', err)
      return {
        ok: false,
        message: err?.data?.message
          || `Cannot connect to server at ${serverUrl.value}. Check your internet connection.`,
      }
    }
  }

  function updateBusinessType(businessType: AuthUser['business_type']) {
    if (!user.value) return
    user.value = { ...user.value, business_type: businessType }
    localStorage.setItem(AUTH_KEY, JSON.stringify(user.value))
    // TODO: also PATCH this to the server so it persists across devices,
    // not just in this device's localStorage.
  }

  function logout() {
    user.value = null
    if (import.meta.client) localStorage.removeItem(AUTH_KEY)
    navigateTo('/login')
  }

  const isLoggedIn = computed(() => !!user.value)
  const isFront = computed(() => user.value?.role === 'front')
  const isKitchen = computed(() => user.value?.role === 'kitchen')

  return {
    user, isLoggedIn, isFront, isKitchen,
    login, logout, updateBusinessType,
    signup, isNativeApp,
  }
}

// import type { AuthUser, LoginPayload } from '@shared/types/auth.types'
// import { useServerConfig } from './useServerConfig'
// import { useLocalDb } from './useLocalDb'

// const AUTH_KEY = 'tapsilogan_user'

// function isNativeApp(): boolean {
//   try {
//     return import.meta.client && !!(window as any).Capacitor?.isNativePlatform?.()
//   } catch {
//     return false
//   }
// }

// export function useAuth() {
//   const { serverUrl } = useServerConfig()
//   const local = useLocalDb()

//   const user = useState<AuthUser | null>('auth-user', () => {
//     if (import.meta.client) {
//       try {
//         const stored = localStorage.getItem(AUTH_KEY)
//         return stored ? JSON.parse(stored) : null
//       } catch { return null }
//     }
//     return null
//   })

//   async function loginLocal(payload: LoginPayload): Promise<{ ok: boolean; message?: string }> {
//     try {
//       const rows = await local.query(
//         'SELECT * FROM users WHERE username = ? LIMIT 1',
//         [payload.username],
//       )
//       const row = rows[0]
//       if (!row) {
//         return { ok: false, message: 'Invalid username or password' }
//       }

//       const hashed = await local.hashPassword(payload.password)
//       if (hashed !== row.password_hash) {
//         return { ok: false, message: 'Invalid username or password' }
//       }

//       const authUser: AuthUser = {
//         id: row.id,
//         username: row.username,
//         role: row.role,
//         business_type: row.business_type,
//         branch_id: row.branch_id,
//         branch_name: row.branch_name,
//         full_name: row.full_name,
//       } as AuthUser

//       user.value = authUser
//       localStorage.setItem(AUTH_KEY, JSON.stringify(authUser))
//       return { ok: true }
//     } catch (err: any) {
//       console.error('Local login error:', err)
//       return { ok: false, message: 'Local login failed. Please try again.' }
//     }
//   }

//   async function loginServer(payload: LoginPayload): Promise<{ ok: boolean; message?: string }> {
//     try {
//       const res = await $fetch<{ success: boolean; user?: AuthUser; message?: string }>(
//         `${serverUrl.value}/api/auth/login`,
//         { method: 'POST' as const, body: payload },
//       )

//       if (res.success && res.user) {
//         user.value = res.user
//         localStorage.setItem(AUTH_KEY, JSON.stringify(res.user))
//         return { ok: true }
//       }
//       return { ok: false, message: res.message || 'Login failed' }
//     } catch (err: any) {
//       console.error('Login error:', err)
//       return {
//         ok: false,
//         message: err?.data?.message
//           || `Cannot connect to server at ${serverUrl.value}. Make sure the server is running and your phone is on the same WiFi.`,
//       }
//     }
//   }

//   // ✅ Native app (installed APK) → always try local DB first, offline
//   // Web/dev browser → use the network server as before
//   async function login(payload: LoginPayload): Promise<{ ok: boolean; message?: string }> {
//     if (isNativeApp()) {
//       return loginLocal(payload)
//     }
//     return loginServer(payload)
//   }

//   async function signupLocal(data: {
//     businessName: string
//     username: string
//     password: string
//   }): Promise<{ ok: boolean; message?: string }> {
//     try {
//       const existing = await local.query(
//         'SELECT id FROM users WHERE username = ? LIMIT 1',
//         [data.username],
//       )
//       if (existing.length > 0) {
//         return { ok: false, message: 'Username already taken' }
//       }

//       const id = crypto.randomUUID()
//       const passwordHash = await local.hashPassword(data.password)
//       const now = new Date().toISOString()
//       const branchId = crypto.randomUUID()

//       await local.run(
//         `INSERT INTO users (id, username, password_hash, role, business_type, branch_id, branch_name, full_name, created_at)
//          VALUES (?, ?, ?, 'admin', NULL, ?, ?, ?, ?)`,
//         [id, data.username, passwordHash, branchId, data.businessName, data.businessName, now],
//       )

//       const authUser: AuthUser = {
//         id,
//         username: data.username,
//         role: 'admin',
//         business_type: null,
//         branch_id: branchId,
//         branch_name: data.businessName,
//         full_name: data.businessName,
//       } as AuthUser

//       user.value = authUser
//       localStorage.setItem(AUTH_KEY, JSON.stringify(authUser))
//       return { ok: true }
//     } catch (err: any) {
//       console.error('Local signup error:', err)
//       return { ok: false, message: 'Could not create account locally.' }
//     }
//   }

//   function updateBusinessType(businessType: AuthUser['business_type']) {
//     if (!user.value) return
//     user.value = { ...user.value, business_type: businessType }
//     localStorage.setItem(AUTH_KEY, JSON.stringify(user.value))

//     // ✅ Persist to local DB too, so it survives app restarts on native
//     if (isNativeApp() && user.value.id) {
//       local.run('UPDATE users SET business_type = ? WHERE id = ?', [businessType, user.value.id]).catch(() => {})
//     }
//   }

//   function logout() {
//     user.value = null
//     if (import.meta.client) localStorage.removeItem(AUTH_KEY)
//     navigateTo('/login')
//   }

//   const isLoggedIn = computed(() => !!user.value)
//   const isFront = computed(() => user.value?.role === 'front')
//   const isKitchen = computed(() => user.value?.role === 'kitchen')

//   return {
//     user, isLoggedIn, isFront, isKitchen,
//     login, logout, updateBusinessType,
//     signupLocal, isNativeApp,
//   }
// }