import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  chartData: [],
  lineChartData: [],
  barChartData: [],
  pieChartData: [],
  isLoading: false,
  error: null,
  dateRange: { start: null, end: null },
  filters: {},
  
  setChartData: (data) => set({ chartData: data }),
  setLineChartData: (data) => set({ lineChartData: data }),
  setBarChartData: (data) => set({ barChartData: data }),
  setPieChartData: (data) => set({ pieChartData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setDateRange: (range) => set({ dateRange: range }),
  setFilters: (filters) => set({ filters }),
  
  fetchChartData: async () => {
    set({ isLoading: true, error: null })
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData = [
        { x: 'Jan', y: 100 },
        { x: 'Feb', y: 150 },
        { x: 'Mar', y: 200 },
        { x: 'Apr', y: 180 },
        { x: 'May', y: 220 },
      ]
      
      set({ 
        chartData: mockData,
        lineChartData: mockData,
        barChartData: mockData,
        pieChartData: [
          { id: 0, value: 10, label: 'Series A' },
          { id: 1, value: 15, label: 'Series B' },
          { id: 2, value: 20, label: 'Series C' },
        ],
        isLoading: false 
      })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  resetData: () => set({
    chartData: [],
    lineChartData: [],
    barChartData: [],
    pieChartData: [],
    error: null,
    dateRange: { start: null, end: null },
    filters: {},
  }),
}))