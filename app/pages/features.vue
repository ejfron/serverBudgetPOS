<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Building2, Wifi, Printer, Users, BarChart3, Smartphone,
  ShoppingBag, ChefHat, Store, Clock, Check,
} from '@lucide/vue'

definePageMeta({ layout: false })

const features = [
  { icon: Wifi, title: 'Works Fully Offline', description: 'Local-first architecture means your store keeps running even without internet. Orders, sales, and printing all work on the local network.' },
  { icon: ChefHat, title: 'Front and Kitchen Sync', description: 'Orders placed at the cashier appear instantly on the kitchen display in real time, so nothing gets missed or delayed.' },
  { icon: Printer, title: 'Bluetooth Receipt Printing', description: 'Connect a thermal receipt printer over Bluetooth and print customer receipts directly from the cashier screen.' },
  { icon: Building2, title: 'Multi-Branch Management', description: 'Run more than one location under a single account. Each branch gets its own cashier and kitchen logins.' },
  { icon: BarChart3, title: 'Sales Dashboard and Reports', description: 'Track revenue, order counts, and completed versus pending orders across all your branches in one place.' },
  { icon: Users, title: 'Role-Based Accounts', description: 'Separate logins for Admin, Front (cashier), and Kitchen. Each sees only the screens relevant to their job.' },
  { icon: Smartphone, title: 'Android App Included', description: 'Install the system as a native Android app on tablets or phones at the counter. No browser required.' },
  { icon: ShoppingBag, title: 'Flexible Menu Management', description: 'Add, edit, and categorize your products and prices per business, with instant updates across all branches.' },
  
]

const storeTypes = [
  { icon: Store, label: 'Sari-Sari Store', hasKitchen: false },
  { icon: ShoppingBag, label: 'Karinderya', hasKitchen: false },
  { icon: ChefHat, label: 'Fastfood', hasKitchen: true },
  { icon: Clock, label: 'Tapsilogan', hasKitchen: true },
  { icon: ChefHat, label: 'Restaurant', hasKitchen: true },
]

const scrolled = ref(false)
function onScroll() {
  scrolled.value = window.scrollY > 20
}
onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const handleSignIn = async () => await navigateTo('/login')
const handleSignUp = async () => await navigateTo('/signup')
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
    <section class="max-w-3xl mx-auto text-center px-6 pt-40 sm:pt-44 pb-14">
      <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-800">
        Everything your store needs to run smoothly
      </h1>
      <p class="mt-4 text-gray-600 text-lg">
        Built specifically for Filipino small businesses, from sari-sari stores to full restaurants.
      </p>
    </section>

    <!-- Feature grid -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          v-for="f in features"
          :key="f.title"
          class="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 hover:border-orange-200 transition-all"
        >
          <div class="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
            <component :is="f.icon" :size="20" class="text-orange-500" />
          </div>
          <h3 class="font-bold text-gray-800 mb-1.5">{{ f.title }}</h3>
          <p class="text-sm text-gray-500 leading-relaxed">{{ f.description }}</p>
        </div>
      </div>
    </section>

    <!-- Store type comparison -->
    <section class="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
      <h2 class="text-2xl font-bold text-gray-800 text-center mb-2">Built for Every Store Type</h2>
      <p class="text-center text-gray-600 mb-8">Each business type gets the exact screens it needs, nothing extra to slow you down.</p>

      <div class="bg-white/90 rounded-2xl border border-white/60 overflow-hidden shadow-sm">
        <table class="w-full text-sm">
          <thead class="bg-orange-50">
            <tr>
              <th class="text-left px-5 py-3 font-semibold text-gray-600">Store Type</th>
              <th class="text-center px-5 py-3 font-semibold text-gray-600">Cashier (Front)</th>
              <th class="text-center px-5 py-3 font-semibold text-gray-600">Kitchen Display</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="t in storeTypes" :key="t.label">
              <td class="px-5 py-4 flex items-center gap-2 font-medium text-gray-800">
                <component :is="t.icon" :size="18" class="text-orange-500" />
                {{ t.label }}
              </td>
              <td class="text-center px-5 py-4">
                <Check :size="18" class="text-green-500 mx-auto" />
              </td>
              <td class="text-center px-5 py-4">
                <Check v-if="t.hasKitchen" :size="18" class="text-green-500 mx-auto" />
                <span v-else class="text-gray-300 text-xs">Not included</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="text-center mt-8">
        <NuxtLink
          to="/pricing"
          class="inline-block px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          See Pricing
        </NuxtLink>
      </div>
    </section>
  </div>
</template>