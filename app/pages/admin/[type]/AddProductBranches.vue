<script setup lang="ts">
import { PlusCircle, Trash2, Loader2, PackageCheck, RefreshCw } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'
import { isValidBusinessType, businessLabel, type BusinessType } from '@shared/types/business.types'

definePageMeta({ layout: 'admin' })

interface MenuItem {
  id?: string
  name: string
  category: string
  price: number
  business_type?: BusinessType
}

const { user } = useAuth()
const currentType = computed<BusinessType>(() => {
  const raw = user.value?.business_type
  return isValidBusinessType(raw) ? raw : 'tapsilogan'
})

const { serverUrl } = useServerConfig()

const menuItems = ref<MenuItem[]>([])
const existingItems = ref<MenuItem[]>([])
const categories = ref<{ id: string; name: string }[]>([])
const loading = ref(false)
const loadingExisting = ref(false)
const error = ref('')
const successMsg = ref('')

async function loadCategories() {
  try {
    const res = await $fetch<{ id: string; name: string }[]>(
      `${serverUrl.value}/api/categories?business_type=${currentType.value}`
    )
    categories.value = res ?? []
  } catch (e) {
    console.error('loadCategories error:', e)
  }
}

function addItem() {
  menuItems.value.push({
    name: '',
    category: categories.value[0]?.name.toLowerCase() || 'silog',
    price: 0,
    business_type: currentType.value,
  })
}

function removeItem(index: number) {
  menuItems.value.splice(index, 1)
}

async function loadExistingItems() {
  loadingExisting.value = true
  try {
    const res = await $fetch<any>(`${serverUrl.value}/api/menu-items`)
    existingItems.value = res?.data ?? []
  } catch (e) {
    console.error('loadExistingItems error:', e)
  } finally {
    loadingExisting.value = false
  }
}

async function saveMenu() {
  loading.value = true
  error.value = ''
  successMsg.value = ''
  try {
    await $fetch(`${serverUrl.value}/api/menu-items/bulk`, {
      method: 'POST',
      body: {
        items: menuItems.value.map(item => ({ ...item, business_type: currentType.value })),
      },
    })
    successMsg.value = 'Menu items saved successfully!'
    menuItems.value = []
    await loadExistingItems()
  } catch (e: any) {
    error.value = e.data?.statusMessage || e.data?.message || 'Failed to save menu items'
    console.error('saveMenu error:', e)
  } finally {
    loading.value = false
  }
}

function categoryLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

onMounted(() => {
  loadCategories()
  loadExistingItems()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Menu Items</h1>
      <p class="text-gray-600 mt-1">Add or edit products for {{ businessLabel(currentType) }}.</p>
    </div>

    <div v-for="(item, i) in menuItems" :key="i" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3">
      <div class="flex justify-between items-center">
        <h3 class="font-semibold text-gray-700">Item {{ i + 1 }}</h3>
        <button @click="removeItem(i)" class="text-red-500 hover:text-red-700 transition">
          <Trash2 :size="18" />
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="text-sm text-gray-600">Name</label>
          <input v-model="item.name" class="w-full rounded-xl border-gray-200 bg-white shadow-sm text-gray-700 mt-1 p-2" required />
        </div>
        <div>
          <label class="text-sm text-gray-600">Category</label>
          <select v-model="item.category" class="w-full rounded-xl border-gray-200 bg-white shadow-sm text-gray-700 mt-1 p-2">
            <option v-for="cat in categories" :key="cat.id" :value="cat.name.toLowerCase()">{{ cat.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-gray-600">Price (₱)</label>
          <input v-model.number="item.price" type="number" step="0.01" min="0" class="w-full rounded-xl border-gray-200 bg-white shadow-sm text-gray-700 mt-1 p-2" required />
        </div>
      </div>
    </div>

    <button @click="addItem" class="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition">
      <PlusCircle :size="20" /> Add Menu Item
    </button>

    <button
      @click="saveMenu"
      :disabled="loading || menuItems.length === 0"
      class="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
    >
      <Loader2 v-if="loading" :size="20" class="animate-spin" />
      {{ loading ? 'Saving...' : 'Save Menu Items' }}
    </button>

    <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>
    <p v-if="successMsg" class="text-green-600 text-sm text-center">{{ successMsg }}</p>

    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <PackageCheck :size="18" class="text-green-500" />
          <h3 class="font-semibold text-gray-700 text-sm">Products ({{ existingItems.length }})</h3>
        </div>
        <button
          class="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          :disabled="loadingExisting"
          @click="loadExistingItems"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="loadingExisting ? 'animate-spin' : ''" />
          Refresh
        </button>
      </div>

      <div v-if="loadingExisting" class="text-center py-8 text-gray-400 text-sm">Loading products...</div>
      <div v-else-if="!existingItems.length" class="text-center py-8 text-gray-400 text-sm">No products yet.</div>
      <div v-else class="divide-y divide-gray-50">
        <div v-for="(saved, i) in existingItems" :key="saved.id ?? i" class="flex items-center justify-between px-5 py-3">
          <div>
            <p class="text-sm font-medium text-gray-800">{{ saved.name }}</p>
            <p class="text-xs text-gray-400">{{ categoryLabel(saved.category) }}</p>
          </div>
          <p class="text-sm font-bold text-orange-500">₱{{ Number(saved.price).toFixed(2) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
