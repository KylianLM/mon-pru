<template>
    <div class="h-64">
      <Line
        v-if="chartData.datasets.length > 0"
        :data="chartData"
        :options="chartOptions"
      />
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
    let currentShares = 0
    
    const data = props.transactions
      .filter(t => t.shares && (t.pru || t.price))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((t, index) => {
        if (index === 0) {
          currentTotal = parseFloat(t.pru) * parseFloat(t.shares)
          currentShares = parseFloat(t.shares)
        } else {
          currentTotal += parseFloat(t.price) * parseFloat(t.shares)
          currentShares += parseFloat(t.shares)
        }
        
        return {
          label: new Date(t.date).toLocaleDateString(),
          value: parseFloat((currentTotal / currentShares).toFixed(2))
        }
      })
  
    return {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'PRU',
        data: data.map(d => d.value),
        borderColor: '#4F46E5',
        backgroundColor: '#4F46E5',
        tension: 0.4
      }]
    }
  })
  
  const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `PRU: ${context.formattedValue}€`
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