import { create } from 'zustand';
import api from '../api/axios';

export const useAssetStore = create((set, get) => ({
  assets: [],
  liabilities: [],
  isLoading: false,
  error: null,

  fetchAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/assets');
      set({
        assets: res.data.filter((a) => a.type === 'asset'),
        liabilities: res.data.filter((a) => a.type === 'liability'),
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Gagal memuat aset', isLoading: false });
    }
  },

  createAsset: async (data) => {
    const res = await api.post('/assets', data);
    if (data.type === 'asset') {
      set((state) => ({ assets: [...state.assets, res.data] }));
    } else {
      set((state) => ({ liabilities: [...state.liabilities, res.data] }));
    }
    return res.data;
  },

  updateAsset: async (id, data) => {
    const res = await api.put('/assets/' + id, data);
    set((state) => ({
      assets: state.assets.map((a) => (a.id === id ? res.data : a)),
      liabilities: state.liabilities.map((a) => (a.id === id ? res.data : a)),
    }));
    return res.data;
  },

  deleteAsset: async (id) => {
    await api.delete('/assets/' + id);
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
      liabilities: state.liabilities.filter((a) => a.id !== id),
    }));
  },

  getNetWorth: () => {
    const totalAssets = get().assets.reduce((s, a) => s + (a.value || 0), 0);
    const totalLiabilities = get().liabilities.reduce((s, a) => s + (a.value || 0), 0);
    return totalAssets - totalLiabilities;
  },
}));
