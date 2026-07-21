<template>
  <!-- Admin Sidebar -->
  <aside v-if="role === 'admin'" class="w-56 bg-white shadow-md flex flex-col overflow-y-auto h-full">
    <div class="flex items-center justify-between border-b border-gray-200 px-3 py-3 lg:hidden">
      <p class="text-sm font-semibold text-gray-700">Admin Menu</p>
      <button class="rounded-lg p-2 text-gray-500 hover:bg-gray-100" @click="$emit('close')" aria-label="Close menu">
        <Icon name="mdi:close" class="h-5 w-5" />
      </button>
    </div>

    <nav class="flex-1 px-3 py-4 space-y-1">
      <NuxtLink
        :to="`/admin/${currentType}`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:view-dashboard" class="w-5 h-5 mr-3" />
        Dashboard
      </NuxtLink>
      <NuxtLink
        :to="`/admin/${currentType}/branches`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:office-building" class="w-5 h-5 mr-3" />
        Branches
      </NuxtLink>
      <NuxtLink
        :to="`/admin/${currentType}/AddProductBranches`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:shopping" class="w-5 h-5 mr-3" />
        Menu Items
      </NuxtLink>
      <NuxtLink
        :to="`/admin/${currentType}/admin-settings`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:cog" class="w-5 h-5 mr-3" />
        Settings
      </NuxtLink>
    </nav>

    <div class="px-3 py-4 border-t border-gray-200">
      <button
        @click="handleLogout"
        class="flex items-center w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
      >
        <Icon name="mdi:logout" class="w-5 h-5 mr-3" />
        Log out
      </button>
    </div>
  </aside>

  <!-- Front Sidebar -->
  <aside v-else-if="role === 'front'" class="w-56 bg-white shadow-md flex flex-col overflow-y-auto h-full">
    <div class="flex items-center justify-between border-b border-gray-200 px-3 py-3 lg:hidden">
      <p class="text-sm font-semibold text-gray-700">Menu</p>
      <button class="rounded-lg p-2 text-gray-500 hover:bg-gray-100" @click="$emit('close')" aria-label="Close menu">
        <Icon name="mdi:close" class="h-5 w-5" />
      </button>
    </div>

    <nav class="flex-1 px-3 py-4 space-y-1">
      <NuxtLink
        :to="`/${businessType}/front`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:menu" class="w-5 h-5 mr-3" />
        Menu
      </NuxtLink>
      <NuxtLink
        :to="`/${businessType}/front/sales`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:chart-line" class="w-5 h-5 mr-3" />
        Sales
      </NuxtLink>
      <NuxtLink
        :to="`/${businessType}/front/product`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:package" class="w-5 h-5 mr-3" />
        Product
      </NuxtLink>
      <NuxtLink
        :to="`/${businessType}/front/transactions`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:receipt" class="w-5 h-5 mr-3" />
        Transactions
      </NuxtLink>
      <NuxtLink
        :to="`/${businessType}/front/settings`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:cog" class="w-5 h-5 mr-3" />
        Settings
      </NuxtLink>
    </nav>

    <div class="px-3 py-4 border-t border-gray-200">
      <button
        @click="handleLogout"
        class="flex items-center w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
      >
        <Icon name="mdi:logout" class="w-5 h-5 mr-3" />
        Log out
      </button>
    </div>
  </aside>

  <!-- Kitchen Sidebar -->
  <aside v-else-if="role === 'kitchen'" class="w-56 bg-white shadow-md flex flex-col overflow-y-auto h-full">
    <nav class="flex-1 px-3 py-4 space-y-1">
      <NuxtLink
        :to="`/${businessType}/kitchen`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:clipboard-list" class="w-5 h-5 mr-3" />
        Orders
      </NuxtLink>
      <NuxtLink
        :to="`/${businessType}/kitchen/history`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:clock" class="w-5 h-5 mr-3" />
        History
      </NuxtLink>
      <NuxtLink
        :to="`/${businessType}/kitchen/printing-settings`"
        class="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        active-class="bg-gray-100 text-gray-900 font-medium"
      >
        <Icon name="mdi:printer" class="w-5 h-5 mr-3" />
        Printing Settings
      </NuxtLink>
    </nav>

    <div class="px-3 py-4 border-t border-gray-200">
      <button
        @click="handleLogout"
        class="flex items-center w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
      >
        <Icon name="mdi:logout" class="w-5 h-5 mr-3" />
        Log out
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { isValidBusinessType } from '@shared/types/business.types'

const props = defineProps<{
  role: 'front' | 'kitchen' | 'admin'
}>()

defineEmits<{ close: [] }>()

const { user, logout } = useAuth()

const currentType = computed(() => {
  const raw = user.value?.business_type
  return isValidBusinessType(raw) ? raw : 'tapsilogan'
})

const businessType = computed(() => {
  const rawType = user.value?.business_type
  if (rawType && isValidBusinessType(rawType)) {
    return rawType
  }
  return 'tapsilogan'
})

function handleLogout() { logout() }
</script>