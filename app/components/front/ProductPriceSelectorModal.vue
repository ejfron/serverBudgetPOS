<script setup lang="ts">
import { Tag, Package, PenLine, Minus, Plus, X, Ruler, ChevronLeft } from '@lucide/vue'

const props = defineProps<{
  open: boolean
  product: any
}>()

const emit = defineEmits<{
  close: []
  confirm: [payload: any]
}>()

const quantity = ref(1)
const priceType = ref<'regular' | 'wholesale' | 'custom'>('regular')
const customPrice = ref<number | null>(null)
const selectedSize = ref<any>(null)

const hasSizes = computed(() => (props.product?.sizes?.length ?? 0) > 0)
// ✅ Two-step flow only when sizes exist: pick size first, then price type
const step = ref<'size' | 'price'>('size')

watch(
  () => props.open,
  (value) => {
    if (value) {
      quantity.value = 1
      priceType.value = 'regular'
      customPrice.value = null
      selectedSize.value = null
      step.value = hasSizes.value ? 'size' : 'price'
    }
  }
)

function chooseSize(size: any) {
  selectedSize.value = size
  step.value = 'price'
}

function backToSizes() {
  step.value = 'size'
  priceType.value = 'regular'
  customPrice.value = null
}

// ✅ Effective price source: the chosen size if sizes exist, else the product itself
const priceSource = computed(() => selectedSize.value ?? props.product)

const selectedPrice = computed(() => {
  if (!priceSource.value) return 0

  if (priceType.value === 'wholesale') {
    return Number(
      priceSource.value.wholesale_price ??
      priceSource.value.price
    )
  }

  if (priceType.value === 'custom') {
    return Number(customPrice.value || 0)
  }

  return Number(priceSource.value.price)
})

const subtotal = computed(() => {
  return selectedPrice.value * quantity.value
})

const isConfirmDisabled = computed(() => {
  return priceType.value === 'custom' && (!customPrice.value || customPrice.value <= 0)
})

function addToCart() {
  if (isConfirmDisabled.value) return

  emit('confirm', {
    ...props.product,
    price: priceSource.value.price, // base regular price for this size (or product)
    wholesale_price: priceSource.value.wholesale_price,
    quantity: quantity.value,
    selling_price: selectedPrice.value,
    price_type: priceType.value,
    size_name: selectedSize.value?.name ?? null,
  })

  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-9999 bg-black/50 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">

        <!-- Header -->
        <div class="flex items-start justify-between mb-5">
          <div class="flex items-center gap-2 pr-6">
            <button
              v-if="step === 'price' && hasSizes"
              class="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0"
              @click="backToSizes"
            >
              <ChevronLeft class="w-4 h-4 text-gray-500" />
            </button>
            <div>
              <h2 class="text-xl font-bold text-gray-800">
                {{ product?.name }}
              </h2>
              <p v-if="step === 'price' && selectedSize" class="text-xs text-gray-400 mt-0.5">
                {{ selectedSize.name }}
              </p>
            </div>
          </div>
          <button
            class="w-8 h-8 shrink-0 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
            @click="emit('close')"
          >
            <X class="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <!-- STEP 1: Choose size -->
        <div v-if="step === 'size'">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1.5">
            <Ruler class="w-3.5 h-3.5" />
            Choose size
          </p>
          <div class="space-y-2.5">
            <button
              v-for="size in product?.sizes"
              :key="size.id"
              class="w-full border-2 border-gray-200 hover:border-orange-300 rounded-xl p-3.5 text-left flex items-center justify-between transition-all"
              @click="chooseSize(size)"
            >
              <span class="font-semibold text-gray-800 text-sm">{{ size.name }}</span>
              <span class="text-orange-500 font-bold text-base">₱{{ Number(size.price).toFixed(2) }}</span>
            </button>
          </div>
        </div>

        <!-- STEP 2: Choose price type + quantity -->
        <div v-else>
          <p class="text-xs font-semibold text-gray-400 uppercase mb-2">Choose price</p>
          <div class="space-y-2.5">

            <!-- Regular -->
            <button
              class="w-full border-2 rounded-xl p-3.5 text-left flex items-center gap-3 transition-all"
              :class="priceType === 'regular'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'"
              @click="priceType = 'regular'"
            >
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                :class="priceType === 'regular' ? 'bg-orange-500' : 'bg-gray-100'"
              >
                <Tag class="w-4 h-4" :class="priceType === 'regular' ? 'text-white' : 'text-gray-400'" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 text-sm">Regular Price</p>
                <p class="text-orange-500 font-bold text-base">
                  ₱{{ Number(priceSource?.price || 0).toFixed(2) }}
                </p>
              </div>
              <div
                class="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
                :class="priceType === 'regular' ? 'border-orange-500' : 'border-gray-300'"
              >
                <div v-if="priceType === 'regular'" class="w-2.5 h-2.5 rounded-full bg-orange-500" />
              </div>
            </button>

            <!-- Wholesale -->
            <button
              class="w-full border-2 rounded-xl p-3.5 text-left flex items-center gap-3 transition-all"
              :class="priceType === 'wholesale'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'"
              @click="priceType = 'wholesale'"
            >
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                :class="priceType === 'wholesale' ? 'bg-blue-500' : 'bg-gray-100'"
              >
                <Package class="w-4 h-4" :class="priceType === 'wholesale' ? 'text-white' : 'text-gray-400'" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 text-sm">Wholesale Price</p>
                <p class="text-blue-500 font-bold text-base">
                  ₱{{
                    Number(
                      priceSource?.wholesale_price ??
                      priceSource?.price
                    ).toFixed(2)
                  }}
                </p>
                <p v-if="!priceSource?.wholesale_price" class="text-[11px] text-gray-400 mt-0.5">
                  No wholesale price set — using regular price
                </p>
              </div>
              <div
                class="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
                :class="priceType === 'wholesale' ? 'border-blue-500' : 'border-gray-300'"
              >
                <div v-if="priceType === 'wholesale'" class="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </div>
            </button>

            <!-- Custom -->
            <div
              class="border-2 rounded-xl p-3.5 transition-all"
              :class="priceType === 'custom'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <button
                class="w-full flex items-center gap-3"
                @click="priceType = 'custom'"
              >
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  :class="priceType === 'custom' ? 'bg-purple-500' : 'bg-gray-100'"
                >
                  <PenLine class="w-4 h-4" :class="priceType === 'custom' ? 'text-white' : 'text-gray-400'" />
                </div>
                <p class="font-semibold text-gray-800 text-sm flex-1 text-left">Custom Price</p>
                <div
                  class="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
                  :class="priceType === 'custom' ? 'border-purple-500' : 'border-gray-300'"
                >
                  <div v-if="priceType === 'custom'" class="w-2.5 h-2.5 rounded-full bg-purple-500" />
                </div>
              </button>

              <div class="relative mt-3">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₱</span>
                <input
                  v-model.number="customPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="w-full border text-gray-500 border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                  @click="priceType = 'custom'"
                />
              </div>
            </div>
          </div>

          <!-- QUANTITY -->
          <div class="mt-5 flex items-center justify-between">
            <p class="font-semibold text-gray-800 text-sm">Quantity</p>
            <div class="flex items-center gap-3">
              <button
                class="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-orange-300 hover:text-orange-500 transition"
                @click="quantity = Math.max(1, quantity - 1)"
              >
                <Minus class="w-4 h-4" />
              </button>
              <div class="text-lg text-gray-600 font-bold w-8 text-center">{{ quantity }}</div>
              <button
                class="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition"
                @click="quantity++"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- SUBTOTAL -->
          <div class="mt-5 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
            <span class="font-semibold text-gray-600 text-sm">Subtotal</span>
            <span class="text-orange-500 font-bold text-xl">₱{{ subtotal.toFixed(2) }}</span>
          </div>

          <!-- ACTIONS -->
          <div class="grid grid-cols-2 gap-3 mt-5">
            <button
              class="border border-gray-200 rounded-xl py-3 font-semibold text-gray-500 hover:bg-gray-50 transition"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              class="rounded-xl py-3 font-semibold transition"
              :class="isConfirmDisabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'"
              :disabled="isConfirmDisabled"
              @click="addToCart"
            >
              Add To Order
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>