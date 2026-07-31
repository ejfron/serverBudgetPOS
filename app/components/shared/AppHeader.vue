<script setup lang="ts">
import { hasKitchen } from '@shared/types/business.types'
import type { BusinessTheme } from '~/utils/businessTheme'

const { user } = useAuth()
const branchHasKitchen = computed(() => hasKitchen(user.value?.business_type))

import {
  Printer, Wifi, LogOut, Loader2,
  X, BluetoothSearching, CheckCircle2, RefreshCw, Send,
  Store, User, ChevronDown,
} from '@lucide/vue'

const props = defineProps<{
  role: 'front' | 'kitchen' | 'admin'
  branchName?: string
  printerConnected?: boolean
  printerConnecting?: boolean
  theme?: BusinessTheme
}>()

defineEmits<{
  logout: []
  connectPrinter: []
}>()

const {
  connected: printerConnectedLocal,
  connectedDevice,
  scanning,
  pairedDevices,
  errorMsg,
  successMsg,
  scanDevices,
  selectDevice,
  disconnectPrinter,
  testPrint,
} = usePrinter()

const showModal = ref(false)
const showProfileDropdown = ref(false)
const connecting = ref(false)
const connectingId = ref<string | null>(null)
const testing = ref(false)

const printerConnected = computed(() => props.printerConnected ?? printerConnectedLocal.value)

const displayBranchName = computed(() => props.branchName || user.value?.branch_name || 'Branch')
const displayRole = computed(() => user.value?.role || props.role)
const displayName = computed(() => user.value?.full_name || user.value?.username || 'User')

// Get initials from name
const userInitials = computed(() => {
  const name = displayName.value
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

function getRoleBadge(role: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    admin: { label: 'Admin', color: 'text-purple-700', bg: 'bg-purple-100' },
    front: { label: 'Cashier', color: 'text-orange-700', bg: 'bg-orange-100' },
    kitchen: { label: 'Kitchen', color: 'text-blue-700', bg: 'bg-blue-100' },
  }
  return map[role] || map.front
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.profile-dropdown-container')) {
    showProfileDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

async function openModal() {
  showModal.value = true
  await scanDevices()
}

async function handleSelect(device: any) {
  connecting.value = true
  connectingId.value = device.id
  try {
    await selectDevice(device)
  } catch {
    // errorMsg set inside usePrinter
  } finally {
    connecting.value = false
    connectingId.value = null
  }
}

async function handleTestPrint() {
  testing.value = true
  await testPrint()
  testing.value = false
}

function isCurrentDevice(device: any): boolean {
  return connectedDevice.value?.id === device.id
}

function deviceIcon(device: any): string {
  const name = (device.name ?? '').toLowerCase()
  if (name.includes('printer') || name.includes('pos') || name.includes('xp-') || name.includes('bt-') || name.includes('mtp')) return '🖨️'
  if (name.includes('samsung') || name.includes('iphone') || name.includes('android')) return '📱'
  return '📡'
}

const badge = computed(() => getRoleBadge(displayRole.value))
</script>

<template>
  <header class="bg-white border-b border-gray-200 px-4 lg:px-6 py-2 flex items-center justify-between shrink-0 shadow-sm">
    
    <!-- Left: Logo & Brand -->
    <div class="flex items-center gap-3">
      <NuxtLink to="/" class="flex items-center shrink-0">
        <img
          src="/uploads/ChatGPT Image Jul 18, 2026 at 10_13_50 AM.png"
          class="h-14 sm:h-15 md:h-16 w-auto object-contain"
          alt="BudgetPOS"
        />
      </NuxtLink>
      
      <!-- Branch & Role Info -->
      <div class="hidden md:flex items-center gap-3 pl-3 border-l border-gray-200">
        <div class="flex items-center gap-1.5">
          <Store class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-semibold text-gray-700">{{ displayBranchName }}</span>
        </div>
        <span
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          :class="[badge.bg, badge.color]"
        >
          {{ badge.label }}
        </span>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-2">
      <!-- Printer Button (Front only) -->
      <button
        v-if="role === 'front'"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border"
        :class="printerConnected
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:border-gray-300'"
        @click="openModal"
      >
        <Printer class="w-3.5 h-3.5" />
        <span class="hidden sm:inline text-[11px]">
          {{ printerConnected ? (connectedDevice?.name ?? 'Connected') : 'Printer' }}
        </span>
        <span
          class="w-2 h-2 rounded-full shrink-0"
          :class="printerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'"
        />
      </button>

      <!-- Kitchen Live Badge -->
      <div
        v-if="role === 'kitchen'"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span class="hidden sm:inline">Live</span>
      </div>

      <!-- Profile Dropdown -->
      <div class="profile-dropdown-container relative">
        <button
          class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-all group"
          @click.stop="showProfileDropdown = !showProfileDropdown"
        >
          <!-- Avatar Circle -->
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            :class="role === 'admin' ? 'bg-purple-500' : role === 'kitchen' ? 'bg-blue-500' : 'bg-orange-500'"
          >
            <span>{{ userInitials }}</span>
          </div>
          <div class="hidden sm:flex flex-col items-start leading-tight">
            <span class="text-xs font-semibold text-gray-700">{{ displayName }}</span>
            <span class="text-[10px] text-gray-400">{{ badge.label }}</span>
          </div>
          <ChevronDown
            class="w-3.5 h-3.5 text-gray-400 transition-transform hidden sm:block"
            :class="showProfileDropdown ? 'rotate-180' : ''"
          />
        </button>

        <!-- Dropdown Menu -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-if="showProfileDropdown"
            class="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50"
          >
            <!-- Profile Info -->
            <div class="px-4 py-3 border-b border-gray-100">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  :class="role === 'admin' ? 'bg-purple-500' : role === 'kitchen' ? 'bg-blue-500' : 'bg-orange-500'"
                >
                  <span>{{ userInitials }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-800 truncate">{{ displayName }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ user?.username || '' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  :class="[badge.bg, badge.color]"
                >
                  {{ badge.label }}
                </span>
                <span class="text-[10px] text-gray-400">{{ displayBranchName }}</span>
              </div>
            </div>

            <!-- Menu Items -->
            <div class="py-1">
              <button
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                @click="showProfileDropdown = false; $emit('logout')"
              >
                <LogOut class="w-4 h-4" />
                <span class="font-medium">Log out</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>

  <!-- Printer Modal -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        @click.self="showModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div class="flex items-center gap-2">
              <BluetoothSearching class="w-5 h-5 text-blue-500" />
              <p class="font-bold text-gray-800">Connect Bluetooth Printer</p>
            </div>
            <button
              class="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              @click="showModal = false"
            >
              <X class="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div v-if="scanning" class="flex flex-col items-center justify-center py-12 gap-3">
            <div class="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Loader2 class="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <p class="text-sm font-semibold text-gray-700">Looking for paired devices...</p>
            <p class="text-xs text-gray-400 text-center px-8">Make sure your printer is turned ON</p>
          </div>

          <div v-else class="p-4 space-y-3">
            <div v-if="successMsg" class="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-green-500 shrink-0" />
              <p class="text-xs text-green-700 font-medium">{{ successMsg }}</p>
            </div>

            <div v-if="errorMsg" class="bg-red-50 border border-red-200 rounded-xl p-3">
              <p class="text-xs text-red-600">{{ errorMsg }}</p>
            </div>

            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Paired devices ({{ pairedDevices.length }})
              </p>
              <button
                class="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50"
                :disabled="scanning"
                @click="scanDevices"
              >
                <RefreshCw class="w-3.5 h-3.5" :class="scanning ? 'animate-spin' : ''" />
                Refresh
              </button>
            </div>

            <div v-if="pairedDevices.length === 0 && !errorMsg" class="text-center py-6">
              <BluetoothSearching class="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p class="text-sm font-medium text-gray-600">No paired devices found</p>
              <p class="text-xs text-gray-400 mt-1">Go to phone Settings → Bluetooth → pair your printer</p>
            </div>

            <div class="space-y-2 max-h-60 overflow-y-auto">
              <button
                v-for="device in pairedDevices"
                :key="device.id"
                class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-95"
                :class="connectingId === device.id
                  ? 'border-blue-300 bg-blue-50'
                  : isCurrentDevice(device)
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-100 bg-gray-50 hover:border-orange-300 hover:bg-orange-50'"
                :disabled="connecting"
                @click="handleSelect(device)"
              >
                <div class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl shrink-0 shadow-sm">
                  {{ deviceIcon(device) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-800 truncate">
                    {{ device.name || 'Unknown Device' }}
                  </p>
                  <p class="text-xs text-gray-400 font-mono truncate">{{ device.id }}</p>
                  <p v-if="isCurrentDevice(device)" class="text-xs text-green-500 font-medium mt-0.5">
                    ✓ Currently connected
                  </p>
                </div>
                <div class="shrink-0">
                  <Loader2 v-if="connectingId === device.id" class="w-5 h-5 text-blue-500 animate-spin" />
                  <CheckCircle2 v-else-if="isCurrentDevice(device)" class="w-5 h-5 text-green-500" />
                  <div v-else class="w-5 h-5 rounded-full border-2 border-gray-200" />
                </div>
              </button>
            </div>

            <button
              v-if="printerConnected"
              class="w-full py-2.5 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              :disabled="testing"
              @click="handleTestPrint"
            >
              <Loader2 v-if="testing" class="w-3.5 h-3.5 animate-spin" />
              <Send v-else class="w-3.5 h-3.5" />
              {{ testing ? 'Printing test...' : 'Print test receipt' }}
            </button>

            <button
              v-if="printerConnected && connectedDevice"
              class="w-full py-2.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 text-xs font-medium flex items-center justify-center gap-2"
              @click="disconnectPrinter"
            >
              <X class="w-3.5 h-3.5" />
              Disconnect {{ connectedDevice.name }}
            </button>

            <div class="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p class="text-xs text-amber-700 font-semibold">💡 How to pair a Bluetooth printer</p>
              <p class="text-xs text-amber-600 mt-0.5">
                Works with any classic-Bluetooth (SPP) thermal printer — Xprinter, generic 58mm printers, etc.<br>
                1. Turn ON the printer<br>
                2. Phone <strong>Settings → Bluetooth</strong><br>
                3. Find it in the list → tap to pair<br>
                4. PIN: <strong>0000</strong> or <strong>1234</strong><br>
                5. Come back here and tap Refresh
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>