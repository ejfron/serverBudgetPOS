<script setup lang="ts">
const { scanning, scanProgress, discover } = useServerDiscovery()
const { serverUrl } = useServerConfig()

const errorMsg = ref('')
const successMsg = ref('')

async function handleScan() {
  errorMsg.value = ''
  successMsg.value = ''
  const result = await discover()
  if (result.ok) {
    successMsg.value = `Found server at ${result.ip}`
    setTimeout(() => navigateTo('/login'), 800)
  } else {
    errorMsg.value = result.message ?? 'Could not find the server.'
  }
}

onMounted(() => {
  handleScan()
})
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
    <div class="w-full max-w-sm bg-gray-900 rounded-2xl p-6 border border-gray-800 text-center">
      <h1 class="text-white text-lg font-bold mb-1">Finding Server...</h1>
      <p class="text-gray-400 text-sm mb-5">
        Make sure your phone is on the same WiFi as the Tapsilogan computer.
      </p>

      <div v-if="scanning" class="mb-4">
        <div class="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div class="bg-orange-500 h-2 transition-all duration-200" :style="{ width: scanProgress + '%' }" />
        </div>
        <p class="text-gray-500 text-xs mt-2">Scanning network...</p>
      </div>

      <p v-if="errorMsg" class="text-red-400 text-sm mb-3">{{ errorMsg }}</p>
      <p v-if="successMsg" class="text-green-400 text-sm mb-3">{{ successMsg }}</p>

      <button
        v-if="!scanning"
        class="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm"
        @click="handleScan"
      >
        {{ errorMsg ? 'Try Again' : 'Scan Again' }}
      </button>

      <p class="text-gray-500 text-xs mt-4">
        Currently saved: <span class="text-gray-300">{{ serverUrl || 'none' }}</span>
      </p>
    </div>
  </div>
</template>