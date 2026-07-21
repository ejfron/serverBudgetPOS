<script setup lang="ts">
import { Search, Beef, CupSoda, Utensils, ShoppingBag, Soup, Drumstick, Apple, Milk, Cookie, Sparkles, Package, Coffee, Pizza, Croissant, IceCream } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'

const { serverUrl } = useServerConfig()
const { user } = useAuth()

const props = defineProps<{ items: any[] }>()
defineEmits<{ add: [item: any] }>()

const activeCategory = ref('all')
const search = ref('')
const dbCategories = ref<{ id: string; name: string }[]>([])


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
  
  // Deterministic icon based on category name hash
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return icons[Math.abs(hash) % icons.length]
}

async function loadCategories() {
  try {
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

const fallbackImg = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop&auto=format'

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
  <div class="flex flex-col gap-4 h-full">
    <div class="relative shrink-0">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        v-model="search"
        type="text"
        placeholder="Search menu..."
        class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
      />
    </div>

    <div class="flex gap-2 shrink-0 overflow-x-auto pb-0.5">
      <button
        v-for="cat in allCategories"
        :key="cat.key"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 capitalize"
        :class="activeCategory === cat.key
          ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
          : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'"
        @click="activeCategory = cat.key"
      >
        <component :is="cat.icon" class="w-3.5 h-3.5" />
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <div class="grid grid-cols-3 gap-3 overflow-y-auto pb-4">
      <button
        v-for="item in filtered"
        :key="item.id"
        class="group bg-white border border-gray-100 hover:border-orange-300 rounded-2xl overflow-hidden text-left transition-all duration-200 hover:shadow-xl hover:shadow-orange-100 active:scale-95 shadow-sm flex flex-col"
        @click="$emit('add', item)"
      >
        <div class="relative w-full h-28 overflow-hidden" :class="getBgColor(item.name)">
          <img
            :src="fallbackImg"
            alt="Menu item"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 opacity-40"
            loading="lazy"
          />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-lg font-extrabold text-gray-800 drop-shadow-sm">{{ item.name.charAt(0) }}</span>
          </div>
          <div class="absolute top-2 right-2 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
            <span class="text-white text-xs font-bold leading-none">+</span>
          </div>
        </div>

        <div class="p-3 flex-1 flex flex-col gap-1.5">
          <p class="text-sm font-semibold text-gray-800 truncate">{{ item.name }}</p>
          <p class="text-sm font-bold text-gray-600">
            ₱{{ Number(item.price).toFixed(2) }}
          </p>
          <div class="mt-auto pt-1.5">
            <div class="w-full py-1.5 rounded-lg bg-orange-50 text-orange-500 text-xs font-bold text-center border border-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-all">
              Add to order
            </div>
          </div>
        </div>
      </button>

      <div v-if="!filtered.length" class="col-span-3 flex flex-col items-center justify-center py-12">
        <Search class="w-10 h-10 text-gray-300 mb-3" />
        <p class="text-gray-500 text-sm font-medium">No items found</p>
        <p class="text-gray-400 text-xs mt-1">Try a different search or category</p>
      </div>
    </div>
  </div>
</template>