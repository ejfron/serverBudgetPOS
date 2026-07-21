<script setup lang="ts">
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

    <!-- Cashier -->
    <p class="text-xs text-gray-500 mb-2">
      cashier: {{ order.cashier || 'unknown' }}
    </p>

    <!-- Items list -->
    <div class="mb-3">
      <template v-for="item in order.order_items" :key="item.id">
        <div class="flex items-baseline gap-2 text-sm mt-1.5">
          <span class="font-medium text-gray-800">{{ item.quantity }}</span>
          <span class="text-gray-800 font-medium truncate">{{ item.item_name }}</span>
        </div>
        <p v-if="item.notes" class="text-xs text-gray-400 pl-5.5 truncate">
          Notes: {{ item.notes }}
        </p>
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