<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Check, Utensils, ChefHat, CookingPot, ShoppingBasket, X } from '@lucide/vue'

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

const tiers: PricingTier[] = [
  {
    type: 'sarisari',
    label: 'Sari-Sari Store',
    icon: ShoppingBasket,
    price: 4199,
    additionalBranch: 3999,
    hasKitchen: false,
    description: 'Perfect for retail counters and small stores.',
  },
  {
    type: 'karinderya',
    label: 'Karinderya',
    icon: CookingPot,
    price: 4199,
    additionalBranch: 3999,
    hasKitchen: false,
    description: 'Simple cashier flow for turo-turo style eateries.',
  },
  {
    type: 'fastfood',
    label: 'Fast Food',
    icon: ChefHat,
    price: 4199,
    additionalBranch: 3999,
    hasKitchen: true,
    description: 'Quick service with kitchen display for fast-food chains.',
  },
  {
    type: 'tapsilogan',
    label: 'Tapsilogan',
    icon: Utensils,
    price: 7999,
    additionalBranch: 4499,
    hasKitchen: true,
    description: 'Front counter and kitchen display, built for breakfast houses.',
    featured: true,
  },
  {
    type: 'restaurant',
    label: 'Restaurant',
    icon: ChefHat,
    price: 20000,
    additionalBranch: 12000,
    hasKitchen: true,
    description: 'Full front and kitchen system for full-service dining.',
  },
]

function formatPeso(n: number) {
  return `₱${n.toLocaleString('en-PH')}`
}

const handleSignIn = async () => await navigateTo('/login')
const handleSignUp = async () => await navigateTo('/signup')

const scrolled = ref(false)
function onScroll() {
  scrolled.value = window.scrollY > 20
}
onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-orange-50 via-yellow-50 to-amber-100">
    <!-- Nav -->
    <header class="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 pt-6 transition-all duration-300">
      <div
        class="max-w-6xl mx-auto flex items-center justify-between gap-4 rounded-full px-4 sm:px-6 py-2 transition-all duration-300"
        :class="scrolled
           ? 'bg-white/70 backdrop-blur-md shadow-lg shadow-orange-900/5'
          : 'bg-white/20 backdrop-blur-md shadow-lg shadow-orange-900/5'"
      >
        <NuxtLink to="/" class="flex items-center shrink-0">
          <img
            src="/uploads/ChatGPT Image Jul 18, 2026 at 10_13_50 AM.png"
            class="h-16 sm:h-20 w-auto object-contain"
            alt="BudgetPOS"
          />
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-8 text-base font-semibold text-gray-700">
          <NuxtLink to="/" class="hover:text-orange-500 transition">Home</NuxtLink>
          <NuxtLink to="/about" class="hover:text-orange-500 transition">About</NuxtLink>
          <NuxtLink to="/features" class="hover:text-orange-500 transition">Features</NuxtLink>
          <NuxtLink to="/pricing" class="hover:text-orange-500 transition">Pricing</NuxtLink>
        </nav>

        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            @click="handleSignIn"
            class="px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base font-semibold text-gray-700 hover:text-orange-600 transition"
          >
            Sign In
          </button>
          <button
            @click="handleSignUp"
            class="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white text-sm sm:text-base font-bold rounded-full shadow-md hover:shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            Get Started
          </button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="max-w-3xl mx-auto text-center px-6 pt-40 sm:pt-44 pb-10">
      <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-800">
        Simple, one-time pricing per branch
      </h1>
      <p class="mt-4 text-gray-600 text-lg">
        No subscriptions, no surprise fees. Pick the plan that matches your store type.
      </p>
    </section>

<!-- Scrollable Pricing Cards -->
<section class="pb-20">
  <div class="max-w-7xl mx-auto px-4">
    <div class="flex gap-5 overflow-x-auto pt-5 pb-4 snap-x snap-mandatory scroll-smooth">
      <div
        v-for="tier in tiers"
        :key="tier.type"
        class="relative bg-white/90 backdrop-blur-md rounded-2xl border-2 p-6 flex flex-col shadow-sm transition-all shrink-0 w-[280px] sm:w-[300px] snap-center mt-3 overflow-visible"
        :class="tier.featured ? 'border-orange-400 shadow-lg' : 'border-white/60 hover:border-orange-200'"
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
          <li class="flex items-start gap-2">
            <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
            <span>Sales dashboard & reports</span>
          </li>
          <li class="flex items-start gap-2">
            <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
            <span>Bluetooth thermal printer</span>
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