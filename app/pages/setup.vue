<script setup lang="ts">
import { PlusCircle, Trash2, Store, LogOut, Loader2, ChefHat, CookingPot, ShoppingBasket, Utensils, Plus, Pizza } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'
import { BUSINESS_TYPES, hasKitchen, type BusinessType } from '@shared/types/business.types'

definePageMeta({ layout: false })

const { serverUrl } = useServerConfig()
const { logout, user, updateBusinessType } = useAuth()
const router = useRouter()

const typeIcons: Record<BusinessType, any> = {
  tapsilogan: Utensils,
  restaurant: ChefHat,
  fastfood: Pizza,
  karinderya: CookingPot,
  sarisari: ShoppingBasket,
}

const selectedType = ref<BusinessType>('tapsilogan')

interface BranchInput {
  name: string
  location: string
  hasKitchen: boolean
  cashierUsername: string
  cashierPassword: string
  kitchenUsername: string
  kitchenPassword: string
}

const branches = ref<BranchInput[]>([])
const loading = ref(false)
const error = ref('')
const successMsg = ref('')

function selectType(type: BusinessType) {
  selectedType.value = type
}

function addBranchRow() {
  branches.value.push({
    name: '',
    location: '',
    hasKitchen: false,
    cashierUsername: '',
    cashierPassword: '',
    kitchenUsername: '',
    kitchenPassword: '',
  })
}

function toggleKitchen(index: number) {
  const branch = branches.value[index]
  branch.hasKitchen = !branch.hasKitchen
  if (!branch.hasKitchen) {
    branch.kitchenUsername = ''
    branch.kitchenPassword = ''
  }
}

function removeBranch(index: number) {
  branches.value.splice(index, 1)
}

onMounted(() => {
  if (!user.value) {
    const stored = localStorage.getItem('tapsilogan_user')
    if (stored) {
      user.value = JSON.parse(stored)
    } else {
      router.replace('/login')
    }
  }
})

async function submitBranches() {
  loading.value = true
  error.value = ''

  for (let i = 0; i < branches.value.length; i++) {
    const b = branches.value[i]
    if (!b.name || !b.cashierUsername || !b.cashierPassword) {
      error.value = `Branch ${i + 1}: Name, Cashier Username & Password are required.`
      loading.value = false
      return
    }
    if (b.hasKitchen && (!b.kitchenUsername || !b.kitchenPassword)) {
      error.value = `Branch ${i + 1}: Kitchen Username & Password are required.`
      loading.value = false
      return
    }
  }

  try {
    if (user.value?.branch_id) {
      await $fetch(`${serverUrl.value}/api/setup/business-type`, {
        method: 'POST',
        body: {
          branch_id: user.value.branch_id,
          business_type: selectedType.value,
        },
      }).catch(err => console.warn('Business type API warning:', err.message))
    }

    if (branches.value.length > 0) {
      const payload = branches.value.map(b => ({
        name: b.name,
        location: b.location || '',
        business_type: selectedType.value,
        has_kitchen: b.hasKitchen,
        cashierUsername: b.cashierUsername,
        cashierPassword: b.cashierPassword,
        kitchenUsername: b.hasKitchen ? b.kitchenUsername : '',
        kitchenPassword: b.hasKitchen ? b.kitchenPassword : '',
      }))

      // ✅ Send admin_branch_id so branches are linked to this admin
      await $fetch(`${serverUrl.value}/api/branches`, {
        method: 'POST',
        body: { 
          branches: payload,
          admin_branch_id: user.value?.branch_id 
        },
      })
    }

    updateBusinessType(selectedType.value)

    successMsg.value = 'Setup complete!'
    setTimeout(() => router.replace('/admin'), 1000)
  } catch (e: any) {
    console.error('Setup error:', e)
    error.value = e.data?.message || 'Failed to save. Please try again.'
  } finally {
    loading.value = false
  }
}

function skipSetup() {
  updateBusinessType(selectedType.value)
  router.replace('/admin')
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-orange-50 via-yellow-50 to-amber-100">
    <header class="flex items-center justify-between p-4 bg-white/70 backdrop-blur-md shadow-sm">
      <div class="flex items-center gap-2">
        <Store :size="24" class="text-orange-500" />
        <span class="font-bold text-gray-800">Tapsilogan POS</span>
        <span class="text-sm text-gray-500">· Branch Setup</span>
      </div>
      <div class="flex gap-3">
        <button @click="skipSetup" class="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2">
          Skip for now
        </button>
        <button @click="logout" class="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition">
          <LogOut :size="16" />
          Logout
        </button>
      </div>
    </header>

    <div class="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">What type of store do you run?</h1>
        <p class="text-gray-600 mt-1">This sets up the right screens for your business.</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          v-for="t in BUSINESS_TYPES"
          :key="t.value"
          type="button"
          class="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all bg-white/80"
          :class="selectedType === t.value
            ? 'border-orange-400 shadow-md ring-2 ring-orange-200'
            : 'border-gray-100 hover:border-orange-200'"
          @click="selectType(t.value)"
        >
          <component :is="typeIcons[t.value]" :size="24" class="text-orange-500" />
          <span class="text-sm font-semibold text-gray-700">{{ t.label }}</span>
          <span class="text-[10px] text-gray-400">
            {{ t.hasKitchen ? 'Cashier + Kitchen' : 'Cashier only' }}
          </span>
        </button>
      </div>

      <hr class="border-gray-200" />

      <div>
        <h2 class="text-xl font-bold text-gray-800">Create Your Branches</h2>
        <p class="text-gray-600 mt-1">Add each branch. Toggle kitchen ON/OFF per branch as needed.</p>
      </div>

      <div v-for="(branch, i) in branches" :key="i" class="bg-white/80 backdrop-blur-md rounded-xl p-5 shadow border border-white/50 space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="font-semibold text-gray-700">Branch {{ i + 1 }}</h3>
          <button @click="removeBranch(i)" class="text-red-500 hover:text-red-700 transition">
            <Trash2 :size="18" />
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="text-sm text-gray-600">Branch Name *</label>
            <input v-model="branch.name" placeholder="e.g. Main Branch" class="w-full rounded-xl border-gray-200 bg-white/70 shadow-sm text-gray-600 p-2 mt-1" required />
          </div>
          <div>
            <label class="text-sm text-gray-600">Location</label>
            <input v-model="branch.location" placeholder="e.g. 123 Rizal St." class="w-full rounded-xl border-gray-200 bg-white/70 shadow-sm text-gray-600 p-2 mt-1" />
          </div>
        </div>

        <div class="border-t pt-4">
          <p class="text-sm font-medium text-gray-500 mb-3">Cashier Account *</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500">Username</label>
              <input v-model="branch.cashierUsername" placeholder="cashier1" class="w-full rounded-xl border-gray-200 bg-white/70 shadow-sm text-gray-600 p-2" required />
            </div>
            <div>
              <label class="text-xs text-gray-500">Password</label>
              <input v-model="branch.cashierPassword" type="password" placeholder="••••••" class="w-full rounded-xl border-gray-200 bg-white/70 shadow-sm text-gray-600 p-2" required />
            </div>
          </div>
        </div>

        <div class="border-t pt-4">
          <div v-if="!branch.hasKitchen" class="flex items-center justify-between">
            <p class="text-sm text-gray-400 italic">No kitchen needed for this branch</p>
            <button
              @click="toggleKitchen(i)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition"
            >
              <Plus :size="14" />
              Add Kitchen
            </button>
          </div>

          <div v-else>
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-medium text-gray-500">Kitchen Account *</p>
              <button
                @click="toggleKitchen(i)"
                class="text-xs text-red-400 hover:text-red-500 transition"
              >
                Remove Kitchen
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-500">Username</label>
                <input v-model="branch.kitchenUsername" placeholder="kitchen1" class="w-full rounded-xl border-gray-200 bg-white/70 shadow-sm text-gray-600 p-2" required />
              </div>
              <div>
                <label class="text-xs text-gray-500">Password</label>
                <input v-model="branch.kitchenPassword" type="password" placeholder="••••••" class="w-full rounded-xl border-gray-200 bg-white/70 shadow-sm text-gray-600 p-2" required />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button @click="addBranchRow" class="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition">
        <PlusCircle :size="20" /> Add Another Branch
      </button>

      <button
        @click="submitBranches"
        :disabled="loading"
        class="w-full py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        <Loader2 v-if="loading" :size="20" class="animate-spin" />
        {{ loading ? 'Saving...' : 'Save Branches & Continue' }}
      </button>

      <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>
      <p v-if="successMsg" class="text-green-600 text-sm text-center">{{ successMsg }}</p>
    </div>
  </div>
</template>