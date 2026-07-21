<script setup lang="ts">
defineProps<{ branchName: string; role: 'front' | 'kitchen' }>()
</script>
<template>
  <p class="text-xs text-gray-400">{{ branchName }} · <span class="capitalize">{{ role }}</span></p>
</template>
