<script setup lang="ts">
import { Plus, Pencil, Trash2, Search, Loader2, ImagePlus, X, Utensils, Tag, Ruler, PlusCircle } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'
import { usePosData } from '~/composables/usePosData'

definePageMeta({ layout: 'front' })

const { serverUrl } = useServerConfig()
const { user } = useAuth()
const {
  isLocal,
  getMenuItems,
  getCategoriesLocal,
  saveMenuItemLocal,
  deleteMenuItemLocal,
} = usePosData()

const menuItems = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const activeCategory = ref('all')
const showModal = ref(false)
const saving = ref(false)
const deleting = ref<string | null>(null)
const imagePreview = ref<string | null>(null)
const imageFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const isSariSari = computed(() => user.value?.business_type === 'sarisari')

const showCustomCategoryInput = ref(false)
const customCategoryName = ref('')

interface SizeRow {
  name: string
  price: number | null
  wholesale_price: number | null
}

const form = ref({
  id: '',
  name: '',
  category: '',
  price: 0,
  wholesale_price: null as number | null,
  sizes: [] as SizeRow[],
})

const isEditing = computed(() => !!form.value.id)
const hasSizes = computed(() => form.value.sizes.length > 0)

function hasWholesale(item: any): boolean {
  return item.wholesale_price !== null && item.wholesale_price !== undefined && Number(item.wholesale_price) > 0
}

const filtered = computed(() => {
  let list = activeCategory.value === 'all'
    ? menuItems.value
    : menuItems.value.filter(i => i.category === activeCategory.value)
  if (search.value.trim()) {
    list = list.filter(i => i.name.toLowerCase().includes(search.value.toLowerCase()))
  }
  return list
})

function imageUrl(item: any): string | null {
  if (!item.image_url) return null
  if (item.image_url.startsWith('http') || item.image_url.startsWith('data:')) return item.image_url
  return `${serverUrl.value}${item.image_url}`
}

function priceRangeLabel(item: any): string {
  if (!item.sizes?.length) return `₱${Number(item.price).toFixed(2)}`
  const prices = item.sizes.map((s: any) => Number(s.price))
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? `₱${min.toFixed(2)}` : `₱${min.toFixed(2)} – ₱${max.toFixed(2)}`
}

function openAdd() {
  const defaultCat = dbCategories.value[0]?.name.toLowerCase() || ''
  form.value = { id: '', name: '', category: defaultCat, price: 0, wholesale_price: null, sizes: [] }
  imagePreview.value = null
  imageFile.value = null
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
    wholesale_price: item.wholesale_price ?? null,
    sizes: (item.sizes ?? []).map((s: any) => ({
      name: s.name,
      price: s.price,
      wholesale_price: s.wholesale_price ?? null,
    })),
  }
  imagePreview.value = imageUrl(item)
  imageFile.value = null
  showCustomCategoryInput.value = false
  customCategoryName.value = ''
  showModal.value = true
}

// ✅ Add custom category - saves to server
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
        business_type: user.value?.business_type || 'tapsilogan',
      },
    })
    
    // Add locally and select
    dbCategories.value.push({ id: key, name: name })
    form.value.category = key
    showCustomCategoryInput.value = false
    customCategoryName.value = ''
  } catch (e: any) {
    alert(e?.data?.message || 'Failed to add category')
  }
}

function addSizeRow() {
  form.value.sizes.push({ name: '', price: null, wholesale_price: null })
}

function removeSizeRow(index: number) {
  form.value.sizes.splice(index, 1)
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const dbCategories = ref<{ id: string; name: string }[]>([])

const filterCategories = computed(() => [
  { key: 'all', label: 'All' },
  ...dbCategories.value.map(c => ({ key: c.name.toLowerCase(), label: c.name })),
])

async function loadCategories() {
  try {
    if (isLocal.value) {
      dbCategories.value = getCategoriesLocal(user.value?.business_type)
      return
    }
    const bt = user.value?.business_type || 'tapsilogan'
    const res = await $fetch<{ id: string; name: string }[]>(
      `${serverUrl.value}/api/categories?business_type=${bt}`
    )
    dbCategories.value = res ?? []
  } catch (e) {
    console.error('loadCategories error:', e)
  }
}

async function saveItem() {
  if (!form.value.name.trim()) {
    alert('Please fill in the product name')
    return
  }
  if (!form.value.category) {
    alert('Please select or enter a category')
    return
  }

  if (!hasSizes.value && !form.value.price) {
    alert('Please fill in a price, or add at least one size')
    return
  }
  if (hasSizes.value) {
    for (const s of form.value.sizes) {
      if (!s.name.trim() || s.price == null || s.price === ('' as any)) {
        alert('Each size needs a name and a price')
        return
      }
    }
  }

  saving.value = true
  try {
    if (isLocal.value) {
      let imageDataUrl: string | null = null
      if (imageFile.value) {
        imageDataUrl = await fileToBase64(imageFile.value)
      }

      await saveMenuItemLocal(
        {
          id: form.value.id,
          name: form.value.name.trim(),
          category: form.value.category,
          price: form.value.price,
          wholesale_price: form.value.wholesale_price,
          sizes: form.value.sizes.map(s => ({
            name: s.name,
            price: Number(s.price),
            wholesale_price: s.wholesale_price != null && (s.wholesale_price as any) !== '' ? Number(s.wholesale_price) : null,
          })),
        },
        imageDataUrl,
        isEditing.value,
      )

      showModal.value = false
      await loadProducts()
      await loadCategories()
      return
    }

    const formData = new FormData()
    formData.append('name', form.value.name.trim())
    formData.append('category', form.value.category)
    formData.append('price', String(form.value.price))
    formData.append('business_type', user.value?.business_type || '')
    formData.append('branch_id', user.value?.branch_id || '')

    if (form.value.wholesale_price !== null && form.value.wholesale_price !== undefined && (form.value.wholesale_price as any) !== '') {
      formData.append('wholesale_price', String(form.value.wholesale_price))
    }

    if (imageFile.value) {
      formData.append('image', imageFile.value)
    }

    if (isEditing.value) {
      await $fetch(`${serverUrl.value}/api/menu-items/${form.value.id}`, {
        method: 'PATCH' as 'POST',
        body: formData,
      })
    } else {
      await $fetch(`${serverUrl.value}/api/menu-items`, {
        method: 'POST' as const,
        body: formData,
      })
    }

    showModal.value = false
    await loadProducts()
    await loadCategories()
  } catch (e: any) {
    alert(e?.data?.message || 'Failed to save product')
  } finally {
    saving.value = false
  }
}

async function loadProducts() {
  loading.value = true
  try {
    menuItems.value = await getMenuItems()
  } catch (e) {
    console.error('loadProducts error:', e)
  } finally {
    loading.value = false
  }
}

async function deleteItem(id: string) {
  if (!confirm('Delete this product?')) return
  deleting.value = id
  try {
    if (isLocal.value) {
      await deleteMenuItemLocal(id)
    } else {
      await $fetch(`${serverUrl.value}/api/menu-items/${id}`, {
        method: 'DELETE' as 'POST',
      })
    }
    await loadProducts()
  } catch (e) {
    console.error(e)
  } finally {
    deleting.value = null
  }
}

onMounted(() => {
  loadProducts()
  loadCategories()
})
</script>



<template>
  <div class="space-y-4 sm:space-y-5 pb-4 sm:pb-6 px-3 sm:px-4">

    <!-- Header – stacks on small screens -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Products</h1>
        <p class="text-gray-500 text-sm mt-0.5">{{ menuItems.length }} items in menu</p>
      </div>
      <button
        class="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-orange-200 transition active:scale-95 w-full sm:w-auto"
        @click="openAdd"
      >
        <Plus class="w-4 h-4" />
        Add Product
      </button>
    </div>

    <!-- Search + filter – stack on mobile -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1 w-full">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="search"
          placeholder="Search products..."
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 shadow-sm"
        />
      </div>
      <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          v-for="cat in filterCategories"
          :key="cat.key"
          class="px-3 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap"
          :class="activeCategory === cat.key
            ? 'bg-orange-500 text-white'
            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
          @click="activeCategory = cat.key"
        >
          {{ cat.label }}
          <span class="ml-1 opacity-70">
            ({{ cat.key === 'all' ? menuItems.length : menuItems.filter(i => i.category === cat.key).length }})
          </span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-400">
      <Loader2 class="w-6 h-6 animate-spin mx-auto mb-2" />
      Loading products...
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="text-center py-12 bg-white rounded-2xl border border-gray-100">
      <Utensils class="w-12 h-12 text-orange-300 mx-auto mb-3" />
      <p class="text-gray-500 text-sm font-medium">No products found</p>
      <button class="mt-3 text-orange-500 text-sm font-semibold hover:underline" @click="openAdd">
        Add your first product
      </button>
    </div>

    <!-- Product cards – responsive grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
      >
        <div
          class="h-20 sm:h-24 flex items-center justify-center overflow-hidden"
          :class="imageUrl(item) ? '' : 'bg-gray-50'"
        >
          <img
            v-if="imageUrl(item)"
            :src="imageUrl(item)!"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-2xl sm:text-3xl font-bold text-gray-300 capitalize">
            {{ item.name.charAt(0) }}
          </span>
        </div>

        <div class="p-2 sm:p-2.5 flex-1 flex flex-col gap-0.5 sm:gap-1">
          <p class="text-xs sm:text-sm font-semibold text-gray-700 truncate capitalize leading-tight">{{ item.name }}</p>
          <p class="text-[10px] sm:text-xs text-gray-400 capitalize">{{ item.category }}</p>
          <p class="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">
            {{ priceRangeLabel(item) }}
          </p>

          <div v-if="item.sizes?.length" class="mt-0.5 sm:mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-100">
            <Ruler class="w-2.5 h-2.5" />
            {{ item.sizes.length }} size{{ item.sizes.length > 1 ? 's' : '' }}
          </div>

          <div v-if="isSariSari && !item.sizes?.length && hasWholesale(item)" class="mt-0.5 sm:mt-1">
            <div class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
              <Tag class="w-2.5 h-2.5" />
              Wholesale ₱{{ Number(item.wholesale_price).toFixed(2) }}
            </div>
          </div>

          <div class="flex gap-2 mt-auto pt-2">
            <button
              class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 text-xs font-medium transition"
              @click="openEdit(item)"
            >
              <Pencil class="w-3 h-3" /> <span class="hidden sm:inline">Edit</span>
            </button>
            <button
              class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 text-xs font-medium transition"
              :disabled="deleting === item.id"
              @click="deleteItem(item.id)"
            >
              <Loader2 v-if="deleting === item.id" class="w-3 h-3 animate-spin" />
              <Trash2 v-else class="w-3 h-3" /> <span class="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="showModal = false"
      >
        <div class="bg-white rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm shadow-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto transition-all">
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

          <!-- ... (rest of modal unchanged) ... -->
          <!-- Include your existing modal fields here exactly as before -->
          <div class="space-y-3">

            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase block mb-1.5">
                Product Image (optional)
              </label>

              <div
                v-if="imagePreview"
                class="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 mb-2"
              >
                <img :src="imagePreview" alt="Preview" class="w-full h-full object-cover" />
                <button
                  class="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center"
                  @click="removeImage"
                >
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

              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onImageSelect"
              />
            </div>

            <div>
              <label class="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Name</label>
              <input
                v-model="form.name"
                placeholder="e.g. Tapsilog"
                class="w-full border text-gray-700 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
              />
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

            <!-- Base price + wholesale -->
            <div v-if="!hasSizes">
              <label class="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Regular Price (₱)</label>
              <input
                v-model.number="form.price"
                type="number"
                step="0.01"
                min="0"
                class="w-full border border-gray-200 rounded-xl text-gray-700 px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            <div v-if="isSariSari && !hasSizes">
              <label class="text-xs font-semibold text-gray-500 uppercase block mb-1.5">
                Wholesale Price (₱) <span class="normal-case text-gray-400 font-normal">— optional</span>
              </label>
              <input
                v-model.number="form.wholesale_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave blank to use regular price"
                class="w-full border text-gray-700 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>

            <!-- Sizes -->
            <div class="border-t border-gray-100 pt-3">
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                  <Ruler class="w-3.5 h-3.5" />
                  Sizes <span class="normal-case text-gray-400 font-normal">— optional</span>
                </label>
                <button
                  class="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600"
                  @click="addSizeRow"
                >
                  <Plus class="w-3 h-3" /> Add Size
                </button>
              </div>

              <p v-if="!hasSizes" class="text-[11px] text-gray-400 mb-2">
                No sizes added — the product will use the regular price above.
              </p>

              <div v-for="(size, i) in form.sizes" :key="i" class="border border-gray-200 rounded-xl p-3 mb-2 space-y-2">
                <div class="flex items-center gap-2">
                  <input
                    v-model="size.name"
                    placeholder="Size name (e.g. Small)"
                    class="flex-1 border text-gray-700 border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                  />
                  <button
                    class="w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center shrink-0"
                    @click="removeSizeRow(i)"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
                <div class="grid" :class="isSariSari ? 'grid-cols-2 gap-2' : 'grid-cols-1'">
                  <div>
                    <label class="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Regular Price (₱)</label>
                    <input
                      v-model.number="size.price"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-full border text-gray-700 border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                    />
                  </div>
                  <div v-if="isSariSari">
                    <label class="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Wholesale (₱)</label>
                    <input
                      v-model.number="size.wholesale_price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Optional"
                      class="w-full border text-gray-700 border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>

              <p v-if="hasSizes && isSariSari" class="text-[11px] text-gray-400 mt-1">
                Each size can have its own wholesale price.
              </p>
            </div>
          </div>

          <div class="flex gap-3 mt-5">
            <button
              class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50"
              @click="showModal = false"
            >
              Cancel
            </button>
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

<style scoped>
/* Force single column on very narrow screens for better touch targets */
@media (max-width: 380px) {
  .grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>