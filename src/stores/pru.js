import { defineStore } from "pinia";

const CURRENT_VERSION = "1.0.0";

export const usePruStore = defineStore("pru", {
  state: () => ({
    version: CURRENT_VERSION,
    isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
    simulations: [],
    currentSimulation: {
      name: "",
      transactions: [
        {
          type: "initial",
          pru: "",
          shares: "",
          date: new Date().toISOString().split("T")[0],
        },
      ],
      potentialSellPrice: "",
      result: null,
    },
  }),

  getters: {
    totalShares: (state) => {
      return state.currentSimulation.transactions.reduce((sum, t) => 
        sum + (parseFloat(t.shares) || 0), 0)
    },

    totalInvestment: (state) => {
      return state.currentSimulation.transactions.reduce((sum, t) => {
        const amount = t.type === 'initial' 
          ? parseFloat(t.pru) * parseFloat(t.shares)
          : parseFloat(t.price) * parseFloat(t.shares)
        return sum + (amount || 0)
      }, 0)
    },

    newPRU() {
      if (this.totalShares === 0) return 0
      return this.totalInvestment / this.totalShares
    },

    pruChangePercentage(state) {
      const initialPRU = parseFloat(state.currentSimulation.transactions[0]?.pru)
      if (!initialPRU || !this.newPRU) return 0
      return ((this.newPRU - initialPRU) / initialPRU) * 100
    },

    potentialGain(state) {
      if (!this.newPRU || !state.currentSimulation.potentialSellPrice) return null
      const gain = (parseFloat(state.currentSimulation.potentialSellPrice) - this.newPRU) * this.totalShares
      const gainPercentage = ((parseFloat(state.currentSimulation.potentialSellPrice) - this.newPRU) / this.newPRU) * 100
      const gainAfterTax = gain * 0.7 // 30% flat tax

      return {
        raw: gain,
        percentage: gainPercentage,
        afterTax: gainAfterTax
      }
    }
},

  actions: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem("darkMode", this.isDarkMode);
    },

    addTransaction() {
      this.currentSimulation.transactions.push({
        type: "purchase",
        price: "",
        shares: "",
        date: new Date().toISOString().split("T")[0],
      });
    },

    removeTransaction(index) {
      if (index > 0) {
        this.currentSimulation.transactions.splice(index, 1);
      }
    },

    loadSimulation(simulation) {
      this.currentSimulation = {
        ...simulation,
        transactions: simulation.transactions.map((t) => ({
          ...t,
          date: t.date || new Date().toISOString().split("T")[0],
        })),
      };
    },

    resetSimulation() {
      this.currentSimulation = {
        name: "",
        transactions: [
          {
            type: "initial",
            pru: "",
            shares: "",
            date: new Date().toISOString().split("T")[0],
          },
        ],
        potentialSellPrice: "",
        result: null,
      };
    },

    saveSimulation() {
      const simulationToSave = {
        ...this.currentSimulation,
        id: Date.now(),
        date: new Date().toISOString(),
        version: this.version,
        result: {
          pru: this.newPRU,
          totalShares: this.totalShares,
          totalInvestment: this.totalInvestment,
          pruChangePercentage: this.pruChangePercentage,
          potentialSellPrice: this.currentSimulation.potentialSellPrice,
        },
      };

      this.simulations.unshift(simulationToSave);
      this.persistState();
    },

    async shareResults() {
      try {
        await navigator.clipboard.writeText(this.generateShareText());
        return true;
      } catch (err) {
        console.error("Error copying to clipboard:", err);
        return false;
      }
    },

    deleteSimulation(simulationId) {
      this.simulations = this.simulations.filter(
        (sim) => sim.id !== simulationId
      );
      this.persistState();
    },

    loadSavedData() {
      // Charger les simulations
      const saved = localStorage.getItem("pru-simulations");
      if (saved) {
        const parsedData = JSON.parse(saved);
        this.migrateDataIfNeeded(parsedData);
        this.simulations = parsedData;
      }

      // Charger le thème
      const savedDarkMode = localStorage.getItem("darkMode");
      if (savedDarkMode !== null) {
        this.isDarkMode = savedDarkMode === "true";
      }
    },

    migrateDataIfNeeded(data) {
      // Exemple de migration
      if (!data[0]?.version || data[0]?.version !== CURRENT_VERSION) {
        // Ajouter ici la logique de migration si nécessaire
        data.forEach((simulation) => {
          simulation.version = CURRENT_VERSION;
          // Autres migrations si nécessaire
        });
      }
    },

    persistState() {
      localStorage.setItem("pru-simulations", JSON.stringify(this.simulations));
    },

    generateShareText() {
      const formattedDate = new Date().toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const initialPRU = parseFloat(this.currentSimulation.transactions[0].pru);
      const totalTransactions = this.currentSimulation.transactions.length - 1;

      const lines = [
        `📊 Analyse PRU - ${this.currentSimulation.name}`,
        `📅 ${formattedDate}`,
        ``,
        `Position initiale:`,
        `• PRU: ${formatPrice(initialPRU)}€`,
        `• Actions: ${formatNumber(
          parseFloat(this.currentSimulation.transactions[0].shares)
        )}`,
        ``,
        `Après ${totalTransactions} transaction${
          totalTransactions > 1 ? "s" : ""
        }:`,
        `• Nouveau PRU: ${formatPrice(this.newPRU)}€ (${
          this.pruChangePercentage > 0 ? "+" : ""
        }${this.pruChangePercentage.toFixed(2)}%)`,
        `• Total actions: ${formatNumber(this.totalShares)}`,
        `• Investissement: ${formatPrice(this.totalInvestment)}€`,
      ];

      if (this.currentSimulation.potentialSellPrice && this.potentialGain) {
        const gainSymbol = this.potentialGain.raw > 0 ? "+" : "";
        lines.push(
          ``,
          `Simulation vente à ${formatPrice(
            parseFloat(this.currentSimulation.potentialSellPrice)
          )}€:`,
          `• PnL: ${gainSymbol}${formatPrice(
            this.potentialGain.raw
          )}€ (${gainSymbol}${this.potentialGain.percentage.toFixed(2)}%)`,
          `• PnL net: ${gainSymbol}${formatPrice(this.potentialGain.afterTax)}€`
        );
      }

      return lines.join("\n");
    },
  },
});

// Utility functions
function formatPrice(value) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(value);
}
