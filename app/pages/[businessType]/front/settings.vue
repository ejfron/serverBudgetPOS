<script setup lang="ts">
definePageMeta({ layout: 'front' })

import { Store, Printer, Coins, Save, Settings as SettingsIcon } from '@lucide/vue'

const { user } = useAuth()

const form = reactive({
  branchName: user.value?.branch_name || '',
  printerEnabled: true,
  currency: 'PHP',
})

const saved = ref(false)
function handleSave() {
  // Wire up to a real settings endpoint later — for now just a local confirm flash
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <div class="flex items-center gap-2">
      <SettingsIcon class="w-6 h-6 text-orange-500" />
      <h1 class="text-2xl font-bold text-gray-800">Settings</h1>
    </div>

    <form @submit.prevent="handleSave" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      <div>
        <label for="branchName" class="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Store class="w-4 h-4 text-gray-400" />
          Branch Name
        </label>
        <input
          id="branchName"
          v-model="form.branchName"
          type="text"
          class="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm text-sm focus:border-orange-400 focus:ring-orange-400"
        />
      </div>

      <div class="flex items-center gap-2 py-1">
        <Printer class="w-4 h-4 text-gray-400" />
        <input
          id="printerEnabled"
          v-model="form.printerEnabled"
          type="checkbox"
          class="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
        />
        <label for="printerEnabled" class="text-sm text-gray-700">Enable Printer</label>
      </div>

      <div>
        <label for="currency" class="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Coins class="w-4 h-4 text-gray-400" />
          Currency
        </label>
        <select
          id="currency"
          v-model="form.currency"
          class="mt-1.5 block w-full rounded-xl border-gray-200 shadow-sm text-sm focus:border-orange-400 focus:ring-orange-400"
        >
          <option value="PHP">PHP (₱)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
        </select>
      </div>

      <button
        type="submit"
        class="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-200 transition active:scale-95"
      >
        <Save class="w-4 h-4" />
        Save Settings
      </button>

      <p v-if="saved" class="text-xs text-green-600 font-medium">✓ Settings saved</p>
    </form>
  </div>
</template>