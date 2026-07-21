<script setup lang="ts">
import type { Order } from '@shared/types/order.types'
import CookingQueue from '~/components/kitchen/CookingQueue.vue'
import DoneStrip from '~/components/kitchen/DoneStrip.vue'

definePageMeta({ layout: 'kitchen' })

const { user } = useAuth()
const { fetchOrders, markReady } = useOrder()
const { connect: connectSocket, onMessage } = useSocket()

const pendingOrders = ref<Order[]>([])
const readyOrders = ref<Order[]>([])
const newestOrderId = ref<string | null>(null)

async function loadOrders() {
  if (!user.value) return
  pendingOrders.value = await fetchOrders(user.value.branch_id, 'pending')
  readyOrders.value = await fetchOrders(user.value.branch_id, 'ready')
}

async function onMarkDone(orderId: string) {
  const ok = await markReady(orderId)
  if (ok) {
    const order = pendingOrders.value.find(o => o.id === orderId)
    if (order) {
      pendingOrders.value = pendingOrders.value.filter(o => o.id !== orderId)
      readyOrders.value.unshift({ ...order, status: 'ready' })
    }
  }
}

onMounted(async () => {
  await loadOrders()
  if (user.value) {
    connectSocket(user.value.branch_id)
    onMessage((msg) => {
      if (msg.type === 'ORDER_CREATED') {
        if (!pendingOrders.value.find(o => o.id === msg.order.id)) {
          pendingOrders.value.unshift(msg.order)
          newestOrderId.value = msg.order.id
          setTimeout(() => { newestOrderId.value = null }, 10000)
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
    <DoneStrip :orders="readyOrders" />

    <div class="flex-1 min-h-0">
      <CookingQueue
        :orders="pendingOrders"
        :newest-id="newestOrderId ?? undefined"
        @mark-done="onMarkDone"
      />
    </div>
  </div>
</template>