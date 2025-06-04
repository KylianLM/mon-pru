<template>
  <div class="h-64">
    <Line v-if="chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'vue-chartjs'

// Register required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps({
  transactions: {
    type: Array,
    required: true
  },
  darkMode: {
    type: Boolean,
    default: false
  }
})

const chartData = computed(() => {
  let currentTotal = 0
  let currentTotalWithoutFees = 0
  let currentShares = 0

  const data = props.transactions
    .filter(t => t.shares && (t.pru || t.price))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((t, index) => {
      const shares = parseFloat(t.shares)

      if (index === 0) {
        // Pour la position initiale : PRU = prix unitaire d'achat
        const pru = parseFloat(t.pru)
        const transactionAmount = pru * shares
        const fixedFees = parseFloat(t.fixedFees) || 0
        const percentageFees = ((parseFloat(t.percentageFees) || 0) / 100) * transactionAmount

        // Total avec frais = montant + frais
        currentTotal = transactionAmount + fixedFees + percentageFees
        // Total sans frais = juste le montant
        currentTotalWithoutFees = transactionAmount
        currentShares = shares
      } else {
        const price = parseFloat(t.price)
        const transactionAmount = price * shares
        const fixedFees = parseFloat(t.fixedFees) || 0
        const percentageFees = ((parseFloat(t.percentageFees) || 0) / 100) * transactionAmount

        currentTotal += transactionAmount + fixedFees + percentageFees
        currentTotalWithoutFees += transactionAmount
        currentShares += shares
      }

      return {
        label: new Date(t.date).toLocaleDateString('fr-FR', {
          month: 'short',
          day: 'numeric'
        }),
        pruWithFees: parseFloat((currentTotal / currentShares).toFixed(2)),
        pruWithoutFees: parseFloat((currentTotalWithoutFees / currentShares).toFixed(2))
      }
    })

  return {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'PRU avec frais',
        data: data.map(d => d.pruWithFees),
        borderColor: '#4F46E5',
        backgroundColor: '#4F46E5',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'PRU sans frais',
        data: data.map(d => d.pruWithoutFees),
        borderColor: '#06B6D4',
        backgroundColor: '#06B6D4',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: props.darkMode ? '#9CA3AF' : '#4B5563',
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: props.darkMode ? '#1F2937' : '#FFFFFF',
      titleColor: props.darkMode ? '#F9FAFB' : '#111827',
      bodyColor: props.darkMode ? '#F9FAFB' : '#111827',
      borderColor: props.darkMode ? '#374151' : '#E5E7EB',
      borderWidth: 1,
      callbacks: {
        label: (context) => {
          const label = context.dataset.label
          const value = context.formattedValue
          return `${label}: ${value}€`
        },
        afterBody: (tooltipItems) => {
          if (tooltipItems.length >= 2) {
            const pruWithFees = parseFloat(tooltipItems[0].raw)
            const pruWithoutFees = parseFloat(tooltipItems[1].raw)
            const difference = pruWithFees - pruWithoutFees

            // Éviter la division par zéro
            if (pruWithoutFees === 0) {
              return [
                '',
                `Impact des frais: +${difference.toFixed(2)}€`
              ]
            }

            const percentageIncrease = ((difference / pruWithoutFees) * 100).toFixed(2)
            return [
              '',
              `Impact des frais: +${difference.toFixed(2)}€`,
              `Soit +${percentageIncrease}% sur le PRU`
            ]
          }
          return []
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: (value) => `${value}€`,
        color: props.darkMode ? '#9CA3AF' : '#4B5563'
      },
      grid: {
        color: props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: {
      ticks: {
        color: props.darkMode ? '#9CA3AF' : '#4B5563'
      },
      grid: {
        display: false
      }
    }
  }
}))
</script>