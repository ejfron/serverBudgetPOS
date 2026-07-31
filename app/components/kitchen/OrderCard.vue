<script setup lang="ts">
import { UtensilsCrossed, Package } from '@lucide/vue'

const props = defineProps<{ order: any; isNew?: boolean }>()
defineEmits<{ markDone: [orderId: string] }>()

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  return `${Math.floor(s / 3600)}h ago`
}
</script>

<template>
  <div
    class="w-75 shrink-0 bg-white rounded-xl p-4 border shadow-sm transition-all"
    :class="isNew ? 'border-orange-400' : 'border-gray-200'"
  >
    <!-- Top row: badge + order number + time -->
    <div class="flex items-center justify-between mb-1.5">
      <div class="flex items-center gap-2">
        <span v-if="isNew" class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
          just in
        </span>
        <span class="font-semibold text-gray-800">Order #{{ String(order.order_number).padStart(3, '0') }}</span>
      </div>
      <span class="text-xs text-gray-400">{{ timeAgo(order.created_at) }}</span>
    </div>

    <!-- Order type badge -->
    <div v-if="order.order_type" class="mb-2">
      <span
        class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
        :class="order.order_type === 'take-out' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'"
      >
        <Package v-if="order.order_type === 'take-out'" class="w-3 h-3" />
        <UtensilsCrossed v-else class="w-3 h-3" />
        {{ order.order_type === 'take-out' ? 'Take Out' : 'Dine In' }}
      </span>
    </div>

    <!-- Cashier -->
    <div class="text-xs text-gray-500 mb-2">
      cashier: {{ order.cashier || 'unknown' }}
    </div>

    <!-- Customer Request -->
    <div v-if="order.notes_type" class="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
      <div class="text-xs text-gray-500 font-medium">Customer Request:</div>
      <div class="text-sm text-gray-700">
        {{ order.notes_type }}
      </div>
    </div>

    <!-- Items list -->
    <div class="mb-3">
      <template v-for="item in order.order_items" :key="item.id">
        <div class="flex items-baseline gap-2 text-sm mt-1.5">
          <span class="font-medium text-gray-800">{{ item.quantity }}</span>
          <span class="text-gray-800 font-medium truncate">{{ item.item_name }}</span>
        </div>
      </template>
    </div>

    <!-- Mark done button -->
    <button
      class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg text-sm transition-colors"
      @click="$emit('markDone', order.id)"
    >
      ✓ Mark done
    </button>
  </div>
</template>