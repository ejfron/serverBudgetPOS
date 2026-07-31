<script setup lang="ts">
import { useServerConfig } from '~/composables/useServerConfig'
import { ArrowLeft } from '@lucide/vue'

definePageMeta({ layout: false })

const { serverUrl } = useServerConfig()

const businessName = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

const { login, signupLocal, isNativeApp } = useAuth()

async function handleSignup() {
  error.value = ''

  if (!businessName.value.trim() || !username.value.trim() || !password.value) {
    error.value = 'All fields are required'
    return
  }
  if (username.value.trim().length < 3) {
    error.value = 'Username must be at least 3 characters'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    // ✅ Native app: create the account entirely on-device, no network needed
    if (isNativeApp()) {
      const result = await signupLocal({
        businessName: businessName.value.trim(),
        username: username.value.trim(),
        password: password.value,
      })

      if (!result.ok) {
        error.value = result.message || 'Unable to create account. Please try again.'
        return
      }

      await navigateTo('/setup')
      return
    }

    // Web/dev fallback — original server-based signup
    const res = await $fetch<{ success: boolean; user?: any; message?: string }>(
      `${serverUrl.value}/api/setup/complete`,
      {
        method: 'POST' as const,
        body: {
          businessName: businessName.value.trim(),
          username: username.value.trim(),
          password: password.value,
        },
      },
    )

    if (!res.success || !res.user) {
      error.value = res.message || 'Unable to create account. Please try again.'
      return
    }

    localStorage.setItem('tapsilogan_user', JSON.stringify(res.user))
    await navigateTo('/setup')
  } catch (err: any) {
    console.error('Signup error:', err)
    error.value = err?.data?.message
      || err?.data?.statusMessage
      || `Cannot connect to server. Make sure the server is running.`
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
    <NuxtLink
      to="/"
      class="absolute top-6 left-4 sm:left-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-sm text-sm font-semibold text-gray-700 hover:text-orange-600 hover:shadow-md transition-all"
    >
      <ArrowLeft :size="16" />
      Back
    </NuxtLink>
    <div class="w-full max-w-md">

      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center">
          <div class="w-60 h-40 flex items-center justify-center">
            <img
              src="/uploads/ChatGPT Image Jul 18, 2026 at 10_13_50 AM.png"
              class="h-full w-auto object-contain"
              alt="BudgetPOS"
            />
          </div>
        </div>
        <p class="text-gray-500 text-sm -mt-9">Sign up to continue</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
          <input
            v-model="businessName"
            type="text"
            placeholder="e.g. Tapsilogan ni Aling Maria"
            class="w-full border border-gray-200 rounded-xl text-gray-600 px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            @keyup.enter="handleSignup"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
          <input
            v-model="username"
            type="text"
            placeholder="Your login username"
            class="w-full border border-gray-200  text-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            @keyup.enter="handleSignup"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="At least 6 characters"
              class="w-full border border-gray-200 rounded-xl text-gray-600 px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 pr-12"
              @keyup.enter="handleSignup"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
          <input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Re-enter your password"
            class="w-full border border-gray-200 rounded-xl text-gray-600 px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            @keyup.enter="handleSignup"
          />
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-3">
          <p class="text-xs text-red-600">{{ error }}</p>
        </div>

        <button
          :disabled="loading"
          class="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
          @click="handleSignup"
        >
          <span v-if="loading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>

        <p class="text-center text-sm text-gray-500">
          Already have an account?
          <NuxtLink to="/login" class="text-orange-500 font-semibold hover:underline">Sign in</NuxtLink>
        </p>
      </div>

      <p class="text-center text-xs text-gray-400 mt-6">
        BudgetPOS v1.0 · Affordable POS for Filipino Businesses
      </p>
    </div>
  </div>
</template>