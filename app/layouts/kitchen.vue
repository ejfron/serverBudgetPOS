<script setup lang="ts">
import { Menu } from '@lucide/vue'
import AppBottomNav from '~/components/shared/AppBottomNav.vue'
import AppHeader from '~/components/shared/AppHeader.vue'
import AppSidebar from '~/components/shared/AppSidebar.vue'
import { themeFor } from '~/utils/businessTheme'

const { user, logout } = useAuth()
const sidebarOpen = ref(false)

const theme = computed(() => themeFor(user.value?.business_type))

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}
</script>

<!-- layouts/kitchen.vue -->
<template>
  <div class="min-h-screen bg-gray-50 text-gray-800">
    <AppHeader
      role="kitchen"
      :branch-name="user?.branch_name ?? ''"
      :theme="theme"
      class="fixed top-0 left-0 right-0 z-50 h-16"
      @logout="logout"
      @toggle-sidebar="toggleSidebar"
    />

    <!-- Overlay for sidebar on mobile -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/40 lg:hidden"
      @click="closeSidebar"
    />

    <!-- Sidebar - hidden on mobile -->
    <AppSidebar
      role="kitchen"
      :theme="theme"
      class="fixed left-0 top-20 bottom-0 z-40 w-56 transition-transform duration-200 ease-in-out overflow-y-auto hidden lg:block"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      @close="closeSidebar"
    />

    <!-- Add Bottom Navigation for mobile -->
    <AppBottomNav role="kitchen" />

    <!-- Adjust padding for bottom nav on mobile -->
    <main class="pt-16 p-4 lg:ml-56 min-h-screen pb-20 lg:pb-4">
      <slot />
    </main>
  </div>
</template>