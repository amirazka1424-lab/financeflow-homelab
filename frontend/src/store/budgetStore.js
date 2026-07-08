import { create } from 'zustand'
import api from '../api/axios'

const useBudgetStore = create((set) => ({
  budgets: [],
  isLoading: false,
  error: null,

  fetchBudgets: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.get('/budgets')
      set({ budgets: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal memuat anggaran', isLoading: false })
    }
  },

  createBudget: async (data) => {
    try {
      const res = await api.post('/budgets', data)
      set((state) => ({ budgets: [...state.budgets, res.data] }))
      return true
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal membuat anggaran' })
      return false
    }
  },

  updateBudget: async (id, data) => {
    try {
      const res = await api.put(`/budgets/${id}`, data)
      set((state) => ({
        budgets: state.budgets.map((b) => b.id === id ? res.data : b)
      }))
      return true
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal update anggaran' })
      return false
    }
  },

  deleteBudget: async (id) => {
    try {
      await api.delete(`/budgets/${id}`)
      set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }))
      return true
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal hapus anggaran' })
      return false
    }
  },
}))

export default useBudgetStore
