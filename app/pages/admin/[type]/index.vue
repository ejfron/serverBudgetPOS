<script setup lang="ts">
import { ClipboardList, Search, RefreshCw, TrendingUp, ShoppingBag, Store, Loader2 } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'
import { isValidBusinessType } from '@shared/types/business.types'

definePageMeta({ layout: 'admin' })

const { user } = useAuth()
const currentType = computed(() => {
  const raw = user.value?.business_type
  return isValidBusinessType(raw) ? raw : 'tapsilogan'
})
const { serverUrl } = useServerConfig()

const search = ref('')
const statusFilter = ref<'all' | 'pending' | 'ready' | 'completed'>('all')
const orders = ref<any[]>([])
const loading = ref(false)

const stats = computed(() => ({
  total: orders.value.length,
  pending: orders.value.filter(o => o.status === 'pending').length,
  ready: orders.value.filter(o => o.status === 'ready').length,
  completed: orders.value.filter(o => o.status === 'completed').length,
  revenue: orders.value.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total_amount ?? 0), 0),
}))

const filtered = computed(() => {
  let list = statusFilter.value === 'all' ? orders.value : orders.value.filter(o => o.status === statusFilter.value)
  if (search.value.trim()) {
    list = list.filter(o => String(o.order_number).includes(search.value))
  }
  return list
})

async function loadData() {
  loading.value = true
  try {
    if (!user.value?.branch_id) return
    
    const res = await $fetch<any>(`${serverUrl.value}/api/orders?branch_id=${user.value.branch_id}`)
    orders.value = (res.data ?? []).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch (e) {
    console.error('loadData error:', e)
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

onMounted(() => loadData())
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-gray-500 text-sm mt-1">Your branch overview</p>
      </div>
      <button
        class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-sm"
        @click="loadData"
      >
        <RefreshCw class="w-4 h-4" /> Refresh
      </button>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 mb-2">
          <TrendingUp class="w-4 h-4 text-orange-500" />
          <p class="text-xs text-gray-400 font-medium uppercase">Revenue</p>
        </div>
        <p class="text-2xl font-bold text-orange-500">₱{{ stats.revenue.toFixed(2) }}</p>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 mb-2">
          <ShoppingBag class="w-4 h-4 text-gray-400" />
          <p class="text-xs text-gray-400 font-medium uppercase">Total Orders</p>
        </div>
        <p class="text-2xl font-bold text-gray-800">{{ stats.total }}</p>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 mb-2">
          <Store class="w-4 h-4 text-gray-400" />
          <p class="text-xs text-gray-400 font-medium uppercase">Pending</p>
        </div>
        <p class="text-2xl font-bold text-yellow-600">{{ stats.pending }}</p>
      </div>
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 mb-2">
          <ClipboardList class="w-4 h-4 text-green-500" />
          <p class="text-xs text-gray-400 font-medium uppercase">Completed</p>
        </div>
        <p class="text-2xl font-bold text-green-600">{{ stats.completed }}</p>
      </div>
    </div>

    <div class="flex gap-3 items-center">
      <div class="relative flex-1">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="search"
          placeholder="Search by order #..."
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 shadow-sm"
        />
      </div>
      <div class="flex gap-2">
        <button
          v-for="s in ['all', 'pending', 'ready', 'completed']"
          :key="s"
          class="px-3 py-2 rounded-xl text-xs font-semibold transition capitalize"
          :class="statusFilter === s ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
          @click="statusFilter = s as any"
        >
          {{ s }}
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-if="loading" class="text-center py-12">
        <Loader2 class="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
        <p class="text-gray-400 text-sm">Loading orders...</p>
      </div>

      <div v-else-if="!filtered.length" class="text-center py-12">
        <ClipboardList class="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p class="text-gray-500 text-sm">No orders found</p>
      </div>

      <table v-else class="min-w-full divide-y divide-gray-100">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Order</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Items</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Total</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Time</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="order in filtered" :key="order.id" class="hover:bg-gray-50 transition">
            <td class="px-5 py-3.5 text-sm font-bold text-gray-800">#{{ String(order.order_number).padStart(3, '0') }}</td>
            <td class="px-5 py-3.5 text-sm text-gray-500 max-w-xs truncate">
              {{ order.order_items?.map((i: any) => `${i.item_name} x${i.quantity}`).join(', ') || '—' }}
            </td>
            <td class="px-5 py-3.5 text-sm font-bold text-orange-500">₱{{ Number(order.total_amount).toFixed(2) }}</td>
            <td class="px-5 py-3.5">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" :class="statusColor[order.status]">
                {{ order.status }}
              </span>
            </td>
            <td class="px-5 py-3.5 text-xs text-gray-400">{{ formatDate(order.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>