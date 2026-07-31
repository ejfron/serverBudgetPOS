<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowRight, TrendingUp, GitBranch, BarChart3, WifiOff } from '@lucide/vue'
import HomeHeader from '~/components/shared/HomeHeader.vue';

definePageMeta({ layout: false })

const handleSignUp = async () => await navigateTo('/signup')
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-orange-50 via-yellow-50 to-amber-100">
    <!-- Nav -->
    <HomeHeader />

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
          Budget POS helps Restaurants, Karinderyas, Tapsilog stores, Fastfood, and Sari-Sari stores
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

        <!-- Feature Cards with Icons -->
        <div class="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 p-6 hover:border-orange-200 hover:shadow-lg transition-all group">
            <div class="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
              <TrendingUp class="w-6 h-6 text-orange-500" />
            </div>
            <h3 class="font-bold text-gray-800">Real-Time Sales</h3>
            <p class="text-sm text-gray-500 mt-2">
              Monitor every transaction instantly with automatic sales tracking.
            </p>
          </div>

          <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 p-6 hover:border-orange-200 hover:shadow-lg transition-all group">
            <div class="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
              <GitBranch class="w-6 h-6 text-orange-500" />
            </div>
            <h3 class="font-bold text-gray-800">Front and Kitchen Sync</h3>
            <p class="text-sm text-gray-500 mt-2">
              Orders placed at the counter appear instantly on the kitchen display.
            </p>
          </div>

          <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 p-6 hover:border-orange-200 hover:shadow-lg transition-all group">
            <div class="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
              <BarChart3 class="w-6 h-6 text-orange-500" />
            </div>
            <h3 class="font-bold text-gray-800">Business Reports</h3>
            <p class="text-sm text-gray-500 mt-2">
              Generate daily, weekly, and monthly sales reports with ease.
            </p>
          </div>

          <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 p-6 hover:border-orange-200 hover:shadow-lg transition-all group">
            <div class="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
              <WifiOff class="w-6 h-6 text-orange-500" />
            </div>
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