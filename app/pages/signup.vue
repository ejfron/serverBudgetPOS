<script setup lang="ts">
import { Store, User, Lock, AlertCircle, Loader2, ArrowLeft } from '@lucide/vue'

definePageMeta({ layout: false })

const businessName = ref('')
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const router = useRouter()
const { login } = useAuth()

// ✅ Commented out for testing
// onMounted(async () => {
//   try {
//     const { needsSetup } = await $fetch('/api/setup/status')
//     if (!needsSetup) router.replace('/login')
//   } catch (_) {}
// })

async function handleSignup() {
  loading.value = true
  error.value = ''

  try {
    const result = await $fetch('/api/setup/complete', {
      method: 'POST',
      body: {
        businessName: businessName.value,
        username: username.value,
        password: password.value,
      },
    })

    if (result.user) {
      const auth = useAuth()
      // ✅ Ensure business_type is empty to force setup page
      auth.user.value = {
        ...result.user,
        business_type: result.user.business_type || '',
      }
      localStorage.setItem('tapsilogan_user', JSON.stringify(auth.user.value))
      await router.replace('/setup')
      return
    }

    // Fallback login
    const loginResult = await login({
      username: username.value,
      password: password.value,
    })

    if (!loginResult.ok) {
      error.value = 'Account created but auto-login failed. Please log in manually.'
      setTimeout(() => router.replace('/login'), 2000)
      return
    }

    await router.replace('/setup')
  } catch (e: any) {
    console.error('Signup error:', e)

    if (e.statusCode === 409) {
      error.value = 'This username is already taken. Please choose another.'
    } else if (e.statusCode === 400) {
      error.value = e.data?.statusMessage || 'Invalid input. Please check your information.'
    } else {
      error.value = 'Unable to create account. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 via-yellow-50 to-amber-100 p-4">
    <div class="absolute top-0 right-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl" />
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />

    <NuxtLink
      to="/"
      class="absolute top-6 left-4 sm:left-6 z-10 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-sm text-sm font-semibold text-gray-700 hover:text-orange-600 hover:shadow-md transition-all"
    >
      <ArrowLeft :size="16" />
      Back
    </NuxtLink>

    <div class="relative w-full max-w-lg bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-8 sm:p-10">
      <div class="flex flex-col items-center mb-8">
        <div class="w-60 h-40 flex items-center justify-center">
          <img src="/uploads/ChatGPT Image Jul 18, 2026 at 10_13_50 AM.png" alt="BudgetPOS">
        </div>
        <h1 class="text-3xl font-extrabold text-gray-800">Create Your Account</h1>
        <p class="text-sm text-gray-500 mt-2 text-center">
          Sign up to start using Budget POS.
        </p>
      </div>

      <form @submit.prevent="handleSignup" class="space-y-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Business Name</label>
          <div class="relative">
            <Store :size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="businessName" type="text" required placeholder="e.g. Juan's Store" class="pl-10 py-2 w-full rounded-xl border-gray-200 bg-white/70 shadow-sm focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50 transition text-gray-600" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Admin Username</label>
          <div class="relative">
            <User :size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="username" type="text" required placeholder="admin" class="pl-10 py-2 w-full rounded-xl border-gray-200 bg-white/70 shadow-sm focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50 transition text-gray-600" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Password</label>
          <div class="relative">
            <Lock :size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="password" type="password" required minlength="6" placeholder="••••••••" class="pl-10 py-2 w-full rounded-xl border-gray-200 bg-white/70 shadow-sm focus:border-orange-400 focus:ring focus:ring-orange-200 focus:ring-opacity-50 transition text-gray-600" />
          </div>
          <p class="mt-1 text-xs text-gray-400">At least 6 characters</p>
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center space-x-2">
          <AlertCircle :size="18" class="shrink-0" />
          <span>{{ error }}</span>
        </div>

        <button type="submit" :disabled="loading" class="w-full py-3 px-4 bg-linear-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2">
          <Loader2 v-if="loading" :size="20" class="animate-spin text-white" />
          <span>{{ loading ? 'Creating account...' : 'Sign Up & Continue' }}</span>
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-gray-400">
        This will be your administrator account. You can add staff later.
      </p>
    </div>
  </div>
</template>