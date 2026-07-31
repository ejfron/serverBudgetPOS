<script setup lang="ts">
import { Search, Beef, CupSoda, Utensils, ShoppingBag, Soup, Drumstick, Apple, Milk, Cookie, Sparkles, Package, Coffee, Pizza, Croissant, IceCream, AlertTriangle, XCircle } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'
import { usePosData } from '~/composables/usePosData'
import { hasKitchen } from '@shared/types/business.types'
import ProductPriceSelectorModal from './ProductPriceSelectorModal.vue'

const { serverUrl } = useServerConfig()
const { user } = useAuth()
const { isLocal, getCategoriesLocal } = usePosData()

const props = defineProps<{ items: any[] }>()
const emit = defineEmits<{ add: [item: any] }>()

const activeCategory = ref('all')
const search = ref('')
const dbCategories = ref<{ id: string; name: string }[]>([])

const selectedItem = ref<any>(null)
const showPriceModal = ref(false)

const showAvailability = computed(() => hasKitchen(user.value?.business_type))

function isOutOfStock(item: any): boolean {
  return showAvailability.value && (item.is_available === false || item.stock_status === 'out_of_stock')
}

function isLowStock(item: any): boolean {
  return showAvailability.value && item.stock_status === 'low' && item.is_available !== false
}

function openProduct(item: any) {
  if (isOutOfStock(item)) return
  selectedItem.value = item
  showPriceModal.value = true
}

function closeModal() {
  showPriceModal.value = false
}

function addProduct(payload: any) {
  emit('add', payload)
  showPriceModal.value = false
}

function imageUrl(item: any): string | null {
  if (!item.image_url) return null
  if (item.image_url.startsWith('http') || item.image_url.startsWith('data:')) return item.image_url
  return `${serverUrl.value}${item.image_url}`
}

const businessIcons: Record<string, any[]> = {
  tapsilogan: [Beef, CupSoda, ShoppingBag, Utensils],
  restaurant: [Soup, Drumstick, CupSoda, ShoppingBag, Beef, Coffee],
  karinderya: [Soup, Drumstick, CupSoda, ShoppingBag],
  sarisari: [Package, Apple, CupSoda, Cookie, Sparkles],
  fastfood: [Beef, Cookie, CupSoda, Milk, Beef, Pizza, Croissant, IceCream],
}

function getIcon(name: string): any {
  const bt = user.value?.business_type || 'tapsilogan'
  const icons = businessIcons[bt] || businessIcons.tapsilogan
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return icons[Math.abs(hash) % icons.length]
}

async function loadCategories() {
  try {
    if (isLocal.value) {
      dbCategories.value = getCategoriesLocal(user.value?.business_type)
      return
    }
    const bt = user.value?.business_type || 'tapsilogan'
    const res = await $fetch<{ id: string; name: string }[]>(
      `${serverUrl.value}/api/categories?business_type=${bt}`
    )
    dbCategories.value = res ?? []
  } catch (e) {
    console.error('MenuGrid loadCategories error:', e)
  }
}

const allCategories = computed(() => {
  return [
    { key: 'all', label: 'All Items', icon: Utensils },
    ...dbCategories.value.map(cat => ({
      key: cat.name.toLowerCase(),
      label: cat.name,
      icon: getIcon(cat.name),
    })),
  ]
})

const pastelBgColors = ['bg-amber-50', 'bg-rose-50', 'bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-yellow-50', 'bg-lime-50', 'bg-cyan-50', 'bg-orange-50']
function getBgColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return pastelBgColors[Math.abs(hash) % pastelBgColors.length]
}

const filtered = computed(() => {
  let list = activeCategory.value === 'all'
    ? props.items
    : props.items.filter((i: any) => i.category?.toLowerCase() === activeCategory.value)
  if (search.value.trim()) {
    list = list.filter((i: any) => i.name.toLowerCase().includes(search.value.toLowerCase()))
  }
  return list
})

onMounted(() => {
  loadCategories()
})
</script>

<template>
  <div class="flex flex-col gap-3 sm:gap-4 h-full">
    <!-- Search Bar -->
    <div class="relative shrink-0">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        v-model="search"
        type="text"
        placeholder="Search menu..."
        class="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-sm sm:text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
      />
    </div>

    <!-- Categories -->
    <div class="flex gap-1.5 sm:gap-2 shrink-0 overflow-x-auto pb-0.5 scrollbar-hide">
      <button
        v-for="cat in allCategories"
        :key="cat.key"
        class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 capitalize"
        :class="activeCategory === cat.key
          ? 'bg-orange-500 text-white shadow-sm'
          : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'"
        @click="activeCategory = cat.key"
      >
        <component :is="cat.icon" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span class="hidden xs:inline">{{ cat.label }}</span>
        <span class="xs:hidden">{{ cat.label.substring(0, 8) }}{{ cat.label.length > 8 ? '…' : '' }}</span>
      </button>
    </div>

    <!-- Menu Grid – balanced columns: 2 on mobile, 3 on tablet, 4 on desktop -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 overflow-y-auto pb-4">
      <button
        v-for="item in filtered"
        :key="item.id"
        class="group bg-white border border-gray-100 rounded-2xl overflow-hidden text-left transition-all duration-200 shadow-sm flex flex-col h-full"
        :class="isOutOfStock(item)
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:border-gray-200 hover:shadow-md active:scale-[0.98]'"
        :disabled="isOutOfStock(item)"
        @click="openProduct(item)"
      >
        <!-- Image area -->
        <div
          class="relative w-full overflow-hidden"
          :class="getBgColor(item.name)"
          style="height: 100px;"
        >
          <img
            v-if="imageUrl(item)"
            :src="imageUrl(item)!"
            :alt="item.name"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-80"
            loading="lazy"
          />
          <div class="absolute inset-0 flex items-center justify-center p-2">
            <span v-if="!imageUrl(item)" class="text-xs sm:text-sm font-bold text-gray-700 drop-shadow-sm capitalize text-center leading-tight">{{ item.name }}</span>
          </div>

          <!-- Availability badges -->
          <div
            v-if="isOutOfStock(item)"
            class="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-red-100 text-red-600 border border-red-200"
          >
            <XCircle class="w-2.5 h-2.5" />
            Out
          </div>
          <div
            v-else-if="isLowStock(item)"
            class="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-amber-100 text-amber-600 border border-amber-200"
          >
            <AlertTriangle class="w-2.5 h-2.5" />
            Low
          </div>

          <div
            v-if="!isOutOfStock(item)"
            class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
          >
            <Plus class="w-3 h-3 text-orange-500" />
          </div>
        </div>

        <!-- Card content -->
        <div class="p-1.5 sm:p-2 flex-1 flex flex-col gap-1 min-h-16 sm:min-h-20">
          <p class="text-xs sm:text-xs font-semibold text-gray-700 truncate capitalize leading-tight">{{ item.name }}</p>
          <p class="text-xs font-medium text-gray-500">
            ₱{{ Number(item.price).toFixed(2) }}
          </p>
          <div class="mt-auto pt-1">
            <div
              v-if="isOutOfStock(item)"
              class="w-full py-1 rounded-lg bg-gray-100 text-gray-400 text-[10px] font-medium text-center border border-gray-200"
            >
              Unavailable
            </div>
            <div
              v-else
              class="w-full py-1 rounded-lg bg-orange-50 text-orange-600 text-[10px] sm:text-xs font-medium text-center border border-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-all"
            >
              <span class="hidden xs:inline">Add</span>
              <span class="xs:hidden">+</span>
            </div>
          </div>
        </div>
      </button>

      <!-- Empty State -->
      <div v-if="!filtered.length" class="col-span-full flex flex-col items-center justify-center py-8 sm:py-12">
        <Search class="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mb-2 sm:mb-3" />
        <p class="text-gray-500 text-xs sm:text-sm font-medium">No items found</p>
        <p class="text-gray-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Try a different search or category</p>
      </div>
    </div>

    <ProductPriceSelectorModal
      :open="showPriceModal"
      :product="selectedItem"
      @close="closeModal"
      @confirm="addProduct"
    />
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

@media (min-width: 400px) {
  .xs\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>