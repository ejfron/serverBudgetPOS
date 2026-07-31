<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Heart, Target, Users2 } from '@lucide/vue'
import HomeHeader from '~/components/shared/HomeHeader.vue'

definePageMeta({ layout: false })

const values = [
  {
    icon: Heart,
    title: 'Made for Filipino Businesses',
    description: 'Every feature, from GCash support to Peso formatting, is built around how small businesses actually operate here, not adapted from a foreign template.',
  },
  {
    icon: Target,
    title: 'Simple Over Fancy',
    description: 'We would rather ship something a busy cashier can learn in five minutes than pack in features nobody uses.',
  },
  {
    icon: Users2,
    title: 'Built With Real Store Owners',
    description: 'Every screen was shaped by feedback from actual tapsilogan, karinderya, and sari-sari store operators.',
  },
]


</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-orange-50 via-yellow-50 to-amber-100">
 
    <HomeHeader />

    <!-- Hero -->
    <section class="max-w-3xl mx-auto text-center px-6 pt-40 sm:pt-44 pb-16">
      <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-800">
        A POS system built from the sari-sari store up
      </h1>
      <p class="mt-4 text-gray-600 text-lg leading-relaxed">
        Budget POS started with a simple idea. Small Filipino food businesses deserve software
        that is built for how they actually work, with no bloated features, no confusing setup,
        and no internet required to keep the line moving.
      </p>
    </section>

    <!-- Story -->
    <section class="max-w-3xl mx-auto px-6 pb-16">
      <div class="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-white/60 shadow-sm">
        <h2 class="text-xl font-bold text-gray-800 mb-3">Why we built this</h2>
        <p class="text-gray-600 leading-relaxed mb-4">
          Most POS systems are either too expensive, too complicated, or built for restaurants
          in countries where the workflows just do not match a tapsilogan stall or a neighborhood
          sari-sari store. We wanted something a cashier could pick up in minutes, that kept
          working even when the internet dropped, and that a small business owner could actually afford.
        </p>
        <p class="text-gray-600 leading-relaxed">
          That is why every business type, Sari-Sari Store, Karinderya, Tapsilogan, and Restaurant,
          gets exactly the screens it needs. No kitchen display cluttering up a sari-sari store's
          cashier flow. No missing kitchen sync for a busy tapsilogan counter during the morning rush.
        </p>
      </div>
    </section>

    <!-- Values -->
    <section class="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
      <h2 class="text-2xl font-bold text-gray-800 text-center mb-8">What We Believe In</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          v-for="v in values"
          :key="v.title"
          class="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 text-center"
        >
          <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <component :is="v.icon" :size="22" class="text-orange-500" />
          </div>
          <h3 class="font-bold text-gray-800 mb-2">{{ v.title }}</h3>
          <p class="text-sm text-gray-500 leading-relaxed">{{ v.description }}</p>
        </div>
      </div>

      <div class="text-center mt-10">
        <NuxtLink
          to="/signup"
          class="inline-block px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          Start Your Store Today
        </NuxtLink>
      </div>
    </section>
  </div>
</template>