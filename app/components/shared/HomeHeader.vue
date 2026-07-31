<script setup lang="ts">
const scrolled = ref(false)
const mobileMenuOpen = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 20
}

const handleSignIn = async () => await navigateTo('/login')
const handleSignUp = async () => await navigateTo('/signup')

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header class="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 pt-6 transition-all duration-300">
    <div
      class="max-w-6xl mx-auto flex items-center justify-between gap-4 rounded-full px-4 sm:px-6 py-2 transition-all duration-300 relative"
      :class="scrolled
        ? 'bg-white/70 backdrop-blur-md shadow-lg shadow-orange-900/5'
        : 'bg-white/20 backdrop-blur-md shadow-lg shadow-orange-900/5'"
    >
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center shrink-0" @click="closeMobileMenu">
        <img
          src="/uploads/ChatGPT Image Jul 18, 2026 at 10_13_50 AM.png"
          class="h-12 sm:h-16 md:h-20 w-auto object-contain"
          alt="BudgetPOS"
        />
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center gap-8 text-base font-semibold text-gray-700">
        <NuxtLink 
          to="/" 
          class="hover:text-orange-500 transition relative"
          active-class="text-orange-500"
          exact-active-class="text-orange-500"
        >
          Home
          <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-500 scale-x-0 transition-transform duration-300" 
                :class="$route.path === '/' ? 'scale-x-100' : ''"></span>
        </NuxtLink>
        <NuxtLink 
          to="/about" 
          class="hover:text-orange-500 transition relative"
          active-class="text-orange-500"
          exact-active-class="text-orange-500"
        >
          About
          <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-500 scale-x-0 transition-transform duration-300" 
                :class="$route.path === '/about' ? 'scale-x-100' : ''"></span>
        </NuxtLink>
        <NuxtLink 
          to="/features" 
          class="hover:text-orange-500 transition relative"
          active-class="text-orange-500"
          exact-active-class="text-orange-500"
        >
          Features
          <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-500 scale-x-0 transition-transform duration-300" 
                :class="$route.path === '/features' ? 'scale-x-100' : ''"></span>
        </NuxtLink>
        <NuxtLink 
          to="/pricing" 
          class="hover:text-orange-500 transition relative"
          active-class="text-orange-500"
          exact-active-class="text-orange-500"
        >
          Pricing
          <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-500 scale-x-0 transition-transform duration-300" 
                :class="$route.path === '/pricing' ? 'scale-x-100' : ''"></span>
        </NuxtLink>
      </nav>

      <!-- Desktop Actions -->
      <div class="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
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

      <!-- Mobile Menu Button -->
      <button
        @click="toggleMobileMenu"
        class="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Toggle menu"
      >
        <span
          class="block w-6 h-0.5 bg-gray-700 transition-all duration-300"
          :class="mobileMenuOpen ? 'rotate-45 translate-y-2' : ''"
        ></span>
        <span
          class="block w-6 h-0.5 bg-gray-700 transition-all duration-300"
          :class="mobileMenuOpen ? 'opacity-0' : ''"
        ></span>
        <span
          class="block w-6 h-0.5 bg-gray-700 transition-all duration-300"
          :class="mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''"
        ></span>
      </button>

      <!-- Mobile Menu Dropdown -->
      <div
        v-if="mobileMenuOpen"
        class="absolute top-full left-4 right-4 mt-3 md:hidden bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-orange-900/10 p-4 flex flex-col gap-2 animate-slideDown"
      >
        <NuxtLink
          to="/"
          class="px-4 py-3 text-base font-semibold text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition"
          active-class="text-orange-500 bg-orange-50"
          exact-active-class="text-orange-500 bg-orange-50"
          @click="closeMobileMenu"
        >
          Home
        </NuxtLink>
        <NuxtLink
          to="/about"
          class="px-4 py-3 text-base font-semibold text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition"
          active-class="text-orange-500 bg-orange-50"
          exact-active-class="text-orange-500 bg-orange-50"
          @click="closeMobileMenu"
        >
          About
        </NuxtLink>
        <NuxtLink
          to="/features"
          class="px-4 py-3 text-base font-semibold text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition"
          active-class="text-orange-500 bg-orange-50"
          exact-active-class="text-orange-500 bg-orange-50"
          @click="closeMobileMenu"
        >
          Features
        </NuxtLink>
        <NuxtLink
          to="/pricing"
          class="px-4 py-3 text-base font-semibold text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition"
          active-class="text-orange-500 bg-orange-50"
          exact-active-class="text-orange-500 bg-orange-50"
          @click="closeMobileMenu"
        >
          Pricing
        </NuxtLink>
        <div class="border-t border-gray-200 my-2"></div>
        <button
          @click="() => { handleSignIn(); closeMobileMenu() }"
          class="px-4 py-3 text-base font-semibold text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
        >
          Sign In
        </button>
        <button
          @click="() => { handleSignUp(); closeMobileMenu() }"
          class="px-4 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white text-base font-bold rounded-xl shadow-md hover:shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all"
        >
          Get Started
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideDown {
  animation: slideDown 0.2s ease-out;
}
</style>