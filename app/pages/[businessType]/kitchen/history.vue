<script setup lang="ts">
import { Search, Loader2, CheckCircle2, XCircle, Calendar, ChevronDown, ChevronUp, ShoppingBag, X } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'

definePageMeta({ layout: 'kitchen' })

const { serverUrl } = useServerConfig()
const { user } = useAuth()

interface Order {
  id: string
  order_number: number
  status: string
  total_amount: number
  payment_method: string
  order_type: string
  created_at: string
  completed_at?: string
  order_items: Array<{
    id: string
    item_name: string
    quantity: number
    unit_price: number
    subtotal: number
  }>
  cashier?: string
}

const orders = ref<Order[]>([])
const loading = ref(false)
const searchQuery = ref('')
const expandedOrder = ref<string | null>(null)
const dateFilter = ref<'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'>('today')
const customDate = ref('')

const filteredOrders = computed(() => {
  let list = orders.value

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (dateFilter.value === 'today') {
    list = list.filter(o => new Date(o.created_at) >= today)
  } else if (dateFilter.value === 'yesterday') {
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    list = list.filter(o => {
      const d = new Date(o.created_at)
      return d >= yesterday && d < today
    })
  } else if (dateFilter.value === 'week') {
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    list = list.filter(o => new Date(o.created_at) >= weekAgo)
  } else if (dateFilter.value === 'month') {
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    list = list.filter(o => new Date(o.created_at) >= monthAgo)
  } else if (dateFilter.value === 'custom' && customDate.value) {
    const selectedDate = new Date(customDate.value)
    const nextDay = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
    list = list.filter(o => {
      const d = new Date(o.created_at)
      return d >= selectedDate && d < nextDay
    })
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(o => {
      const orderNum = String(o.order_number).padStart(3, '0')
      const items = (o.order_items || []).map(i => i.item_name).join(' ')
      return orderNum.includes(query) || items.toLowerCase().includes(query)
    })
  }

  return list
})

function toggleExpand(orderId: string) {
  expandedOrder.value = expandedOrder.value === orderId ? null : orderId
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit',
  })
}

function getStatusBadge(status: string) {
  const map: Record<string, { color: string; bg: string; border: string; label: string }> = {
    completed: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Completed' },
    voided: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: 'Voided' },
  }
  return map[status] || { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', label: status }
}

function clearCustomDate() {
  customDate.value = ''
  dateFilter.value = 'today'
}

async function loadOrders() {
  loading.value = true
  try {
    const res = await $fetch<any>(`${serverUrl.value}/api/orders`, {
      query: { branch_id: user.value?.branch_id }
    })
    orders.value = (res?.data ?? []).filter((o: Order) => 
      o.status === 'completed' || o.status === 'voided'
    )
  } catch (e) {
    console.error('loadOrders error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="space-y-4 sm:space-y-5 pb-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Order History</h1>
        <p class="text-gray-500 text-xs sm:text-sm mt-0.5">View completed cooking orders</p>
      </div>
    </div>

    <!-- Date Filter Tabs + Inline Date Picker -->
    <div class="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 flex-nowrap items-center">
      <button
        v-for="d in [
          { key: 'today', label: 'Today' },
          { key: 'yesterday', label: 'Yesterday' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'all', label: 'All Time' },
        ]"
        :key="d.key"
        class="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap shrink-0"
        :class="dateFilter === d.key && !customDate
          ? 'bg-orange-500 text-white shadow-sm'
          : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
        @click="dateFilter = d.key as any; customDate = ''"
      >
        <Calendar class="w-3 h-3" />
        {{ d.label }}
      </button>

      <!-- Inline Custom Date Picker (always visible) -->
      <div
        class="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap shrink-0"
        :class="dateFilter === 'custom' && customDate
          ? 'bg-orange-500 text-white shadow-sm'
          : 'bg-white text-gray-500 border border-gray-200'"
      >
        <Calendar class="w-3 h-3" />
        <input
          v-model="customDate"
          type="date"
          class="bg-transparent text-inherit font-semibold outline-none text-xs w-[110px] sm:w-[130px] cursor-pointer"
          :class="dateFilter === 'custom' && customDate ? 'text-white' : 'text-gray-500'"
          @change="dateFilter = 'custom'"
        />
        <button
          v-if="customDate"
          @click="clearCustomDate"
          class="ml-1 w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center"
        >
          <X class="w-3 h-3" :class="dateFilter === 'custom' && customDate ? 'text-white' : 'text-gray-500'" />
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="relative">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        v-model="searchQuery"
        placeholder="Search order # or item..."
        class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 shadow-sm"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16">
      <Loader2 class="w-8 h-8 animate-spin mx-auto text-orange-400 mb-3" />
      <p class="text-gray-400 text-sm">Loading orders...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="!filteredOrders.length" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <ShoppingBag class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500 font-medium">No orders found</p>
      <p class="text-gray-400 text-sm mt-1">Completed orders will appear here</p>
    </div>

    <!-- Order Cards -->
    <div v-else class="space-y-2 sm:space-y-3">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all"
        :class="order.status === 'voided' ? 'border-red-200 opacity-75' : 'border-gray-100'"
      >
        <div
          class="flex items-center justify-between px-3.5 sm:px-5 py-3 cursor-pointer hover:bg-gray-50 transition"
          @click="toggleExpand(order.id)"
        >
          <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div
              class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0"
              :class="(order.payment_method || 'cash') === 'gcash' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'"
            >
              #{{ String(order.order_number).padStart(3, '0') }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-[300px]">
                  {{ order.order_items?.map((i: any) => i.item_name).join(', ') || '—' }}
                </p>
                <span
                  class="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0"
                  :class="[getStatusBadge(order.status).bg, getStatusBadge(order.status).color, getStatusBadge(order.status).border]"
                >
                  {{ getStatusBadge(order.status).label }}
                </span>
                <span class="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200 shrink-0">
                  {{ (order.payment_method || 'cash') === 'gcash' ? 'GCash' : 'Cash' }}
                </span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-400 mt-0.5">{{ formatDate(order.created_at) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
            <p class="text-xs sm:text-sm font-bold text-orange-500">₱{{ Number(order.total_amount).toFixed(2) }}</p>
            <ChevronDown
              class="w-4 h-4 text-gray-400 transition-transform"
              :class="expandedOrder === order.id ? 'rotate-180' : ''"
            />
          </div>
        </div>

        <div v-if="expandedOrder === order.id" class="px-3.5 sm:px-5 pb-4 border-t border-gray-100 pt-3">
          <div class="mb-3">
            <p class="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase mb-2">Order Items</p>
            <div class="space-y-1.5">
              <div v-for="(item, i) in order.order_items" :key="i" class="flex items-center justify-between text-xs sm:text-sm py-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-700">{{ item.quantity }}x</span>
                  <span class="text-gray-600">{{ item.item_name }}</span>
                </div>
                <span class="text-gray-500">₱{{ Number(item.subtotal || item.quantity * item.unit_price).toFixed(2) }}</span>
              </div>
            </div>
            <div class="border-t border-gray-100 mt-2 pt-2 flex justify-between text-xs sm:text-sm font-bold">
              <span class="text-gray-700">Total</span>
              <span class="text-orange-500">₱{{ Number(order.total_amount).toFixed(2) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 mb-2">
            <div class="bg-gray-50 rounded-xl p-2">
              <p class="text-[10px] text-gray-400">Payment</p>
              <p class="text-xs font-semibold text-gray-700 capitalize">{{ order.payment_method || 'Cash' }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-2">
              <p class="text-[10px] text-gray-400">Type</p>
              <p class="text-xs font-semibold text-gray-700 capitalize">{{ order.order_type || 'Dine-in' }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-2">
              <p class="text-[10px] text-gray-400">Time</p>
              <p class="text-xs font-semibold text-gray-700">{{ formatTime(order.created_at) }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-2">
              <p class="text-[10px] text-gray-400">Cashier</p>
              <p class="text-xs font-semibold text-gray-700">{{ order.cashier || '—' }}</p>
            </div>
          </div>

          <div v-if="order.status === 'voided'" class="flex items-center gap-1.5 text-[10px] sm:text-xs text-red-400 bg-red-50 rounded-xl px-3 py-2 mt-2">
            <XCircle class="w-3.5 h-3.5" />
            This order has been voided
          </div>
        </div>
      </div>
    </div>
  </div>
</template>