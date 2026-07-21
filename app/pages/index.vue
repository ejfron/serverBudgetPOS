<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowRight } from '@lucide/vue'

definePageMeta({ layout: false })

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
    <main class="px-4 py-16 sm:py-20 pt-40 sm:pt-44">
      <div class="max-w-5xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-5 py-2 text-sm text-orange-700 mb-8">
          <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          Built for Filipino Food and Retail Businesses
        </div>

        <h1 class="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight text-gray-800">
          Complete
          <span class="text-orange-500">Point of Sale</span>
          Solution
          <br />
          for Food and Retail Businesses
        </h1>

        <p class="mt-8 text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Budget POS helps restaurants, karinderyas, tapsilog stores, and sari-sari stores
          manage sales, orders, and daily reports from one simple dashboard, even without internet.
        </p>

        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            @click="handleSignUp"
            class="w-full sm:w-auto px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Get Started Free
            <ArrowRight :size="18" />
          </button>
          <NuxtLink
            to="/pricing"
            class="w-full sm:w-auto px-6 py-3 bg-white/80 border border-white/60 text-gray-700 font-semibold rounded-xl hover:border-orange-200 transition-all text-center"
          >
            See Pricing
          </NuxtLink>
        </div>

        <!-- Feature Cards -->
        <div class="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 p-6 hover:border-orange-200 transition-all">
            <h3 class="font-bold text-gray-800">Real-Time Sales</h3>
            <p class="text-sm text-gray-500 mt-2">
              Monitor every transaction instantly with automatic sales tracking.
            </p>
          </div>

          <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 p-6 hover:border-orange-200 transition-all">
            <h3 class="font-bold text-gray-800">Front and Kitchen Sync</h3>
            <p class="text-sm text-gray-500 mt-2">
              Orders placed at the counter appear instantly on the kitchen display.
            </p>
          </div>

          <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 p-6 hover:border-orange-200 transition-all">
            <h3 class="font-bold text-gray-800">Business Reports</h3>
            <p class="text-sm text-gray-500 mt-2">
              Generate daily, weekly, and monthly sales reports with ease.
            </p>
          </div>

          <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 p-6 hover:border-orange-200 transition-all">
            <h3 class="font-bold text-gray-800">Works Offline</h3>
            <p class="text-sm text-gray-500 mt-2">
              Local-first system. Your store keeps running even without internet.
            </p>
          </div>
        </div>

        <!-- Bottom Information -->
        <div class="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
          <div>✓ Secure Authentication</div>
          <div>✓ Sales Analytics</div>
          <div>✓ Bluetooth Receipt Printing</div>
          <div>✓ Multi-Branch Support</div>
          <div>✓ Android App Included</div>
        </div>
      </div>
    </main>
  </div>
</template>