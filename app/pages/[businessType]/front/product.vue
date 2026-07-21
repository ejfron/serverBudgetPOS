<script setup lang="ts">
import { Plus, Pencil, Trash2, Search, Loader2, ImagePlus, X, Tag, Utensils, Upload, ImageIcon } from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'

definePageMeta({ layout: 'front' })

const { serverUrl } = useServerConfig()
const { user } = useAuth()

interface Category { id: string; name: string; business_type?: string }

const menuItems = ref<any[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)
const search = ref('')
const activeCategory = ref('all')
const showModal = ref(false)
const saving = ref(false)
const deleting = ref<string | null>(null)

const showNewCategoryInput = ref(false)
const newCategoryName = ref('')
const addingCategory = ref(false)

const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const isDragging = ref(false)

const form = ref({ id: '', name: '', category: '', price: 0 })
const isEditing = computed(() => !!form.value.id)

const businessType = computed(() => user.value?.business_type || 'tapsilogan')

const filtered = computed(() => {
  let list = activeCategory.value === 'all'
    ? menuItems.value
    : menuItems.value.filter(i => i.category === activeCategory.value)
  if (search.value.trim()) {
    list = list.filter(i => i.name.toLowerCase().includes(search.value.toLowerCase()))
  }
  return list
})

function imageUrlFor(item: any): string | null {
  if (!item.image_url) return null
  return `${serverUrl.value}${item.image_url}`
}

async function loadProducts() {
  loading.value = true
  try {
    const res = await $fetch<any>(`${serverUrl.value}/api/menu-items`)
    menuItems.value = res.data ?? []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function loadCategories() {
  try {
    // ✅ Filter categories by business type
    const res = await $fetch<Category[]>(`${serverUrl.value}/api/categories?business_type=${businessType.value}`)
    categories.value = res ?? []
    if (!form.value.category && categories.value.length) {
      form.value.category = categories.value[0].name.toLowerCase()
    }
  } catch (e) { console.error(e) }
}

async function addNewCategory() {
  const name = newCategoryName.value.trim()
  if (!name) return
  addingCategory.value = true
  try {
    // ✅ Send business_type when creating category
    const created = await $fetch<Category>(`${serverUrl.value}/api/categories`, {
      method: 'POST',
      body: { 
        name,
        business_type: businessType.value 
      },
    })
    await loadCategories()
    form.value.category = created.name.toLowerCase()
    newCategoryName.value = ''
    showNewCategoryInput.value = false
  } catch (e) {
    console.error('Add category error:', e)
  } finally {
    addingCategory.value = false
  }
}

function pastelBgFor(cat: string) {
  const palette = ['bg-amber-50', 'bg-cyan-50', 'bg-green-50', 'bg-rose-50', 'bg-violet-50', 'bg-orange-50']
  let hash = 0
  for (const ch of cat) hash = (hash * 31 + ch.charCodeAt(0)) % palette.length
  return palette[hash]
}

function priceColorFor(cat: string) {
  const palette = ['text-amber-600', 'text-cyan-600', 'text-green-600', 'text-rose-600', 'text-violet-600', 'text-orange-600']
  let hash = 0
  for (const ch of cat) hash = (hash * 31 + ch.charCodeAt(0)) % palette.length
  return palette[hash]
}

function openAdd() {
  form.value = { id: '', name: '', category: categories.value[0]?.name.toLowerCase() ?? '', price: 0 }
  imageFile.value = null
  imagePreview.value = null
  showModal.value = true
}

function openEdit(item: any) {
  form.value = { id: item.id, name: item.name, category: item.category, price: item.price }
  imageFile.value = null
  imagePreview.value = imageUrlFor(item)
  showModal.value = true
}

function handleImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function clearImage() {
  imageFile.value = null
  imagePreview.value = null
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    imageFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

async function saveItem() {
  if (!form.value.name || !form.value.price) return
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('name', form.value.name)
    formData.append('category', form.value.category)
    formData.append('price', String(form.value.price))
    if (imageFile.value) formData.append('image', imageFile.value)

    if (isEditing.value) {
      await $fetch(`${serverUrl.value}/api/menu-items/${form.value.id}`, {
        method: 'PATCH',
        body: formData,
      })
    } else {
      await $fetch(`${serverUrl.value}/api/menu-items`, {
        method: 'POST',
        body: formData,
      })
    }
    showModal.value = false
    await loadProducts()
  } catch (e) {
    console.error('saveItem error:', e)
  } finally {
    saving.value = false
  }
}

async function deleteItem(id: string) {
  if (!confirm('Delete this product?')) return
  deleting.value = id
  try {
    await fetch(`${serverUrl.value}/api/menu-items/${id}`, { method: 'DELETE' })
    await loadProducts()
  } catch (e) { console.error(e) }
  finally { deleting.value = null }
}

onMounted(async () => {
  await loadCategories()
  await loadProducts()
})
</script>

<template>
  <div class="space-y-5 pb-6">

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Products</h1>
        <p class="text-gray-500 text-sm mt-1">{{ menuItems.length }} items in menu</p>
      </div>
      <button
        class="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-orange-200 transition active:scale-95"
        @click="openAdd"
      >
        <Plus class="w-4 h-4" /> Add Product
      </button>
    </div>

    <div class="flex gap-3 items-center flex-wrap">
      <div class="relative flex-1 min-w-48">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="search"
          placeholder="Search products..."
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 shadow-sm"
        />
      </div>
      <div class="flex gap-2 flex-wrap">
        <button
          class="px-3 py-2 rounded-xl text-xs font-semibold transition"
          :class="activeCategory === 'all'
            ? 'bg-orange-500 text-white'
            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
          @click="activeCategory = 'all'"
        >
          All
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="px-3 py-2 rounded-xl text-xs font-semibold transition capitalize"
          :class="activeCategory === cat.name.toLowerCase()
            ? 'bg-orange-500 text-white'
            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
          @click="activeCategory = cat.name.toLowerCase()"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">
      <Loader2 class="w-6 h-6 animate-spin mx-auto mb-2" />
      Loading products...
    </div>

    <div v-else-if="!filtered.length" class="text-center py-12 bg-white rounded-2xl border border-gray-100">
      <p class="text-4xl mb-3 flex items-center justify-center">
        <Utensils class="text-orange-500" />
      </p>
      <p class="text-gray-500 text-sm font-medium">No products found</p>
      <button class="mt-3 text-orange-500 text-sm font-semibold hover:underline" @click="openAdd">
        Add your first product
      </button>
    </div>

    <div v-else class="grid grid-cols-3 gap-3">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group"
      >
        <div
          class="h-20 flex items-center justify-center text-3xl font-bold text-gray-600 overflow-hidden"
          :class="!imageUrlFor(item) ? pastelBgFor(item.category) : ''"
        >
          <img
            v-if="imageUrlFor(item)"
            :src="imageUrlFor(item)!"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <span v-else>{{ item.name.charAt(0) }}</span>
        </div>

        <div class="p-3">
          <p class="text-sm font-bold text-gray-800 truncate">{{ item.name }}</p>
          <p class="text-xs text-gray-400 capitalize mt-0.5">{{ item.category }}</p>
          <p class="text-base font-bold mt-1" :class="priceColorFor(item.category)">
            ₱{{ Number(item.price).toFixed(2) }}
          </p>

          <div class="flex gap-2 mt-3">
            <button
              class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 text-xs font-semibold transition"
              @click="openEdit(item)"
            >
              <Pencil class="w-3 h-3" /> Edit
            </button>
            <button
              class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 text-xs font-semibold transition"
              :disabled="deleting === item.id"
              @click="deleteItem(item.id)"
            >
              <Loader2 v-if="deleting === item.id" class="w-3 h-3 animate-spin" />
              <Trash2 v-else class="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal remains the same -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-800">
            {{ isEditing ? 'Edit Product' : 'New Product' }}
          </h2>
          <button
            @click="showModal = false"
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="px-6 py-5 space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
            <div
              v-if="!imagePreview"
              class="relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden"
              :class="isDragging 
                ? 'border-orange-400 bg-orange-50' 
                : 'border-gray-300 hover:border-orange-300 hover:bg-gray-50'"
              @dragover="onDragOver"
              @dragleave="onDragLeave"
              @drop="onDrop"
            >
              <label class="flex flex-col items-center justify-center py-8 px-4 cursor-pointer">
                <div class="p-3 rounded-full bg-orange-50 mb-3">
                  <ImageIcon class="w-8 h-8 text-orange-400" />
                </div>
                <p class="text-sm font-semibold text-gray-700 mb-1">Drop your image here</p>
                <p class="text-xs text-gray-400 mb-4">PNG, JPG, or WEBP up to 5MB</p>
                <span class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm">
                  <Upload class="w-4 h-4" /> Browse Files
                </span>
                <input type="file" accept="image/*" class="hidden" @change="handleImageSelect" />
              </label>
            </div>
            <div v-else class="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <img :src="imagePreview" class="w-full h-48 object-cover" alt="Product preview" />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                <label class="p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-700 cursor-pointer transition shadow-lg">
                  <Pencil class="w-4 h-4" />
                  <input type="file" accept="image/*" class="hidden" @change="handleImageSelect" />
                </label>
                <button class="p-2.5 rounded-full bg-white/90 hover:bg-red-50 text-gray-700 hover:text-red-500 transition shadow-lg" @click="clearImage">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <div class="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 bg-gradient-to-t from-black/50 to-transparent">
                <span class="text-xs text-white font-medium">Image uploaded</span>
                <div class="flex gap-1">
                  <label class="px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs cursor-pointer transition backdrop-blur-sm">
                    Change
                    <input type="file" accept="image/*" class="hidden" @change="handleImageSelect" />
                  </label>
                  <button class="px-2.5 py-1 rounded-md bg-white/20 hover:bg-red-400/60 text-white text-xs transition backdrop-blur-sm" @click="clearImage">Remove</button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
            <input v-model="form.name" placeholder="e.g. Tapsilog" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <div v-if="!showNewCategoryInput" class="flex gap-2">
              <select v-model="form.category" class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white capitalize transition">
                <option v-for="cat in categories" :key="cat.id" :value="cat.name.toLowerCase()">{{ cat.name }}</option>
              </select>
              <button class="px-3 rounded-xl border border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition shrink-0" title="Add new category" @click="showNewCategoryInput = true">
                <Plus class="w-4 h-4" />
              </button>
            </div>
            <div v-else class="flex gap-2">
              <input v-model="newCategoryName" placeholder="Category name" class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition" @keyup.enter="addNewCategory" />
              <button class="px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition" :disabled="addingCategory || !newCategoryName.trim()" @click="addNewCategory">
                <Loader2 v-if="addingCategory" class="w-4 h-4 animate-spin" />
                <span v-else>Add</span>
              </button>
              <button class="px-3 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition" @click="showNewCategoryInput = false">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Price (₱)</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₱</span>
              <input v-model.number="form.price" type="number" step="0.01" min="0" placeholder="0.00" class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />
            </div>
          </div>
        </div>

        <div class="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button class="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-100 transition" @click="showModal = false">Cancel</button>
          <button class="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-orange-200" :disabled="saving" @click="saveItem">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            {{ saving ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>