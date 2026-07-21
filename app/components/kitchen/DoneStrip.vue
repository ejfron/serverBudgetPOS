<script setup lang="ts">
defineProps<{ orders: any[] }>()
</script>
<template>
  <div v-if="orders.length" class="shrink-0">
    <div class="flex items-center justify-between mb-2">
      <p class="text-xs text-gray-400">Waiting for pickup</p>
      <span class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">{{ orders.length }} ready</span>
    </div>
    <div class="flex gap-2 overflow-x-auto pb-1">
      <div v-for="order in orders" :key="order.id" class="flex-none bg-gray-900 border border-green-500/30 rounded-xl p-3 min-w-36">
        <p class="text-sm font-medium text-white">Order #{{ order.order_number }}</p>
        <p class="text-xs text-green-400 mt-0.5">Ready ✓</p>
        <p class="text-xs text-gray-500 mt-1">{{ order.order_items?.map((i: any) => `${i.item_name} x${i.quantity}`).join(', ') }}</p>
      </div>
    </div>
  </div>
</template>
