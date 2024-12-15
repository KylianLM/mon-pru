<template>
    <div :class="[
        'rounded-lg overflow-hidden shadow-lg p-6',
        store.isDarkMode ? 'bg-gray-800' : 'bg-white'
    ]">
        <!-- Nom de la simulation -->
        <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Nom de la simulation</label>
            <input v-model="store.currentSimulation.name" type="text" :class="[
                'w-full rounded-md shadow-sm',
                store.isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
            ]" placeholder="Ex: Achat Apple" />
        </div>

        <!-- Transactions -->
        <div class="space-y-6">
            <div v-for="(transaction, index) in store.currentSimulation.transactions" :key="index"
                class="p-4 rounded-lg border" :class="store.isDarkMode ? 'border-gray-700' : 'border-gray-200'">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-medium">
                        {{ index === 0 ? 'Position initiale' : `Transaction ${index}` }}
                    </h3>
                    <button v-if="index > 0" @click="store.removeTransaction(index)"
                        class="text-red-500 hover:text-red-700">
                        Supprimer
                    </button>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                    <div>
                        <label class="block text-sm font-medium mb-2">Date</label>
                        <input type="date" v-model="transaction.date" :class="[
                            'w-full rounded-md shadow-sm',
                            store.isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        ]" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">
                            {{ index === 0 ? 'PRU Actuel (€)' : 'Prix d\'achat (€)' }}
                        </label>
                        <input type="number" v-model="transaction[index === 0 ? 'pru' : 'price']" step="0.01" :class="[
                            'w-full rounded-md shadow-sm',
                            store.isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        ]" placeholder="Ex: 150.45" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Nombre d'actions</label>
                        <input type="number" v-model="transaction.shares" :class="[
                            'w-full rounded-md shadow-sm',
                            store.isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        ]" placeholder="Ex: 10" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Bouton Ajouter Transaction -->
        <button @click="store.addTransaction" :class="[
            'mt-4 w-full py-2 rounded-md',
            store.isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
        ]">
            + Ajouter une transaction
        </button>

        <!-- Résultats -->
        <div v-if="store.newPRU" class="mt-8 space-y-6">
            <div class="grid gap-4 md:grid-cols-3">
                <div :class="[
                    'p-4 rounded-lg',
                    store.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                ]">
                    <dt class="text-sm font-medium mb-1">Nouveau PRU</dt>
                    <dd class="text-2xl font-semibold text-indigo-500">
                        {{ formatPrice(store.newPRU) }}€
                        <span v-if="store.pruChangePercentage" :class="[
                            'text-sm ml-2',
                            store.pruChangePercentage > 0 ? 'text-red-500' : 'text-green-500'
                        ]">
                            {{ store.pruChangePercentage > 0 ? '↑' : '↓' }}
                            {{ Math.abs(store.pruChangePercentage).toFixed(2) }}%
                        </span>
                    </dd>
                </div>

                <div :class="[
                    'p-4 rounded-lg',
                    store.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                ]">
                    <dt class="text-sm font-medium mb-1">Total actions</dt>
                    <dd class="text-2xl font-semibold">
                        {{ formatNumber(store.totalShares) }}
                    </dd>
                </div>

                <div :class="[
                    'p-4 rounded-lg',
                    store.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                ]">
                    <dt class="text-sm font-medium mb-1">Investissement total</dt>
                    <dd class="text-2xl font-semibold">
                        {{ formatPrice(store.totalInvestment) }}€
                    </dd>
                </div>
            </div>

            <!-- Simulation de vente -->
            <div :class="[
                'p-4 rounded-lg border',
                store.isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            ]">
                <h3 class="text-lg font-medium mb-4">Simulation de vente</h3>

                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label class="block text-sm font-medium mb-2">
                            Prix de vente potentiel (€)
                        </label>
                        <input type="number" v-model="store.currentSimulation.potentialSellPrice" step="0.01" :class="[
                            'w-full rounded-md shadow-sm',
                            store.isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'
                        ]" placeholder="Ex: 180.50" />
                    </div>

                    <div v-if="store.potentialGain" class="sm:pt-8">
                        <button @click="sharePotentialGain"
                            class="inline-flex items-center px-4 py-2 text-sm rounded-md transition-colors" :class="[
                                store.isDarkMode
                                    ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            ]">
                            Partager les résultats
                        </button>
                        <span v-if="showShareSuccess" class="ml-2 text-green-500 text-sm">
                            Copié !
                        </span>
                    </div>
                </div>

                <div v-if="store.potentialGain" class="mt-4 grid gap-4 sm:grid-cols-2">
                    <div :class="[
                        'p-3 rounded-lg',
                        store.isDarkMode ? 'bg-gray-600' : 'bg-white'
                    ]">
                        <dt class="text-sm font-medium mb-1">Plus-value brute</dt>
                        <dd :class="[
                            'text-xl font-semibold',
                            store.potentialGain.raw > 0 ? 'text-green-500' : 'text-red-500'
                        ]">
                            {{ formatPrice(store.potentialGain.raw) }}€
                            <span class="text-sm ml-1">
                                ({{ store.potentialGain.percentage.toFixed(2) }}%)
                            </span>
                        </dd>
                    </div>

                    <div :class="[
                        'p-3 rounded-lg',
                        store.isDarkMode ? 'bg-gray-600' : 'bg-white'
                    ]">
                        <dt class="text-sm font-medium mb-1">Plus-value après impôts</dt>
                        <dd :class="[
                            'text-xl font-semibold',
                            store.potentialGain.afterTax > 0 ? 'text-green-500' : 'text-red-500'
                        ]">
                            {{ formatPrice(store.potentialGain.afterTax) }}€
                        </dd>
                    </div>
                </div>
            </div>

            <!-- Graphique d'évolution -->
            <div :class="[
                'p-4 rounded-lg border',
                store.isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            ]">
                <h3 class="text-lg font-medium mb-4">Évolution du PRU</h3>
                <PRUChart :transactions="store.currentSimulation.transactions" :dark-mode="store.isDarkMode" />
            </div>
        </div>

        <!-- Bouton Sauvegarder -->
        <button @click="store.saveSimulation" :class="[
            'mt-6 w-full py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors',
            { 'opacity-50 cursor-not-allowed': !store.currentSimulation.name }
        ]" :disabled="!store.currentSimulation.name">
            Sauvegarder la simulation
        </button>

        <!-- Simulations sauvegardées -->
        <div v-if="store.simulations.length > 0" class="mt-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Simulations sauvegardées</h2>
                <button @click="store.resetSimulation"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                    Nouvelle simulation
                </button>
            </div>
            <div class="space-y-4">
                <div v-for="sim in store.simulations" :key="sim.id" :class="[
                    'p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-200',
                    store.isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-white'
                ]" @click="loadSimulation(sim)">
                    <div class="flex justify-between items-center">
                        <h3 class="font-medium">{{ sim.name }}</h3>
                        <div class="flex items-center gap-4">
                            <span class="text-sm" :class="store.isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                                {{ formatDate(sim.date) }}
                            </span>
                            <button @click.stop="confirmDeleteSimulation(sim.id)"
                                class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                :class="store.isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-red-600'">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="mt-2 grid gap-4 md:grid-cols-3">
                        <div>
                            <span class="text-sm" :class="store.isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                                PRU
                            </span>
                            <p class="text-lg font-semibold text-indigo-500">
                                {{ formatPrice(sim.result.pru) }}€
                            </p>
                        </div>
                        <div>
                            <span class="text-sm" :class="store.isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                                Actions
                            </span>
                            <p class="text-lg font-semibold">
                                {{ formatNumber(sim.result.totalShares) }}
                            </p>
                        </div>
                        <div>
                            <span class="text-sm" :class="store.isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                                Total
                            </span>
                            <p class="text-lg font-semibold">
                                {{ formatPrice(sim.result.totalInvestment) }}€
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="mt-8 py-4 text-center border-t" :class="store.isDarkMode ? 'border-gray-800' : ''">
        <div class="flex justify-center space-x-4">
            <a href="https://github.com/KylianLM/mon-pru" target="_blank" class="transition-colors"
                :class="store.isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'">
                GitHub
            </a>
            <a href="https://bsky.app/profile/kylianlm.bsky.social" target="_blank" class="transition-colors"
                :class="store.isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'">
                Bluesky
            </a>
        </div>
    </footer>
</template>

<script setup>
import { ref } from 'vue'
import { usePruStore } from '../stores/pru'
import PRUChart from './PRUChart.vue'

const store = usePruStore()
const showShareSuccess = ref(false)

async function sharePotentialGain() {
    const success = await store.shareResults()
    if (success) {
        showShareSuccess.value = true
        setTimeout(() => {
            showShareSuccess.value = false
        }, 2000)
    }
}

function formatPrice(value) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value)
}

function formatNumber(value) {
    return new Intl.NumberFormat('fr-FR').format(value)
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

function loadSimulation(simulation) {
    store.loadSimulation(simulation)
}

function confirmDeleteSimulation(simulationId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette simulation ?')) {
        store.deleteSimulation(simulationId)
    }
}
</script>