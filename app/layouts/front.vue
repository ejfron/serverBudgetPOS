<script setup lang="ts">
import { Menu } from '@lucide/vue'
import AppHeader from '~/components/shared/AppHeader.vue'
import AppSidebar from '~/components/shared/AppSidebar.vue'
import { themeFor } from '~/utils/businessTheme'

const { user, logout } = useAuth()
const { connected, connect } = usePrinter()
const connecting = ref(false)
const sidebarOpen = ref(false)

const theme = computed(() => themeFor(user.value?.business_type))

async function handleConnect() {
  connecting.value = true
  await connect()
  connecting.value = false
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

// ✅ Don't auto-connect Bluetooth on app start — prevents crash
onMounted(() => {
  // connect() — disabled to prevent Bluetooth crash on APK startup
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-800">
    <AppHeader
      role="front"
      :branch-name="user?.branch_name ?? ''"
      :printer-connected="connected"
      :printer-connecting="connecting"
      :theme="theme"
      class="fixed top-0 left-0 right-0 z-50 h-16"
      @logout="logout"
      @connect-printer="handleConnect"
      @toggle-sidebar="toggleSidebar"
    />

    <button
      v-if="!sidebarOpen"
      class="fixed left-3 top-20 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-lg lg:hidden"
      @click="toggleSidebar"
      aria-label="Open menu"
    >
      <Menu class="h-5 w-5" />
    </button>

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-35 bg-black/30 lg:hidden"
      @click="closeSidebar"
    />

    <AppSidebar
      role="front"
      :theme="theme"
      class="fixed left-0 top-16 bottom-0 z-40 w-56 transition-transform duration-200 ease-in-out"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      @close="closeSidebar"
    />

    <main class="mt-16 p-4 overflow-hidden lg:ml-56">
      <slot />
    </main>
  </div>
</template>