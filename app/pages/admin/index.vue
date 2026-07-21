<script setup lang="ts">
definePageMeta({ layout: false })
import { isValidBusinessType } from '@shared/types/business.types'

const { user } = useAuth()

onMounted(async () => {
  if (user.value && user.value.role === 'admin') {
    const rawType = user.value.business_type
    const businessType = isValidBusinessType(rawType) ? rawType : 'tapsilogan'
    await navigateTo(`/admin/${businessType}`)
  } else {
    await navigateTo('/login')
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
      <p class="mt-4 text-gray-500">Redirecting to your dashboard...</p>
    </div>
  </div>
</template>