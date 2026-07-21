<script setup lang="ts">
definePageMeta({ layout: 'front' })

import { RefreshCw, NotepadText, Banknote, CreditCard, Calendar, Filter, ShoppingBag } from '@lucide/vue'
import { useAuth } from '~/composables/useAuth'
import { useServerConfig } from '~/composables/useServerConfig'

const { user } = useAuth()
const { serverUrl } = useServerConfig()

const stats = ref({ totalRevenue: 0, orderCount: 0, averageOrder: 0 })
const recentOrders = ref<any[]>([])
const loading = ref(false)
const selectedFilter = ref<'today' | 'week' | 'all'>('today')
const selectedPayment = ref<'all' | 'cash' | 'gcash'>('all')
const selectedDate = ref<string>('')

async function loadStats() {
  if (!user.value?.branch_id) return
  loading.value = true
  try {
    // Only load completed orders for sales
    const [statsRes, ordersRes] = await Promise.all([
      $fetch<any>(`${serverUrl.value}/api/sales/stats?branch_id=${user.value.branch_id}`),
      $fetch<any>(`${serverUrl.value}/api/orders?branch_id=${user.value.branch_id}&status=completed`),
    ])
 
    stats.value = statsRes ?? { totalRevenue: 0, orderCount: 0, averageOrder: 0 }
    recentOrders.value = (ordersRes?.data ?? []).filter(
      (o: any) => o.status === 'completed' && o.status !== 'voided'
    )
  } catch (e) {
    console.error('loadStats error:', e)
  } finally {
    loading.value = false
  }
}

function parseOrderDate(value: string | Date | null | undefined) {
  if (!value) return null
  const parsed = typeof value === 'string'
    ? new Date(value.replace(' ', 'T'))
    : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const filteredOrders = computed(() => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)

  return recentOrders.value.filter((o) => {
    const created = parseOrderDate(o.created_at)
    if (!created) return false

    if (selectedDate.value) {
      const filterDate = new Date(selectedDate.value)
      const filterDateStr = toLocalDateString(filterDate)
      const orderDateStr = toLocalDateString(created)
      if (orderDateStr !== filterDateStr) return false
    } else if (selectedFilter.value === 'today') {
      if (created < todayStart || created >= new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)) return false
    } else if (selectedFilter.value === 'week') {
      if (created < weekStart) return false
    }

    if (selectedPayment.value !== 'all') {
      const orderPayment = (o.payment_method || 'cash').toLowerCase()
      if (orderPayment !== selectedPayment.value) return false
    }

    return true
  })
})

const cashOrders = computed(() => filteredOrders.value.filter(o => (o.payment_method || 'cash').toLowerCase() === 'cash'))
const gcashOrders = computed(() => filteredOrders.value.filter(o => (o.payment_method || 'cash').toLowerCase() === 'gcash'))

const cashRevenue = computed(() => cashOrders.value.reduce((sum, o) => sum + (o.total_amount ?? 0), 0))
const gcashRevenue = computed(() => gcashOrders.value.reduce((sum, o) => sum + (o.total_amount ?? 0), 0))
const filteredRevenue = computed(() => cashRevenue.value + gcashRevenue.value)

const cashCount = computed(() => cashOrders.value.length)
const gcashCount = computed(() => gcashOrders.value.length)
const totalOrders = computed(() => filteredOrders.value.length)

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function clearDateFilter() {
  selectedDate.value = ''
  selectedFilter.value = 'today'
}

watch(
  () => user.value?.branch_id,
  (branchId) => {
    if (branchId) loadStats()
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-4 sm:space-y-6 pb-6">

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Sales Report</h1>
        <p class="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">{{ user?.branch_name }}</p>
      </div>
      <button
        class="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-2.5 sm:px-3 py-2 rounded-xl shadow-sm transition"
        @click="loadStats"
      >
        <RefreshCw class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span class="hidden sm:inline">Refresh</span>
      </button>
    </div>

    <div class="flex gap-2 sm:gap-3 overflow-x-auto pb-1 -mx-1 px-1 flex-nowrap sm:flex-wrap">
      <div class="flex gap-1 sm:gap-1.5 shrink-0">
        <button
          v-for="f in [{ key: 'today', label: 'Today' }, { key: 'week', label: 'Week' }, { key: 'all', label: 'All' }]"
          :key="f.key"
          class="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition whitespace-nowrap"
          :class="selectedFilter === f.key && !selectedDate
            ? 'bg-orange-500 text-white shadow-sm'
            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
          @click="selectedFilter = f.key as any; selectedDate = ''"
        >
          {{ f.label }}
        </button>
      </div>

      <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <Calendar class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
        <input
          type="date"
          v-model="selectedDate"
          class="px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border border-gray-200 bg-white text-gray-600 focus:outline-none focus:border-orange-400 transition w-[130px] sm:w-auto"
          @change="selectedFilter = '' as any"
        />
        <button
          v-if="selectedDate"
          class="text-[10px] sm:text-xs text-red-400 hover:text-red-500 shrink-0"
          @click="clearDateFilter"
        >
          ✕
        </button>
      </div>

      <div class="w-px h-6 bg-gray-200 hidden sm:block shrink-0" />

      <div class="flex gap-1 sm:gap-1.5 shrink-0">
        <button
          class="px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
          :class="selectedPayment === 'all'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
          @click="selectedPayment = 'all'"
        >
          <Filter class="w-3 h-3 sm:w-3.5 sm:h-3.5" /> All
        </button>
        <button
          class="px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
          :class="selectedPayment === 'cash'
            ? 'bg-green-500 text-white shadow-sm'
            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
          @click="selectedPayment = 'cash'"
        >
          <Banknote class="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Cash
        </button>
        <button
          class="px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
          :class="selectedPayment === 'gcash'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
          @click="selectedPayment = 'gcash'"
        >
          <CreditCard class="w-3 h-3 sm:w-3.5 sm:h-3.5" /> GCash
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 sm:py-16">
      <div class="w-8 h-8 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mx-auto mb-3" />
      <p class="text-gray-400 text-xs sm:text-sm">Loading sales data...</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div class="bg-white rounded-2xl p-3.5 sm:p-5 shadow-sm border border-gray-100">
          <p class="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Total Revenue</p>
          <p class="text-lg sm:text-2xl font-bold text-orange-500 mt-0.5 sm:mt-1">₱{{ filteredRevenue.toFixed(2) }}</p>
          <p class="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">{{ totalOrders }} orders</p>
        </div>

        <div class="bg-white rounded-2xl p-3.5 sm:p-5 shadow-sm border border-gray-100">
          <p class="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1">
            <ShoppingBag class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" /> Total Orders
          </p>
          <p class="text-lg sm:text-2xl font-bold text-gray-800 mt-0.5 sm:mt-1">{{ totalOrders }}</p>
          <p class="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
            {{ selectedFilter === 'today' ? 'Today' : selectedFilter === 'week' ? 'This week' : 'All time' }}
          </p>
        </div>

        <div class="bg-white rounded-2xl p-3.5 sm:p-5 shadow-sm border border-gray-100">
          <p class="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1">
            <Banknote class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500" /> Cash
          </p>
          <p class="text-lg sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">₱{{ cashRevenue.toFixed(2) }}</p>
          <p class="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">{{ cashCount }} orders</p>
        </div>

        <div class="bg-white rounded-2xl p-3.5 sm:p-5 shadow-sm border border-gray-100">
          <p class="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1">
            <CreditCard class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" /> GCash
          </p>
          <p class="text-lg sm:text-2xl font-bold text-blue-600 mt-0.5 sm:mt-1">₱{{ gcashRevenue.toFixed(2) }}</p>
          <p class="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">{{ gcashCount }} orders</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-xs sm:text-sm font-bold text-gray-700">Order History</h2>
          <span class="text-[10px] sm:text-xs text-gray-400">{{ totalOrders }} records</span>
        </div>

        <div v-if="!filteredOrders.length" class="text-center py-10 sm:py-12">
          <p class="text-3xl sm:text-4xl mb-2 sm:mb-3 flex items-center justify-center gap-2 text-gray-300">
            <NotepadText />
          </p>
          <p class="text-gray-500 text-xs sm:text-sm font-medium">No completed orders yet</p>
          <p class="text-gray-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Orders will appear here once completed</p>
        </div>

        <div v-else>
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition gap-2"
          >
            <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div 
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-[11px] sm:text-sm shrink-0"
                :class="(order.payment_method || 'cash') === 'gcash' 
                  ? 'bg-blue-50 text-blue-500' 
                  : 'bg-green-50 text-green-500'"
              >
                #{{ String(order.order_number).padStart(3, '0') }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <p class="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-48">
                    {{ order.order_items?.map((i: any) => `${i.item_name} x${i.quantity}`).join(', ') || '—' }}
                  </p>
                  <span 
                    class="text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-md shrink-0"
                    :class="(order.payment_method || 'cash') === 'gcash' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-green-100 text-green-600'"
                  >
                    {{ (order.payment_method || 'cash') === 'gcash' ? 'GCash' : 'Cash' }}
                  </span>
                </div>
                <p class="text-[10px] sm:text-xs text-gray-400">{{ formatDate(order.created_at) }}</p>
              </div>
            </div>
            <p class="text-xs sm:text-sm font-bold text-orange-500 shrink-0">
              ₱{{ Number(order.total_amount).toFixed(2) }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>