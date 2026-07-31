<!-- components/shared/AppBottomNav.vue -->
<template>
  <nav 
    v-if="isMobile" 
    class="fixed bottom-0 left-0 right-0 bg-white border-t rounded-tl-4xl rounded-tr-4xl border-gray-200 safe-area-bottom z-50"
  >
    <!-- Admin Bottom Nav -->
    <div v-if="role === 'admin'" class="flex justify-around items-center h-16 px-2">
      <NuxtLink
        :to="`/admin/${currentType}`"
        class="nav-link"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:view-dashboard" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Dashboard</span>
      </NuxtLink>
      <NuxtLink
        :to="`/admin/${currentType}/branches`"
        class="nav-link"
        active-class="nav-link-active"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:office-building" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Branches</span>
      </NuxtLink>
      <NuxtLink
        :to="`/admin/${currentType}/AddProductBranches`"
        class="nav-link"
        active-class="nav-link-active"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:shopping" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Items</span>
      </NuxtLink>
      <NuxtLink
        :to="`/admin/${currentType}/admin-settings`"
        class="nav-link"
        active-class="nav-link-active"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:cog" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Settings</span>
      </NuxtLink>
    </div>

    <!-- Front Bottom Nav -->
    <div v-else-if="role === 'front'" class="flex justify-around items-center h-16 px-2">
      <NuxtLink
        :to="`/${businessType}/front`"
        class="nav-link"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:menu" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Menu</span>
      </NuxtLink>
      <NuxtLink
        :to="`/${businessType}/front/sales`"
        class="nav-link"
        active-class="nav-link-active"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:chart-line" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Sales</span>
      </NuxtLink>
      <NuxtLink
        :to="`/${businessType}/front/product`"
        class="nav-link"
        active-class="nav-link-active"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:package" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Products</span>
      </NuxtLink>
      <NuxtLink
        :to="`/${businessType}/front/transactions`"
        class="nav-link"
        active-class="nav-link-active"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:receipt" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Trans.</span>
      </NuxtLink>
      <NuxtLink
        :to="`/${businessType}/front/settings`"
        class="nav-link"
        active-class="nav-link-active"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:cog" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Settings</span>
      </NuxtLink>
    </div>

    <!-- Kitchen Bottom Nav -->
    <div v-else-if="role === 'kitchen'" class="flex justify-around items-center h-16 px-2">
      <NuxtLink
        :to="`/${businessType}/kitchen`"
        class="nav-link"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:clipboard-list" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Orders</span>
      </NuxtLink>
      <NuxtLink
        :to="`/${businessType}/kitchen/history`"
        class="nav-link"
        active-class="nav-link-active"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:clock" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">History</span>
      </NuxtLink>
       <NuxtLink
        :to="`/${businessType}/kitchen/products`"
        class="nav-link"
        active-class="nav-link-active"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:shopping" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Product</span>
      </NuxtLink>
      
      <NuxtLink
        :to="`/${businessType}/kitchen/printing-settings`"
        class="nav-link"
        active-class="nav-link-active"
        exact-active-class="nav-link-active"
      >
        <Icon name="mdi:printer" class="w-5 h-5" />
        <span class="text-xs mt-1 font-medium">Print</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { isValidBusinessType } from '@shared/types/business.types'
import {} from '@lucide/vue'

const props = defineProps<{
  role: 'front' | 'kitchen' | 'admin'
}>()

const { user } = useAuth()


const isMobile = ref(false)

const currentType = computed(() => {
  const raw = user.value?.business_type
  return isValidBusinessType(raw) ? raw : 'tapsilogan'
})

const businessType = computed(() => {
  const rawType = user.value?.business_type
  if (rawType && isValidBusinessType(rawType)) {
    return rawType
  }
  return 'tapsilogan'
})

onMounted(() => {

  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function checkMobile() {

  isMobile.value = window.innerWidth < 1024 
}
</script>

<style>
/* Use unscoped styles to override NuxtLink defaults */
.nav-link {
  position: relative !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 6px 12px 4px !important;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
  color: #4b5563 !important;
  text-decoration: none !important;
}

.nav-link:hover {
  color: #111827 !important;
  background-color: transparent !important;
}

.nav-link-active {
  background-color: transparent !important;
  color: #f97316 !important;
}

.nav-link-active:hover {
  background-color: transparent !important;
  color: #f97316 !important;
}

/* Small indicator bar above the active item instead of a circle/pill background */
.nav-link-active::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  width: 20px !important;
  height: 3px !important;
  border-radius: 9999px !important;
  background-color: #f97316 !important;
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>