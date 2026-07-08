import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/axios'

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await api.post('/auth/login', { email, password })
          set({ token: res.data.access_token, user: res.data.user, isLoading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`
          return true
        } catch (err) {
          set({ error: err.response?.data?.detail || 'Login gagal', isLoading: false })
          return false
        }
      },

      register: async (email, password, fullName) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/register', { email, password, full_name: fullName })
          set({ isLoading: false })
          return true
        } catch (err) {
          set({ error: err.response?.data?.detail || 'Registrasi gagal', isLoading: false })
          return false
        }
      },

      logout: () => {
        set({ token: null, user: null })
        delete api.defaults.headers.common['Authorization']
      },

      setToken: (token) => {
        set({ token })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)

export default useAuthStore
