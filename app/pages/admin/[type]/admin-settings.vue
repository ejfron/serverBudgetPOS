<script setup lang="ts">
import { Save, Loader2, Building2, Phone, MapPin, DollarSign } from '@lucide/vue'
import { businessLabel, isValidBusinessType } from '@shared/types/business.types'

definePageMeta({ layout: 'admin' })

const { user } = useAuth()
const currentType = computed(() => {
  const raw = user.value?.business_type
  return isValidBusinessType(raw) ? raw : 'tapsilogan'
})

const settingsKey = computed(() => `${user.value?.branch_id}_settings`)

const businessName = ref('')
const address = ref('')
const phone = ref('')
const currency = ref('₱')
const taxRate = ref(0)
const saving = ref(false)
const success = ref(false)

async function saveSettings() {
  saving.value = true
  try {
    localStorage.setItem(settingsKey.value, JSON.stringify({
      businessName: businessName.value,
      address: address.value,
      phone: phone.value,
      currency: currency.value,
      taxRate: taxRate.value,
    }))
    success.value = true
    setTimeout(() => (success.value = false), 3000)
  } finally {
    saving.value = false
  }
}

function loadSettings() {
  const saved = localStorage.getItem(settingsKey.value)
  if (saved) {
    const s = JSON.parse(saved)
    businessName.value = s.businessName ?? businessLabel(currentType.value)
    address.value = s.address ?? ''
    phone.value = s.phone ?? ''
    currency.value = s.currency ?? '₱'
    taxRate.value = s.taxRate ?? 0
  } else {
    businessName.value = businessLabel(currentType.value)
    address.value = ''
    phone.value = ''
    currency.value = '₱'
    taxRate.value = 0
  }
}

watch(currentType, () => loadSettings())
onMounted(() => loadSettings())
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Settings</h1>
      <p class="text-gray-500 text-sm mt-1">Manage your business preferences</p>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 max-w-lg">
      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
          <Building2 class="w-4 h-4 text-orange-500" /> Business Name
        </label>
        <input v-model="businessName" class="w-full border text-gray-600 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
      </div>
      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
          <MapPin class="w-4 h-4 text-orange-500" /> Address
        </label>
        <input v-model="address" class="w-full border text-gray-600 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
      </div>
      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
          <Phone class="w-4 h-4 text-orange-500" /> Phone
        </label>
        <input v-model="phone" class="w-full border text-gray-600 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
            <DollarSign class="w-4 h-4 text-orange-500" /> Currency
          </label>
          <input v-model="currency" class="w-full border text-gray-600 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1.5 block">Tax Rate (%)</label>
          <input v-model.number="taxRate" type="number" step="0.01" min="0" class="w-full border text-gray-600 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
        </div>
      </div>
    </div>

    <button
      :disabled="saving"
      class="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition"
      @click="saveSettings"
    >
      <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
      <Save v-else class="w-4 h-4" />
      {{ saving ? 'Saving...' : 'Save Settings' }}
    </button>

    <div v-if="success" class="flex items-center gap-2 text-green-600 text-sm font-medium">
      Settings saved successfully!
    </div>
  </div>
</template>