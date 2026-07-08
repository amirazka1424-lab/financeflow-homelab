import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }
    const success = await register(email, password, fullName)
    if (success) {
      toast.success('Registrasi berhasil! Silakan login.')
      navigate('/login')
    } else {
      toast.error('Registrasi gagal. Coba lagi.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">FinanceFlow</h1>
          <p className="text-gray-500 mt-2">Buat akun baru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder="Nama lengkap Anda"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="email@contoh.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Min 8 karakter"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Ulangi password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Masuk sekarang
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
