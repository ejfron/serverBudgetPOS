<script setup lang="ts">
import { Search, Loader2, Utensils, CheckCircle2, XCircle, Package, AlertTriangle } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'
import { usePosData } from '~/composables/usePosData'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'kitchen' })

const { serverUrl } = useServerConfig()
const { user } = useAuth()
const { getMenuItemsAll, updateMenuItemAvailability } = usePosData()

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  image_url?: string
  is_available: boolean
  stock_status?: 'available' | 'low' | 'out_of_stock'
}

const menuItems = ref<MenuItem[]>([])
const loading = ref(false)
const search = ref('')
const activeCategory = ref('all')
const updatingId = ref<string | null>(null)

const categories = computed(() => {
  const cats = new Set(menuItems.value.map(i => i.category))
  return ['all', ...Array.from(cats)]
})

const filtered = computed(() => {
  let list = activeCategory.value === 'all'
    ? menuItems.value
    : menuItems.value.filter(i => i.category === activeCategory.value)
  if (search.value.trim()) {
    list = list.filter(i => i.name.toLowerCase().includes(search.value.toLowerCase()))
  }
  return list
})

const availableCount = computed(() => menuItems.value.filter(i => i.is_available).length)
const outOfStockCount = computed(() => menuItems.value.filter(i => !i.is_available).length)

function imageUrl(item: MenuItem): string | null {
  if (!item.image_url) return null
  if (item.image_url.startsWith('http') || item.image_url.startsWith('data:')) return item.image_url
  return `${serverUrl.value}${item.image_url}`
}

// ✅ Uses usePosData → reads directly from local SQLite on native Android,
// no $fetch, no server dependency
async function loadProducts() {
  loading.value = true
  try {
    const items = await getMenuItemsAll()
    menuItems.value = (items ?? []).map((item: any) => ({
      ...item,
      is_available: item.is_available !== false,
      stock_status: item.stock_status || (item.is_available !== false ? 'available' : 'out_of_stock'),
    }))
  } catch (e) {
    console.error('loadProducts error:', e)
  } finally {
    loading.value = false
  }
}

async function toggleAvailability(item: MenuItem) {
  updatingId.value = item.id
  try {
    const newStatus = !item.is_available
    const newStock = newStatus ? 'available' : 'out_of_stock'
    const result = await updateMenuItemAvailability(item.id, newStatus, newStock)
    item.is_available = result?.is_available ?? newStatus
    item.stock_status = result?.stock_status ?? newStock
  } catch (e) {
    console.error('toggleAvailability error:', e)
  } finally {
    updatingId.value = null
  }
}

async function setStockStatus(item: MenuItem, status: 'available' | 'low' | 'out_of_stock') {
  updatingId.value = item.id
  try {
    const isAvail = status !== 'out_of_stock'
    const result = await updateMenuItemAvailability(item.id, isAvail, status)
    item.is_available = result?.is_available ?? isAvail
    item.stock_status = result?.stock_status ?? status
  } catch (e) {
    console.error('setStockStatus error:', e)
  } finally {
    updatingId.value = null
  }
}

function getStockBadge(status: string) {
  const map: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    available: { label: 'Available', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
    low: { label: 'Low Stock', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
    out_of_stock: { label: 'Out of Stock', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  }
  return map[status] || map.available
}

function categoryLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

onMounted(() => {
  loadProducts()
})
</script>

<template>
  <div class="space-y-5 pb-6">
    
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Product Availability</h1>
        <p class="text-gray-500 text-sm mt-1">Manage which items are available for ordering</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Package class="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-800">{{ menuItems.length }}</p>
            <p class="text-xs text-gray-400">Total Items</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 class="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-emerald-600">{{ availableCount }}</p>
            <p class="text-xs text-gray-400">Available</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle class="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p class="text-2xl font-bold text-red-500">{{ outOfStockCount }}</p>
            <p class="text-xs text-gray-400">Out of Stock</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search + Filter -->
    <div class="flex gap-3 items-center">
      <div class="relative flex-1">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="search"
          placeholder="Search products..."
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 shadow-sm"
        />
      </div>
      <div class="flex gap-2 shrink-0 overflow-x-auto">
        <button
          v-for="cat in categories"
          :key="cat"
          class="px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap capitalize"
          :class="activeCategory === cat
            ? 'bg-orange-500 text-white'
            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
          @click="activeCategory = cat"
        >
          {{ cat === 'all' ? 'All' : cat }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-400">
      <Loader2 class="w-6 h-6 animate-spin mx-auto mb-2" />
      Loading products...
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <Utensils class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500 font-medium">No products found</p>
    </div>

    <!-- Product List -->
    <div v-else class="space-y-2">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="bg-white border rounded-2xl overflow-hidden shadow-sm transition-all"
        :class="item.is_available ? 'border-gray-100' : 'border-red-200 bg-red-50/30'"
      >
        <div class="flex items-center gap-4 p-4">
          <!-- Product Image -->
          <div
            class="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-gray-100"
            :class="item.is_available ? 'bg-gray-50' : 'bg-red-100/50'"
          >
            <img
              v-if="imageUrl(item)"
              :src="imageUrl(item)!"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="w-full h-full flex items-center justify-center text-xl font-bold text-gray-300">
              {{ item.name.charAt(0).toUpperCase() }}
            </span>
          </div>

          <!-- Product Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-bold text-gray-800 truncate capitalize">{{ item.name }}</p>
              <span
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border shrink-0"
                :class="[getStockBadge(item.stock_status || (item.is_available ? 'available' : 'out_of_stock')).bg, 
                         getStockBadge(item.stock_status || (item.is_available ? 'available' : 'out_of_stock')).color,
                         getStockBadge(item.stock_status || (item.is_available ? 'available' : 'out_of_stock')).border]"
              >
                <component :is="getStockBadge(item.stock_status || (item.is_available ? 'available' : 'out_of_stock')).icon" class="w-3 h-3" />
                {{ getStockBadge(item.stock_status || (item.is_available ? 'available' : 'out_of_stock')).label }}
              </span>
            </div>
            <p class="text-xs text-gray-400 capitalize mt-0.5">{{ item.category }}</p>
            <p class="text-sm font-semibold text-orange-500 mt-1">₱{{ Number(item.price).toFixed(2) }}</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Stock Status Buttons -->
            <div class="hidden sm:flex items-center gap-1">
              <button
                class="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border"
                :class="item.stock_status === 'available'
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-emerald-300 hover:text-emerald-500'"
                :disabled="updatingId === item.id"
                @click="setStockStatus(item, 'available')"
              >
                <Loader2 v-if="updatingId === item.id" class="w-3 h-3 animate-spin" />
                <span v-else>Available</span>
              </button>
              <button
                class="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border"
                :class="item.stock_status === 'low'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-amber-300 hover:text-amber-500'"
                :disabled="updatingId === item.id"
                @click="setStockStatus(item, 'low')"
              >
                Low
              </button>
              <button
                class="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border"
                :class="item.stock_status === 'out_of_stock'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-500'"
                :disabled="updatingId === item.id"
                @click="setStockStatus(item, 'out_of_stock')"
              >
                Out
              </button>
            </div>

            <!-- Mobile Toggle -->
            <button
              class="sm:hidden relative w-12 h-7 rounded-full transition-all duration-200 flex items-center"
              :class="item.is_available ? 'bg-emerald-500' : 'bg-gray-300'"
              :disabled="updatingId === item.id"
              @click="toggleAvailability(item)"
            >
              <Loader2 v-if="updatingId === item.id" class="w-4 h-4 animate-spin text-white absolute inset-0 m-auto" />
              <span
                v-else
                class="w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 absolute"
                :class="item.is_available ? 'left-1' : 'right-1'"
              />
            </button>

            <!-- Desktop Toggle -->
            <button
              class="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border"
              :class="item.is_available
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'"
              :disabled="updatingId === item.id"
              @click="toggleAvailability(item)"
            >
              <Loader2 v-if="updatingId === item.id" class="w-3.5 h-3.5 animate-spin" />
              <template v-else>
                <CheckCircle2 v-if="item.is_available" class="w-3.5 h-3.5" />
                <XCircle v-else class="w-3.5 h-3.5" />
                {{ item.is_available ? 'Available' : 'Unavailable' }}
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>