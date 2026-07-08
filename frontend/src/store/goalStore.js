import { create } from 'zustand';
import api from '../api/axios';

export const useGoalStore = create((set) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/goals');
      set({ goals: res.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal memuat goals', isLoading: false });
    }
  },

  createGoal: async (data) => {
    const res = await api.post('/goals', data);
    set((state) => ({ goals: [...state.goals, res.data] }));
    return res.data;
  },

  updateGoal: async (id, data) => {
    const res = await api.put(`/goals/${id}`, data);
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? res.data : g)),
    }));
    return res.data;
  },

  addSaving: async (id, amount) => {
    const res = await api.post(`/goals/${id}/saving`, { amount });
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? res.data : g)),
    }));
    return res.data;
  },

  deleteGoal: async (id) => {
    await api.delete(`/goals/${id}`);
    set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
  },
}));
