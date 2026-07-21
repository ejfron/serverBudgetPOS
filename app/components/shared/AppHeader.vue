<script setup lang="ts">
import { hasKitchen } from '@shared/types/business.types'
import type { BusinessTheme } from '~/utils/businessTheme'

const { user } = useAuth()
const branchHasKitchen = computed(() => hasKitchen(user.value?.business_type))

import {
  Printer, Wifi, LogOut, Clock, Loader2,
  X, BluetoothSearching, CheckCircle2, RefreshCw, Send, Settings,
  Receipt, ChefHat,
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
  toggleSidebar: []
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

const currentTime = ref('')
const currentDate = ref('')
const showModal = ref(false)
const connecting = ref(false)
const connectingId = ref<string | null>(null)
const testing = ref(false)

const printerConnected = computed(() => props.printerConnected ?? printerConnectedLocal.value)

const displayBranchName = computed(() => props.branchName || user.value?.branch_name || 'Branch')
const displayRole = computed(() => user.value?.role || props.role)
const displayBusinessType = computed(() => {
  const bt = user.value?.business_type || 'tapsilogan'
  return bt.charAt(0).toUpperCase() + bt.slice(1)
})

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  currentDate.value = now.toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
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
</script>

<template>
  <header class="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">

    <div class="flex items-center gap-2.5">
      <button @click="$emit('toggleSidebar')" class="lg:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100 mr-1">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center shadow-md text-white"
        :class="theme?.solidBg ?? 'bg-orange-500'"
      >
        <Receipt v-if="role === 'front'" class="w-5 h-5" />
        <ChefHat v-else class="w-5 h-5" />
      </div>
      <div>
        <p class="font-bold text-gray-800 text-sm leading-tight">
          <span class="text-orange-500">{{ displayBusinessType }}</span> POS
        </p>
        <p class="text-xs text-gray-400">
          {{ displayBranchName }} · <span class="capitalize font-medium text-gray-500">{{ displayRole }}</span>
        </p>
      </div>
    </div>

    <div class="hidden md:flex items-center gap-2">
      <Clock class="w-4 h-4 text-gray-300" />
      <div class="flex flex-col items-center">
        <p class="text-base font-bold text-gray-800 leading-none">{{ currentTime }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ currentDate }}</p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        v-if="role === 'front'"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
        :class="printerConnected
          ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
          : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'"
        @click="openModal"
      >
        <Printer class="w-3.5 h-3.5" />
        <span v-if="printerConnected" class="hidden sm:inline">
          {{ connectedDevice?.name ?? 'Printer ready' }}
        </span>
        <span v-else class="hidden sm:inline">Connect printer</span>
      </button>

      <div
        v-if="role === 'kitchen'"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-green-50 text-green-600 border border-green-200"
      >
        <Wifi class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Live</span>
      </div>

      <NuxtLink
        v-if="role === 'front'"
        to="/front/settings"
        class="flex items-center justify-center w-8 h-8 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
        title="Settings"
      >
        <Settings class="w-4 h-4" />
      </NuxtLink>

      <div class="w-px h-5 bg-gray-200" />

      <button
        class="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-xl transition-all"
        @click="$emit('logout')"
      >
        <LogOut class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Log out</span>
      </button>
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