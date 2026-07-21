<script setup lang="ts">
definePageMeta({ layout: 'front' })

import { 
  Search, Filter, Trash2, XCircle, Edit3, Eye, 
  Loader2, AlertTriangle, CheckCircle, Clock, ChefHat, 
  X, RefreshCw, ChevronDown, ChevronUp, ShoppingBag, 
  Plus, Minus, Banknote, CreditCard, ShieldAlert, Lock
} from '@lucide/vue'
import { useServerConfig } from '~/composables/useServerConfig'

const { serverUrl } = useServerConfig()
const { user, login } = useAuth()

const orders = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref<'all' | 'pending' | 'ongoing' | 'ready' | 'completed' | 'voided'>('all')
const paymentFilter = ref<'all' | 'cash' | 'gcash'>('all')
const expandedOrder = ref<string | null>(null)
const showDeleteModal = ref(false)
const showVoidModal = ref(false)
const showEditModal = ref(false)
const showAuthModal = ref(false)
const selectedOrder = ref<any>(null)
const processing = ref(false)

const adminPassword = ref('')
const adminError = ref('')
const adminAuthenticated = ref(false)
const pendingAction = ref<'edit' | 'void' | 'delete' | null>(null)

const isAdmin = computed(() => user.value?.role === 'admin')

const editForm = ref({
  items: [] as any[],
  payment_method: 'cash'
})

const editTotal = computed(() => 
  editForm.value.items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0)
)

async function loadOrders() {
  loading.value = true
  try {
    const res = await $fetch<any>(`${serverUrl.value}/api/orders?branch_id=${user.value?.branch_id}`)
    orders.value = res.data ?? []
  } catch (e) {
    console.error('loadOrders error:', e)
  } finally {
    loading.value = false
  }
}

const filteredOrders = computed(() => {
  return orders.value.filter((o) => {
    if (statusFilter.value !== 'all' && o.status !== statusFilter.value) return false
    if (paymentFilter.value !== 'all') {
      const payment = (o.payment_method || 'cash').toLowerCase()
      if (payment !== paymentFilter.value) return false
    }
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      const orderNum = String(o.order_number).padStart(3, '0')
      const items = (o.order_items || []).map((i: any) => i.item_name).join(' ')
      if (!orderNum.includes(query) && !items.toLowerCase().includes(query)) return false
    }
    return true
  })
})

const pendingCount = computed(() => orders.value.filter(o => o.status === 'pending').length)
const ongoingCount = computed(() => orders.value.filter(o => o.status === 'ongoing').length)
const readyCount = computed(() => orders.value.filter(o => o.status === 'ready').length)
const completedCount = computed(() => orders.value.filter(o => o.status === 'completed').length)
const voidedCount = computed(() => orders.value.filter(o => o.status === 'voided').length)
const totalCount = computed(() => filteredOrders.value.length)

function getStatusBadge(status: string) {
  const map: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
    pending: { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Clock, label: 'Pending' },
    ongoing: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: ChefHat, label: 'Ongoing' },
    ready: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, label: 'Ready' },
    completed: { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', icon: CheckCircle, label: 'Completed' },
    voided: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'Voided' },
  }
  return map[status] || map.pending
}

function toggleExpand(orderId: string) {
  expandedOrder.value = expandedOrder.value === orderId ? null : orderId
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function requireAuth(action: 'edit' | 'void' | 'delete', order: any) {
  if (isAdmin.value) {
    executeAction(action, order)
    return
  }
  
  selectedOrder.value = order
  pendingAction.value = action
  adminPassword.value = ''
  adminError.value = ''
  adminAuthenticated.value = false
  showAuthModal.value = true
}

async function verifyAdmin() {
  adminError.value = ''
  processing.value = true
  
  try {
    const result = await $fetch(`${serverUrl.value}/api/auth/verify-admin`, {
      method: 'POST',
      body: { 
        branch_id: user.value?.branch_id,
        password: adminPassword.value 
      }
    })
    
    if (result.verified) {
      adminAuthenticated.value = true
      showAuthModal.value = false
      if (pendingAction.value && selectedOrder.value) {
        executeAction(pendingAction.value, selectedOrder.value)
      }
    } else {
      adminError.value = 'Invalid admin password'
    }
  } catch (e: any) {
    adminError.value = e.data?.message || 'Verification failed'
  } finally {
    processing.value = false
  }
}

function executeAction(action: 'edit' | 'void' | 'delete', order: any) {
  switch (action) {
    case 'edit': openEditModal(order); break
    case 'void': openVoidModal(order); break
    case 'delete': openDeleteModal(order); break
  }
}

function openVoidModal(order: any) {
  selectedOrder.value = order
  showVoidModal.value = true
}

async function confirmVoid() {
  if (!selectedOrder.value) return
  processing.value = true
  try {
    await $fetch(`${serverUrl.value}/api/orders/${selectedOrder.value.id}`, {
      method: 'PATCH',
      body: { status: 'voided' }
    })
    showVoidModal.value = false
    await loadOrders()
  } catch (e) {
    console.error('Void error:', e)
    alert('Failed to void order')
  } finally {
    processing.value = false
  }
}

function openDeleteModal(order: any) {
  selectedOrder.value = order
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!selectedOrder.value) return
  processing.value = true
  try {
    await $fetch(`${serverUrl.value}/api/orders/${selectedOrder.value.id}`, {
      method: 'DELETE'
    })
    showDeleteModal.value = false
    await loadOrders()
  } catch (e) {
    console.error('Delete error:', e)
    alert('Failed to delete order')
  } finally {
    processing.value = false
  }
}

function openEditModal(order: any) {
  selectedOrder.value = order
  editForm.value = {
    items: (order.order_items || []).map((i: any) => ({
      item_name: i.item_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
    payment_method: order.payment_method || 'cash'
  }
  showEditModal.value = true
}

function addEditItem() {
  editForm.value.items.push({ item_name: '', quantity: 1, unit_price: 0 })
}

function removeEditItem(index: number) {
  editForm.value.items.splice(index, 1)
}

async function confirmEdit() {
  if (!selectedOrder.value) return
  processing.value = true
  try {
    const totalAmount = editForm.value.items.reduce(
      (sum: number, i: any) => sum + (i.quantity * i.unit_price), 0
    )
    await $fetch(`${serverUrl.value}/api/orders/${selectedOrder.value.id}`, {
      method: 'PATCH',
      body: {
        order_items: editForm.value.items.map((i: any) => ({
          item_name: i.item_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.quantity * i.unit_price
        })),
        total_amount: totalAmount,
        payment_method: editForm.value.payment_method
      }
    })
    showEditModal.value = false
    await loadOrders()
  } catch (e) {
    console.error('Edit error:', e)
    alert('Failed to update order')
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="space-y-4 sm:space-y-6 pb-6">

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Transactions</h1>
        <p class="text-gray-500 text-xs sm:text-sm mt-0.5">View & manage all orders</p>
      </div>
      <button
        class="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-2.5 sm:px-3 py-2 rounded-xl shadow-sm transition"
        @click="loadOrders"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Refresh</span>
      </button>
    </div>

    <div class="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 flex-nowrap">
      <button
        v-for="s in [
          { key: 'all', label: 'All', count: totalCount, color: 'bg-orange-500' },
          { key: 'pending', label: 'Pending', count: pendingCount, color: 'bg-yellow-500' },
          { key: 'ongoing', label: 'Cooking', count: ongoingCount, color: 'bg-blue-500' },
          { key: 'ready', label: 'Ready', count: readyCount, color: 'bg-green-500' },
          { key: 'completed', label: 'Done', count: completedCount, color: 'bg-gray-500' },
          { key: 'voided', label: 'Voided', count: voidedCount, color: 'bg-red-500' },
        ]"
        :key="s.key"
        class="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap shrink-0"
        :class="statusFilter === s.key
          ? 'text-white shadow-sm ' + s.color
          : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'"
        @click="statusFilter = s.key as any"
      >
        {{ s.label }}
        <span class="text-[10px] opacity-80">({{ s.count }})</span>
      </button>
    </div>

    <div class="flex flex-wrap gap-2 sm:gap-3">
      <div class="relative flex-1 min-w-[150px] sm:min-w-[200px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input v-model="searchQuery" placeholder="Search order # or item..." class="w-full pl-8 sm:pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-400 shadow-sm" />
      </div>
      <div class="flex gap-1 sm:gap-1.5">
        <button class="px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition flex items-center gap-1" :class="paymentFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'" @click="paymentFilter = 'all'"><Filter class="w-3 h-3" /> All</button>
        <button class="px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition flex items-center gap-1" :class="paymentFilter === 'cash' ? 'bg-green-500 text-white' : 'bg-white text-gray-500 border border-gray-200'" @click="paymentFilter = 'cash'"><Banknote class="w-3 h-3" /> Cash</button>
        <button class="px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition flex items-center gap-1" :class="paymentFilter === 'gcash' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 border border-gray-200'" @click="paymentFilter = 'gcash'"><CreditCard class="w-3 h-3" /> GCash</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-16">
      <Loader2 class="w-8 h-8 animate-spin mx-auto text-orange-400 mb-3" />
      <p class="text-gray-400 text-sm">Loading orders...</p>
    </div>

    <div v-else-if="!filteredOrders.length" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <ShoppingBag class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500 font-medium">No orders found</p>
    </div>

    <div v-else class="space-y-2 sm:space-y-3">
      <div v-for="order in filteredOrders" :key="order.id" class="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all" :class="order.status === 'voided' ? 'border-red-200 opacity-75' : 'border-gray-100'">
        <div class="flex items-center justify-between px-3.5 sm:px-5 py-3 cursor-pointer hover:bg-gray-50 transition" @click="toggleExpand(order.id)">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0" :class="(order.payment_method || 'cash') === 'gcash' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'">#{{ String(order.order_number).padStart(3, '0') }}</div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-[250px]">{{ order.order_items?.map((i: any) => i.item_name).join(', ') || '—' }}</p>
                <span class="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0" :class="[getStatusBadge(order.status).bg, getStatusBadge(order.status).color, getStatusBadge(order.status).border]">{{ getStatusBadge(order.status).label }}</span>
                <span class="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200 shrink-0">{{ (order.payment_method || 'cash') === 'gcash' ? 'GCash' : 'Cash' }}</span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-400 mt-0.5">{{ formatDate(order.created_at) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
            <p class="text-xs sm:text-sm font-bold text-orange-500">₱{{ Number(order.total_amount).toFixed(2) }}</p>
            <ChevronDown class="w-4 h-4 text-gray-400 transition-transform" :class="expandedOrder === order.id ? 'rotate-180' : ''" />
          </div>
        </div>

        <div v-if="expandedOrder === order.id" class="px-3.5 sm:px-5 pb-4 border-t border-gray-100 pt-3">
          <div class="mb-3">
            <p class="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase mb-2">Order Items</p>
            <div class="space-y-1.5">
              <div v-for="(item, i) in order.order_items" :key="i" class="flex items-center justify-between text-xs sm:text-sm py-1">
                <div class="flex items-center gap-2"><span class="font-medium text-gray-700">{{ item.quantity }}x</span><span class="text-gray-600">{{ item.item_name }}</span></div>
                <span class="text-gray-500">₱{{ Number(item.subtotal || item.quantity * item.unit_price).toFixed(2) }}</span>
              </div>
            </div>
            <div class="border-t border-gray-100 mt-2 pt-2 flex justify-between text-xs sm:text-sm font-bold"><span class="text-gray-700">Total</span><span class="text-orange-500">₱{{ Number(order.total_amount).toFixed(2) }}</span></div>
          </div>
          <p class="text-[10px] sm:text-xs text-gray-400 mb-3">Cashier: {{ order.cashier || 'Unknown' }}</p>

          <!-- ✅ Actions available for ALL statuses except voided -->
          <div v-if="order.status !== 'voided'" class="flex gap-2 flex-wrap">
            <button class="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition" @click="requireAuth('edit', order)"><Edit3 class="w-3 h-3" /> Edit</button>
            <button v-if="order.status !== 'voided'" class="flex items-center gap-1 px-3 py-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 text-xs font-semibold transition" @click="requireAuth('void', order)"><XCircle class="w-3 h-3" /> Void</button>
            <button class="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-semibold transition" @click="requireAuth('delete', order)"><Trash2 class="w-3 h-3" /> Delete</button>
          </div>
          <div v-else class="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400"><XCircle class="w-3 h-3 text-red-400" /> This order has been voided</div>
        </div>
      </div>
    </div>

    <!-- Admin Auth Modal -->
    <div v-if="showAuthModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div class="text-center mb-4">
          <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3"><Lock class="w-6 h-6 text-orange-500" /></div>
          <h3 class="text-lg font-bold text-gray-800">Admin Authorization Required</h3>
          <p class="text-sm text-gray-500 mt-1">Enter admin password to {{ pendingAction }} this order</p>
        </div>
        <div class="space-y-3">
          <input v-model="adminPassword" type="password" placeholder="Admin password" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" @keyup.enter="verifyAdmin" />
          <p v-if="adminError" class="text-red-500 text-xs">{{ adminError }}</p>
        </div>
        <div class="flex gap-2 mt-4">
          <button class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm" @click="showAuthModal = false">Cancel</button>
          <button class="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm flex items-center justify-center gap-2" :disabled="processing" @click="verifyAdmin"><Loader2 v-if="processing" class="w-4 h-4 animate-spin" /> Verify</button>
        </div>
      </div>
    </div>

    <!-- Void Modal -->
    <div v-if="showVoidModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div class="text-center mb-4"><div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3"><AlertTriangle class="w-6 h-6 text-yellow-600" /></div><h3 class="text-lg font-bold text-gray-800">Void Order?</h3><p class="text-sm text-gray-500 mt-1">Void order #{{ String(selectedOrder?.order_number).padStart(3, '0') }}?</p></div>
        <div class="flex gap-2"><button class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm" @click="showVoidModal = false">Cancel</button><button class="flex-1 py-2.5 rounded-xl bg-yellow-500 text-white font-semibold text-sm flex items-center justify-center gap-2" :disabled="processing" @click="confirmVoid"><Loader2 v-if="processing" class="w-4 h-4 animate-spin" /> Void Order</button></div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div class="text-center mb-4"><div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3"><Trash2 class="w-6 h-6 text-red-500" /></div><h3 class="text-lg font-bold text-gray-800">Delete Order?</h3><p class="text-sm text-gray-500 mt-1">Delete order #{{ String(selectedOrder?.order_number).padStart(3, '0') }}?</p></div>
        <div class="flex gap-2"><button class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm" @click="showDeleteModal = false">Cancel</button><button class="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2" :disabled="processing" @click="confirmDelete"><Loader2 v-if="processing" class="w-4 h-4 animate-spin" /> Delete</button></div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100"><h3 class="text-lg font-bold text-gray-800">Edit Order #{{ String(selectedOrder?.order_number).padStart(3, '0') }}</h3><button class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" @click="showEditModal = false"><X class="w-5 h-5" /></button></div>
        <div class="px-5 py-4 space-y-4">
          <div><label class="text-xs font-semibold text-gray-500 uppercase mb-2 block">Items</label>
            <div class="space-y-2">
              <div v-for="(item, i) in editForm.items" :key="i" class="flex items-center gap-2">
                <input v-model="item.item_name" placeholder="Item name" class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-400" />
                <input v-model.number="item.quantity" type="number" min="1" placeholder="Qty" class="w-14 px-2 py-2 border border-gray-200 rounded-lg text-xs text-center" />
                <input v-model.number="item.unit_price" type="number" step="0.01" min="0" placeholder="Price" class="w-20 px-2 py-2 border border-gray-200 rounded-lg text-xs" />
                <button class="p-1.5 rounded-lg text-red-400 hover:bg-red-50 shrink-0" @click="removeEditItem(i)"><X class="w-4 h-4" /></button>
              </div>
            </div>
            <button class="mt-2 flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-semibold" @click="addEditItem"><Plus class="w-3 h-3" /> Add item</button>
          </div>
          <div><label class="text-xs font-semibold text-gray-500 uppercase mb-2 block">Payment</label>
            <div class="flex gap-2">
              <button class="flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition" :class="editForm.payment_method === 'cash' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 text-gray-400'" @click="editForm.payment_method = 'cash'">Cash</button>
              <button class="flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition" :class="editForm.payment_method === 'gcash' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400'" @click="editForm.payment_method = 'gcash'">GCash</button>
            </div>
          </div>
          <div class="flex justify-between items-center py-2 border-t border-gray-100"><span class="text-sm font-bold text-gray-700">New Total</span><span class="text-lg font-bold text-orange-500">₱{{ editTotal.toFixed(2) }}</span></div>
        </div>
        <div class="flex gap-3 px-5 py-4 bg-gray-50 border-t border-gray-100"><button class="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm" @click="showEditModal = false">Cancel</button><button class="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm flex items-center justify-center gap-2" :disabled="processing" @click="confirmEdit"><Loader2 v-if="processing" class="w-4 h-4 animate-spin" /> Save Changes</button></div>
      </div>
    </div>

  </div>
</template>