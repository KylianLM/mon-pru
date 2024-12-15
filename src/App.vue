<template>
    <div :class="[
      'min-h-screen transition-colors duration-200',
      store.isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    ]">
      <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Header -->
        <header class="flex justify-between items-center mb-8">
          <div class="text-center flex-1">
            <h1 class="text-3xl font-bold">MonPRU</h1>
            <p :class="store.isDarkMode ? 'text-gray-400' : 'text-gray-600'">
              Calculateur de Prix de Revient Unitaire
            </p>
          </div>
          <button 
            @click="store.toggleDarkMode"
            :class="[
              'p-2 rounded-lg',
              store.isDarkMode ? 'bg-gray-800 text-yellow-500' : 'bg-white text-gray-800'
            ]"
          >
            {{ store.isDarkMode ? '🌙' : '☀️' }}
          </button>
        </header>
  
        <PRUCalculator />
      </div>
    </div>
  </template>
  
  <script setup>
  import { usePruStore } from './stores/pru'
  import PRUCalculator from './components/PRUCalculator.vue'
  
  const store = usePruStore()
  </script>