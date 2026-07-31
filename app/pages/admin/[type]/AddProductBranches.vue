<script setup lang="ts">
import { Plus, Pencil, Trash2, Loader2, PackageCheck, RefreshCw, Store, ImagePlus, X } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'
import { isValidBusinessType, businessLabel, type BusinessType } from '@shared/types/business.types'

definePageMeta({ layout: 'admin' })

interface MenuItem {
  id?: string
  name: string
  category: string
  price: number
  business_type?: BusinessType
  branch_id?: string
  image_url?: string
}

interface Branch {
  id: string
  name: string
  address?: string | null
  business_type?: BusinessType
  created_at?: string
}

const { user } = useAuth()
const currentType = computed<BusinessType>(() => {
  const raw = user.value?.business_type
  return isValidBusinessType(raw) ? raw : 'tapsilogan'
})

const { serverUrl } = useServerConfig()

const allBranches = ref<Branch[]>([])
const selectedBranchId = ref<string>('')
const existingItems = ref<MenuItem[]>([])
const dbCategories = ref<{ id: string; name: string }[]>([])
const loading = ref(false)
const loadingExisting = ref(false)
const loadingBranches = ref(false)
const error = ref('')
const successMsg = ref('')

const activeCategory = ref('all')

const showModal = ref(false)
const saving = ref(false)
const imagePreview = ref<string | null>(null)
const imageFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const showCustomCategoryInput = ref(false)
const customCategoryName = ref('')

const form = ref({
  id: '',
  name: '',
  category: '',
  price: 0,
})

const isEditing = computed(() => !!form.value.id)

const myBranches = computed(() =>
  allBranches.value.filter(b => b.id !== user.value?.branch_id)
)

const selectedBranch = computed(() => 
  myBranches.value.find(b => b.id === selectedBranchId.value)
)

const filterCategories = computed(() => [
  { key: 'all', label: 'All' },
  ...dbCategories.value.map(c => ({ key: c.name.toLowerCase(), label: c.name })),
])

const filteredItems = computed(() => {
  if (activeCategory.value === 'all') return existingItems.value
  return existingItems.value.filter(i => i.category === activeCategory.value)
})

function imageUrl(item: any): string | null {
  if (!item.image_url) return null
  if (item.image_url.startsWith('http') || item.image_url.startsWith('data:')) return item.image_url
  return `${serverUrl.value}${item.image_url}`
}

async function loadBranches() {
  loadingBranches.value = true
  try {
    const res = await $fetch<any>(`${serverUrl.value}/api/branches`, {
      query: { admin_branch_id: user.value?.branch_id }
    })
    
    const branchData = Array.isArray(res) ? res : (res?.data ?? [])
    allBranches.value = branchData.filter((b: Branch) => b.id !== user.value?.branch_id)
    
    if (myBranches.value.length > 0 && !selectedBranchId.value) {
      selectedBranchId.value = myBranches.value[0].id
      await loadExistingItems()
      await loadCategories()
    }
  } catch (e) {
    console.error('loadBranches error:', e)
    error.value = 'Failed to load branches'
  } finally {
    loadingBranches.value = false
  }
}

async function loadCategories() {
  if (!selectedBranchId.value) return
  try {
    const res = await $fetch<{ id: string; name: string }[]>(
      `${serverUrl.value}/api/categories?business_type=${currentType.value}`
    )
    dbCategories.value = res ?? []
  } catch (e) {
    console.error('loadCategories error:', e)
  }
}

function openAdd() {
  const defaultCat = dbCategories.value[0]?.name.toLowerCase() || ''
  form.value = { id: '', name: '', category: defaultCat, price: 0 }
  imagePreview.value = null
  imageFile.value = null
  error.value = ''
  successMsg.value = ''
  showCustomCategoryInput.value = false
  customCategoryName.value = ''
  showModal.value = true
}

function openEdit(item: any) {
  form.value = {
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
  }
  imagePreview.value = imageUrl(item)
  imageFile.value = null
  error.value = ''
  successMsg.value = ''
  showCustomCategoryInput.value = false
  customCategoryName.value = ''
  showModal.value = true
}

// ✅ Add custom category - now saves to server
async function addCustomCategory() {
  const name = customCategoryName.value.trim()
  if (!name) return
  
  const key = name.toLowerCase()
  
  // Check if already exists in local list
  if (dbCategories.value.find(c => c.name.toLowerCase() === key)) {
    form.value.category = key
    showCustomCategoryInput.value = false
    customCategoryName.value = ''
    return
  }
  
  // Save to server
  try {
    await $fetch(`${serverUrl.value}/api/categories`, {
      method: 'POST',
      body: {
        name: name,
        business_type: currentType.value,
      },
    })
    
    // Add locally and select
    dbCategories.value.push({ id: key, name: name })
    form.value.category = key
    showCustomCategoryInput.value = false
    customCategoryName.value = ''
    successMsg.value = `Category "${name}" added!`
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to add category'
  }
}

function onImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function removeImage() {
  imagePreview.value = null
  imageFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function loadExistingItems() {
  if (!selectedBranchId.value) {
    existingItems.value = []
    return
  }
  
  loadingExisting.value = true
  try {
    const res = await $fetch<any>(`${serverUrl.value}/api/menu-items`, {
      query: { branch_id: selectedBranchId.value },
    })
    existingItems.value = res?.data ?? []
  } catch (e) {
    console.error('loadExistingItems error:', e)
  } finally {
    loadingExisting.value = false
  }
}

async function saveItem() {
  if (!form.value.name.trim()) {
    error.value = 'Please fill in the product name'
    return
  }
  if (!form.value.category) {
    error.value = 'Please select or enter a category'
    return
  }
  if (!form.value.price || form.value.price <= 0) {
    error.value = 'Please fill in a valid price'
    return
  }

  saving.value = true
  error.value = ''

  try {
    const formData = new FormData()
    formData.append('name', form.value.name.trim())
    formData.append('category', form.value.category)
    formData.append('price', String(form.value.price))
    formData.append('business_type', currentType.value)
    formData.append('branch_id', selectedBranchId.value)

    if (imageFile.value) {
      formData.append('image', imageFile.value)
    }

    if (isEditing.value) {
      await $fetch(`${serverUrl.value}/api/menu-items/${form.value.id}`, {
        method: 'PATCH' as 'POST',
        body: formData,
      })
      successMsg.value = 'Product updated successfully!'
    } else {
      await $fetch(`${serverUrl.value}/api/menu-items`, {
        method: 'POST',
        body: formData,
      })
      successMsg.value = `Product added to ${selectedBranch.value?.name || 'selected branch'}!`
    }

    showModal.value = false
    await loadExistingItems()
    await loadCategories()
  } catch (e: any) {
    error.value = e.data?.statusMessage || e.data?.message || 'Failed to save product'
  } finally {
    saving.value = false
  }
}

async function deleteItem(id: string) {
  if (!confirm('Delete this product?')) return
  try {
    await $fetch(`${serverUrl.value}/api/menu-items/${id}`, {
      method: 'DELETE' as 'POST',
    })
    await loadExistingItems()
    successMsg.value = 'Product deleted successfully!'
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to delete product'
  }
}

async function onBranchChange() {
  existingItems.value = []
  activeCategory.value = 'all'
  error.value = ''
  successMsg.value = ''
  
  if (selectedBranchId.value) {
    await loadCategories()
    await loadExistingItems()
  }
}

function categoryLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

const pastelBg: Record<string, string> = {
  silog: 'bg-amber-50',
  drinks: 'bg-cyan-50',
  extras: 'bg-green-50',
}

onMounted(() => {
  loadBranches()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Menu Items</h1>
        <p class="text-gray-600 mt-1">Manage products per branch for {{ businessLabel(currentType) }}.</p>
      </div>
      <button
        v-if="selectedBranchId"
        class="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-orange-200 transition active:scale-95"
        @click="openAdd"
      >
        <Plus class="w-4 h-4" />
        Add Product
      </button>
    </div>

    <!-- Branch Selector -->
    <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div class="flex items-center gap-2 mb-3">
        <Store class="w-5 h-5 text-orange-500" />
        <h3 class="font-semibold text-gray-700">Select Branch</h3>
      </div>
      
      <div v-if="loadingBranches" class="flex items-center gap-2 text-gray-400 text-sm py-2">
        <Loader2 class="w-4 h-4 animate-spin" />
        Loading branches...
      </div>
      
      <div v-else-if="!myBranches.length" class="text-gray-400 text-sm py-2">
        No additional branches found. Create branches first in the Branches page.
      </div>
      
      <div v-else class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="branch in myBranches"
            :key="branch.id"
            class="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
            :class="selectedBranchId === branch.id
              ? 'border-orange-400 bg-orange-50 text-orange-600 shadow-sm'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
            @click="selectedBranchId = branch.id; onBranchChange()"
          >
            <Store class="w-4 h-4" />
            {{ branch.name }}
          </button>
        </div>
        
        <p v-if="selectedBranch" class="text-xs text-gray-400">
          Managing: <span class="font-semibold text-gray-600">{{ selectedBranch.name }}</span>
        </p>
      </div>
    </div>

    <!-- Messages -->
    <p v-if="error" class="text-red-600 text-sm text-center bg-red-50 rounded-lg py-2">{{ error }}</p>
    <p v-if="successMsg" class="text-green-600 text-sm text-center bg-green-50 rounded-lg py-2">{{ successMsg }}</p>

    <!-- Products -->
    <template v-if="selectedBranchId">
      <!-- Category Filter Tabs -->
      <div v-if="existingItems.length" class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="cat in filterCategories"
          :key="cat.key"
          class="px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap"
          :class="activeCategory === cat.key
            ? 'bg-orange-500 text-white shadow-sm'
            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
          @click="activeCategory = cat.key"
        >
          {{ cat.label }}
          <span class="ml-1 opacity-70">
            ({{ cat.key === 'all' ? existingItems.length : existingItems.filter(i => i.category === cat.key).length }})
          </span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loadingExisting" class="text-center py-12 text-gray-400">
        <Loader2 class="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading products...
      </div>

      <!-- Empty -->
      <div v-else-if="!existingItems.length" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <PackageCheck class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p class="text-gray-500 font-medium">No products yet for {{ selectedBranch?.name }}</p>
        <button class="mt-3 text-orange-500 text-sm font-semibold hover:underline" @click="openAdd">
          Add your first product
        </button>
      </div>

      <!-- Product Cards Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
        >
          <div
            class="h-28 flex items-center justify-center overflow-hidden"
            :class="imageUrl(item) ? '' : (pastelBg[item.category] ?? 'bg-gray-50')"
          >
            <img
              v-if="imageUrl(item)"
              :src="imageUrl(item)!"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-3xl font-bold text-gray-300 capitalize">{{ item.name.charAt(0) }}</span>
          </div>

          <div class="p-3">
            <p class="text-sm font-bold text-gray-800 truncate capitalize">{{ item.name }}</p>
            <p class="text-xs text-gray-400 capitalize mt-0.5">{{ item.category }}</p>
            <p class="text-base font-bold mt-1 text-orange-500">₱{{ Number(item.price).toFixed(2) }}</p>

            <div class="flex gap-2 mt-3">
              <button
                class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 text-xs font-semibold transition"
                @click="openEdit(item)"
              >
                <Pencil class="w-3 h-3" /> Edit
              </button>
              <button
                class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 text-xs font-semibold transition"
                @click="deleteItem(item.id!)"
              >
                <Trash2 class="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- No branch selected -->
    <div v-else class="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
      <Store class="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p class="font-medium">Select a branch above to manage its products.</p>
    </div>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        @click.self="showModal = false"
      >
        <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800">
              {{ isEditing ? 'Edit Product' : 'Add Product' }}
            </h2>
            <button
              class="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              @click="showModal = false"
            >
              <X class="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div class="space-y-3">
            <!-- Image Upload -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Product Image (optional)</label>
              <div v-if="imagePreview" class="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 mb-2">
                <img :src="imagePreview" alt="Preview" class="w-full h-full object-cover" />
                <button class="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center" @click="removeImage">
                  <X class="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <button
                v-else
                class="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-orange-300 hover:text-orange-400 transition"
                @click="fileInputRef?.click()"
              >
                <ImagePlus class="w-6 h-6" />
                <span class="text-xs font-medium">Tap to upload image</span>
              </button>
              <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onImageSelect" />
            </div>

            <!-- Name -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Name</label>
              <input v-model="form.name" placeholder="e.g. Tapsilog" class="w-full border text-gray-700 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
            </div>

            <!-- Custom Category with + button -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Category</label>
              
              <div v-if="showCustomCategoryInput" class="flex gap-2">
                <input
                  v-model="customCategoryName"
                  placeholder="Enter category name..."
                  class="flex-1 border text-gray-700 border-orange-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-orange-50"
                  @keyup.enter="addCustomCategory"
                />
                <button
                  class="px-3 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition"
                  @click="addCustomCategory"
                >
                  Add
                </button>
                <button
                  class="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition"
                  @click="showCustomCategoryInput = false; customCategoryName = ''"
                >
                  Cancel
                </button>
              </div>

              <div v-else class="flex gap-2">
                <select
                  v-model="form.category"
                  class="flex-1 border border-gray-200 text-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white"
                >
                  <option value="">Select a category</option>
                  <option
                    v-for="cat in dbCategories"
                    :key="cat.id"
                    :value="cat.name.toLowerCase()"
                  >
                    {{ cat.name }}
                  </option>
                </select>
                <button
                  class="w-10 h-10 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-500 flex items-center justify-center transition shrink-0"
                  title="Add custom category"
                  @click="showCustomCategoryInput = true; customCategoryName = ''"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Price -->
            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Price (₱)</label>
              <input v-model.number="form.price" type="number" step="0.01" min="0" placeholder="0.00" class="w-full border border-gray-200 rounded-xl text-gray-700 px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
            </div>

            <!-- Branch info -->
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-500">Adding to: <span class="font-semibold text-gray-700">{{ selectedBranch?.name || 'Selected Branch' }}</span></p>
            </div>
          </div>

          <p v-if="error" class="text-red-600 text-xs mt-3">{{ error }}</p>

          <div class="flex gap-3 mt-5">
            <button class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50" @click="showModal = false">Cancel</button>
            <button
              class="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold flex items-center justify-center gap-2"
              :disabled="saving"
              @click="saveItem"
            >
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              {{ saving ? 'Saving...' : isEditing ? 'Update' : 'Add Product' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>