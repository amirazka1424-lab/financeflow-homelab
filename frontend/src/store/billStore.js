import { create } from 'zustand';
import api from '../api/axios';

export const useBillStore = create((set) => ({
  bills: [],
  isLoading: false,
  error: null,

  fetchBills: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/bills');
      set({ bills: res.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal memuat tagihan', isLoading: false });
    }
  },

  createBill: async (data) => {
    const res = await api.post('/bills', data);
    set((state) => ({ bills: [...state.bills, res.data] }));
    return res.data;
  },

  updateBill: async (id, data) => {
    const res = await api.put('/bills/' + id, data);
    set((state) => ({
      bills: state.bills.map((b) => (b.id === id ? res.data : b)),
    }));
    return res.data;
  },

  markPaid: async (id) => {
    const res = await api.post('/bills/' + id + '/pay');
    set((state) => ({
      bills: state.bills.map((b) => (b.id === id ? res.data : b)),
    }));
    return res.data;
  },

  deleteBill: async (id) => {
    await api.delete('/bills/' + id);
    set((state) => ({ bills: state.bills.filter((b) => b.id !== id) }));
  },

  getUpcomingBills: () => {
    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return useBillStore
      .getState()
      .bills.filter((b) => {
        const due = new Date(b.due_date);
        return !b.is_paid && due >= now && due <= in7days;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  },
}));
