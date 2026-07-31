<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Check, Utensils, ChefHat, CookingPot, ShoppingBasket, X } from '@lucide/vue'
import HomeHeader from '~/components/shared/HomeHeader.vue'

definePageMeta({ layout: false })

interface PricingTier {
  type: string
  label: string
  icon: any
  price: number
  additionalBranch: number
  hasKitchen: boolean
  description: string
  featured?: boolean
}

const thermalPrinterTiers: PricingTier[] = [
  {
    type: 'sarisari',
    label: 'Sari-Sari Store',
    icon: ShoppingBasket,
    price: 6499,
    additionalBranch: 3699,
    hasKitchen: false,
    description: 'Perfect for retail counters and small stores.',
  },
  {
    type: 'karinderya',
    label: 'Karinderya',
    icon: CookingPot,
    price: 6499,
    additionalBranch: 3699,
    hasKitchen: false,
    description: 'Simple cashier flow for turo-turo style eateries.',
  },
  {
    type: 'fastfood',
    label: 'Fast Food',
    icon: ChefHat,
    price: 7499,
    additionalBranch: 4299,
    hasKitchen: false,
    description: 'Quick service with kitchen display for fast-food chains.',
  },
  {
    type: 'tapsilogan',
    label: 'Tapsilogan',
    icon: Utensils,
    price: 8999,
    additionalBranch: 5499,
    hasKitchen: true,
    description: 'Front counter and kitchen display, built for breakfast houses.',
    featured: true,
  },
  {
    type: 'restaurant',
    label: 'Restaurant',
    icon: ChefHat,
    price: 8999,
    additionalBranch: 5499,
    hasKitchen: true,
    description: 'Full front and kitchen system for full-service dining.',
  },
]

const tabletTiers: PricingTier[] = [
  {
    type: 'sarisari',
    label: 'Sari-Sari Store',
    icon: ShoppingBasket,
    price: 12499,
    additionalBranch: 9999,
    hasKitchen: false,
    description: 'Perfect for retail counters and small stores. + Tablet included.',
  },
  {
    type: 'karinderya',
    label: 'Karinderya',
    icon: CookingPot,
    price: 12499,
    additionalBranch: 9999,
    hasKitchen: false,
    description: 'Simple cashier flow for turo-turo style eateries. + Tablet included.',
  },
  {
    type: 'fastfood',
    label: 'Fast Food',
    icon: ChefHat,
    price: 13499,
    additionalBranch: 9999,
    hasKitchen: false,
    description: 'Quick service with kitchen display for fast-food chains. + Tablet included.',
  },
  {
    type: 'tapsilogan',
    label: 'Tapsilogan',
    icon: Utensils,
    price: 19999,
    additionalBranch: 18299,
    hasKitchen: true,
    description: 'Front counter and kitchen display, built for breakfast houses. + Tablet included.',
    featured: true,
  },
  {
    type: 'restaurant',
    label: 'Restaurant',
    icon: ChefHat,
    price: 19999,
    additionalBranch: 18299,
    hasKitchen: true,
    description: 'Full front and kitchen system for full-service dining. + Tablet included.',
  },
]

const withTablet = ref(false)
const tiers = ref(thermalPrinterTiers)

watch(withTablet, (newValue) => {
  tiers.value = newValue ? tabletTiers : thermalPrinterTiers
})

function formatPeso(n: number) {
  return `₱${n.toLocaleString('en-PH')}`
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-orange-50 via-yellow-50 to-amber-100">
      
    <HomeHeader />

    <!-- Hero -->
    <section class="max-w-3xl mx-auto text-center px-6 pt-40 sm:pt-44 pb-10">
      <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-800">
        Simple, one-time pricing per branch
      </h1>
      <p class="mt-4 text-gray-600 text-lg">
        One time payment, No subscriptions, no surprise fees. Pick the plan that matches your store type, You have 5-day free trial
      </p>
    </section>

    <section class="pb-20">
    <div class="flex items-center justify-center w-full">
  <div class="flex items-center justify-center gap-1.5 w-md bg-white-9/10 rounded-full p-1 shadow-md">
    <!-- Option 1: Keep all in a row (recommended) -->
    <div class="text-sm font-medium text-slate-700 whitespace-nowrap">
      Printer
    </div>

    <div class="relative flex items-center">
      <input type="checkbox" id="toggle" class="sr-only" v-model="withTablet">
      <label for="toggle" class="relative flex h-8 w-16 cursor-pointer items-center rounded-full px-1 transition-colors duration-300" :class="withTablet ? 'bg-orange-400' : 'bg-emerald-100'">
        <span class="h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out" :class="withTablet ? 'translate-x-8' : 'translate-x-0'"></span>
      </label>
    </div>

    <div class="flex items-center gap-1.5 whitespace-nowrap">
      <span class="text-sm font-medium text-slate-700">Printer + Tablet</span>
      <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">-20%</span>
    </div>
  </div>
</div>

      <!-- Scroll Cards with Subtle Blurred Surrounding -->
      <div class="max-w-7xl mx-auto px-4 relative">
        <!-- Left subtle blur overlay -->
        <div class="absolute left-0 top-0 h-full w-12 md:w-16 lg:w-20 pointer-events-none z-10 bg-gradient-to-r from-orange-50/70 via-orange-50/30 to-transparent"></div>
        
        <!-- Right subtle blur overlay -->
        <div class="absolute right-0 top-0 h-full w-12 md:w-16 lg:w-20 pointer-events-none z-10 bg-gradient-to-l from-orange-50/70 via-orange-50/30 to-transparent"></div>

        <div class="flex gap-5 overflow-x-auto pt-5 pb-4 snap-x snap-mandatory scroll-smooth px-4 md:px-8">
          <div
            v-for="(tier, index) in tiers"
            :key="tier.type"
            class="relative bg-white/90 backdrop-blur-md rounded-2xl border-2 p-6 flex flex-col shadow-sm transition-all shrink-0 w-[280px] sm:w-[300px] snap-center mt-3 overflow-visible"
            :class="[
              tier.featured ? 'border-orange-400 shadow-lg' : 'border-white/60 hover:border-orange-200',
              // Subtle blur effect on surrounding cards
              (index === 0 || index === tiers.length - 1) ? 'opacity-90 blur-[0.3px]' : '',
              (index === 1 || index === tiers.length - 2) ? 'opacity-95 blur-[0.1px]' : ''
            ]"
          >
            <span
              v-if="tier.featured"
              class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap z-10 shadow-md"
            >
              Most Popular
            </span>

            <div class="flex items-center gap-2 mb-3">
              <component :is="tier.icon" :size="22" class="text-orange-500" />
              <h3 class="font-bold text-gray-800">{{ tier.label }}</h3>
            </div>

            <p class="text-sm text-gray-500 mb-5 min-h-10">{{ tier.description }}</p>

            <div class="mb-1">
              <span class="text-3xl font-extrabold text-gray-800">{{ formatPeso(tier.price) }}</span>
            </div>
            <p class="text-xs text-gray-400 mb-4">One-time payment</p>

            <div class="bg-gray-50 rounded-xl p-3 mb-4">
              <p class="text-xs text-gray-500">
                Additional branches:
                <span class="font-semibold text-gray-700">{{ formatPeso(tier.additionalBranch) }}</span> each
              </p>
            </div>

            <ul class="space-y-2.5 text-sm text-gray-600 mb-6 flex-1">
              <li class="flex items-start gap-2">
                <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
                <span>Cashier (Front) account</span>
              </li>
              <li v-if="tier.hasKitchen" class="flex items-start gap-2">
                <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
                <span>Kitchen display account</span>
              </li>
              <li v-else class="flex items-start gap-2 text-gray-400">
                <X :size="16" class="text-gray-300 mt-0.5 shrink-0" />
                <span>No kitchen side</span>
              </li>

              <li v-if="tier.type === 'fastfood'" class="flex items-start gap-2">
                <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
                <span>Optional kitchen side</span>
              </li>
              <li class="flex items-start gap-2">
                <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
                <span>Sales dashboard & reports</span>
              </li>
              <li class="flex items-start gap-2">
                <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
                <span>Bluetooth thermal printer</span>
              </li>

              <li v-if="!tier.hasKitchen && withTablet" class="flex items-start gap-2">
                <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
                <span>1pcs 12-inch tablet included</span>
              </li>

              <li v-if="tier.hasKitchen && withTablet" class="flex items-start gap-2">
                <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
                <span>2pcs 12-inch tablet included</span>
              </li>
              <li class="flex items-start gap-2">
                <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
                <span>IOS Version and Android Version</span>
              </li>

              <li class="flex items-start gap-2">
                <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
                <span>Works offline, local-first</span>
              </li>
            </ul>

            <NuxtLink
              to="/signup"
              class="w-full py-2.5 text-center rounded-xl font-semibold text-sm transition-all"
              :class="tier.featured
                ? 'bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'"
            >
              Choose {{ tier.label }}
            </NuxtLink>
          </div>
        </div>

        <!-- Scroll indicator -->
        <div class="flex justify-center gap-1.5 mt-6 lg:hidden">
          <div class="w-2 h-2 rounded-full bg-orange-400"></div>
          <div class="w-2 h-2 rounded-full bg-gray-300"></div>
          <div class="w-2 h-2 rounded-full bg-gray-300"></div>
          <div class="w-2 h-2 rounded-full bg-gray-300"></div>
          <div class="w-2 h-2 rounded-full bg-gray-300"></div>
        </div>

        <p class="text-center text-sm text-gray-500 mt-8">
          Not sure which type fits your business?
          <NuxtLink to="/features" class="text-orange-600 font-medium hover:underline">Compare features</NuxtLink>
        </p>
      </div>
    </section>

    <!-- FAQ -->
    <section class="max-w-3xl mx-auto px-6 pb-24">
      <h2 class="text-xl font-bold text-gray-800 mb-6 text-center">Common Questions</h2>
      <div class="space-y-4">
        <div class="bg-white/80 rounded-xl p-5 border border-white/60">
          <p class="font-semibold text-gray-800 text-sm">Is this a one-time payment or a subscription?</p>
          <p class="text-sm text-gray-600 mt-1">One-time, per branch. No monthly fees for using the core system.</p>
        </div>
        <div class="bg-white/80 rounded-xl p-5 border border-white/60">
          <p class="font-semibold text-gray-800 text-sm">Can I switch my store type later?</p>
          <p class="text-sm text-gray-600 mt-1">Your store type is set once during setup. Contact support if you need to change it.</p>
        </div>
        <div class="bg-white/80 rounded-xl p-5 border border-white/60">
          <p class="font-semibold text-gray-800 text-sm">Does the price include a printer?</p>
          <p class="text-sm text-gray-600 mt-1">Yes. A Bluetooth thermal receipt printer is included with your purchase.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hide scrollbar for cleaner look */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #fb923c;
  border-radius: 9999px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #f97316;
}

/* Smooth scroll behavior */
.overflow-x-auto {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
</style>