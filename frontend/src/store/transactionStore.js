import { create } from 'zustand'
import api from '../api/axios'

const useTransactionStore = create((set, get) => ({
  transactions: [],
  summary: null,
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    limit: 20,
    type: '',
    category: '',
    start_date: '',
    end_date: '',
  },

  fetchTransactions: async () => {
    set({ isLoading: true, error: null })
    try {
      const { filters } = get()
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      )
      const res = await api.get('/transactions', { params })
      set({ transactions: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal memuat transaksi', isLoading: false })
    }
  },

  fetchSummary: async () => {
    try {
      const res = await api.get('/transactions/summary')
      set({ summary: res.data })
    } catch (err) {
      console.error(err)
    }
  },

  createTransaction: async (data) => {
    try {
      const res = await api.post('/transactions', data)
      set((state) => ({ transactions: [res.data, ...state.transactions] }))
      return true
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal membuat transaksi' })
      return false
    }
  },

  updateTransaction: async (id, data) => {
    try {
      const res = await api.put(`/transactions/${id}`, data)
      set((state) => ({
        transactions: state.transactions.map((t) => t.id === id ? res.data : t)
      }))
      return true
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal update transaksi' })
      return false
    }
  },

  deleteTransaction: async (id) => {
    try {
      await api.delete(`/transactions/${id}`)
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id)
      }))
      return true
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal hapus transaksi' })
      return false
    }
  },

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}))

export default useTransactionStore
