<script setup lang="ts">
definePageMeta({ layout: 'front' })

const route = useRoute()
const businessType = computed(() => route.params.businessType as string)

import ReadyPickupStrip from '~/components/front/ReadyPickupStrip.vue'
import MenuGrid from '~/components/front/MenuGrid.vue'
import OrderCart from '~/components/front/OrderCart.vue'
import { useServerConfig } from '~/composables/useServerConfig'
import { hasKitchen } from '@shared/types/business.types'

const { user } = useAuth()
const { fetchOrders, placeOrder, markCompleted, printing } = useOrder()
const { connect: connectSocket, onMessage } = useSocket()
const { cart, orderNumber, loading, addToCart, incrementCart, decrementCart, clearCart } = useFrontOrder()
const { serverUrl } = useServerConfig()

const menuItems = ref<any[]>([])
const readyOrders = ref<any[]>([])
const menuGridKey = ref(0)

async function loadMenu() {
  try {
    const res = await $fetch<any>(`${serverUrl.value}/api/menu-items`)
    menuItems.value = res.data ?? []
    menuGridKey.value++ 
  } catch (e) {
    console.error('loadMenu error:', e)
  }
}

async function loadReadyOrders() {
  if (!user.value) return
  readyOrders.value = await fetchOrders(user.value.branch_id, 'ready')
}

async function loadNextOrderNumber() {
  if (!user.value) return
  const all = await fetchOrders(user.value.branch_id)
  const nums = all.map((o: any) => o.order_number).filter(Boolean)
  orderNumber.value = nums.length ? Math.max(...nums) + 1 : 1
}

// ✅ Updated: Auto-complete if no kitchen
async function submitOrder(paymentMethod: string = 'cash') {
  if (!cart.value.length || !user.value) return
  loading.value = true

  const order = await placeOrder(
    user.value.branch_id,
    user.value.id,
    cart.value,
    user.value.branch_name,
    paymentMethod
  )

  if (!order) {
    alert('Failed to save order. Please try again.')
    loading.value = false
    return
  }

  // ✅ If branch has NO kitchen, auto-complete the order
  if (!hasKitchen(user.value.business_type)) {
    await markCompleted(order.id)
  }

  clearCart()
  await loadNextOrderNumber()
  loading.value = false
}

async function onReceived(orderId: string) {
  await markCompleted(orderId)
  readyOrders.value = readyOrders.value.filter(o => o.id !== orderId)
}

onMounted(async () => {
  await loadMenu()
  await loadReadyOrders()
  await loadNextOrderNumber()

  if (user.value) {
    connectSocket(user.value.branch_id)
    onMessage((msg: any) => {
      if (msg.type === 'ORDER_UPDATED' && msg.order.status === 'ready') {
        if (!readyOrders.value.find(o => o.id === msg.order.id)) {
          readyOrders.value.unshift(msg.order)
        }
      }
      if (msg.type === 'ORDER_UPDATED' && msg.order.status === 'completed') {
        readyOrders.value = readyOrders.value.filter(o => o.id !== msg.order.id)
      }
    })
  }
})
</script>

<template>
  <div class="flex flex-col gap-3 h-full">
    <ReadyPickupStrip :orders="readyOrders" @received="onReceived" />

    <div class="flex flex-1 min-h-0 flex-col gap-3 lg:flex-row lg:items-start">
      <div class="flex-1 min-h-0 overflow-y-auto pb-4 lg:pr-2">
        <MenuGrid :key="menuGridKey" :items="menuItems" @add="addToCart" />
      </div>

      <div class="w-full lg:w-80 lg:max-w-sm lg:sticky lg:top-4 lg:self-start">
        <OrderCart
          :cart="cart"
          :order-number="orderNumber"
          :loading="loading"
          :printing="printing"
          @increment="incrementCart"
          @decrement="decrementCart"
          @clear="clearCart"
          @submit="submitOrder"
        />
      </div>
    </div>
  </div>
</template>