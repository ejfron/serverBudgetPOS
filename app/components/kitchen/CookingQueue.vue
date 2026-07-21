<script setup lang="ts">
import type { Order } from '@shared/types/order.types'
import OrderCard from '~/components/kitchen/OrderCard.vue'

const props = defineProps<{
  orders: Order[]
  newestId?: string
}>()

defineEmits<{ markDone: [orderId: string] }>()
</script>

<template>
  <div class="flex flex-col gap-3 h-full min-h-0">
    <!-- Header -->
    <div class="flex items-center gap-2 shrink-0">
      <h2 class="text-sm font-medium text-gray-400">Cooking now</h2>
      <span class="text-xs font-semibold bg-red-100 text-red-500 px-2.5 py-0.5 rounded-full">
        {{ orders.length }} orders
      </span>
    </div>

    <!-- Card row -->
    <div class="flex-1 min-h-0 overflow-y-auto">
      <div class="w-full flex flex-wrap gap-4 items-start">
        <OrderCard
          v-for="order in orders"
          :key="order.id"
          :order="order"
          :is-new="order.id === newestId"
          @mark-done="$emit('markDone', order.id)"
        />
      </div>

      <!-- Empty state -->
      <div v-if="!orders.length" class="flex flex-col items-center justify-center py-16">
        <p class="text-gray-400 text-sm">No orders cooking right now</p>
      </div>
    </div>
  </div>
</template>