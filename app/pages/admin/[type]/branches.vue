<script setup lang="ts">
import { PlusCircle, Trash2, Store, Loader2, RefreshCw, Eye, EyeOff, User, Key, MapPin, Calendar, Building2, Users } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'
import { hasKitchen, businessLabel, isValidBusinessType, type BusinessType } from '@shared/types/business.types'

definePageMeta({ layout: 'admin' })

const { user } = useAuth()
const currentType = computed<BusinessType>(() => {
  const raw = user.value?.business_type
  return isValidBusinessType(raw) ? raw : 'tapsilogan'
})
const { serverUrl } = useServerConfig()

interface BranchWithStaff {
  id: string
  name: string
  address: string | null
  business_type: BusinessType
  created_at: string
  cashierUsername: string | null
  kitchenUsername: string | null
  cashierPasswordHash: string | null
  kitchenPasswordHash: string | null
}

const existingBranches = ref<BranchWithStaff[]>([])
const loadingBranches = ref(false)

// ✅ Only show branches belonging to THIS admin (by branch_id)
const myBranches = computed(() =>
  existingBranches.value.filter(b => 
    b.id !== user.value?.branch_id
  )
)

const visiblePasswords = ref<Set<string>>(new Set())
const showAdminPassword = ref(false)

function togglePasswordVisibility(branchId: string) {
  const newSet = new Set(visiblePasswords.value)
  if (newSet.has(branchId)) newSet.delete(branchId)
  else newSet.add(branchId)
  visiblePasswords.value = newSet
}

interface BranchInput {
  name: string
  location: string
  business_type: BusinessType
  cashierUsername: string
  cashierPassword: string
  kitchenUsername: string
  kitchenPassword: string
}

const newBranches = ref<BranchInput[]>([])
const adding = ref(false)
const error = ref('')
const successMsg = ref('')

async function fetchBranches() {
  loadingBranches.value = true
  try {
    // ✅ Send admin's branch_id to filter results
    const data = await $fetch<BranchWithStaff[]>(`${serverUrl.value}/api/branches`, {
      query: { admin_branch_id: user.value?.branch_id }
    })
    existingBranches.value = data
  } catch (e: any) {
    error.value = 'Failed to load branches'
    console.error(e)
  } finally {
    loadingBranches.value = false
  }
}

onMounted(() => fetchBranches())

function addBranchRow() {
  newBranches.value.push({
    name: '', location: '', business_type: currentType.value,
    cashierUsername: '', cashierPassword: '', kitchenUsername: '', kitchenPassword: '',
  })
}
function removeBranchRow(index: number) {
  newBranches.value.splice(index, 1)
}

async function submitBranches() {
  adding.value = true
  error.value = ''
  successMsg.value = ''
  try {
    // ✅ Send admin's branch_id when creating branches
    await $fetch(`${serverUrl.value}/api/branches`, {
      method: 'POST',
      body: { 
        branches: newBranches.value,
        admin_branch_id: user.value?.branch_id 
      },
    })
    successMsg.value = 'Branches created successfully!'
    newBranches.value = []
    await fetchBranches()
  } catch (e: any) {
    error.value = e.data?.message || e.data?.statusMessage || 'Failed to create branches'
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    
    <!-- Admin Account Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <User :size="20" class="text-white" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-white">Admin Account</h2>
            <p class="text-orange-100 text-xs">Your login credentials</p>
          </div>
        </div>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div class="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
              <User :size="16" class="text-orange-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Username</p>
              <p class="text-sm font-bold text-gray-800 truncate">{{ user?.username || '—' }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div class="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Key :size="16" class="text-amber-500" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Password</p>
              <div class="flex items-center gap-2">
                <p class="text-sm font-mono text-gray-600">
                  {{ showAdminPassword ? (user?.password || '••••••••') : '••••••••' }}
                </p>
                <button @click="showAdminPassword = !showAdminPassword" class="text-gray-400 hover:text-gray-600 shrink-0">
                  <EyeOff v-if="showAdminPassword" :size="14" />
                  <Eye v-else :size="14" />
                </button>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div class="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <Building2 :size="16" class="text-green-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Business Type</p>
              <p class="text-sm font-bold text-gray-800">{{ businessLabel(currentType) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Branches Section -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Users :size="20" class="text-gray-400" />
          <h2 class="text-xl font-bold text-gray-800">Additional Branches</h2>
          <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{{ myBranches.length }}</span>
        </div>
        <button @click="fetchBranches" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition">
          <RefreshCw :size="16" /> Refresh
        </button>
      </div>

      <div v-if="loadingBranches" class="text-center py-12">
        <Loader2 :size="24" class="animate-spin mx-auto text-gray-400" />
        <p class="text-gray-400 text-sm mt-2">Loading branches...</p>
      </div>

      <div v-else-if="myBranches.length === 0" class="text-center py-16 bg-white rounded-2xl border border-gray-200">
        <Store :size="48" class="mx-auto text-gray-300 mb-3" />
        <p class="text-gray-500 font-medium">No additional branches</p>
        <p class="text-gray-400 text-sm mt-1">Add a new branch below</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="branch in myBranches"
          :key="branch.id"
          class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
        >
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Store :size="16" class="text-orange-500" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-gray-800">{{ branch.name }}</h3>
                <div v-if="branch.address" class="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin :size="10" />
                  {{ branch.address }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 text-xs text-gray-400">
              <Calendar :size="12" />
              {{ new Date(branch.created_at).toLocaleDateString() }}
            </div>
          </div>

          <div class="p-5 space-y-3">
            <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                  <User :size="14" class="text-green-600" />
                </div>
                <div>
                  <p class="text-[10px] font-semibold text-gray-400 uppercase">Cashier</p>
                  <p class="text-sm font-medium text-gray-700">{{ branch.cashierUsername || '—' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-mono text-gray-500">
                  {{ visiblePasswords.has(branch.id) ? branch.cashierPasswordHash?.substring(0, 16) + '...' : '••••••' }}
                </span>
                <button v-if="branch.cashierPasswordHash" @click="togglePasswordVisibility(branch.id)" class="text-gray-400 hover:text-gray-600">
                  <EyeOff v-if="visiblePasswords.has(branch.id)" :size="14" />
                  <Eye v-else :size="14" />
                </button>
              </div>
            </div>

            <div 
              class="flex items-center justify-between p-3 rounded-xl"
              :class="branch.kitchenUsername ? 'bg-gray-50' : 'bg-gray-50/50'"
            >
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full flex items-center justify-center"
                  :class="branch.kitchenUsername ? 'bg-blue-100' : 'bg-gray-100'">
                  <User :size="14" :class="branch.kitchenUsername ? 'text-blue-600' : 'text-gray-400'" />
                </div>
                <div>
                  <p class="text-[10px] font-semibold text-gray-400 uppercase">Kitchen</p>
                  <p class="text-sm font-medium" :class="branch.kitchenUsername ? 'text-gray-700' : 'text-gray-400'">
                    {{ branch.kitchenUsername || 'Not assigned' }}
                  </p>
                </div>
              </div>
              <div v-if="branch.kitchenPasswordHash" class="flex items-center gap-1.5">
                <span class="text-xs font-mono text-gray-500">
                  {{ visiblePasswords.has(branch.id) ? branch.kitchenPasswordHash?.substring(0, 16) + '...' : '••••••' }}
                </span>
                <button @click="togglePasswordVisibility(branch.id)" class="text-gray-400 hover:text-gray-600">
                  <EyeOff v-if="visiblePasswords.has(branch.id)" :size="14" />
                  <Eye v-else :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add New Branch -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 class="text-lg font-bold text-gray-800 mb-4">Add New Branch</h2>

      <div v-for="(branch, i) in newBranches" :key="i" class="bg-gray-50 rounded-xl p-5 space-y-4 mb-4">
        <div class="flex justify-between items-center">
          <h3 class="font-semibold text-gray-700">Branch {{ i + 1 }}</h3>
          <button @click="removeBranchRow(i)" class="text-red-500 hover:text-red-700 transition">
            <Trash2 :size="18" />
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="text-sm text-gray-600">Branch Name</label>
            <input v-model="branch.name" class="w-full rounded-xl border-gray-200 bg-white shadow-sm text-gray-700 mt-1 p-2" required />
          </div>
          <div>
            <label class="text-sm text-gray-600">Location</label>
            <input v-model="branch.location" class="w-full rounded-xl border-gray-200 bg-white shadow-sm text-gray-700 mt-1 p-2" />
          </div>
        </div>

        <div class="border-t pt-4">
          <p class="text-sm font-medium text-gray-500 mb-3">Cashier Account</p>
          <div class="grid grid-cols-2 gap-3">
            <input v-model="branch.cashierUsername" placeholder="Username" class="w-full rounded-xl border-gray-200 bg-white shadow-sm text-gray-700 p-2" required />
            <input v-model="branch.cashierPassword" type="password" placeholder="Password" class="w-full rounded-xl border-gray-200 bg-white shadow-sm text-gray-700 p-2" required />
          </div>
        </div>

        <div v-if="hasKitchen(currentType)" class="border-t pt-4">
          <p class="text-sm font-medium text-gray-500 mb-3">Kitchen Account</p>
          <div class="grid grid-cols-2 gap-3">
            <input v-model="branch.kitchenUsername" placeholder="Username" class="w-full rounded-xl border-gray-200 bg-white shadow-sm text-gray-700 p-2" required />
            <input v-model="branch.kitchenPassword" type="password" placeholder="Password" class="w-full rounded-xl border-gray-200 bg-white shadow-sm text-gray-700 p-2" required />
          </div>
        </div>
      </div>

      <button @click="addBranchRow" class="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition mb-4">
        <PlusCircle :size="20" /> Add Branch Row
      </button>

      <button
        @click="submitBranches"
        :disabled="adding || newBranches.length === 0"
        class="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        <Loader2 v-if="adding" :size="20" class="animate-spin" />
        {{ adding ? 'Saving...' : 'Save New Branches' }}
      </button>

      <p v-if="error" class="text-red-600 text-sm text-center mt-3">{{ error }}</p>
      <p v-if="successMsg" class="text-green-600 text-sm text-center mt-3">{{ successMsg }}</p>
    </div>
  </div>
</template>