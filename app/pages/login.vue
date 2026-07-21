<script setup lang="ts">
definePageMeta({ layout: false })
import { ArrowLeft } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'
import { isValidBusinessType } from '@shared/types/business.types'

const { login, user } = useAuth()
const { serverUrl } = useServerConfig()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  if (!username.value || !password.value) {
    error.value = 'Please enter username and password'
    return
  }

  loading.value = true
  error.value = ''

  const result = await login({ username: username.value, password: password.value })

  if (!result.ok) {
    error.value = result.message || 'Login failed'
    loading.value = false
    return
  }

 // In the onSubmit function, replace the setTimeout block:

setTimeout(async () => {
  if (user.value) {
    const role = String(user.value.role)
    const rawType = user.value.business_type
    const businessType = isValidBusinessType(rawType) ? rawType : 'tapsilogan'
    
    // Capitalize first letter to match route names
    const businessTypeCapitalized = businessType.charAt(0).toUpperCase() + businessType.slice(1)

    if (role === 'admin') {
      await navigateTo(`/admin/${businessType}`)
    } else if (role === 'front') {
      await navigateTo(`/${businessType}/front`)  
    } else if (role === 'kitchen') {
      await navigateTo(`/${businessType}/kitchen`)  
    } else {
      await navigateTo('/login')
    }
  } else {
    await navigateTo('/login')
  }
  loading.value = false
}, 100)

}

// onMounted(async () => {
//   try {
//     const { needsSetup } = await $fetch<{ needsSetup: boolean }>(`${serverUrl.value}/api/setup/status`)
//     if (needsSetup) {
//       await navigateTo('/signup')
//     }
//   } catch (_) {}
// })
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-orange-50 via-yellow-50 to-amber-100 flex items-center justify-center p-4">
    <!-- Back button -->
    <NuxtLink
      to="/"
      class="absolute top-6 left-4 sm:left-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-sm text-sm font-semibold text-gray-700 hover:text-orange-600 hover:shadow-md transition-all"
    >
      <ArrowLeft :size="16" />
      Back
    </NuxtLink>

    <div class="w-full max-w-sm">
      <!-- Logo -->
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
        <p class="text-gray-500 text-sm -mt-9">Sign in to continue</p>
      </div>

      <!-- Form -->
      <div class="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
            <input
              v-model="username"
              type="text"
              placeholder="Enter username"
              class="w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
              @keyup.enter="onSubmit"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="Enter password"
              class="w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
              @keyup.enter="onSubmit"
            />
          </div>

          <p v-if="error" class="text-red-500 text-sm font-medium">{{ error }}</p>

          <button
            :disabled="loading"
            class="w-full flex items-center justify-center gap-2 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
            @click="onSubmit"
          >
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>
      </div>

      <p class="text-center text-gray-500 text-xs mt-6">
        Budget POS v1.0 · Local system
      </p>
    </div>
  </div>
</template>