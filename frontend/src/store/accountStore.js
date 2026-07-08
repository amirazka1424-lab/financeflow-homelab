import { create } from 'zustand';
import api from '../api/axios';

export const useAccountStore = create((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/accounts');
      set({ accounts: res.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal memuat akun', isLoading: false });
    }
  },

  createAccount: async (data) => {
    const res = await api.post('/accounts', data);
    set((state) => ({ accounts: [...state.accounts, res.data] }));
    return res.data;
  },

  updateAccount: async (id, data) => {
    const res = await api.put(`/accounts/${id}`, data);
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? res.data : a)),
    }));
    return res.data;
  },

  deleteAccount: async (id) => {
    await api.delete(`/accounts/${id}`);
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }));
  },

  getTotalBalance: () => {
    return get().accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  },
}));
