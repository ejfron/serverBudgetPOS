<script setup lang="ts">
import { CheckCircle2, Bell, PackageCheck } from '@lucide/vue'

defineProps<{ orders: any[] }>()
defineEmits<{ received: [orderId: string] }>()
</script>

<template>
  <div v-if="orders.length" class="shrink-0">
    <div class="bg-green-50 border border-green-200 rounded-2xl p-3">
      <div class="flex items-center justify-between mb-2.5">
        <div class="flex items-center gap-2">
          <Bell class="w-3.5 h-3.5 text-green-600 animate-bounce" />
          <p class="text-xs font-bold text-green-700 uppercase tracking-wide">Ready for Pickup</p>
        </div>
        <span class="text-xs bg-red-500 text-white px-2.5 py-0.5 rounded-full font-bold">
          {{ orders.length }} waiting
        </span>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-1">
        <div
          v-for="order in orders"
          :key="order.id"
          class="flex-none bg-white border border-green-200 rounded-xl px-3 py-2.5 flex items-center gap-3 min-w-52 shadow-sm"
        >
          <div class="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 class="w-4 h-4 text-green-600" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-800">
              Order #{{ String(order.order_number).padStart(3, '0') }}
            </p>
            <p class="text-xs text-gray-400 truncate">
              {{ order.order_items?.map((i: any) => `${i.item_name} x${i.quantity}`).join(', ') }}
            </p>
          </div>
          <button
            class="shrink-0 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm"
            @click="$emit('received', order.id)"
          >
            <PackageCheck class="w-3.5 h-3.5" />
            Received
          </button>
        </div>
      </div>
    </div>
  </div>
</template>