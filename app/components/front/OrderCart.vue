<script setup lang="ts">
import { ShoppingCart, Minus, Plus, Trash2, Receipt, Banknote, CreditCard, Loader2, Printer, StickyNote, AlertTriangle, UtensilsCrossed, Package } from '@lucide/vue'
import { hasKitchen } from '@shared/types/business.types'
import { useServerConfig } from '~/composables/useServerConfig'

const props = defineProps<{
  cart?: any[]
  orderNumber?: number
  loading?: boolean
  printing?: boolean
}>()

const emit = defineEmits<{
  increment: [id: string]
  decrement: [id: string]
  clear: []
  submit: [paymentMethod: string, orderType: string, orderNote: string]
}>()

const { serverUrl } = useServerConfig()
const { cart: sharedCart, orderNumber: sharedOrderNumber, loading: sharedLoading, incrementCart, decrementCart, clearCart } = useFrontOrder()
const { connected: printerConnected, isNative } = usePrinter()
const { user } = useAuth()
const orderNote = ref('')

const cartItems = computed(() => props.cart ?? sharedCart.value)
const orderNumber = computed(() => props.orderNumber ?? sharedOrderNumber.value)
const loading = computed(() => props.loading ?? sharedLoading.value)
const total = computed(() => cartItems.value.reduce((sum: number, l: any) => sum + l.unit_price * l.quantity, 0))

const paymentMethod = ref<'cash' | 'gcash'>('cash')
const orderType = ref<'dine-in' | 'take-out'>('dine-in')

const showOrderType = computed(() => {
  const bt = user.value?.business_type
  return bt === 'tapsilogan' || bt === 'restaurant' || bt === 'fastfood' || bt === 'karinderya'
})

// ✅ Combines size + price tier, e.g. "Large · Wholesale Price" or just "Regular Price"
function priceTypeLabel(line: any): string {
  const tier = line.price_type === 'wholesale' ? 'Wholesale Price'
    : line.price_type === 'custom' ? 'Custom Price'
    : 'Regular Price'
  return line.size_name ? `${line.size_name} · ${tier}` : tier
}

function showOriginalPrice(line: any): boolean {
  return (
    (line.price_type === 'wholesale' || line.price_type === 'custom')
    && line.regular_price != null
    && Number(line.regular_price) !== Number(line.unit_price)
  )
}

function lineImageUrl(line: any): string | null {
  if (!line.image_url) return null
  if (line.image_url.startsWith('http') || line.image_url.startsWith('data:')) return line.image_url
  return `${serverUrl.value}${line.image_url}`
}

const showPrinterWarning = computed(() => isNative() && !printerConnected.value)

const buttonLabel = computed(() => {
  if (props.printing) return 'Printing receipt...'
  if (loading.value) return 'Placing order...'
  return 'Place Order'
})
const isBusy = computed(() => loading.value || props.printing)

function handleSubmit() {
  emit('submit', paymentMethod.value, orderType.value, orderNote.value)
  orderNote.value = ''
}
</script>

<template>
  <div class="bg-white border border-gray-100 rounded-2xl flex flex-col h-full max-h-full overflow-hidden shadow-sm">

    <!-- Header -->
    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
      <div>
        <p class="text-xs text-gray-400 font-medium">New Order Bill</p>
        <p class="text-base font-bold text-gray-800">Order #{{ String(orderNumber).padStart(3, '0') }}</p>
      </div>
      <button
        v-if="cartItems.length"
        class="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all font-medium border border-red-100"
        @click="emit('clear')"
      >
        <Trash2 class="w-3 h-3" />
        Clear
      </button>
    </div>

    <!-- Printer warning -->
    <div v-if="showPrinterWarning" class="mx-4 mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
      <AlertTriangle class="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <p class="text-xs text-amber-700 font-medium">No printer connected — tap "Connect printer" up top before checkout.</p>
    </div>

    <!-- Empty state -->
    <div v-if="!cartItems.length" class="flex-1 flex flex-col items-center justify-center gap-3 p-6">
      <div class="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
        <ShoppingCart class="w-8 h-8 text-orange-300" />
      </div>
      <div class="text-center">
        <p class="text-gray-600 text-sm font-semibold">Empty order</p>
        <p class="text-gray-400 text-xs mt-1">Select items from the menu</p>
      </div>
    </div>

    <!-- Cart items -->
    <div v-else class="flex-1 overflow-y-auto divide-y divide-gray-100">
      <div
        v-for="line in cartItems"
        :key="line.line_key"
        class="flex items-start gap-3 px-4 py-4"
      >
        <div class="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
          <img
            v-if="lineImageUrl(line)"
            :src="lineImageUrl(line)!"
            :alt="line.name"
            class="w-full h-full object-cover"
          />
          <ShoppingCart v-else class="w-5 h-5 text-gray-300" />
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-gray-800 truncate">{{ line.name }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ priceTypeLabel(line) }}</p>

          <div class="flex items-center gap-1.5 mt-2">
            <button
              class="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-all flex items-center justify-center shadow-sm"
              @click="emit('decrement', line.line_key)"
            >
              <Minus class="w-3 h-3" />
            </button>
            <span class="text-sm font-bold text-gray-800 w-6 text-center">{{ line.quantity }}</span>
            <button
              class="w-7 h-7 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all flex items-center justify-center shadow-sm"
              @click="emit('increment', line.line_key)"
            >
              <Plus class="w-3 h-3" />
            </button>
          </div>
        </div>

        <div class="text-right shrink-0">
          <p v-if="showOriginalPrice(line)" class="text-xs text-gray-400 line-through">
            ₱{{ Number(line.regular_price).toFixed(2) }}
          </p>
          <p class="text-sm font-bold text-gray-700">
            ₱{{ Number(line.unit_price).toFixed(2) }}
          </p>
          <p class="text-sm font-bold text-orange-500 mt-1">
            ₱{{ (line.unit_price * line.quantity).toFixed(2) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-5 pb-5 pt-4 shrink-0 border-t border-gray-100 bg-gray-50/50">
      <div class="space-y-1.5 mb-4">
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-400">Subtotal</p>
          <p class="text-xs text-gray-600 font-medium">₱{{ total.toFixed(2) }}</p>
        </div>
        <div class="border-t border-dashed border-gray-200 pt-1.5 flex items-center justify-between">
          <p class="text-sm font-bold text-gray-800">Total</p>
          <p class="text-xl font-bold text-orange-500">₱{{ total.toFixed(2) }}</p>
        </div>
      </div>

      <div v-if="showOrderType" class="flex gap-2 mb-3">
        <button
          class="flex-1 rounded-xl py-2.5 flex flex-col items-center gap-1 transition-all border-2"
          :class="orderType === 'dine-in' ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'"
          @click="orderType = 'dine-in'"
        >
          <UtensilsCrossed class="w-4 h-4" :class="orderType === 'dine-in' ? 'text-amber-600' : 'text-gray-400'" />
          <span class="text-xs font-semibold" :class="orderType === 'dine-in' ? 'text-amber-600' : 'text-gray-400'">Dine In</span>
        </button>
        <button
          class="flex-1 rounded-xl py-2.5 flex flex-col items-center gap-1 transition-all border-2"
          :class="orderType === 'take-out' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'"
          @click="orderType = 'take-out'"
        >
          <Package class="w-4 h-4" :class="orderType === 'take-out' ? 'text-blue-600' : 'text-gray-400'" />
          <span class="text-xs font-semibold" :class="orderType === 'take-out' ? 'text-blue-600' : 'text-gray-400'">Take Out</span>
        </button>
      </div>

      <div class="flex gap-2 mb-4">
        <button
          class="flex-1 rounded-xl py-2.5 flex flex-col items-center gap-1 transition-all border-2"
          :class="paymentMethod === 'cash' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white'"
          @click="paymentMethod = 'cash'"
        >
          <Banknote class="w-5 h-5" :class="paymentMethod === 'cash' ? 'text-orange-500' : 'text-gray-400'" />
          <span class="text-xs font-semibold" :class="paymentMethod === 'cash' ? 'text-orange-500' : 'text-gray-400'">Cash</span>
        </button>
        <button
          class="flex-1 rounded-xl py-2.5 flex flex-col items-center gap-1 transition-all border-2"
          :class="paymentMethod === 'gcash' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white'"
          @click="paymentMethod = 'gcash'"
        >
          <CreditCard class="w-5 h-5" :class="paymentMethod === 'gcash' ? 'text-orange-500' : 'text-gray-400'" />
          <span class="text-xs font-semibold" :class="paymentMethod === 'gcash' ? 'text-orange-500' : 'text-gray-400'">GCash</span>
        </button>
      </div>

      <div class="mb-4">
        <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase mb-1.5">
          <StickyNote class="w-3.5 h-3.5" />
          Customer Pinned
        </label>
        <input
          v-model="orderNote"
          placeholder="No ice, less salty..."
          class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
        />
      </div>

      <button
        :disabled="!cartItems.length || isBusy"
        class="w-full font-bold py-3.5 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
        :class="cartItems.length && !isBusy
          ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-200 active:scale-95'
          : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
        @click="handleSubmit"
      >
        <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
        <Printer v-else-if="printing" class="w-4 h-4 animate-pulse" />
        <Receipt v-else class="w-4 h-4" />
        {{ buttonLabel }}
      </button>
    </div>
  </div>
</template>